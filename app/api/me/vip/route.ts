import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const runtime = "edge";

// GET /api/me/vip
// Returns { isVip, voucherCode?, gameSlugs?[] } for the signed-in user.
// Used by the UI to show VIP pricing + VIP badge throughout.
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ isVip: false });

  const supabase = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return NextResponse.json({ isVip: false });

  // Join claim → voucher, filter by vip_mode + is_active
  const { data: claim } = await supabase
    .from("vouchers_claimed")
    .select("voucher_code, voucher:vouchers!inner(code, is_active, vip_mode, game_slugs, title)")
    .eq("user_id", u.user.id)
    .maybeSingle();

  type JoinedClaim = {
    voucher_code: string;
    voucher: { code: string; is_active: boolean; vip_mode: boolean; game_slugs: string[] | null; title: string | null };
  };
  const row = claim as unknown as JoinedClaim | null;
  const v = row?.voucher;
  if (!v?.is_active || !v.vip_mode) {
    return NextResponse.json({ isVip: false });
  }

  return NextResponse.json({
    isVip: true,
    voucherCode: v.code,
    title: v.title,
    gameSlugs: v.game_slugs ?? null,
  });
}
