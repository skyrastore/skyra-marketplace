"use client";

import Link from "next/link";
import { useI18n } from "./i18n-provider";

const LOGO_URL = "https://lh3.googleusercontent.com/d/1HmBuyY8D5ccBUUAP-GsCuiTNxpxsaDsu";

// Shared nav for non-home pages (game detail, order status, lacak, etc.)
// Includes brand + ID/EN toggle + back-to-home CTA.
export function SiteNav() {
  const { lang, setLang, t } = useI18n();
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <img src={LOGO_URL} alt="Skyra" />
          <span className="brand">SKYRA STORE</span>
        </Link>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <div className="lang-sw">
            <button className={lang === "id" ? "on" : ""} onClick={() => setLang("id")}>ID</button>
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          </div>
          <Link href="/" className="nav-cta">{t("nav.back_home")}</Link>
        </div>
      </div>
    </nav>
  );
}
