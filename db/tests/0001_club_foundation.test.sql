-- RLS and invitation tests for 0001_club_foundation.sql.
-- Runs inside a transaction and always rolls back: safe to execute against dev.
-- Any failed expectation raises an exception (the run errors out).

begin;

-- Fixtures: two confirmed auth users, one invited as owner, one outsider.
insert into auth.users (id, email, email_confirmed_at, aud, role)
values
  ('00000000-0000-4000-8000-0000000000a1', 'test-owner@club.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-outsider@club.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000c3', 'test-treasurer@club.test', now(), 'authenticated', 'authenticated');
insert into club.invitations (email, roles) values ('test-owner@club.test', '{owner}');

-- 1. Outsider: claim fails and every table reads empty.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated","amr":[{"method":"otp","timestamp":1}]}', true);
do $$ begin
  if club.claim_invitation() then raise exception 'outsider claimed an invitation'; end if;
  if exists (select 1 from club.admin_users) then raise exception 'outsider reads admins'; end if;
  if exists (select 1 from club.role_permissions) then raise exception 'outsider reads permissions'; end if;
  if exists (select 1 from club.invitations) then raise exception 'outsider reads invitations'; end if;
  if exists (select 1 from club.my_permissions()) then raise exception 'outsider has permissions'; end if;
end $$;
do $$ begin
  insert into club.invitations (email, roles, invited_by)
  values ('x@club.test', '{owner}', '00000000-0000-4000-8000-0000000000b2');
  raise exception 'outsider created an invitation';
exception when insufficient_privilege then null;
end $$;

-- 2. Owner claims the invitation and gets every permission.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated","amr":[{"method":"otp","timestamp":1}]}', true);
do $$ begin
  if not club.claim_invitation() then raise exception 'owner could not claim'; end if;
  if not club.claim_invitation() then raise exception 'second claim should still be true'; end if;
  if not club.has_permission('admins.manage') then raise exception 'owner lacks admins.manage'; end if;
  if (select count(*) from club.my_permissions()) <> 16 then raise exception 'owner permission count'; end if;
end $$;

-- 3. Owner invites a treasurer; the treasurer claims and is limited.
insert into club.invitations (email, roles, invited_by)
values ('test-treasurer@club.test', '{treasurer}', '00000000-0000-4000-8000-0000000000a1');
do $$ begin
  insert into club.invitations (email, roles, invited_by)
  values ('y@club.test', '{viewer}', '00000000-0000-4000-8000-0000000000b2');
  raise exception 'owner forged invited_by';
exception when insufficient_privilege then null;
end $$;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated","amr":[{"method":"otp","timestamp":1}]}', true);
do $$ begin
  if not club.claim_invitation() then raise exception 'treasurer could not claim'; end if;
  if club.has_permission('admins.manage') then raise exception 'treasurer can manage admins'; end if;
  if not club.has_permission('fees.write') then raise exception 'treasurer lacks fees.write'; end if;
  if (select count(*) from club.admin_users) <> 2 then raise exception 'treasurer should read both admins'; end if;
  if exists (select 1 from club.invitations) then raise exception 'treasurer reads invitations'; end if;
  if exists (select 1 from club.audit_log) then raise exception 'treasurer reads audit log'; end if;
end $$;
-- Treasurer cannot promote themself (RLS hides the row from insert check).
do $$ begin
  insert into club.admin_user_roles values ('00000000-0000-4000-8000-0000000000c3', 'owner');
  raise exception 'treasurer promoted themself';
exception when insufficient_privilege then null;
end $$;
-- Treasurer cannot deactivate the owner (update silently matches no rows).
update club.admin_users set active = false where id = '00000000-0000-4000-8000-0000000000a1';
do $$ begin
  if not (select active from club.admin_users where id = '00000000-0000-4000-8000-0000000000a1') then
    raise exception 'treasurer deactivated the owner';
  end if;
end $$;

-- 4. Owner deactivates the treasurer; the treasurer loses all access.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated","amr":[{"method":"otp","timestamp":1}]}', true);
update club.admin_users set active = false where id = '00000000-0000-4000-8000-0000000000c3';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated","amr":[{"method":"otp","timestamp":1}]}', true);
do $$ begin
  if club.claim_invitation() then raise exception 'deactivated admin still active'; end if;
  if exists (select 1 from club.admin_users) then raise exception 'deactivated admin reads admins'; end if;
end $$;

-- 5. The last owner cannot remove their own owner role (checked at commit time).
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated","amr":[{"method":"otp","timestamp":1}]}', true);
do $$ begin
  if (select count(*) from club.audit_log) = 0 then raise exception 'audit log is empty'; end if;
end $$;
savepoint before_last_owner;
delete from club.admin_user_roles where admin_user_id = '00000000-0000-4000-8000-0000000000a1' and role = 'owner';
do $$ begin
  set constraints all immediate;
  raise exception 'last owner removed';
exception when check_violation then null;
end $$;
rollback to savepoint before_last_owner;

select 'all club foundation tests passed' as result;
rollback;
