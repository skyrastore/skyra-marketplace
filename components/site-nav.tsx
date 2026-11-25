"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { useI18n } from "./i18n-provider";
import { useAuth } from "./auth-provider";

const LOGO_URL = "https://lh3.googleusercontent.com/d/1HmBuyY8D5ccBUUAP-GsCuiTNxpxsaDsu";

export function SiteNav() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const isAuthed = !!user;

  const items: { href: string; label: string }[] = [
    { href: "/", label: t("nav.home") },
    { href: "/lacak", label: t("nav.track") },
    ...(isAuthed
      ? [
          { href: "/riwayat", label: "Riwayat Pesanan" },
          { href: "/kupon", label: t("nav.vouchers") },
          { href: "/saldo", label: t("nav.balance") },
        ]
      : []),
  ];

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const displayName = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || "";

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          <img src={LOGO_URL} alt="Skyra" />
          <span className="brand">SKYRA STORE</span>
        </Link>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {isAuthed ? (
            <button
              className="nav-cta"
              onClick={() => setOpen((o) => !o)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px 6px 6px" }}
              aria-label={displayName}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" width={26} height={26} style={{ borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#dbeafe", color: "#1a52b8", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <UserIcon size={14} />
                </span>
              )}
              <span style={{ maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
            </button>
          ) : (
            <Link href="/login" className="nav-cta">{t("nav.login")}</Link>
          )}
          <button
            className="nav-burger"
            aria-label={t("a11y.open_menu")}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="nav-drawer">
          {isAuthed && (
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.12)", display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" width={36} height={36} style={{ borderRadius: "50%" }} />
              ) : (
                <span style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,.15)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <UserIcon size={18} />
                </span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: ".9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
                <div style={{ fontSize: ".72rem", opacity: .7, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
              </div>
            </div>
          )}
          {items.map((it) => (
            <Link key={it.href} href={it.href} onClick={() => setOpen(false)}>
              {it.label}
            </Link>
          ))}
          {isAuthed && (
            <button
              onClick={async () => { await signOut(); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "none", border: 0, color: "inherit",
                padding: "10px 16px", font: "inherit", textAlign: "left",
                cursor: "pointer", opacity: .8,
              }}
            >
              <LogOut size={14} /> Keluar
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
