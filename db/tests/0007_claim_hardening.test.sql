-- Tests for 0007_claim_hardening.sql: an invitation is claimed only from an email
-- link/OTP or OAuth session on an account without a password. Always rolls back.

begin;

insert into auth.users (id, email, email_confirmed_at, aud, role, encrypted_password) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-link@club.test', now(), 'authenticated', 'authenticated', null),
  ('00000000-0000-4000-8000-0000000000b2', 'test-password@club.test', now(), 'authenticated', 'authenticated', '$2a$10$hash'),
  ('00000000-0000-4000-8000-0000000000c3', 'test-google@club.test', now(), 'authenticated', 'authenticated', ''),
  ('00000000-0000-4000-8000-0000000000d4', 'test-unconfirmed@club.test', null, 'authenticated', 'authenticated', null);
insert into club.invitations (email, roles) values
  ('test-link@club.test', '{owner}'),
  ('test-password@club.test', '{viewer}'),
  ('test-google@club.test', '{viewer}'),
  ('test-unconfirmed@club.test', '{viewer}');

set local role authenticated;

-- 1. A password session (amr "password") can't claim, even for an invited address.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated","amr":[{"method":"password","timestamp":1}]}', true);
do $$ begin
  if club.claim_invitation() then raise exception 'claimed from a password session'; end if;
end $$;
-- No amr at all: refused too.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ begin
  if club.claim_invitation() then raise exception 'claimed without amr'; end if;
end $$;

-- 2. Email-link session on a passwordless account: claims.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated","amr":[{"method":"magiclink","timestamp":1}]}', true);
do $$ begin
  if not club.claim_invitation() then raise exception 'magic link could not claim'; end if;
end $$;

-- 3. Account with a password: refused even with an OTP session (pre-registered address).
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated","amr":[{"method":"otp","timestamp":1}]}', true);
do $$ begin
  if club.claim_invitation() then raise exception 'account with a password claimed'; end if;
end $$;

-- 4. OAuth session, empty password: claims.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated","amr":[{"method":"oauth","timestamp":1}]}', true);
do $$ begin
  if not club.claim_invitation() then raise exception 'oauth could not claim'; end if;
end $$;

-- 5. Unconfirmed email: refused.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000d4","role":"authenticated","amr":[{"method":"otp","timestamp":1}]}', true);
do $$ begin
  if club.claim_invitation() then raise exception 'unconfirmed email claimed'; end if;
end $$;

-- 6. Already-active admins stay active whatever the session method.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated","amr":[{"method":"password","timestamp":1}]}', true);
do $$ begin
  if not club.claim_invitation() then raise exception 'active admin reported inactive'; end if;
end $$;

reset role;
do $$ begin
  if (select count(*) from club.invitations where accepted_at is not null) <> 2 then
    raise exception 'wrong invitations accepted';
  end if;
  if exists (select 1 from club.admin_users where id in ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000d4')) then
    raise exception 'refused users became admins';
  end if;
end $$;

select 'all claim hardening tests passed' as result;
rollback;
