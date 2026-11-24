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
  // Try 1: getRequestContext (Cloudflare bindings)
  try {
    const ctx = getRequestContext();
    const envObj = ctx?.env as Record<string, string | undefined> | undefined;
    console.log("[env debug]", key, {
      hasContext: !!ctx,
      hasEnv: !!envObj,
      envKeys: envObj ? Object.keys(envObj).sort() : [],
    });
    const val = envObj?.[key];
    if (val !== undefined && val !== "") return val;
  } catch (e) {
    console.log("[env debug] getRequestContext threw:", key, (e as Error).message);
  }

  // Try 2: process.env
  const procVal = process.env[key];
  console.log("[env debug] process.env", key, { hasVal: !!procVal });
  if (procVal !== undefined && procVal !== "") return procVal;

  // Try 3: globalThis (last resort for exotic runtimes)
  const globalVal = (globalThis as unknown as Record<string, string | undefined>)[key];
  console.log("[env debug] globalThis", key, { hasVal: !!globalVal });
  return globalVal;
}
