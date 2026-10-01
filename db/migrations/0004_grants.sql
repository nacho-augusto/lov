-- Grants: calls per year, required documents (free text), attached files and the
-- expenses used to justify them.

begin;

create type club.grant_status as enum ('preparing', 'submitted', 'awarded', 'rejected', 'justified');
create type club.task_status as enum ('pending', 'in_progress', 'done', 'not_applicable');

create table club.grants (
  id uuid primary key default gen_random_uuid(),
  year int not null check (year between 2000 and 2100),
  name text not null check (btrim(name) <> ''),
  awarding_body text,
  call_url text check (call_url is null or call_url ~* '^https?://'),
  requested_cents bigint check (requested_cents is null or requested_cents >= 0),
  awarded_cents bigint check (awarded_cents is null or awarded_cents >= 0),
  status club.grant_status not null default 'preparing',
  application_deadline date,
  justification_deadline date,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index grants_year_idx on club.grants (year desc);

create table club.grant_requirements (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid not null references club.grants (id) on delete cascade,
  description text not null check (btrim(description) <> ''),
  status club.task_status not null default 'pending',
  notes text,
  sort int not null default 0
);
create index grant_requirements_grant_idx on club.grant_requirements (grant_id, sort);

create table club.grant_documents (
  id uuid primary key default gen_random_uuid(),
  grant_id uuid not null references club.grants (id) on delete cascade,
  requirement_id uuid references club.grant_requirements (id) on delete set null,
  path text not null unique,
  file_name text not null,
  size_bytes bigint,
  uploaded_by uuid default auth.uid(),
  uploaded_at timestamptz not null default now()
);

alter table club.transactions
  add column grant_id uuid references club.grants (id) on delete set null;
create index transactions_grant_idx on club.transactions (grant_id) where grant_id is not null;

-- Linking an expense to a grant is a grants task (secretaries), not an accounts edit.
create function club.link_expense_to_grant(p_transaction uuid, p_grant uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not club.has_permission('grants.write') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
  update club.transactions
  set grant_id = p_grant
  where id = p_transaction and kind = 'expense';
  if not found then
    raise exception 'Gasto no encontrado' using errcode = 'no_data_found';
  end if;
end;
$$;

create trigger touch before update on club.grants for each row execute function club.touch_updated_at();
create trigger audit after insert or update or delete on club.grants for each row execute function club.audit();
create trigger audit after insert or update or delete on club.grant_requirements for each row execute function club.audit();
create trigger audit after insert or update or delete on club.grant_documents for each row execute function club.audit();

revoke all on function club.link_expense_to_grant(uuid, uuid) from public, anon;
grant execute on function club.link_expense_to_grant(uuid, uuid) to authenticated;

alter table club.grants enable row level security;
alter table club.grant_requirements enable row level security;
alter table club.grant_documents enable row level security;

create policy "read grants" on club.grants for select to authenticated
  using ((select club.has_permission('grants.read')));
create policy "add grants" on club.grants for insert to authenticated
  with check ((select club.has_permission('grants.write')));
create policy "edit grants" on club.grants for update to authenticated
  using ((select club.has_permission('grants.write'))) with check ((select club.has_permission('grants.write')));

create policy "read grant requirements" on club.grant_requirements for select to authenticated
  using ((select club.has_permission('grants.read')));
create policy "add grant requirements" on club.grant_requirements for insert to authenticated
  with check ((select club.has_permission('grants.write')));
create policy "edit grant requirements" on club.grant_requirements for update to authenticated
  using ((select club.has_permission('grants.write'))) with check ((select club.has_permission('grants.write')));
create policy "delete grant requirements" on club.grant_requirements for delete to authenticated
  using ((select club.has_permission('grants.write')));

create policy "read grant documents" on club.grant_documents for select to authenticated
  using ((select club.has_permission('grants.read')));
create policy "add grant documents" on club.grant_documents for insert to authenticated
  with check ((select club.has_permission('grants.write')));
create policy "delete grant documents" on club.grant_documents for delete to authenticated
  using ((select club.has_permission('grants.write')));

grant select,
  insert (year, name, awarding_body, call_url, requested_cents, awarded_cents, status,
          application_deadline, justification_deadline, notes),
  update (year, name, awarding_body, call_url, requested_cents, awarded_cents, status,
          application_deadline, justification_deadline, notes)
  on club.grants to authenticated;
grant select, delete, insert (grant_id, description, status, notes, sort), update (description, status, notes, sort)
  on club.grant_requirements to authenticated;
grant select, delete, insert (grant_id, requirement_id, path, file_name, size_bytes)
  on club.grant_documents to authenticated;
grant all on all tables in schema club to service_role;

-- Private bucket for grant paperwork. Files are uploaded straight from the browser
-- with a signed upload URL, so they can be bigger than a Server Action body.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('club-grants', 'club-grants', false, 26214400,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp',
              'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.oasis.opendocument.text', 'application/vnd.oasis.opendocument.spreadsheet',
              'application/zip'])
on conflict (id) do nothing;

create policy "club grants read" on storage.objects for select to authenticated
  using (bucket_id = 'club-grants' and (select club.has_permission('grants.read')));
create policy "club grants upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'club-grants' and (select club.has_permission('grants.write')));
create policy "club grants delete" on storage.objects for delete to authenticated
  using (bucket_id = 'club-grants' and (select club.has_permission('grants.write')));

commit;
