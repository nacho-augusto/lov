import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. Server-only, and used for the single job that
// needs it (checking for a pending invitation before a first sign-in).
// Returns null when the secret key isn't configured.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    db: { schema: "club" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
