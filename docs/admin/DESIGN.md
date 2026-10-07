# Admin panel — design

Status: **implemented** through phase 6 (2026-10-07); see the status rows in §8. Pending: email
provider + automatic reminders and the subdomain switch, both waiting for the club domain.

Private back-office for the board of C.D. La Otra Vertiente. Invitation-only, no
self-registration. UI copy in Spanish; code, schema and docs in English.

---

## 1. Goals and non-goals

**Goals**

- Keep grants (subvenciones), club accounts, member fees, membership and the internal
  league in one place, with the supporting documents attached.
- Send reminder emails (pending fees, expiring licences, grant deadlines).
- Several admins with assignable roles; every change traceable.

**Non-goals (for now)**

- Online payments (Stripe etc.). Payments are Bizum / transfer / cash, recorded by hand.
- Strava sync. The Strava API terms (Nov 2024) only allow showing a user's data to that
  same user, so a shared leaderboard fed from Strava is not allowed. League data is entered
  by admins. Revisit only after reading the current Strava API agreement.
- Member self-service portal (planned for a later phase, see §9).

---

## 2. Architecture

| Concern | Choice | Notes |
|---|---|---|
| App | Same Next.js 16 app, route group `app/(admin)/admin/...` | Public site untouched. Read `node_modules/next/dist/docs/` before coding (Next 16 conventions, `proxy.ts`). |
| Subdomain | `proxy.ts` rewrites `admin.<domain>/*` → `/admin/*`; `/admin` on the public host redirects to the subdomain | Until the real domain exists, `/admin` on localhost / preview. |
| Database | Supabase Postgres, RLS on every table | Money as integer cents (`bigint`), dates as `date`, timezone Europe/Madrid. |
| Auth | Supabase Auth: Google OAuth + email magic link as fallback. **Sign-ups disabled.** Admins invited from the panel. | See §3. |
| Files | Supabase Storage, **private** buckets, short-lived signed URLs | Buckets: `receipts`, `grant-documents`, `member-documents`, `club-documents`. |
| Email | Transactional provider (Resend or equivalent, chosen via Vercel Marketplace when we build it) | Spanish templates, sending log. |
| Scheduled jobs | Vercel Cron → route handler | Daily: build reminder queue, send due reminders. |
| Hosting | Vercel | Supabase / Vercel / email provider treated as production. |

### Where the database lives

**Development (decided 2026-10-01):** a dedicated schema `club` inside the existing
`bluchia-dev` Supabase project (Free plan; the account's free project slots are taken, and
that project is a disposable test environment). Consequences we accept for dev only:

- `auth.users` is shared with bluchia-dev, and the project-wide "allow sign-ups" setting
  can't be set just for us → access depends entirely on the `club.admin_users` allowlist
  (already required by every RLS policy, §3).
- All app tables, functions and views live in `club`, never in `public`. The schema is
  accessed only from server code; it is exposed to the Data API only if we need it.
- Storage buckets prefixed `club-`. **No real member data** in this environment — test
  data only.
- Migrations live in this repo, so the schema can be recreated as-is in a dedicated project.

**Production (later):** its own project — a freed free slot or a separate account for the
club — with sign-ups disabled project-wide. Free-plan projects pause after ~7 days of
inactivity; the daily reminder cron should keep it awake (to verify).

Mutations go through Server Actions that re-check the session and role server-side; RLS is
the second line of defence, not the only one.

---

## 3. Access, invitations and roles

### No registration, ever

1. Supabase project setting "Allow new users to sign up" = **off**.
2. An admin with `admins.manage` invites by email → `auth.admin.inviteUserByEmail` (server
   only, service-role key never reaches the browser) + row in `admin_users`.
3. Google login only succeeds for an email that already exists in `auth.users`.
4. Defence in depth: every RLS policy requires an **active** row in `admin_users` for
   `auth.uid()`. Even if an auth user were created somehow, they see nothing.
5. Revoking access = `admin_users.active = false` + sign-out of all sessions.

> To verify during implementation: that disabled sign-ups also block first-time Google
> OAuth for unknown emails in the current Supabase version. Point 4 covers us either way.

### Roles

Roles are assignable and combinable (`admin_user_roles`). Permissions are fixed in code and
mirrored in a SQL helper `has_permission(text)` used by RLS.

| Role | Can |
|---|---|
| `owner` | Everything, including managing admins and roles. At least one must always exist. |
| `treasurer` | Accounts, fee types, charges, payments, budgets; read members. |
| `secretary` | Members, licences, onboarding checklist, grants, club documents, emails. |
| `league` | League entries; read members. |
| `viewer` | Read-only everywhere except member sensitive fields. |

Sensitive member fields (national ID, emergency/health notes) are readable only by
`owner` and `secretary`.

---

## 4. Modules

### 4.1 Dashboard (Inicio)

"What needs attention": pending/overdue charges with totals, licences not renewed for the
season, grant deadlines in the next 30 days, current balance, last league update.

### 4.2 Members (Miembros del club)

- Member record: name, email, phone, birth date, national ID (optional), emergency contact,
  join date, leave date, status (`active` / `inactive`), notes, consents (data processing
  date, image use yes/no).
- **Leaving never deletes**: sets `left_on` + `inactive`; history (payments, league) stays.
- **On join**, an onboarding checklist is generated from `requirement_templates`
  (e.g. federation licence, club fee, GDPR consent, emergency details). Templates marked
  `yearly` are regenerated each season.
- Federation licences per season: federation, modality, licence number, validity, linked
  charge. Renewal reminder in November–December.
- Fee assignments: which fee types each member pays (see 4.3).

### 4.3 Club accounts (Cuentas del club)

**Ledger**

- Transactions: `income` / `expense`, date, amount, category, description, counterparty,
  receipt file, optional link to a grant (for justification) and to a payment.
- Balance, filters by period/category, budget vs actual per year, CSV export for the AGM.

**Fees and charges** — supports several fee types with any periodicity:

- `fee_types`: name, default amount, periodicity (`one_off`, `monthly`, `bimonthly`,
  `quarterly`, `semiannual`, `annual`), active flag.
- `member_fees`: member ↔ fee type, start/end, optional custom amount (discounts, family).
- Charges are generated per period for every member with an active assignment (button
  "Generar cargos de <periodo>", idempotent per member+fee+period). One-off charges can be
  created by hand (e.g. trip, kit).
- Payments against a charge (partial allowed): amount, date, method. **Recording a payment
  creates its income transaction automatically** — no double entry.
- Charge status derived: `pending`, `partial`, `paid`, `waived`, plus `overdue` when past due.

### 4.4 Grants (Subvenciones)

- Grant: year, name, awarding body, call URL, requested amount, awarded amount, status
  (`preparing` → `submitted` → `awarded` / `rejected` → `justified`), application deadline,
  justification deadline, notes.
- Required documents written as free text, one per line → `grant_requirements` with status
  (`pending`, `in_progress`, `done`, `not_applicable`) and attached files.
- Justification view: expenses linked to the grant, total vs awarded, missing receipts.
- Deadline reminders to secretaries.

### 4.5 Internal league (Liga interna)

- Monthly entry per member: distance (km) and elevation gain (m+). Entered by admins with
  `league` role; one row per member and month (edit, not duplicate). Fast grid entry:
  all active members × one month.
- Score: **effort-km = km + m+ / 100** (shown alongside raw km and m+).
- Views over any **date range by months** ("franja"):
  - Ranking for the range (effort-km, km, m+).
  - Evolution chart per member (monthly and cumulative).
  - Range comparison: range A vs range B (e.g. last 3 months vs previous 3), with the
    difference per member.
  - Presets: current month, last 3 / 6 / 12 months, season to date.
- Only active members appear by default; former members kept in history.

### 4.6 Communications (Comunicaciones)

- Editable Spanish templates with variables (`{{nombre}}`, `{{importe}}`, `{{concepto}}`,
  `{{fecha_limite}}`…).
- Send to one member, to a filtered set (e.g. everyone with overdue charges), or to all
  active members. Preview before sending.
- Automatic reminders (optional, per rule): e.g. day 5 of each month to members with
  overdue charges; licence renewal in November. Rules can be switched off.
- Every email logged: recipient, template, subject, related charge, status, sent by.
- Throttle: no more than one automatic reminder per member per charge per 7 days.

### 4.7 Extras (agreed, later phases)

- **Audit log**: who changed what and when, via DB triggers on every table.
- **Club documents**: statutes, CIF, insurance policy, AGM minutes, with expiry dates.
- **Activity calendar**: outings and races with sign-ups.
- **Club gear**: items, who has them, since when.
- **Member portal** (magic link, no registration): own payments, own league history,
  activity sign-ups; later self-reporting of league data.

---

## 5. Data model (first cut)

```text
admin_users(id → auth.users, full_name, email, active, invited_by, created_at)
admin_user_roles(admin_user_id, role)                     -- role enum as in §3

members(id, first_name, last_name, email, phone, birth_date, national_id,
        emergency_name, emergency_phone, health_notes, joined_on, left_on, status,
        data_consent_at, image_consent, notes, created_at, updated_at)
requirement_templates(id, name, description, yearly, active, sort)
member_requirements(id, member_id, template_id, season, status, due_on,
                    completed_on, document_path, notes)
federation_licences(id, member_id, season, federation, modality, licence_number,
                    valid_until, charge_id)

fee_types(id, name, default_amount_cents, periodicity, active)
member_fees(id, member_id, fee_type_id, starts_on, ends_on, amount_cents_override)
charges(id, member_id, fee_type_id NULL, concept, period_start, period_end,
        amount_cents, due_on, waived, created_by, created_at)
        UNIQUE(member_id, fee_type_id, period_start)
payments(id, charge_id, amount_cents, paid_on, method, notes, transaction_id, created_by)

categories(id, kind, name)
transactions(id, kind, occurred_on, amount_cents, category_id, description,
             counterparty, receipt_path, grant_id NULL, created_by, created_at)
budgets(year, category_id, amount_cents)

grants(id, year, name, awarding_body, call_url, requested_cents, awarded_cents, status,
       application_deadline, justification_deadline, notes)
grant_requirements(id, grant_id, description, status, notes, sort)
grant_documents(id, grant_id, requirement_id NULL, path, file_name, uploaded_by, uploaded_at)

league_entries(id, member_id, month DATE /* first day */, distance_m, elevation_gain_m,
               entered_by, updated_at)  UNIQUE(member_id, month)

email_templates(id, key, name, subject, body)
reminder_rules(id, kind, template_id, schedule, active)
email_messages(id, template_id, member_id, to_email, subject, status, provider_id,
               charge_id NULL, sent_by NULL /* NULL = automatic */, sent_at, error)

audit_log(id, table_name, row_id, action, old_data, new_data, actor, at)
```

Charge status, balances and league aggregates are views/queries, not stored columns.

---

## 6. Security and privacy

- RLS on every table; policies use `has_permission()`; storage policies mirror them.
- Service-role key only in server code / env vars; never logged or sent to the client.
- Private files only via signed URLs (short expiry).
- GDPR: store the minimum (national ID optional), record consent date, image-use consent
  respected, export/delete on request for former members (anonymise, keep accounting).
- Emails: no sensitive data in bodies; unsubscribe not needed for transactional club
  notices, but keep a per-member "no automatic reminders" flag.

---

## 7. UI

- Desktop-first but usable on phone (treasurer recording a Bizum on the go).
- Left nav: Inicio · Miembros · Cuentas · Cuotas · Subvenciones · Liga · Comunicaciones ·
  Calendario · Documentos · Material · Ajustes (categorías y trámites, administradores, registro).
- No generic admin template and no flashy effects (no glass, glow, 3D, heavy animation).
  Everything derives from the club identity:
  - **Palette from the logo**: rock black (`--charcoal #14171c` / `--ink`), snow white
    (`--snow`, `--paper`), stone greys, and **sun orange `--orange #f26b1d` as the only
    accent** (primary actions, current selection, the league curve). Status colours kept
    muted so orange stays special. Reuse the tokens in `app/globals.css`.
  - **Type**: an angular, condensed display face echoing the logo lettering for headings and
    big numbers; a plain readable sans for tables and forms; tabular figures for money.
  - **Motifs**: the logo's sun arc and peak silhouette (login, header, empty states drawn
    as the silhouettes of the club's peaks from `content/peaks.ts`); faint contour lines
    as the only texture.
  - **League as mountain**: cumulative chart drawn as an elevation profile; elevation gain
    translated to club peaks ("este mes: 1,4 Maromas"); range ranking as a summit board.
  - **Club voice** in copy: close and informal ("A Juan le faltan 2 cuotas"), Spanish.
- **Day mode** (default): bluchia.com cream `#fbfaf7` for page and sidebar, white panels,
  neutral greys, black-lettered logo; no black backgrounds. **Night mode** (rock): dark
  sidebar with white-lettered logo. Toggle "Modo día / Modo noche"; OS preference when
  unset. Approved 2026-10-01.
- Static mockup with sample data: `/admin-maqueta` (login), `/admin-maqueta/inicio`,
  `/admin-maqueta/liga`. Throwaway; the real panel replaces it.

---

## 8. Phases

| Phase | Scope | Done when |
|---|---|---|
| 0. Foundation | Supabase project, schema + RLS, invite-only auth (Google + magic link), roles, admin shell, audit log | An invited admin can log in; a non-invited Google account cannot; RLS tests pass |
|  | **Status 2026-10-01:** schema `club` applied to bluchia-dev and RLS-tested (`db/tests/`); invite-only login (email link, Google pending provider setup), protected `/admin` shell, admins & invitations page. Needs: `club` exposed in Data API, redirect URL, `SUPABASE_SECRET_KEY` in `.env.local`. | |
| 1. Members | Member CRUD, join/leave, onboarding checklist, licences | Board can migrate the current member list |
|  | **Status 2026-10-01:** done and tested end to end with a throwaway session: list/search, alta with checklist, record (sensitive data split, owner/secretary only), licences, baja/reactivation, open season. `club` exposed in the Data API in-database (see `db/README.md`). | |
| 2. Money | Fee types, assignments, charge generation, payments → ledger, ledger, budgets, CSV | A full fee cycle runs end to end and balances match |
|  | **Status 2026-10-01:** done and tested end to end: fee types (any periodicity), per-member assignments with special prices, period charge generation, partial payments booked to the ledger automatically, waiving, ledger with private receipts, budget vs actual, CSV export. | |
| 3. Emails | Templates, manual sends, log, automatic reminder rules (cron) | Overdue members receive one reminder; log shows it |
|  | **Status 2026-10-01:** templates, audiences (active / overdue / no licence / one member), personalised previews, sending through the admin's own mail app (mailto, BCC for groups) and a sending log. Provider (Resend via Vercel Marketplace) and automatic reminder cron wait for the club domain. | |
| 4. Grants | Grants, requirement checklist, documents, expense linking, deadline alerts | A 2026 grant can be prepared and justified in the panel |
|  | **Status 2026-10-01:** done and tested end to end: grants per year with status and deadlines, required documents as free text (one per line) with per-document files uploaded straight to private Storage (up to 25 MB), expense linking for justification, deadlines on the dashboard. | |
| 5. League | Monthly grid entry, rankings, ranges, comparison, charts | Monthly update takes < 5 min |
|  | **Status 2026-10-01:** done and tested end to end: monthly grid entry for all active members, any month range with the previous range as comparison, season profile, summit board with Maromas and sparklines. | |
| 6. Extras | Club documents, calendar, gear, member portal | — |
|  | **Status 2026-10-07:** built and RLS-tested locally (`db/tests/0008`–`0011`), not yet applied to bluchia-dev nor tried in the browser. Club documents with expiry and private files (dashboard warns 60 days ahead); calendar with capacity-checked sign-ups; gear with one holder at a time and loan history; member portal at `/socio` (email link, no password: own fees, league months, activity sign-ups). Also: settings page for categories and onboarding items, GDPR export (JSON) and anonymisation of former members, "no automatic reminders" flag (used once the reminder cron exists). | |
| — | Subdomain switch | When the real domain exists |

Each phase: tests for RLS and money logic, a functional pass in the browser, review before
merge.

---

### Member portal (implemented)

- Route `/socio`, same app and Supabase auth as the panel. Sign-in by email link only; a new
  auth user is created only for an address that belongs to an active member, and the form
  answers the same either way.
- Members get **no table access**. Security-definer RPCs (`club.portal_*`) return only rows
  of the members whose email matches the caller's confirmed address, proven by an email
  link/OTP or OAuth session on an account without a password (same rule as invitations,
  `0007`). Members sharing one email (a family) see each other.
- Sign-ups from the portal go through `club.portal_signup`, which re-checks the link, the
  deadline and (via the sign-up trigger) the places left. The audit log shows them as made
  "desde su zona".
- Panel and portal share one session cookie: "Salir" in either signs out of both.

### Privacy tools (implemented)

- **Export:** `/admin/miembros/<id>/datos` returns a JSON with everything held about a member
  (needs `members.sensitive`).
- **Anonymise:** `club.anonymise_member` for former members with nothing owed: clears
  personal fields and private data, renames them "Antiguo miembro XXXX" in the ledger and
  sending log, scrubs personal values from the audit log, keeps every amount. Irreversible;
  an anonymised member is frozen (`0011`): no edits, licences, sign-ups or loans. The auth
  user a member may have from the portal is not deleted (shared auth in dev): remove it by
  hand in Supabase if asked.

## 9. Assumptions to confirm

- "Bidimensionales" read as other periodicities (bimonthly/semiannual); the model supports
  any periodicity plus one-off charges.
- League data is entered by admins for now; self-reporting comes with the member portal.
- Licences are charged to members as a fee type; whether the club fronts the payment does
  not change the model.
- Some admins may not use Google → magic-link email login as fallback.
- Portal: a family sharing one email sees all its members; activity sign-ups have no waiting
  list; former members can't sign in to the portal.
