"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ArrowLeft, Shield, Zap, Gift, type LucideIcon } from "lucide-react";

export const runtime = "edge";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const { user, loading, signInGoogle } = useAuth();
  const nextPath = sp.get("next") || "/";

  useEffect(() => {
    if (!loading && user) router.replace(nextPath);
  }, [loading, user, router, nextPath]);

  return (
    <>
      <SiteNav />
      <main
        style={{
          minHeight: "calc(100vh - 62px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          background: "linear-gradient(180deg,#1a52b8 0%,#2970ff 100%)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#fff",
            borderRadius: 20,
            padding: "36px 28px",
            boxShadow: "0 20px 60px rgba(15,23,42,.3)",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "#64748b",
              textDecoration: "none",
              fontSize: ".85rem",
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            <ArrowLeft size={14} /> Beranda
          </Link>

          <h1 style={{ fontFamily: "'Fredoka'", fontSize: "1.8rem", fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
            Masuk ke Skyra
          </h1>
          <p style={{ fontSize: ".9rem", color: "#64748b", marginBottom: 28, fontWeight: 500 }}>
            Login untuk history order, voucher pribadi, dan checkout lebih cepat.
          </p>

          <button
            onClick={signInGoogle}
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px 16px",
              borderRadius: 12,
              border: "1px solid #e2e8ff",
              background: "#fff",
              color: "#0f172a",
              fontFamily: "inherit",
              fontSize: ".95rem",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              transition: "all .15s",
              boxShadow: "0 2px 8px rgba(15,23,42,.05)",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#f8fafc")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#fff")}
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.4C29.4 34.9 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.4c-.4.4 6.7-4.9 6.7-15.1 0-1.3-.1-2.3-.5-3.5z"/>
            </svg>
            Lanjut dengan Google
          </button>

          <div style={{ textAlign: "center", margin: "22px 0 18px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8ff" }} />
            <span style={{ fontSize: ".72rem", color: "#94a3b8", fontWeight: 700, letterSpacing: ".5px" }}>ATAU</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8ff" }} />
          </div>

          <Link
            href={nextPath}
            style={{
              display: "flex",
              width: "100%",
              padding: "12px 16px",
              borderRadius: 12,
              background: "#f1f5f9",
              color: "#475569",
              textDecoration: "none",
              fontFamily: "inherit",
              fontSize: ".88rem",
              fontWeight: 700,
              textAlign: "center",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
            }}
          >
            Lanjut sebagai Guest
          </Link>

          <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <Benefit Icon={Zap} text="Checkout cepat" />
            <Benefit Icon={Gift} text="Voucher pribadi" />
            <Benefit Icon={Shield} text="History order" />
          </div>

          <p style={{ fontSize: ".7rem", color: "#94a3b8", textAlign: "center", marginTop: 20, lineHeight: 1.5 }}>
            Dengan masuk, kamu setuju dengan <Link href="/" style={{ color: "#2970ff" }}>Syarat Layanan</Link> dan <Link href="/" style={{ color: "#2970ff" }}>Kebijakan Privasi</Link> Skyra.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Benefit({ Icon, text }: { Icon: LucideIcon; text: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px", background: "#f8fafc", borderRadius: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: "#dbeafe", color: "#2970ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={14} />
      </div>
      <span style={{ fontSize: ".67rem", color: "#334155", fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>{text}</span>
    </div>
  );
}
