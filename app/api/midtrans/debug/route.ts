// ═══════════════════════════════════════════════════════════
// Diagnostic endpoint — TEMPORARY, remove after webhook is working
// Pings Midtrans's /v2/<order_id>/status with our SERVER_KEY.
// 200 → key is valid in this env
// 401 → key is wrong (typo, whitespace, sandbox/prod mismatch)
// GET /api/midtrans/debug?order=WLT-xxx
// ═══════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const runtime = "edge";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const order = url.searchParams.get("order");
  if (!order) return NextResponse.json({ error: "pass ?order=<midtrans_order_id>" }, { status: 400 });

  const serverKey = env("MIDTRANS_SERVER_KEY");
  if (!serverKey) {
    return NextResponse.json({
      ok: false,
      reason: "MIDTRANS_SERVER_KEY env var is missing or empty in this Cloudflare Pages deployment",
    });
  }

  const envTag = (process.env.NEXT_PUBLIC_MIDTRANS_ENV || "sandbox") === "production" ? "production" : "sandbox";
  const apiBase = envTag === "production"
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";

  const auth = btoa(`${serverKey}:`);
  const res = await fetch(`${apiBase}/v2/${order}/status`, {
    headers: { Accept: "application/json", Authorization: `Basic ${auth}` },
  });
  const data = await res.json().catch(() => ({ raw: "non-json" }));

  return NextResponse.json({
    ok: res.ok,
    http: res.status,
    env_tag: envTag,
    server_key_prefix: serverKey.slice(0, 10),
    server_key_length: serverKey.length,
    server_key_starts_space: serverKey.startsWith(" "),
    server_key_trailing_space: serverKey.endsWith(" "),
    midtrans_response: data,
  });
}
