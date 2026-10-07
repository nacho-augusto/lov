-- Tests for 0011_review_fixes.sql. Always rolls back.

begin;

insert into auth.users (id, email, email_confirmed_at, aud, role, encrypted_password) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-secretary@club.test', now(), 'authenticated', 'authenticated', null),
  ('00000000-0000-4000-8000-0000000000b2', 'stranger@club.test', null, 'authenticated', 'authenticated', '$2a$10$hash'),
  ('00000000-0000-4000-8000-0000000000c3', 'runner@club.test', now(), 'authenticated', 'authenticated', null);
insert into club.admin_users (id, email) values ('00000000-0000-4000-8000-0000000000a1', 'test-secretary@club.test');
insert into club.admin_user_roles values
  ('00000000-0000-4000-8000-0000000000a1', 'owner'),
  ('00000000-0000-4000-8000-0000000000a1', 'secretary');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

insert into club.members (id, first_name, email, joined_on, left_on) values
  ('00000000-0000-4000-8000-00000000f001', 'Juana', 'juana@club.test', '2025-01-01', '2026-06-30');
insert into club.members (id, first_name, email) values
  ('00000000-0000-4000-8000-00000000f002', 'Runner', 'runner@club.test');
insert into club.events (id, title, starts_on, ends_on) values
  ('00000000-0000-4000-8000-00000000e001', 'Travesía', current_date - 1, current_date + 1),
  ('00000000-0000-4000-8000-00000000e002', 'Vieja', current_date - 30, null);
insert into club.event_signups (event_id, member_id, notes)
values ('00000000-0000-4000-8000-00000000e002', '00000000-0000-4000-8000-00000000f001', 'Juana va con su hijo Pablo');
insert into club.gear_items (id, name) values ('00000000-0000-4000-8000-00000000d001', 'Walkie');
insert into club.gear_loans (item_id, member_id, out_on, returned_on, notes)
values ('00000000-0000-4000-8000-00000000d001', '00000000-0000-4000-8000-00000000f001', '2026-01-01', '2026-02-01', 'Entregado en C/ Mayor 3');
insert into club.email_messages (subject, recipients)
values ('Juana, tu cuota', '[{"member_id":"00000000-0000-4000-8000-00000000f001","email":"juana@club.test","name":"Juana"}]');

-- 1. Emails must be lowercase.
do $$ begin
  insert into club.members (first_name, email) values ('Mayus', 'Mayus@club.test');
  raise exception 'uppercase email accepted';
exception when check_violation then null;
end $$;

-- 2. Anonymising clears phase-6 notes and personalised subjects, in tables and audit.
set local role authenticated;
select club.anonymise_member('00000000-0000-4000-8000-00000000f001');
reset role;
do $$ begin
  if exists (select 1 from club.event_signups where notes is not null and member_id = '00000000-0000-4000-8000-00000000f001') then
    raise exception 'sign-up notes kept';
  end if;
  if exists (select 1 from club.gear_loans where notes is not null and member_id = '00000000-0000-4000-8000-00000000f001') then
    raise exception 'loan notes kept';
  end if;
  if exists (select 1 from club.email_messages where subject ~* 'juana') then raise exception 'subject kept'; end if;
  if exists (select 1 from club.audit_log where coalesce(old_data, '{}')::text ~* 'juana|pablo|mayor'
                                              or coalesce(new_data, '{}')::text ~* 'juana|pablo|mayor') then
    raise exception 'audit log still holds personal data';
  end if;
end $$;

-- 3. The anonymised record is frozen, including rows hanging off it.
set local role authenticated;
do $$ begin
  update club.members set phone = '600000000' where id = '00000000-0000-4000-8000-00000000f001';
  raise exception 'anonymised member edited';
exception when check_violation then null;
end $$;
do $$ begin
  insert into club.federation_licences (member_id, season, licence_number)
  values ('00000000-0000-4000-8000-00000000f001', 2027, 'X');
  raise exception 'licence added to an anonymised member';
exception when check_violation then null;
end $$;
do $$ begin
  insert into club.member_private (member_id, national_id) values ('00000000-0000-4000-8000-00000000f001', '1');
  raise exception 'private data added to an anonymised member';
exception when check_violation then null;
end $$;

-- 4. portal_events: nothing for non-members; running multi-day events still listed.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated","amr":[{"method":"password","timestamp":1}]}', true);
do $$ begin
  if exists (select 1 from club.portal_events()) then raise exception 'non-member sees activities'; end if;
end $$;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated","amr":[{"method":"otp","timestamp":1}]}', true);
do $$ begin
  if not exists (select 1 from club.portal_events() where title = 'Travesía') then raise exception 'running event hidden'; end if;
  if exists (select 1 from club.portal_events() where title = 'Vieja') then raise exception 'past event listed'; end if;
end $$;
select club.portal_signup('00000000-0000-4000-8000-00000000e001', '00000000-0000-4000-8000-00000000f002', true);

select 'all review fixes tests passed' as result;
rollback;
