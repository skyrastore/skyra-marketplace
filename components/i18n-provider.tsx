"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type Lang, translate, getStoredLang, setStoredLang } from "@/lib/i18n";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    setLangState(getStoredLang());
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setStoredLang(l);
  }, []);

  const t = useCallback((key: string) => translate(key, lang), [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Allow use outside provider (fallback to ID)
    return {
      lang: "id" as Lang,
      setLang: () => {},
      t: (key: string) => translate(key, "id"),
    };
  }
  return ctx;
}

export function useT() {
  return useI18n().t;
}
