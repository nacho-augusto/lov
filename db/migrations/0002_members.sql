-- Members: records, joining/leaving, onboarding checklist and federation licences.
-- Sensitive data (national ID, health notes) lives in a separate table so RLS can
-- restrict it to roles with `members.sensitive`.

begin;

create table club.members (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (btrim(first_name) <> ''),
  last_name text not null default '',
  email text check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text,
  birth_date date,
  emergency_name text,
  emergency_phone text,
  joined_on date not null default current_date,
  left_on date check (left_on is null or left_on >= joined_on),
  active boolean generated always as (left_on is null) stored,
  data_consent_on date,
  image_consent boolean not null default false,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index members_active_name_idx on club.members (active, last_name, first_name);

create table club.member_private (
  member_id uuid primary key references club.members (id) on delete cascade,
  national_id text,
  health_notes text,
  updated_at timestamptz not null default now()
);

-- What every member has to complete. `yearly` items are renewed each season.
create table club.requirement_templates (
  id uuid primary key default gen_random_uuid(),
  key text unique,                 -- stable handle for automations (e.g. 'licence')
  name text not null,
  description text,
  yearly boolean not null default false,
  active boolean not null default true,
  sort int not null default 0
);

insert into club.requirement_templates (key, name, description, yearly, sort) values
  ('licence', 'Licencia federativa', 'Licencia de la federación de montaña para la temporada.', true, 10),
  ('club_fee', 'Cuota del club', 'Cuota de socio de la temporada.', true, 20),
  ('signup_form', 'Ficha de inscripción firmada', 'Ficha con datos, consentimiento de datos y uso de imagen.', false, 30);

create type club.requirement_status as enum ('pending', 'done', 'not_applicable');

create table club.member_requirements (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references club.members (id) on delete cascade,
  template_id uuid not null references club.requirement_templates (id) on delete restrict,
  season int check (season between 2000 and 2100),   -- null for one-off items
  status club.requirement_status not null default 'pending',
  done_on date,
  notes text,
  updated_at timestamptz not null default now()
);
create unique index member_requirements_unique
  on club.member_requirements (member_id, template_id, coalesce(season, 0));

create table club.federation_licences (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references club.members (id) on delete cascade,
  season int not null check (season between 2000 and 2100),
  federation text not null default 'FAM',
  modality text,
  licence_number text,
  valid_until date,
  notes text,
  created_at timestamptz not null default now(),
  unique (member_id, season)
);

-- ---------------------------------------------------------------------------
-- Checklist generation
-- ---------------------------------------------------------------------------

-- Creates the checklist of one member for a season (idempotent).
create function club.ensure_member_requirements(p_member uuid, p_season int)
returns void language sql security definer set search_path = '' as $$
  insert into club.member_requirements (member_id, template_id, season)
  select p_member, t.id, case when t.yearly then p_season end
  from club.requirement_templates t
  where t.active
  on conflict do nothing;
$$;

-- New members get their checklist for the current season straight away.
create function club.on_member_created() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform club.ensure_member_requirements(new.id, extract(year from new.joined_on)::int);
  return new;
end;
$$;

create trigger checklist after insert on club.members
  for each row execute function club.on_member_created();

-- "Abrir temporada": yearly items for every active member. Returns rows created.
create function club.open_season(p_season int) returns int
language plpgsql security definer set search_path = '' as $$
declare
  n int;
begin
  if not club.has_permission('members.write') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
  insert into club.member_requirements (member_id, template_id, season)
  select m.id, t.id, p_season
  from club.members m
  cross join club.requirement_templates t
  where m.active and t.active and t.yearly
  on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Recording a licence ticks the "licence" item of that season.
create function club.on_licence_saved() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform club.ensure_member_requirements(new.member_id, new.season);
  update club.member_requirements r
  set status = 'done', done_on = coalesce(r.done_on, current_date)
  from club.requirement_templates t
  where r.template_id = t.id and t.key = 'licence'
    and r.member_id = new.member_id and r.season = new.season
    and r.status = 'pending';
  return new;
end;
$$;

create trigger tick_licence after insert or update on club.federation_licences
  for each row execute function club.on_licence_saved();

-- ---------------------------------------------------------------------------
-- Housekeeping triggers
-- ---------------------------------------------------------------------------

create trigger touch before update on club.members
  for each row execute function club.touch_updated_at();
create trigger touch before update on club.member_private
  for each row execute function club.touch_updated_at();
create trigger touch before update on club.member_requirements
  for each row execute function club.touch_updated_at();

create trigger audit after insert or update or delete on club.members
  for each row execute function club.audit();
create trigger audit after insert or update or delete on club.member_private
  for each row execute function club.audit();
create trigger audit after insert or update or delete on club.requirement_templates
  for each row execute function club.audit();
create trigger audit after insert or update or delete on club.member_requirements
  for each row execute function club.audit();
create trigger audit after insert or update or delete on club.federation_licences
  for each row execute function club.audit();

-- The audit log must not copy sensitive values into a table other roles might read.
create or replace function club.audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  rec jsonb := to_jsonb(coalesce(new, old));
  redact text[] := case when tg_table_name = 'member_private'
                        then array['national_id', 'health_notes'] else '{}' end;
begin
  insert into club.audit_log (table_name, row_pk, action, old_data, new_data, actor)
  values (
    tg_table_name,
    coalesce(rec ->> 'id', rec ->> 'admin_user_id', rec ->> 'member_id'),
    lower(tg_op),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) - redact end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) - redact end,
    auth.uid()
  );
  return coalesce(new, old);
end;
$$;

revoke all on function club.ensure_member_requirements(uuid, int), club.on_member_created(),
  club.on_licence_saved() from public, anon, authenticated;
revoke all on function club.open_season(int) from public, anon;
grant execute on function club.open_season(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table club.members enable row level security;
alter table club.member_private enable row level security;
alter table club.requirement_templates enable row level security;
alter table club.member_requirements enable row level security;
alter table club.federation_licences enable row level security;

create policy "read members" on club.members
  for select to authenticated using ((select club.has_permission('members.read')));
create policy "add members" on club.members
  for insert to authenticated with check ((select club.has_permission('members.write')));
create policy "edit members" on club.members
  for update to authenticated
  using ((select club.has_permission('members.write')))
  with check ((select club.has_permission('members.write')));

create policy "read private" on club.member_private
  for select to authenticated using ((select club.has_permission('members.sensitive')));
create policy "add private" on club.member_private
  for insert to authenticated with check ((select club.has_permission('members.sensitive')));
create policy "edit private" on club.member_private
  for update to authenticated
  using ((select club.has_permission('members.sensitive')))
  with check ((select club.has_permission('members.sensitive')));

create policy "read templates" on club.requirement_templates
  for select to authenticated using ((select club.has_permission('members.read')));
create policy "add templates" on club.requirement_templates
  for insert to authenticated with check ((select club.has_permission('members.write')));
create policy "edit templates" on club.requirement_templates
  for update to authenticated
  using ((select club.has_permission('members.write')))
  with check ((select club.has_permission('members.write')));

create policy "read requirements" on club.member_requirements
  for select to authenticated using ((select club.has_permission('members.read')));
create policy "edit requirements" on club.member_requirements
  for update to authenticated
  using ((select club.has_permission('members.write')))
  with check ((select club.has_permission('members.write')));

create policy "read licences" on club.federation_licences
  for select to authenticated using ((select club.has_permission('members.read')));
create policy "add licences" on club.federation_licences
  for insert to authenticated with check ((select club.has_permission('members.write')));
create policy "edit licences" on club.federation_licences
  for update to authenticated
  using ((select club.has_permission('members.write')))
  with check ((select club.has_permission('members.write')));

grant select,
  insert (first_name, last_name, email, phone, birth_date, emergency_name, emergency_phone,
          joined_on, data_consent_on, image_consent, notes),
  update (first_name, last_name, email, phone, birth_date, emergency_name, emergency_phone,
          joined_on, left_on, data_consent_on, image_consent, notes)
  on club.members to authenticated;
grant select, insert (member_id, national_id, health_notes), update (national_id, health_notes)
  on club.member_private to authenticated;
grant select, insert (name, description, yearly, sort), update (name, description, yearly, active, sort)
  on club.requirement_templates to authenticated;
grant select, update (status, done_on, notes) on club.member_requirements to authenticated;
grant select,
  insert (member_id, season, federation, modality, licence_number, valid_until, notes),
  update (federation, modality, licence_number, valid_until, notes)
  on club.federation_licences to authenticated;
grant all on all tables in schema club to service_role;

commit;
