-- Tests for 0009_club_extras.sql. Always rolls back.

begin;

insert into auth.users (id, email, email_confirmed_at, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-secretary@club.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-viewer@club.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000c3', 'test-league@club.test', now(), 'authenticated', 'authenticated');
insert into club.admin_users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-secretary@club.test'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-viewer@club.test'),
  ('00000000-0000-4000-8000-0000000000c3', 'test-league@club.test');
insert into club.admin_user_roles values
  ('00000000-0000-4000-8000-0000000000a1', 'owner'),
  ('00000000-0000-4000-8000-0000000000a1', 'secretary'),
  ('00000000-0000-4000-8000-0000000000b2', 'viewer'),
  ('00000000-0000-4000-8000-0000000000c3', 'league');
insert into club.members (id, first_name) values
  ('00000000-0000-4000-8000-00000000f001', 'Uno'),
  ('00000000-0000-4000-8000-00000000f002', 'Dos'),
  ('00000000-0000-4000-8000-00000000f003', 'Tres');

set local role authenticated;

-- 1. Secretary: documents, events with capacity, gear loans.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
insert into club.club_documents (name, kind, expires_on) values ('Póliza RC', 'insurance', '2027-01-31');
do $$ begin
  insert into club.club_documents (name, kind) values ('Mal', 'receta');
  raise exception 'unknown document kind accepted';
exception when check_violation then null;
end $$;

insert into club.events (title, starts_on, capacity) values ('Maroma test', '2026-11-08', 2);
insert into club.event_signups (event_id, member_id)
select id, '00000000-0000-4000-8000-00000000f001' from club.events where title = 'Maroma test';
do $$ begin
  insert into club.event_signups (event_id, member_id)
  select id, '00000000-0000-4000-8000-00000000f001' from club.events where title = 'Maroma test';
  raise exception 'double sign-up accepted';
exception when unique_violation then null;
end $$;
insert into club.event_signups (event_id, member_id)
select id, '00000000-0000-4000-8000-00000000f002' from club.events where title = 'Maroma test';
do $$ begin
  insert into club.event_signups (event_id, member_id)
  select id, '00000000-0000-4000-8000-00000000f003' from club.events where title = 'Maroma test';
  raise exception 'capacity not enforced';
exception when check_violation then null;
end $$;
update club.events set cancelled = true where title = 'Maroma test';
delete from club.event_signups where member_id = '00000000-0000-4000-8000-00000000f002';
do $$ begin
  insert into club.event_signups (event_id, member_id)
  select id, '00000000-0000-4000-8000-00000000f003' from club.events where title = 'Maroma test';
  raise exception 'signed up to a cancelled event';
exception when check_violation then null;
end $$;

insert into club.gear_items (name, code) values ('Walkie', 'WT-01');
insert into club.gear_loans (item_id, member_id)
select id, '00000000-0000-4000-8000-00000000f001' from club.gear_items where code = 'WT-01';
do $$ begin
  insert into club.gear_loans (item_id, member_id)
  select id, '00000000-0000-4000-8000-00000000f002' from club.gear_items where code = 'WT-01';
  raise exception 'item lent twice';
exception when unique_violation then null;
end $$;
update club.gear_loans set returned_on = current_date;
insert into club.gear_loans (item_id, member_id)
select id, '00000000-0000-4000-8000-00000000f002' from club.gear_items where code = 'WT-01';

-- 2. Viewer reads everything, writes nothing.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from club.club_documents) <> 1 then raise exception 'viewer cannot read documents'; end if;
  if (select count(*) from club.event_signups) <> 1 then raise exception 'viewer cannot read sign-ups'; end if;
  if (select count(*) from club.gear_loans) <> 2 then raise exception 'viewer cannot read loans'; end if;
end $$;
do $$ begin
  insert into club.club_documents (name) values ('hack');
  raise exception 'viewer added a document';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  insert into club.gear_items (name) values ('hack');
  raise exception 'viewer added gear';
exception when insufficient_privilege then null;
end $$;

-- 3. League role runs events, sees no documents or gear.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated"}', true);
insert into club.events (title, starts_on) values ('Salida liga', '2026-12-01');
do $$ begin
  if exists (select 1 from club.club_documents) then raise exception 'league reads documents'; end if;
  if exists (select 1 from club.gear_items) then raise exception 'league reads gear'; end if;
  if (select count(*) from club.events) <> 2 then raise exception 'league cannot read events'; end if;
end $$;

-- 4. Storage policies follow the permissions.
do $$ begin
  insert into storage.objects (bucket_id, name) values ('club-documents', 'x/hack.pdf');
  raise exception 'league uploaded a club document';
exception when insufficient_privilege then null;
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
insert into storage.objects (bucket_id, name) values ('club-documents', 'x/ok.pdf');

select 'all club extras tests passed' as result;
rollback;
