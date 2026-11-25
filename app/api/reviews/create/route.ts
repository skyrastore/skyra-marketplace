import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { env } from "@/lib/env";

export const runtime = "edge";

// POST /api/reviews/create
// Body: { orderCode, rating 1-5, comment?, displayName? }
// Rules: user must own the order AND order.status='done' AND no review for this order yet.
export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    orderCode?: string; rating?: number; comment?: string; displayName?: string;
  };
  const orderCode = (body.orderCode ?? "").trim();
  const rating = Number(body.rating ?? 0);
  if (!orderCode || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "orderCode + rating (1-5) wajib" }, { status: 400 });
  }

  // Authenticate the caller
  const userClient = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: u } = await userClient.auth.getUser();
  if (!u?.user) return NextResponse.json({ error: "invalid_token" }, { status: 401 });

  // Fetch order via service role so RLS doesn't matter here
  const admin = getSupabaseAdmin();
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, user_id, game_id, status")
    .eq("order_code", orderCode)
    .maybeSingle();

  if (orderErr || !order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  if (order.user_id !== u.user.id) return NextResponse.json({ error: "not_your_order" }, { status: 403 });
  if (order.status !== "done") return NextResponse.json({ error: "order_not_done_yet" }, { status: 400 });

  // Check existing review (unique order_id anyway, but we want nicer error)
  const { data: existing } = await admin
    .from("reviews")
    .select("id")
    .eq("order_id", order.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: "already_reviewed" }, { status: 409 });

  const displayName = (body.displayName ?? "").trim()
    || (u.user.user_metadata?.full_name as string | undefined)
    || u.user.email?.split("@")[0]
    || "Customer";

  const { error: insErr } = await admin.from("reviews").insert({
    user_id: u.user.id,
    order_id: order.id,
    game_id: order.game_id,
    rating,
    comment: (body.comment ?? "").trim() || null,
    display_name: displayName.slice(0, 60),
    is_public: true,
  });

  if (insErr) {
    if (insErr.code === "23505") return NextResponse.json({ error: "already_reviewed" }, { status: 409 });
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
