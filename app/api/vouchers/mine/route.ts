import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const runtime = "edge";

// Vouchers the user already claimed, with the voucher detail joined in.
// Returns grouped buckets: active / used / expired.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) return NextResponse.json({ error: "invalid_token" }, { status: 401 });

  const { data, error } = await supabase
    .from("vouchers_claimed")
    .select(`
      voucher_code, claimed_at, used_at, used_order_id,
      voucher:vouchers!inner (
        code, title, description,
        discount_type, discount_value, max_discount_idr, min_purchase_idr,
        is_active, expires_at, vip_mode
      )
    `)
    .eq("user_id", user.user.id)
    .order("claimed_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  const active: unknown[] = [];
  const used: unknown[] = [];
  const expired: unknown[] = [];

  for (const row of data ?? []) {
    // Supabase embed returns the FK row as `voucher` — may be an array in some
    // typings but with !inner it's a single object. Cast locally.
    const voucherRaw = (row as unknown as { voucher: unknown }).voucher;
    const v = Array.isArray(voucherRaw)
      ? (voucherRaw[0] as { is_active: boolean; expires_at: string | null; vip_mode?: boolean } | undefined)
      : (voucherRaw as { is_active: boolean; expires_at: string | null; vip_mode?: boolean } | null);
    // VIP vouchers aren't picked from the regular voucher dropdown — they're
    // applied automatically via /api/me/vip. Hide from this listing.
    if (v?.vip_mode) continue;
    if (row.used_at) {
      used.push(row);
    } else if (!v?.is_active || (v?.expires_at && new Date(v.expires_at).getTime() < now)) {
      expired.push(row);
    } else {
      active.push(row);
    }
  }

  return NextResponse.json({ active, used, expired });
}
