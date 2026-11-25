import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const runtime = "edge";

// Returns { balance_idr, history:[...wallet_tx] } for the signed-in user.
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

  const [walletRes, txRes] = await Promise.all([
    supabase.from("wallets").select("balance_idr, updated_at").eq("user_id", user.user.id).maybeSingle(),
    supabase.from("wallet_tx").select("id, tx_type, amount_idr, balance_after, description, created_at").eq("user_id", user.user.id).order("created_at", { ascending: false }).limit(50),
  ]);

  return NextResponse.json({
    balance_idr: walletRes.data?.balance_idr ?? 0,
    updated_at: walletRes.data?.updated_at ?? null,
    history: txRes.data ?? [],
  });
}
