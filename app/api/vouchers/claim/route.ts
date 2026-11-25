import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const runtime = "edge";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const code = (body.code ?? "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "code_required" }, { status: 400 });

  const supabase = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: user } = await supabase.auth.getUser();
  if (!user?.user) return NextResponse.json({ error: "invalid_token" }, { status: 401 });

  // Validate voucher exists + is public + active + not expired
  const { data: v } = await supabase
    .from("vouchers")
    .select("code, is_active, is_public, expires_at, max_uses, used_count")
    .eq("code", code)
    .maybeSingle();

  if (!v) return NextResponse.json({ error: "voucher_not_found" }, { status: 404 });
  if (!v.is_active) return NextResponse.json({ error: "voucher_inactive" }, { status: 400 });
  if (!v.is_public) return NextResponse.json({ error: "voucher_private" }, { status: 400 });
  if (v.expires_at && new Date(v.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "voucher_expired" }, { status: 400 });
  }
  if (v.max_uses !== null && v.used_count >= v.max_uses) {
    return NextResponse.json({ error: "voucher_exhausted" }, { status: 400 });
  }

  const { error } = await supabase
    .from("vouchers_claimed")
    .insert({ user_id: user.user.id, voucher_code: code });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "already_claimed" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
