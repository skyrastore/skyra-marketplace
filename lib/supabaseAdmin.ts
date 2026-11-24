// ═══════════════════════════════════════════════════════════
// Supabase ADMIN client (service_role key)
// SERVER-SIDE ONLY — bypasses RLS.
// Jangan import ini di client components!
// ═══════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!serviceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY not set in env");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
