-- Club extras: club documents (with expiry), activity calendar with sign-ups, and
-- club gear lent to members.

begin;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------

insert into club.role_permissions (role, permission)
select 'owner'::club.admin_role, p from unnest(array[
  'documents.read', 'documents.write', 'events.read', 'events.write', 'gear.read', 'gear.write'
]) p
union all
select 'secretary'::club.admin_role, p from unnest(array[
  'documents.read', 'documents.write', 'events.read', 'events.write', 'gear.read', 'gear.write'
]) p
union all
select 'treasurer'::club.admin_role, p from unnest(array['documents.read', 'events.read', 'gear.read']) p
union all
select 'league'::club.admin_role, p from unnest(array['events.read', 'events.write']) p
union all
select 'viewer'::club.admin_role, p from unnest(array['documents.read', 'events.read', 'gear.read']) p;

-- ---------------------------------------------------------------------------
-- Club documents
-- ---------------------------------------------------------------------------

create table club.club_documents (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  kind text not null default 'other'
    check (kind in ('statutes', 'tax', 'insurance', 'minutes', 'agreement', 'other')),
  issued_on date,
  expires_on date check (expires_on is null or issued_on is null or expires_on >= issued_on),
  notes text,
  path text unique,
  file_name text,
  size_bytes bigint,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index club_documents_expires_idx on club.club_documents (expires_on) where expires_on is not null;

-- ---------------------------------------------------------------------------
-- Activity calendar
-- ---------------------------------------------------------------------------

create table club.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (btrim(title) <> ''),
  kind text not null default 'outing' check (kind in ('outing', 'race', 'social', 'other')),
  starts_on date not null,
  start_time time,
  ends_on date check (ends_on is null or ends_on >= starts_on),
  location text,
  description text,
  capacity int check (capacity is null or capacity > 0),
  signup_deadline date,
  cancelled boolean not null default false,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_starts_idx on club.events (starts_on);

create table club.event_signups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references club.events (id) on delete cascade,
  member_id uuid not null references club.members (id) on delete cascade,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (event_id, member_id)
);

-- No sign-ups beyond capacity, nor to cancelled events. Locks the event row so two
-- concurrent sign-ups can't both take the last place.
create function club.check_event_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  e club.events;
begin
  select * into e from club.events where id = new.event_id for update;
  if e.cancelled then
    raise exception 'La actividad está cancelada' using errcode = 'check_violation';
  end if;
  if e.capacity is not null
     and (select count(*) from club.event_signups where event_id = new.event_id) >= e.capacity then
    raise exception 'No quedan plazas' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger check_signup before insert on club.event_signups
  for each row execute function club.check_event_signup();

-- ---------------------------------------------------------------------------
-- Club gear
-- ---------------------------------------------------------------------------

create table club.gear_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  code text unique,                 -- label on the item, e.g. "WT-02"
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table club.gear_loans (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references club.gear_items (id) on delete cascade,
  member_id uuid not null references club.members (id) on delete restrict,
  out_on date not null default current_date,
  returned_on date check (returned_on is null or returned_on >= out_on),
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
-- One holder at a time.
create unique index gear_loans_one_open on club.gear_loans (item_id) where returned_on is null;
create index gear_loans_member_idx on club.gear_loans (member_id);

-- ---------------------------------------------------------------------------
-- Housekeeping
-- ---------------------------------------------------------------------------

create trigger touch before update on club.club_documents for each row execute function club.touch_updated_at();
create trigger touch before update on club.events for each row execute function club.touch_updated_at();

create trigger audit after insert or update or delete on club.club_documents for each row execute function club.audit();
create trigger audit after insert or update or delete on club.events for each row execute function club.audit();
create trigger audit after insert or update or delete on club.event_signups for each row execute function club.audit();
create trigger audit after insert or update or delete on club.gear_items for each row execute function club.audit();
create trigger audit after insert or update or delete on club.gear_loans for each row execute function club.audit();

revoke all on function club.check_event_signup() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table club.club_documents enable row level security;
alter table club.events enable row level security;
alter table club.event_signups enable row level security;
alter table club.gear_items enable row level security;
alter table club.gear_loans enable row level security;

create policy "read documents" on club.club_documents for select to authenticated
  using ((select club.has_permission('documents.read')));
create policy "add documents" on club.club_documents for insert to authenticated
  with check ((select club.has_permission('documents.write')));
create policy "edit documents" on club.club_documents for update to authenticated
  using ((select club.has_permission('documents.write'))) with check ((select club.has_permission('documents.write')));
create policy "delete documents" on club.club_documents for delete to authenticated
  using ((select club.has_permission('documents.write')));

create policy "read events" on club.events for select to authenticated
  using ((select club.has_permission('events.read')));
create policy "add events" on club.events for insert to authenticated
  with check ((select club.has_permission('events.write')));
create policy "edit events" on club.events for update to authenticated
  using ((select club.has_permission('events.write'))) with check ((select club.has_permission('events.write')));

-- Sign-up lists name members: readable with events.read plus members.read.
create policy "read signups" on club.event_signups for select to authenticated
  using ((select club.has_permission('events.read')) and (select club.has_permission('members.read')));
create policy "add signups" on club.event_signups for insert to authenticated
  with check ((select club.has_permission('events.write')));
create policy "delete signups" on club.event_signups for delete to authenticated
  using ((select club.has_permission('events.write')));

create policy "read gear" on club.gear_items for select to authenticated
  using ((select club.has_permission('gear.read')));
create policy "add gear" on club.gear_items for insert to authenticated
  with check ((select club.has_permission('gear.write')));
create policy "edit gear" on club.gear_items for update to authenticated
  using ((select club.has_permission('gear.write'))) with check ((select club.has_permission('gear.write')));

create policy "read loans" on club.gear_loans for select to authenticated
  using ((select club.has_permission('gear.read')));
create policy "add loans" on club.gear_loans for insert to authenticated
  with check ((select club.has_permission('gear.write')));
create policy "edit loans" on club.gear_loans for update to authenticated
  using ((select club.has_permission('gear.write'))) with check ((select club.has_permission('gear.write')));

grant select, delete,
  insert (name, kind, issued_on, expires_on, notes),
  update (name, kind, issued_on, expires_on, notes, path, file_name, size_bytes)
  on club.club_documents to authenticated;
grant select,
  insert (title, kind, starts_on, start_time, ends_on, location, description, capacity, signup_deadline),
  update (title, kind, starts_on, start_time, ends_on, location, description, capacity, signup_deadline, cancelled)
  on club.events to authenticated;
grant select, delete, insert (event_id, member_id, notes) on club.event_signups to authenticated;
grant select, insert (name, code, notes), update (name, code, notes, active) on club.gear_items to authenticated;
grant select, insert (item_id, member_id, out_on, notes), update (returned_on, notes) on club.gear_loans to authenticated;
grant all on club.club_documents, club.events, club.event_signups, club.gear_items, club.gear_loans to service_role;

-- ---------------------------------------------------------------------------
-- Private bucket for club paperwork (statutes, insurance, minutes…)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('club-documents', 'club-documents', false, 26214400,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp',
              'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet'])
on conflict (id) do nothing;

create policy "club documents read" on storage.objects for select to authenticated
  using (bucket_id = 'club-documents' and (select club.has_permission('documents.read')));
create policy "club documents upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'club-documents' and (select club.has_permission('documents.write')));
create policy "club documents delete" on storage.objects for delete to authenticated
  using (bucket_id = 'club-documents' and (select club.has_permission('documents.write')));

commit;
