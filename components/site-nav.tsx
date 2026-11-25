"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useI18n } from "./i18n-provider";

const LOGO_URL = "https://lh3.googleusercontent.com/d/1HmBuyY8D5ccBUUAP-GsCuiTNxpxsaDsu";

// TODO: wire up Supabase Auth → `isAuthed` once login is in. For now assume false.
const IS_AUTHED = false;

// Shared nav for every page (home + game + order + lacak + …).
// Only contains: logo + ID/EN + MASUK + burger. All route links live in the
// burger drawer so there's no double-chrome.
export function SiteNav() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);

  // Menu items shown inside drawer. Auth-gated rows show when IS_AUTHED is true.
  const items: { href: string; label: string }[] = [
    { href: "/", label: t("nav.home") },
    { href: "/lacak", label: t("nav.track") },
    ...(IS_AUTHED
      ? [
          { href: "/kupon", label: t("nav.vouchers") },
          { href: "/saldo", label: t("nav.balance") },
        ]
      : []),
  ];

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <img src={LOGO_URL} alt="Skyra" />
          <span className="brand">SKYRA STORE</span>
        </Link>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <div className="lang-sw">
            <button className={lang === "id" ? "on" : ""} onClick={() => setLang("id")}>ID</button>
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          </div>
          <Link href="/login" className="nav-cta">{t("nav.login")}</Link>
          <button
            className="nav-burger"
            aria-label="Open menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="nav-drawer">
          {items.map((it) => (
            <Link key={it.href} href={it.href} onClick={() => setOpen(false)}>
              {it.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
