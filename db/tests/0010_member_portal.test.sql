-- Tests for 0010_member_portal.sql. Always rolls back.

begin;

insert into auth.users (id, email, email_confirmed_at, aud, role, encrypted_password) values
  ('00000000-0000-4000-8000-0000000000a1', 'familia@club.test', now(), 'authenticated', 'authenticated', null),
  ('00000000-0000-4000-8000-0000000000b2', 'otra@club.test', now(), 'authenticated', 'authenticated', null),
  ('00000000-0000-4000-8000-0000000000c3', 'conclave@club.test', now(), 'authenticated', 'authenticated', '$2a$10$hash');
insert into club.members (id, first_name, email) values
  ('00000000-0000-4000-8000-00000000f001', 'Madre', 'Familia@club.test'),
  ('00000000-0000-4000-8000-00000000f002', 'Hijo', 'familia@club.test'),
  ('00000000-0000-4000-8000-00000000f003', 'Otra', 'otra@club.test'),
  ('00000000-0000-4000-8000-00000000f004', 'Clave', 'conclave@club.test');
insert into club.members (id, first_name, email, joined_on, left_on) values
  ('00000000-0000-4000-8000-00000000f005', 'Exsocia', 'otra@club.test', '2020-01-01', '2021-01-01');
insert into club.charges (member_id, concept, amount_cents, due_on) values
  ('00000000-0000-4000-8000-00000000f001', 'Cuota madre', 3000, '2026-01-31'),
  ('00000000-0000-4000-8000-00000000f003', 'Cuota otra', 3000, '2026-01-31');
insert into club.league_entries (member_id, month, distance_m, elevation_gain_m) values
  ('00000000-0000-4000-8000-00000000f002', '2026-09-01', 50000, 2000),
  ('00000000-0000-4000-8000-00000000f003', '2026-09-01', 80000, 4000);
insert into club.events (id, title, starts_on, capacity) values
  ('00000000-0000-4000-8000-00000000e001', 'Futura', current_date + 10, 1),
  ('00000000-0000-4000-8000-00000000e002', 'Pasada', current_date - 10, null);
insert into club.events (id, title, starts_on, signup_deadline) values
  ('00000000-0000-4000-8000-00000000e003', 'Cerrada', current_date + 10, current_date - 1);

set local role authenticated;

-- 1. A family email sees both of its members and nothing else.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated","amr":[{"method":"otp","timestamp":1}]}', true);
do $$ begin
  if (select count(*) from club.portal_me()) <> 2 then raise exception 'family should see two members'; end if;
  if (select count(*) from club.portal_charges()) <> 1 then raise exception 'wrong charges'; end if;
  if (select concept from club.portal_charges()) <> 'Cuota madre' then raise exception 'saw another member''s charge'; end if;
  if (select count(*) from club.portal_league()) <> 1 then raise exception 'wrong league rows'; end if;
  if (select count(*) from club.portal_events()) <> 2 then raise exception 'past or wrong events listed'; end if;
  -- Still no direct table access.
  if exists (select 1 from club.members) then raise exception 'member reads members table'; end if;
  if exists (select 1 from club.charges) then raise exception 'member reads charges table'; end if;
end $$;

-- 2. Sign up within capacity; can't take another family's place or exceed capacity.
select club.portal_signup('00000000-0000-4000-8000-00000000e001', '00000000-0000-4000-8000-00000000f002', true);
do $$ begin
  if (select my_members from club.portal_events() where id = '00000000-0000-4000-8000-00000000e001') <> array['00000000-0000-4000-8000-00000000f002']::uuid[] then
    raise exception 'sign-up not shown';
  end if;
end $$;
do $$ begin
  perform club.portal_signup('00000000-0000-4000-8000-00000000e001', '00000000-0000-4000-8000-00000000f001', true);
  raise exception 'capacity not enforced from the portal';
exception when check_violation then null;
end $$;
do $$ begin
  perform club.portal_signup('00000000-0000-4000-8000-00000000e001', '00000000-0000-4000-8000-00000000f003', true);
  raise exception 'signed up someone else';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform club.portal_signup('00000000-0000-4000-8000-00000000e003', '00000000-0000-4000-8000-00000000f001', true);
  raise exception 'signed up after the deadline';
exception when check_violation then null;
end $$;
do $$ begin
  perform club.portal_signup('00000000-0000-4000-8000-00000000e002', '00000000-0000-4000-8000-00000000f001', true);
  raise exception 'signed up to a past event';
exception when no_data_found then null;
end $$;
select club.portal_signup('00000000-0000-4000-8000-00000000e001', '00000000-0000-4000-8000-00000000f002', false);
do $$ begin
  if (select signups from club.portal_events() where id = '00000000-0000-4000-8000-00000000e001') <> 0 then
    raise exception 'withdrawal failed';
  end if;
end $$;

-- 3. Former members are not linked.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated","amr":[{"method":"magiclink","timestamp":1}]}', true);
do $$ begin
  if (select count(*) from club.portal_me()) <> 1 then raise exception 'former member linked'; end if;
end $$;

-- 4. Password sessions, or accounts with a password, see nothing.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated","amr":[{"method":"password","timestamp":1}]}', true);
do $$ begin
  if exists (select 1 from club.portal_me()) then raise exception 'password session linked'; end if;
  if exists (select 1 from club.portal_charges()) then raise exception 'password session reads charges'; end if;
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated","amr":[{"method":"otp","timestamp":1}]}', true);
do $$ begin
  if exists (select 1 from club.portal_me()) then raise exception 'account with a password linked'; end if;
end $$;

-- 5. The helper itself is not callable.
do $$ begin
  perform club.portal_member_ids();
  raise exception 'helper is callable';
exception when insufficient_privilege then null;
end $$;

select 'all member portal tests passed' as result;
rollback;
