import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const runtime = "edge";

// Public vouchers the user hasn't yet claimed (or has fully used up).
// Requires a logged-in user: pass the Supabase JWT in Authorization header.
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

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("vouchers")
    .select("code, title, description, discount_type, discount_value, max_discount_idr, min_purchase_idr, valid_until:expires_at, is_active, max_uses, used_count")
    .eq("is_active", true)
    .eq("is_public", true)
    .or(`expires_at.is.null,expires_at.gt.${now}`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Which codes the user already claimed? Filter them out.
  const { data: claimed } = await supabase
    .from("vouchers_claimed")
    .select("voucher_code")
    .eq("user_id", user.user.id);

  const claimedSet = new Set((claimed ?? []).map((c) => c.voucher_code));
  const available = (data ?? []).filter((v) => !claimedSet.has(v.code));

  return NextResponse.json({ vouchers: available });
}
