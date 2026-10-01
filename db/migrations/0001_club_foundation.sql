-- Admin panel foundation: schema, admins, roles, permissions, invitations, audit log.
--
-- Everything lives in the `club` schema. In development this schema sits inside a
-- shared Supabase project, so these files are applied with plain SQL and are NOT
-- registered in that project's migration history. Apply them in order.

begin;

create schema club;

revoke all on schema club from public, anon;
grant usage on schema club to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Roles and permissions (single source of truth; the app reads it via RPC)
-- ---------------------------------------------------------------------------

create type club.admin_role as enum ('owner', 'treasurer', 'secretary', 'league', 'viewer');

create table club.role_permissions (
  role club.admin_role not null,
  permission text not null,
  primary key (role, permission)
);

insert into club.role_permissions (role, permission)
select 'owner'::club.admin_role, p from unnest(array[
  'panel.read', 'admins.manage', 'audit.read',
  'members.read', 'members.write', 'members.sensitive',
  'accounts.read', 'accounts.write', 'fees.read', 'fees.write',
  'grants.read', 'grants.write', 'league.read', 'league.write',
  'comms.read', 'comms.send'
]) p
union all
select 'treasurer'::club.admin_role, p from unnest(array[
  'panel.read', 'members.read', 'accounts.read', 'accounts.write',
  'fees.read', 'fees.write', 'grants.read', 'league.read', 'comms.read', 'comms.send'
]) p
union all
select 'secretary'::club.admin_role, p from unnest(array[
  'panel.read', 'members.read', 'members.write', 'members.sensitive',
  'accounts.read', 'fees.read', 'grants.read', 'grants.write', 'league.read',
  'comms.read', 'comms.send'
]) p
union all
select 'league'::club.admin_role, p from unnest(array[
  'panel.read', 'members.read', 'league.read', 'league.write'
]) p
union all
select 'viewer'::club.admin_role, p from unnest(array[
  'panel.read', 'members.read', 'accounts.read', 'fees.read', 'grants.read',
  'league.read', 'comms.read'
]) p;

-- ---------------------------------------------------------------------------
-- Admins
-- ---------------------------------------------------------------------------

create table club.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  active boolean not null default true,
  invited_by uuid references club.admin_users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index admin_users_email_key on club.admin_users (lower(email));

create table club.admin_user_roles (
  admin_user_id uuid not null references club.admin_users (id) on delete cascade,
  role club.admin_role not null,
  primary key (admin_user_id, role)
);

create table club.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(btrim(email)) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  full_name text,
  roles club.admin_role[] not null check (cardinality(roles) > 0),
  invited_by uuid references club.admin_users (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz
);
create unique index invitations_one_pending on club.invitations (email)
  where accepted_at is null and revoked_at is null;

-- ---------------------------------------------------------------------------
-- Audit log (written only by triggers)
-- ---------------------------------------------------------------------------

create table club.audit_log (
  id bigint generated always as identity primary key,
  table_name text not null,
  row_pk text,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  actor uuid,
  at timestamptz not null default now()
);
create index audit_log_at_idx on club.audit_log (at desc);

create function club.audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  rec jsonb := to_jsonb(coalesce(new, old));
begin
  insert into club.audit_log (table_name, row_pk, action, old_data, new_data, actor)
  values (
    tg_table_name,
    coalesce(rec ->> 'id', rec ->> 'admin_user_id'),
    lower(tg_op),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end,
    auth.uid()
  );
  return coalesce(new, old);
end;
$$;

create trigger audit after insert or update or delete on club.admin_users
  for each row execute function club.audit();
create trigger audit after insert or update or delete on club.admin_user_roles
  for each row execute function club.audit();
create trigger audit after insert or update or delete on club.invitations
  for each row execute function club.audit();

create function club.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger touch before update on club.admin_users
  for each row execute function club.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Guard: the club always keeps at least one active owner
-- ---------------------------------------------------------------------------

create function club.ensure_active_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from club.admin_users)
     and not exists (
       select 1
       from club.admin_users u
       join club.admin_user_roles r on r.admin_user_id = u.id
       where u.active and r.role = 'owner'
     ) then
    raise exception 'El club debe tener al menos un propietario activo'
      using errcode = 'check_violation';
  end if;
  return null;
end;
$$;

-- Deferred so a role swap inside one transaction is allowed.
create constraint trigger keep_owner after update or delete on club.admin_users
  deferrable initially deferred for each row execute function club.ensure_active_owner();
create constraint trigger keep_owner after delete or update on club.admin_user_roles
  deferrable initially deferred for each row execute function club.ensure_active_owner();

-- ---------------------------------------------------------------------------
-- Permission helpers
-- ---------------------------------------------------------------------------

create function club.my_permissions() returns setof text
language sql stable security definer set search_path = '' as $$
  select distinct rp.permission
  from club.admin_users u
  join club.admin_user_roles r on r.admin_user_id = u.id
  join club.role_permissions rp on rp.role = r.role
  where u.id = (select auth.uid()) and u.active;
$$;

create function club.has_permission(perm text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from club.admin_users u
    join club.admin_user_roles r on r.admin_user_id = u.id
    join club.role_permissions rp on rp.role = r.role
    where u.id = (select auth.uid()) and u.active and rp.permission = perm
  );
$$;

-- Turns a pending invitation for the signed-in, email-verified user into an admin.
-- Returns true when the caller is (now) an active admin.
create function club.claim_invitation() returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  v_email text;
  v_active boolean;
  inv club.invitations;
begin
  if uid is null then
    return false;
  end if;

  select active into v_active from club.admin_users where id = uid;
  if v_active then
    return true;
  end if;

  select lower(email) into v_email
  from auth.users
  where id = uid and email_confirmed_at is not null;
  if v_email is null then
    return false;
  end if;

  select * into inv
  from club.invitations
  where email = v_email and accepted_at is null and revoked_at is null
  for update;
  if not found then
    return false;
  end if;

  insert into club.admin_users (id, email, full_name, invited_by, active)
  values (uid, v_email, inv.full_name, inv.invited_by, true)
  on conflict (id) do update
    set active = true,
        email = excluded.email,
        full_name = coalesce(excluded.full_name, club.admin_users.full_name);

  delete from club.admin_user_roles where admin_user_id = uid;
  insert into club.admin_user_roles (admin_user_id, role)
  select uid, unnest(inv.roles);

  update club.invitations set accepted_at = now() where id = inv.id;
  return true;
end;
$$;

revoke all on function club.audit(), club.touch_updated_at(), club.ensure_active_owner()
  from public, anon, authenticated;
revoke all on function club.my_permissions(), club.has_permission(text), club.claim_invitation()
  from public, anon;
grant execute on function club.my_permissions(), club.has_permission(text), club.claim_invitation()
  to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table club.role_permissions enable row level security;
alter table club.admin_users enable row level security;
alter table club.admin_user_roles enable row level security;
alter table club.invitations enable row level security;
alter table club.audit_log enable row level security;

create policy "admins read permissions" on club.role_permissions
  for select to authenticated using ((select club.has_permission('panel.read')));

create policy "admins read admins" on club.admin_users
  for select to authenticated using ((select club.has_permission('panel.read')));
create policy "owners update admins" on club.admin_users
  for update to authenticated
  using ((select club.has_permission('admins.manage')))
  with check ((select club.has_permission('admins.manage')));
-- No insert policy: admins are created only by claim_invitation().
-- No delete policy: access is revoked with active = false, never deleted.

create policy "admins read roles" on club.admin_user_roles
  for select to authenticated using ((select club.has_permission('panel.read')));
create policy "owners grant roles" on club.admin_user_roles
  for insert to authenticated with check ((select club.has_permission('admins.manage')));
create policy "owners revoke roles" on club.admin_user_roles
  for delete to authenticated using ((select club.has_permission('admins.manage')));

create policy "owners read invitations" on club.invitations
  for select to authenticated using ((select club.has_permission('admins.manage')));
create policy "owners create invitations" on club.invitations
  for insert to authenticated
  with check (
    (select club.has_permission('admins.manage'))
    and invited_by = (select auth.uid())
    and accepted_at is null and revoked_at is null
  );
create policy "owners revoke invitations" on club.invitations
  for update to authenticated
  using ((select club.has_permission('admins.manage')) and accepted_at is null)
  with check ((select club.has_permission('admins.manage')));

create policy "owners read audit" on club.audit_log
  for select to authenticated using ((select club.has_permission('audit.read')));

grant select on club.role_permissions, club.audit_log to authenticated;
grant select, update (full_name, active) on club.admin_users to authenticated;
grant select, insert, delete on club.admin_user_roles to authenticated;
grant select, insert (email, full_name, roles, invited_by), update (revoked_at)
  on club.invitations to authenticated;
grant all on all tables in schema club to service_role;

commit;
