-- Internal league: monthly distance and elevation gain per member, entered by admins.

begin;

create table club.league_entries (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references club.members (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  distance_m int not null check (distance_m between 0 and 5000000),
  elevation_gain_m int not null check (elevation_gain_m between 0 and 500000),
  entered_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  unique (member_id, month)
);
create index league_entries_month_idx on club.league_entries (month);

create trigger touch before update on club.league_entries for each row execute function club.touch_updated_at();
create trigger audit after insert or update or delete on club.league_entries for each row execute function club.audit();

alter table club.league_entries enable row level security;

create policy "read league" on club.league_entries for select to authenticated
  using ((select club.has_permission('league.read')));
create policy "add league" on club.league_entries for insert to authenticated
  with check ((select club.has_permission('league.write')));
create policy "edit league" on club.league_entries for update to authenticated
  using ((select club.has_permission('league.write'))) with check ((select club.has_permission('league.write')));
create policy "delete league" on club.league_entries for delete to authenticated
  using ((select club.has_permission('league.write')));

grant select, delete, insert (member_id, month, distance_m, elevation_gain_m), update (distance_m, elevation_gain_m)
  on club.league_entries to authenticated;
grant all on club.league_entries to service_role;

commit;
