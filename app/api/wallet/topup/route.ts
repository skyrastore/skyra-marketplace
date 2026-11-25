import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSnapTransaction } from "@/lib/midtrans";
import { env } from "@/lib/env";

export const runtime = "edge";

// Valid topup nominals (in IDR). Cliped server-side to prevent abuse.
const ALLOWED_AMOUNTS = new Set([10_000, 25_000, 50_000, 100_000, 200_000, 500_000, 1_000_000]);

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { amount?: number };
  const amount = Number(body.amount ?? 0);
  if (!ALLOWED_AMOUNTS.has(amount)) {
    return NextResponse.json({ error: "invalid_amount", allowed: [...ALLOWED_AMOUNTS] }, { status: 400 });
  }

  // Auth: resolve user from their JWT
  const userClient = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: u } = await userClient.auth.getUser();
  if (!u?.user) return NextResponse.json({ error: "invalid_token" }, { status: 401 });

  // Build Midtrans order_id: WLT-<short>-<ts>. Short random so not guessable.
  const nonce = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  const midtransOrderId = `WLT-${nonce}-${Date.now().toString(36)}`;

  // Pre-register the topup so webhook can trust the amount / user binding.
  const admin = getSupabaseAdmin();
  const { error: insErr } = await admin.from("wallet_topups").insert({
    midtrans_order_id: midtransOrderId,
    user_id: u.user.id,
    amount_idr: amount,
    status: "pending",
  });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const email = u.user.email || `${u.user.id}@skyra.id`;
  const name = (u.user.user_metadata?.full_name as string | undefined) || email.split("@")[0];

  try {
    const snap = await createSnapTransaction({
      orderCode: midtransOrderId,
      grossAmount: amount,
      itemName: `Topup Saldo Skyra Rp${amount.toLocaleString("id-ID")}`,
      itemId: "wallet-topup",
      customerPhone: "08000000000",
      customerName: name,
      customerEmail: email,
      expiryMinutes: 60,
    });
    return NextResponse.json({ token: snap.token, redirect_url: snap.redirect_url, order_id: midtransOrderId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
