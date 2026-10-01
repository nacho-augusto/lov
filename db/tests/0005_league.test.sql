-- Tests for 0005_league.sql. Always rolls back.

begin;

insert into auth.users (id, email, email_confirmed_at, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-league@club.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-treasurer@club.test', now(), 'authenticated', 'authenticated');
insert into club.admin_users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-league@club.test'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-treasurer@club.test');
insert into club.admin_user_roles values
  ('00000000-0000-4000-8000-0000000000a1', 'league'),
  ('00000000-0000-4000-8000-0000000000b2', 'treasurer'),
  ('00000000-0000-4000-8000-0000000000b2', 'owner');
insert into club.members (id, first_name) values ('00000000-0000-4000-8000-00000000f001', 'Liga');

set local role authenticated;

-- League role records a month; mid-month dates and duplicates are refused.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
insert into club.league_entries (member_id, month, distance_m, elevation_gain_m)
values ('00000000-0000-4000-8000-00000000f001', '2026-09-01', 120500, 5400);
do $$ begin
  insert into club.league_entries (member_id, month, distance_m, elevation_gain_m)
  values ('00000000-0000-4000-8000-00000000f001', '2026-09-15', 1, 1);
  raise exception 'mid-month accepted';
exception when check_violation then null;
end $$;
do $$ begin
  insert into club.league_entries (member_id, month, distance_m, elevation_gain_m)
  values ('00000000-0000-4000-8000-00000000f001', '2026-09-01', 1, 1);
  raise exception 'duplicate month accepted';
exception when unique_violation then null;
end $$;

-- Treasurer (owner too here) reads; a treasurer-only admin could not write (owner can).
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from club.league_entries) <> 1 then raise exception 'cannot read league'; end if;
end $$;
delete from club.admin_user_roles where admin_user_id = '00000000-0000-4000-8000-0000000000b2' and role = 'owner';
update club.league_entries set distance_m = 1;
do $$ begin
  if (select distance_m from club.league_entries) <> 120500 then raise exception 'treasurer edited league'; end if;
end $$;

select 'all league tests passed' as result;
rollback;
