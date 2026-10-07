# Database (`club` schema)

The admin panel stores everything in the Postgres schema `club`.

- **Development:** the schema lives inside the existing Supabase project `bluchia-dev`
  (shared, disposable test environment). Never touch other schemas there and use test
  data only.
- **Production (later):** a dedicated Supabase project; apply the same files in order.

`migrations/` holds plain SQL files, applied **in order** with the SQL editor or the
Supabase MCP `execute_sql` tool. They are deliberately *not* applied with
`supabase db push` / `apply_migration`, so they don't pollute the host project's
migration history.

Seeds (e.g. the first owner invitation) are not migrations: run them by hand.

```sql
-- First owner: they sign in at /admin/login with this email and the invitation is claimed.
insert into club.invitations (email, roles) values ('someone@example.com', '{owner}');
```

## Project settings the app needs

1. **Expose `club` in the Data API.** In bluchia-dev this is done in-database (it overrides
   the dashboard list, so keep the list complete if Bluchia ever changes it):
   ```sql
   alter role authenticator set pgrst.db_schemas = 'public, graphql_public, club';
   notify pgrst, 'reload config';
   -- undo: alter role authenticator reset pgrst.db_schemas; notify pgrst, 'reload config';
   ```
   In a dedicated project, use Settings → Data API → Exposed schemas instead.
2. **Authentication → URL configuration → Redirect URLs:** add
   `http://localhost:3000/admin/auth/callback` and `http://localhost:3000/socio/auth/callback`
   (member portal), and the production URLs later.
3. **Authentication → Providers → Google** (optional): enable with a Google OAuth client.
   In production also disable "Allow new users to sign up".
4. **Authentication → Email → "Confirm email"** must stay on. Invitations can only be
   claimed from an email-link/OTP or Google session on an account without a password
   (`0007_claim_hardening.sql`), but confirmed emails are still part of the check.
   The member portal (`0010`) relies on the same proof. Keep **anonymous sign-ins** and
   **phone OTP** off: an anonymous user can set an email that auto-confirm marks as verified,
   and phone OTP also reports `amr = otp`.
5. **`ADMIN_ORIGIN`** env var: the panel's public origin; sign-in links are built from it.
   **`PORTAL_ORIGIN`** does the same for the member portal (falls back to `ADMIN_ORIGIN`).

## Tests

`tests/` has one file per migration; each runs in a transaction and rolls back, so it is
safe against dev. They expect every migration to be applied. To run them on a throwaway
local Postgres, stub the bits of Supabase they touch (`auth.users`, `auth.uid()`,
`auth.jwt()`, `storage.buckets`, `storage.objects`, roles `anon`, `authenticated`,
`service_role`), apply `migrations/` in order and run each test file with psql.
