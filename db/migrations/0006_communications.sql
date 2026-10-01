-- Communications: editable email templates and a log of what was sent.
-- Sending happens from the admin's own mail app for now (mailto); a provider can be
-- plugged in later without changing these tables (`channel`).

begin;

create table club.email_templates (
  id uuid primary key default gen_random_uuid(),
  key text unique,
  name text not null check (btrim(name) <> ''),
  subject text not null,
  body text not null,
  audience text not null default 'active'
    check (audience in ('active', 'overdue', 'no_licence', 'single')),
  updated_at timestamptz not null default now()
);

insert into club.email_templates (key, name, subject, body, audience) values
  ('fee_reminder', 'Recordatorio de cuota', 'Cuota pendiente en La Otra Vertiente',
   E'¡Hola, {{nombre}}!\n\nTe escribimos desde la junta: tienes pendiente {{pendiente}} ({{conceptos}}).\n\nPuedes pagarlo por Bizum o transferencia cuando te venga bien. Si ya lo has hecho, ignora este mensaje y perdona la lata.\n\n¡Nos vemos en el monte!\nLa junta de La Otra Vertiente',
   'overdue'),
  ('licence_renewal', 'Renovación de licencia', 'Renueva tu licencia federativa {{temporada}}',
   E'¡Hola, {{nombre}}!\n\nYa toca renovar la licencia federativa para {{temporada}}. Sin ella no tenemos seguro en las salidas, así que no lo dejes para el último día.\n\nCualquier duda, nos dices.\n\nLa junta de La Otra Vertiente',
   'no_licence'),
  ('general', 'Aviso general', 'Novedades de La Otra Vertiente',
   E'¡Hola, {{nombre}}!\n\n\n\nUn abrazo,\nLa junta de La Otra Vertiente',
   'active');

create table club.email_messages (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references club.email_templates (id) on delete set null,
  channel text not null default 'mailto' check (channel in ('mailto', 'provider')),
  subject text not null,
  recipients jsonb not null,            -- [{member_id, email, name}]
  recipient_count int generated always as (jsonb_array_length(recipients)) stored,
  sent_by uuid default auth.uid(),
  sent_at timestamptz not null default now()
);
create index email_messages_sent_idx on club.email_messages (sent_at desc);

create trigger touch before update on club.email_templates for each row execute function club.touch_updated_at();
create trigger audit after insert or update or delete on club.email_templates for each row execute function club.audit();

alter table club.email_templates enable row level security;
alter table club.email_messages enable row level security;

create policy "read templates" on club.email_templates for select to authenticated
  using ((select club.has_permission('comms.read')));
create policy "edit templates" on club.email_templates for update to authenticated
  using ((select club.has_permission('comms.send'))) with check ((select club.has_permission('comms.send')));
create policy "add templates" on club.email_templates for insert to authenticated
  with check ((select club.has_permission('comms.send')));

create policy "read messages" on club.email_messages for select to authenticated
  using ((select club.has_permission('comms.read')));
create policy "log messages" on club.email_messages for insert to authenticated
  with check ((select club.has_permission('comms.send')) and sent_by = (select auth.uid()));

grant select, insert (name, subject, body, audience), update (name, subject, body, audience) on club.email_templates to authenticated;
grant select, insert (template_id, subject, recipients, sent_by) on club.email_messages to authenticated;
grant all on club.email_templates, club.email_messages to service_role;

commit;
