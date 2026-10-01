-- Money: income/expense ledger, categories, budgets, fee types, member fee
-- assignments, charges and payments. Amounts are integer cents.
-- Recording a payment books its income in the ledger automatically.

begin;

-- ---------------------------------------------------------------------------
-- Ledger
-- ---------------------------------------------------------------------------

create type club.money_kind as enum ('income', 'expense');

create table club.categories (
  id uuid primary key default gen_random_uuid(),
  key text unique,                -- stable handle used by automations
  kind club.money_kind not null,
  name text not null,
  active boolean not null default true,
  sort int not null default 0,
  unique (kind, name)
);

insert into club.categories (key, kind, name, sort) values
  ('opening_balance', 'income', 'Saldo inicial', 0),
  ('member_fees', 'income', 'Cuotas de socios', 10),
  (null, 'income', 'Licencias federativas', 20),
  (null, 'income', 'Subvenciones', 30),
  (null, 'income', 'Patrocinios', 40),
  (null, 'income', 'Actividades e inscripciones', 50),
  (null, 'income', 'Equipación', 60),
  (null, 'income', 'Otros ingresos', 90),
  (null, 'expense', 'Licencias federativas', 10),
  (null, 'expense', 'Seguros', 20),
  (null, 'expense', 'Material', 30),
  (null, 'expense', 'Equipación', 40),
  (null, 'expense', 'Avituallamiento', 50),
  (null, 'expense', 'Desplazamientos', 60),
  (null, 'expense', 'Inscripciones de carreras', 70),
  (null, 'expense', 'Comisiones bancarias', 80),
  (null, 'expense', 'Otros gastos', 90);

create table club.transactions (
  id uuid primary key default gen_random_uuid(),
  kind club.money_kind not null,
  occurred_on date not null default current_date,
  amount_cents bigint not null check (amount_cents > 0),
  category_id uuid not null references club.categories (id),
  description text not null check (btrim(description) <> ''),
  counterparty text,
  receipt_path text,
  payment_id uuid unique,          -- set when booked from a member payment
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index transactions_date_idx on club.transactions (occurred_on desc);

-- Category kind must match the movement kind.
create function club.check_transaction_category() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select kind from club.categories where id = new.category_id) <> new.kind then
    raise exception 'La categoría no corresponde a un %', new.kind using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger category_kind before insert or update on club.transactions
  for each row execute function club.check_transaction_category();

create table club.budgets (
  year int not null check (year between 2000 and 2100),
  category_id uuid not null references club.categories (id),
  amount_cents bigint not null check (amount_cents >= 0),
  primary key (year, category_id)
);

-- ---------------------------------------------------------------------------
-- Fees, charges and payments
-- ---------------------------------------------------------------------------

create type club.periodicity as enum ('one_off', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual');
create type club.payment_method as enum ('bizum', 'transfer', 'cash', 'card', 'other');

create table club.fee_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (btrim(name) <> ''),
  default_amount_cents bigint not null check (default_amount_cents > 0),
  periodicity club.periodicity not null,
  category_id uuid references club.categories (id),   -- income category; default member_fees
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table club.member_fees (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references club.members (id) on delete cascade,
  fee_type_id uuid not null references club.fee_types (id) on delete cascade,
  starts_on date not null default current_date,
  ends_on date check (ends_on is null or ends_on >= starts_on),
  amount_cents_override bigint check (amount_cents_override is null or amount_cents_override > 0),
  unique (member_id, fee_type_id)
);

create table club.charges (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references club.members (id) on delete restrict,
  fee_type_id uuid references club.fee_types (id) on delete set null,
  concept text not null check (btrim(concept) <> ''),
  period_start date,
  period_end date,
  amount_cents bigint not null check (amount_cents > 0),
  due_on date not null,
  waived boolean not null default false,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create unique index charges_one_per_period on club.charges (member_id, fee_type_id, period_start)
  where fee_type_id is not null and period_start is not null;
create index charges_due_idx on club.charges (due_on);

create table club.payments (
  id uuid primary key default gen_random_uuid(),
  charge_id uuid not null references club.charges (id) on delete restrict,
  amount_cents bigint not null check (amount_cents > 0),
  paid_on date not null default current_date,
  method club.payment_method not null default 'bizum',
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index payments_charge_idx on club.payments (charge_id);

alter table club.transactions
  add constraint transactions_payment_fk foreign key (payment_id) references club.payments (id) on delete cascade;

-- No overpaying a charge, and no paying a waived one.
create function club.check_payment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  c club.charges;
  paid bigint;
begin
  select * into c from club.charges where id = new.charge_id for update;
  if c.waived then
    raise exception 'El cargo está condonado' using errcode = 'check_violation';
  end if;
  select coalesce(sum(amount_cents), 0) into paid from club.payments where charge_id = new.charge_id;
  if paid + new.amount_cents > c.amount_cents then
    raise exception 'El pago supera lo pendiente' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger check_payment before insert on club.payments
  for each row execute function club.check_payment();

-- Every payment books its income; deleting the payment removes it (FK cascade).
create function club.book_payment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  c record;
begin
  select ch.concept, coalesce(ft.category_id, cat.id) as category_id,
         btrim(m.first_name || ' ' || m.last_name) as member_name
  into c
  from club.charges ch
  join club.members m on m.id = ch.member_id
  left join club.fee_types ft on ft.id = ch.fee_type_id
  cross join (select id from club.categories where key = 'member_fees') cat
  where ch.id = new.charge_id;

  insert into club.transactions (kind, occurred_on, amount_cents, category_id, description, counterparty, payment_id, created_by)
  values ('income', new.paid_on, new.amount_cents, c.category_id, c.concept, c.member_name, new.id, new.created_by);
  return new;
end;
$$;
create trigger book_payment after insert on club.payments
  for each row execute function club.book_payment();

-- Charge status for lists and reminders. security_invoker: RLS of the caller applies.
create view club.charge_status with (security_invoker = true) as
select
  c.*,
  coalesce(p.paid_cents, 0) as paid_cents,
  c.amount_cents - coalesce(p.paid_cents, 0) as outstanding_cents,
  case
    when c.waived then 'waived'
    when coalesce(p.paid_cents, 0) >= c.amount_cents then 'paid'
    when c.due_on < current_date then 'overdue'
    when coalesce(p.paid_cents, 0) > 0 then 'partial'
    else 'pending'
  end as status
from club.charges c
left join (select charge_id, sum(amount_cents) as paid_cents from club.payments group by charge_id) p
  on p.charge_id = c.id;

-- Period [start, end] for a fee type starting on p_start.
create function club.period_end(p club.periodicity, p_start date) returns date
language sql immutable set search_path = '' as $$
  select case p
    when 'one_off' then p_start
    when 'monthly' then (p_start + interval '1 month' - interval '1 day')::date
    when 'bimonthly' then (p_start + interval '2 months' - interval '1 day')::date
    when 'quarterly' then (p_start + interval '3 months' - interval '1 day')::date
    when 'semiannual' then (p_start + interval '6 months' - interval '1 day')::date
    when 'annual' then (p_start + interval '1 year' - interval '1 day')::date
  end;
$$;

-- Creates the charges of one fee type for one period, for every active member with an
-- assignment covering it. Idempotent. Returns how many charges were created.
create function club.generate_charges(p_fee_type uuid, p_period_start date, p_due_on date)
returns int language plpgsql security definer set search_path = '' as $$
declare
  ft club.fee_types;
  p_end date;
  n int;
begin
  if not club.has_permission('fees.write') then
    raise exception 'permission denied' using errcode = 'insufficient_privilege';
  end if;
  select * into ft from club.fee_types where id = p_fee_type and active;
  if not found then
    raise exception 'Tipo de cuota no encontrado' using errcode = 'no_data_found';
  end if;
  p_end := club.period_end(ft.periodicity, p_period_start);

  insert into club.charges (member_id, fee_type_id, concept, period_start, period_end, amount_cents, due_on, created_by)
  select m.id, ft.id,
         ft.name || case ft.periodicity
           when 'one_off' then ''
           when 'annual' then ' ' || extract(year from p_period_start)
           else ' · ' || to_char(p_period_start, 'MM/YYYY') || '–' || to_char(p_end, 'MM/YYYY')
         end,
         p_period_start, p_end,
         coalesce(mf.amount_cents_override, ft.default_amount_cents),
         p_due_on, auth.uid()
  from club.member_fees mf
  join club.members m on m.id = mf.member_id
  where mf.fee_type_id = ft.id
    and m.active
    and mf.starts_on <= p_end
    and (mf.ends_on is null or mf.ends_on >= p_period_start)
  on conflict do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;

-- ---------------------------------------------------------------------------
-- Housekeeping
-- ---------------------------------------------------------------------------

create trigger audit after insert or update or delete on club.categories for each row execute function club.audit();
create trigger audit after insert or update or delete on club.transactions for each row execute function club.audit();
create trigger audit after insert or update or delete on club.budgets for each row execute function club.audit();
create trigger audit after insert or update or delete on club.fee_types for each row execute function club.audit();
create trigger audit after insert or update or delete on club.member_fees for each row execute function club.audit();
create trigger audit after insert or update or delete on club.charges for each row execute function club.audit();
create trigger audit after insert or update or delete on club.payments for each row execute function club.audit();

revoke all on function club.check_transaction_category(), club.check_payment(), club.book_payment()
  from public, anon, authenticated;
revoke all on function club.generate_charges(uuid, date, date), club.period_end(club.periodicity, date)
  from public, anon;
grant execute on function club.generate_charges(uuid, date, date), club.period_end(club.periodicity, date)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table club.categories enable row level security;
alter table club.transactions enable row level security;
alter table club.budgets enable row level security;
alter table club.fee_types enable row level security;
alter table club.member_fees enable row level security;
alter table club.charges enable row level security;
alter table club.payments enable row level security;

-- Categories: readable by anyone reading money; managed with accounts.write.
create policy "read categories" on club.categories for select to authenticated
  using ((select club.has_permission('accounts.read')) or (select club.has_permission('fees.read')));
create policy "add categories" on club.categories for insert to authenticated
  with check ((select club.has_permission('accounts.write')));
create policy "edit categories" on club.categories for update to authenticated
  using ((select club.has_permission('accounts.write'))) with check ((select club.has_permission('accounts.write')));

-- Ledger. Movements booked from payments are managed through the payment only.
create policy "read transactions" on club.transactions for select to authenticated
  using ((select club.has_permission('accounts.read')));
create policy "add transactions" on club.transactions for insert to authenticated
  with check ((select club.has_permission('accounts.write')) and payment_id is null);
create policy "edit transactions" on club.transactions for update to authenticated
  using ((select club.has_permission('accounts.write')) and payment_id is null)
  with check ((select club.has_permission('accounts.write')) and payment_id is null);
create policy "delete transactions" on club.transactions for delete to authenticated
  using ((select club.has_permission('accounts.write')) and payment_id is null);

create policy "read budgets" on club.budgets for select to authenticated
  using ((select club.has_permission('accounts.read')));
create policy "add budgets" on club.budgets for insert to authenticated
  with check ((select club.has_permission('accounts.write')));
create policy "edit budgets" on club.budgets for update to authenticated
  using ((select club.has_permission('accounts.write'))) with check ((select club.has_permission('accounts.write')));
create policy "delete budgets" on club.budgets for delete to authenticated
  using ((select club.has_permission('accounts.write')));

create policy "read fee types" on club.fee_types for select to authenticated
  using ((select club.has_permission('fees.read')));
create policy "add fee types" on club.fee_types for insert to authenticated
  with check ((select club.has_permission('fees.write')));
create policy "edit fee types" on club.fee_types for update to authenticated
  using ((select club.has_permission('fees.write'))) with check ((select club.has_permission('fees.write')));

create policy "read member fees" on club.member_fees for select to authenticated
  using ((select club.has_permission('fees.read')));
create policy "add member fees" on club.member_fees for insert to authenticated
  with check ((select club.has_permission('fees.write')));
create policy "edit member fees" on club.member_fees for update to authenticated
  using ((select club.has_permission('fees.write'))) with check ((select club.has_permission('fees.write')));
create policy "delete member fees" on club.member_fees for delete to authenticated
  using ((select club.has_permission('fees.write')));

create policy "read charges" on club.charges for select to authenticated
  using ((select club.has_permission('fees.read')));
create policy "add charges" on club.charges for insert to authenticated
  with check ((select club.has_permission('fees.write')));
create policy "edit charges" on club.charges for update to authenticated
  using ((select club.has_permission('fees.write'))) with check ((select club.has_permission('fees.write')));

create policy "read payments" on club.payments for select to authenticated
  using ((select club.has_permission('fees.read')));
create policy "add payments" on club.payments for insert to authenticated
  with check ((select club.has_permission('fees.write')));
create policy "delete payments" on club.payments for delete to authenticated
  using ((select club.has_permission('fees.write')));

grant select, insert (kind, name, sort), update (name, active, sort) on club.categories to authenticated;
grant select, delete,
  insert (kind, occurred_on, amount_cents, category_id, description, counterparty, receipt_path),
  update (occurred_on, amount_cents, category_id, description, counterparty, receipt_path)
  on club.transactions to authenticated;
grant select, insert, update (amount_cents), delete on club.budgets to authenticated;
grant select, insert (name, default_amount_cents, periodicity, category_id),
  update (name, default_amount_cents, periodicity, category_id, active)
  on club.fee_types to authenticated;
grant select, delete, insert (member_id, fee_type_id, starts_on, ends_on, amount_cents_override),
  update (starts_on, ends_on, amount_cents_override)
  on club.member_fees to authenticated;
grant select, insert (member_id, concept, amount_cents, due_on), update (waived, due_on, concept)
  on club.charges to authenticated;
grant select, delete, insert (charge_id, amount_cents, paid_on, method, notes) on club.payments to authenticated;
grant select on club.charge_status to authenticated;
grant all on all tables in schema club to service_role;

-- ---------------------------------------------------------------------------
-- Receipts storage (private bucket, paths "<year>/<uuid>-<name>")
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('club-receipts', 'club-receipts', false, 5242880,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

create policy "club receipts read" on storage.objects for select to authenticated
  using (bucket_id = 'club-receipts' and (select club.has_permission('accounts.read')));
create policy "club receipts upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'club-receipts' and (select club.has_permission('accounts.write')));
create policy "club receipts delete" on storage.objects for delete to authenticated
  using (bucket_id = 'club-receipts' and (select club.has_permission('accounts.write')));

commit;
