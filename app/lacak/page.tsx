"use client";
export const runtime = "edge";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Receipt } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n-provider";
import { SiteNav } from "@/components/site-nav";

const LOGO_URL = "https://lh3.googleusercontent.com/d/1HmBuyY8D5ccBUUAP-GsCuiTNxpxsaDsu";
const ORDER_CODE_RE = /^SKY-\d{8}-[A-Z0-9]{4,10}$/i;

export default function LacakPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const normalized = code.trim().toUpperCase();
  const isValid = ORDER_CODE_RE.test(normalized);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalized) {
      toast.warning("Masukkan kode order dulu ya");
      return;
    }
    if (!isValid) {
      toast.error("Format kode salah", {
        description: "Contoh: SKY-20261125-A3F7B2",
      });
      return;
    }
    setLoading(true);
    router.push(`/order/${normalized}`);
  };

  return (
    <>
      <SiteNav />

      <div style={{ maxWidth: 560, margin: "40px auto 80px", padding: "0 24px", position: "relative", zIndex: 1 }}>
        {/* Hero */}
        <div style={{ textAlign: "center", color: "#fff", marginBottom: 28 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72, height: 72, borderRadius: 20,
              background: "linear-gradient(135deg,#1452b4,#2272dc)",
              color: "#fff",
              marginBottom: 16,
              boxShadow: "0 14px 40px rgba(34,114,220,.4)",
            }}
          >
            <Receipt size={34} strokeWidth={2} />
          </div>
          <h1
            style={{
              fontFamily: "'Fredoka', system-ui, sans-serif",
              fontSize: "1.9rem",
              fontWeight: 700,
              marginBottom: 8,
              color: "#fff",
              textShadow: "0 2px 20px rgba(5,20,80,.5)",
            }}
          >
            {t("track.title")}
          </h1>
          <p style={{ fontSize: ".92rem", opacity: .85, fontWeight: 500, lineHeight: 1.5 }}>
            {t("track.subtitle")}
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: 28,
            background: "#ffffff",
            border: "1px solid #e2e8ff",
            borderRadius: 20,
            boxShadow: "0 14px 40px rgba(15,23,42,.22)",
          }}
        >
          <label
            htmlFor="order-code"
            style={{
              display: "block",
              fontSize: ".82rem",
              fontWeight: 800,
              marginBottom: 8,
              color: "#334155",
              letterSpacing: ".02em",
            }}
          >
            {t("track.label")}
          </label>
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Search size={18} />
            </div>
            <input
              id="order-code"
              type="text"
              placeholder="SKY-20261125-A3F7B2"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoComplete="off"
              autoCapitalize="characters"
              style={{
                width: "100%",
                padding: "14px 16px 14px 44px",
                borderRadius: 12,
                background: "#f8fafc",
                border: `1.5px solid ${isValid ? "#10b981" : "#e2e8ff"}`,
                color: "#0f172a",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: "1rem",
                fontWeight: 700,
                letterSpacing: ".04em",
                outline: "none",
                transition: ".2s",
              }}
            />
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: ".72rem",
              color: isValid ? "#059669" : "#64748b",
              fontWeight: 600,
              minHeight: 16,
            }}
          >
            {isValid
              ? t("track.valid")
              : normalized
              ? t("track.format_hint")
              : ""}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 18,
              width: "100%",
              padding: 14,
              border: 0,
              borderRadius: 12,
              background: loading
                ? "#e2e8ff"
                : "linear-gradient(135deg,#1452b4,#2272dc,#4a8dff)",
              color: loading ? "#64748b" : "#fff",
              fontFamily: "'Fredoka', system-ui, sans-serif",
              fontSize: ".98rem",
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              letterSpacing: ".3px",
              boxShadow: loading ? "none" : "0 6px 24px rgba(34,114,220,.5)",
              transition: ".2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {loading ? t("track.opening") : t("track.submit")} <ArrowRight size={16} />
          </button>
        </form>

        {/* Help text */}
        <div
          style={{
            marginTop: 20,
            padding: 18,
            background: "rgba(255,255,255,.06)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,.12)",
            borderRadius: 14,
            fontSize: ".82rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,.9)",
          }}
        >
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: 6 }}>{t("track.help_title")}</div>
          <div style={{ opacity: .85, fontWeight: 500 }}>
            {t("track.help_desc")}
          </div>
        </div>
      </div>
    </>
  );
}
