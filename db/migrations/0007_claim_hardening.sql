-- Harden invitation claiming for a shared auth project.
-- email_confirmed_at alone doesn't prove mailbox ownership when sign-ups may be
-- auto-confirmed, or when someone pre-registers an invited address with a password.
-- A claim now requires a session proven by email link/OTP or OAuth, and an account
-- without a password.

begin;

create or replace function club.claim_invitation() returns boolean
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

  -- The session must come from proving control of the mailbox (link/OTP) or Google.
  if not exists (
    select 1 from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) e
    where e ->> 'method' in ('otp', 'magiclink', 'oauth')
  ) then
    return false;
  end if;

  select lower(email) into v_email
  from auth.users
  where id = uid
    and email_confirmed_at is not null
    and coalesce(encrypted_password, '') = '';
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

revoke all on function club.claim_invitation() from public, anon;
grant execute on function club.claim_invitation() to authenticated;

commit;
