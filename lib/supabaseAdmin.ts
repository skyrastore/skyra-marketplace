// ═══════════════════════════════════════════════════════════
// Supabase ADMIN client (service_role key)
// SERVER-SIDE ONLY — bypasses RLS.
// Jangan import ini di client components!
//
// NOTE: lazy init — don't throw at module eval (breaks Next.js build
// "Collecting page data" step). Check runtime availability in handlers.
// ═══════════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Supabase admin client unavailable — NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set"
    );
  }

  _client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

// Backward-compat: Proxy object so existing `supabaseAdmin.from(...)` calls
// trigger lazy init at first use instead of at import time.
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin();
    const value = (client as unknown as Record<PropertyKey, unknown>)[prop as PropertyKey];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
