"use client";

// ID-only mode: toggle removed 2026-11-25. t() stays as a thin
// wrapper so existing t('key') calls across the codebase keep
// working without a mass refactor. lang/setLang are kept in the
// return shape (no-op) so any lingering destructure doesn't crash.

import { translate } from "@/lib/i18n";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useI18n() {
  return {
    lang: "id" as const,
    setLang: () => {},
    t: (key: string) => translate(key, "id"),
  };
}

export function useT() {
  return (key: string) => translate(key, "id");
}
