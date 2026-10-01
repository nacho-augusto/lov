-- Tests for 0004_grants.sql. Always rolls back.

begin;

insert into auth.users (id, email, email_confirmed_at, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-secretary@club.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-treasurer@club.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000c3', 'test-league@club.test', now(), 'authenticated', 'authenticated');
insert into club.admin_users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-secretary@club.test'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-treasurer@club.test'),
  ('00000000-0000-4000-8000-0000000000c3', 'test-league@club.test');
insert into club.admin_user_roles values
  ('00000000-0000-4000-8000-0000000000a1', 'owner'),
  ('00000000-0000-4000-8000-0000000000a1', 'secretary'),
  ('00000000-0000-4000-8000-0000000000b2', 'treasurer'),
  ('00000000-0000-4000-8000-0000000000c3', 'league');
insert into club.transactions (id, kind, amount_cents, category_id, description)
select '00000000-0000-4000-8000-00000000e001', 'expense', 12000, id, 'Material test'
from club.categories where kind = 'expense' and name = 'Material';

set local role authenticated;

-- 1. Secretary creates a grant with requirements and links an expense.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
insert into club.grants (year, name, awarding_body, requested_cents) values (2026, 'Subvención test', 'Diputación', 150000);
select set_config('test.grant', (select id::text from club.grants where name = 'Subvención test'), true);
insert into club.grant_requirements (grant_id, description, sort)
select current_setting('test.grant')::uuid, d, n from unnest(array['Memoria', 'Presupuesto', 'Certificado AEAT']) with ordinality as t(d, n);
select club.link_expense_to_grant('00000000-0000-4000-8000-00000000e001', current_setting('test.grant')::uuid);
do $$ begin
  if (select count(*) from club.grant_requirements) <> 3 then raise exception 'requirements'; end if;
  if (select grant_id from club.transactions where id = '00000000-0000-4000-8000-00000000e001') is null then
    raise exception 'expense not linked';
  end if;
end $$;

-- 2. Treasurer reads grants but can't edit or link.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from club.grants) <> 1 then raise exception 'treasurer cannot read grants'; end if;
end $$;
do $$ begin
  perform club.link_expense_to_grant('00000000-0000-4000-8000-00000000e001', null);
  raise exception 'treasurer unlinked an expense';
exception when insufficient_privilege then null;
end $$;
update club.grants set status = 'awarded';
do $$ begin
  if (select status from club.grants) <> 'preparing' then raise exception 'treasurer edited a grant'; end if;
end $$;

-- 3. League role sees no grants at all.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c3","role":"authenticated"}', true);
do $$ begin
  if exists (select 1 from club.grants) or exists (select 1 from club.grant_requirements) then
    raise exception 'league reads grants';
  end if;
end $$;

select 'all grants tests passed' as result;
rollback;
