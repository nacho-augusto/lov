-- Tests for 0003_money.sql. Always rolls back.

begin;

insert into auth.users (id, email, email_confirmed_at, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-treasurer@club.test', now(), 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-viewer@club.test', now(), 'authenticated', 'authenticated');
insert into club.admin_users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-treasurer@club.test'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-viewer@club.test');
insert into club.admin_user_roles values
  ('00000000-0000-4000-8000-0000000000a1', 'owner'),
  ('00000000-0000-4000-8000-0000000000a1', 'treasurer'),
  ('00000000-0000-4000-8000-0000000000b2', 'viewer');
insert into club.members (id, first_name, last_name) values
  ('00000000-0000-4000-8000-00000000f001', 'Ana', 'Test'),
  ('00000000-0000-4000-8000-00000000f002', 'Bea', 'Test'),
  ('00000000-0000-4000-8000-00000000f003', 'Carla', 'Baja');
update club.members set left_on = current_date where id = '00000000-0000-4000-8000-00000000f003';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

-- 1. Fee type, assignments (one with a family discount, one inactive member).
insert into club.fee_types (name, default_amount_cents, periodicity) values ('Cuota semestral test', 3000, 'semiannual');
select set_config('test.fee', (select id::text from club.fee_types where name = 'Cuota semestral test'), true);
insert into club.member_fees (member_id, fee_type_id, starts_on, amount_cents_override) values
  ('00000000-0000-4000-8000-00000000f001', current_setting('test.fee')::uuid, '2026-01-01', null),
  ('00000000-0000-4000-8000-00000000f002', current_setting('test.fee')::uuid, '2026-01-01', 2000),
  ('00000000-0000-4000-8000-00000000f003', current_setting('test.fee')::uuid, '2026-01-01', null);

-- 2. Generating a period: active members only, idempotent, override respected.
do $$ begin
  if club.generate_charges(current_setting('test.fee')::uuid, '2026-07-01', '2026-07-31') <> 2 then
    raise exception 'expected 2 charges';
  end if;
  if club.generate_charges(current_setting('test.fee')::uuid, '2026-07-01', '2026-07-31') <> 0 then
    raise exception 'generate_charges not idempotent';
  end if;
  if (select amount_cents from club.charges where member_id = '00000000-0000-4000-8000-00000000f002') <> 2000 then
    raise exception 'override ignored';
  end if;
  if (select period_end from club.charges limit 1) <> '2026-12-31' then
    raise exception 'semiannual period end';
  end if;
  if (select status from club.charge_status where member_id = '00000000-0000-4000-8000-00000000f001') <> 'overdue' then
    raise exception 'past due charge should be overdue';
  end if;
end $$;
select set_config('test.charge', (select id::text from club.charges where member_id = '00000000-0000-4000-8000-00000000f001'), true);

-- 3. Partial payment books income; overpaying fails; full payment marks paid.
insert into club.payments (charge_id, amount_cents, paid_on) values (current_setting('test.charge')::uuid, 1000, '2026-08-01');
do $$ begin
  if (select status from club.charge_status where id = current_setting('test.charge')::uuid) <> 'overdue' then
    raise exception 'partially paid overdue charge stays overdue';
  end if;
  if (select count(*) from club.transactions where kind = 'income' and amount_cents = 1000) <> 1 then
    raise exception 'payment not booked';
  end if;
end $$;
do $$ begin
  insert into club.payments (charge_id, amount_cents) values (current_setting('test.charge')::uuid, 2500);
  raise exception 'overpayment accepted';
exception when check_violation then null;
end $$;
insert into club.payments (charge_id, amount_cents) values (current_setting('test.charge')::uuid, 2000);
do $$ begin
  if (select status from club.charge_status where id = current_setting('test.charge')::uuid) <> 'paid' then
    raise exception 'charge should be paid';
  end if;
end $$;

-- 4. Booked movements can't be edited or deleted directly; deleting the payment removes them.
update club.transactions set amount_cents = 1 where payment_id is not null;
do $$ begin
  if exists (select 1 from club.transactions where amount_cents = 1) then raise exception 'booked movement edited'; end if;
end $$;
delete from club.payments where amount_cents = 2000;
do $$ begin
  if (select count(*) from club.transactions) <> 1 then raise exception 'payment delete did not remove its movement'; end if;
end $$;

-- 5. Manual expense; category kind must match.
insert into club.transactions (kind, amount_cents, category_id, description)
select 'expense', 4860, id, 'Avituallamiento test' from club.categories where kind = 'expense' and name = 'Avituallamiento';
do $$ begin
  insert into club.transactions (kind, amount_cents, category_id, description)
  select 'income', 100, id, 'mal' from club.categories where kind = 'expense' limit 1;
  raise exception 'category kind not enforced';
exception when check_violation then null;
end $$;

-- 6. Waived charge can't be paid.
update club.charges set waived = true where member_id = '00000000-0000-4000-8000-00000000f002';
do $$ begin
  insert into club.payments (charge_id, amount_cents)
  select id, 100 from club.charges where member_id = '00000000-0000-4000-8000-00000000f002';
  raise exception 'paid a waived charge';
exception when check_violation then null;
end $$;

-- 7. Viewer reads money, writes nothing.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);
do $$ begin
  if (select count(*) from club.charge_status) <> 2 then raise exception 'viewer cannot read charges'; end if;
  if (select count(*) from club.transactions) <> 2 then raise exception 'viewer cannot read ledger'; end if;
end $$;
do $$ begin
  insert into club.transactions (kind, amount_cents, category_id, description)
  select 'expense', 1, id, 'hack' from club.categories where kind = 'expense' limit 1;
  raise exception 'viewer added a movement';
exception when insufficient_privilege then null;
end $$;
do $$ begin
  perform club.generate_charges(current_setting('test.fee')::uuid, '2027-01-01', '2027-01-31');
  raise exception 'viewer generated charges';
exception when insufficient_privilege then null;
end $$;

select 'all money tests passed' as result;
rollback;
