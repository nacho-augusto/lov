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

1. **Data API → Exposed schemas:** add `club`.
2. **Authentication → URL configuration → Redirect URLs:** add
   `http://localhost:3000/admin/auth/callback` (and the production URL later).
3. **Authentication → Providers → Google** (optional): enable with a Google OAuth client.
   In production also disable "Allow new users to sign up".
