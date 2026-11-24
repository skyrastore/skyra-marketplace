// ═══════════════════════════════════════════════════════════
// Env var access helper (edge runtime compatible)
//
// On Cloudflare Pages edge runtime via @cloudflare/next-on-pages,
// server-side env vars are NOT auto-exposed on process.env — even
// with nodejs_compat flag. They must be read via getRequestContext()
// which exposes Cloudflare bindings including vars.
//
// NEXT_PUBLIC_* vars still work via process.env because webpack
// inlines them at build time.
// ═══════════════════════════════════════════════════════════

import { getRequestContext } from "@cloudflare/next-on-pages";

export function env(key: string): string | undefined {
  // Prefer runtime context (Cloudflare bindings) — covers server-side vars
  try {
    const ctx = getRequestContext();
    const val = (ctx.env as Record<string, string | undefined>)[key];
    if (val !== undefined && val !== "") return val;
  } catch {
    // Not inside request context (build time, SSG, etc.) — fallthrough
  }
  // Fallback: process.env (always works for NEXT_PUBLIC_* due to webpack inline)
  return process.env[key];
}
