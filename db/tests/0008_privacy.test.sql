-- Tests for 0008_privacy.sql. Always rolls back.

begin;

insert into auth.users (id, email, email_confirmed_at, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-secretary@club.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-treasurer@club.test', now(), 'authenticated', 'authenticated');
insert into club.admin_users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-secretary@club.test'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-treasurer@club.test');
insert into club.admin_user_roles values
  ('00000000-0000-4000-8000-0000000000a1', 'owner'),
  ('00000000-0000-4000-8000-0000000000a1', 'secretary'),
  ('00000000-0000-4000-8000-0000000000b2', 'treasurer');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

-- Fixture: a member with private data, a licence, a paid charge and an email.
insert into club.members (id, first_name, last_name, email, phone, joined_on, no_auto_reminders)
values ('00000000-0000-4000-8000-00000000f001', 'Marta', 'Privada', 'marta@club.test', '600000000', '2025-01-01', false);
insert into club.member_private (member_id, national_id, health_notes)
values ('00000000-0000-4000-8000-00000000f001', '12345678Z', 'asma');
insert into club.federation_licences (member_id, season, licence_number, notes)
values ('00000000-0000-4000-8000-00000000f001', 2025, 'LIC-1', 'nota personal');
insert into club.charges (member_id, concept, amount_cents, due_on)
values ('00000000-0000-4000-8000-00000000f001', 'Cuota 2025', 3000, '2025-02-01');
insert into club.payments (charge_id, amount_cents, notes)
select id, 3000, 'pagó su hermana' from club.charges where member_id = '00000000-0000-4000-8000-00000000f001';
insert into club.email_messages (subject, recipients)
values ('Aviso', '[{"member_id":"00000000-0000-4000-8000-00000000f001","email":"marta@club.test","name":"Marta Privada"},{"member_id":null,"email":"otro@club.test","name":"Otro"}]');

set local role authenticated;

-- 1. Active members can't be anonymised.
do $$ begin
  perform club.anonymise_member('00000000-0000-4000-8000-00000000f001');
  raise exception 'anonymised an active member';
exception when check_violation then null;
end $$;

-- 2. Treasurer (no members.sensitive) can't anonymise.
update club.members set left_on = '2026-06-30' where id = '00000000-0000-4000-8000-00000000f001';
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
do $$ begin
  perform club.anonymise_member('00000000-0000-4000-8000-00000000f001');
  raise exception 'treasurer anonymised';
exception when insufficient_privilege then null;
end $$;

-- 3. Owed money blocks it.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
insert into club.charges (member_id, concept, amount_cents, due_on)
values ('00000000-0000-4000-8000-00000000f001', 'Deuda', 1000, '2026-01-01');
do $$ begin
  perform club.anonymise_member('00000000-0000-4000-8000-00000000f001');
  raise exception 'anonymised with debt';
exception when check_violation then null;
end $$;
update club.charges set waived = true where concept = 'Deuda';

-- 4. Anonymise: personal data gone, accounting kept.
select club.anonymise_member('00000000-0000-4000-8000-00000000f001');
reset role;
do $$
declare m club.members;
begin
  select * into m from club.members where id = '00000000-0000-4000-8000-00000000f001';
  if m.first_name not like 'Antiguo miembro %' or m.email is not null or m.phone is not null
     or m.anonymised_at is null or not m.no_auto_reminders then
    raise exception 'member not anonymised: %', to_jsonb(m);
  end if;
  if exists (select 1 from club.member_private where member_id = m.id) then raise exception 'private data kept'; end if;
  if (select licence_number from club.federation_licences where member_id = m.id) is not null then raise exception 'licence number kept'; end if;
  if (select count(*) from club.payments p join club.charges c on c.id = p.charge_id where c.member_id = m.id) <> 1 then
    raise exception 'payment lost';
  end if;
  if (select counterparty from club.transactions where description = 'Cuota 2025') <> m.first_name then
    raise exception 'ledger counterparty not renamed';
  end if;
  if (select sum(amount_cents) from club.transactions where description = 'Cuota 2025') <> 3000 then
    raise exception 'ledger amount changed';
  end if;
  if exists (select 1 from club.email_messages where recipients::text like '%marta%' or recipients::text like '%Privada%') then
    raise exception 'email log still names her';
  end if;
  if (select recipient_count from club.email_messages where subject = 'Aviso') <> 2 then raise exception 'email log lost a row'; end if;
  if exists (select 1 from club.audit_log where old_data::text ~* 'marta|privada|600000000|LIC-1|hermana|nota personal'
                                              or new_data::text ~* 'marta|privada|600000000|LIC-1|hermana|nota personal') then
    raise exception 'audit log still holds personal data';
  end if;
end $$;

-- 5. Can't be reactivated; a second call is a no-op.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
do $$ begin
  update club.members set left_on = null where id = '00000000-0000-4000-8000-00000000f001';
  raise exception 'reactivated an anonymised member';
exception when check_violation then null;
end $$;
select club.anonymise_member('00000000-0000-4000-8000-00000000f001');

select 'all privacy tests passed' as result;
rollback;
