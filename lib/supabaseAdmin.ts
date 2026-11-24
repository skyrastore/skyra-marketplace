// ═══════════════════════════════════════════════════════════
// Supabase ADMIN client (service_role key)
// SERVER-SIDE ONLY — bypasses RLS.
// Jangan import ini di client components!
//
// Lazy init via Proxy — don't throw at module load (breaks Next.js
// "Collecting page data" build step). Uses env() helper which works
// across edge runtime + build time.
// ═══════════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      `Supabase admin client unavailable — url=${!!supabaseUrl}, key=${!!serviceKey}`
    );
  }

  _client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

// Backward-compat Proxy — lazy init on first use
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const value = (client as unknown as Record<PropertyKey, unknown>)[prop as PropertyKey];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
