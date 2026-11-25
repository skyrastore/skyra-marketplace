"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { useI18n } from "./i18n-provider";

const ADMIN_WA = "6285183346300";

export function CSButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const url = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(t("cs.preset"))}`;

  return (
    <>
      {/* Popover card */}
      {open && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 86,
            zIndex: 998,
            width: 280,
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #e2e8ff",
            boxShadow: "0 20px 50px rgba(15,23,42,.25)",
            padding: 18,
            animation: "fadeInUp .2s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div
              style={{
                width: 42, height: 42, borderRadius: 12,
                background: "linear-gradient(135deg,#25D366,#128C7E)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff",
              }}
            >
              <MessageCircle size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: ".92rem", color: "#0f172a" }}>{t("cs.title")}</div>
              <div style={{ fontSize: ".7rem", color: "#64748b", fontWeight: 600 }}>{t("cs.hours")}</div>
            </div>
          </div>
          <div style={{ fontSize: ".82rem", color: "#334155", marginBottom: 12, lineHeight: 1.45, fontWeight: 500 }}>
            {t("cs.body")}
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 14px",
              borderRadius: 10,
              background: "linear-gradient(135deg,#25D366,#128C7E)",
              color: "#fff",
              textDecoration: "none",
              fontFamily: "'Fredoka', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: ".9rem",
              boxShadow: "0 4px 14px rgba(37,211,102,.4)",
            }}
          >
            <MessageCircle size={16} />
            {t("cs.start")}
          </a>
        </div>
      )}

      {/* Floating FAB */}
      <button
        aria-label={t("cs.title")}
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 999,
          width: 56,
          height: 56,
          borderRadius: 999,
          background: "linear-gradient(135deg,#25D366,#128C7E)",
          color: "#fff",
          border: 0,
          cursor: "pointer",
          boxShadow: "0 10px 30px rgba(37,211,102,.45), 0 0 0 4px rgba(37,211,102,.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform .2s cubic-bezier(.34,1.56,.64,1)",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}
      >
        {open ? (
          <span style={{ fontSize: "1.6rem", fontWeight: 300, lineHeight: 1 }}>+</span>
        ) : (
          <MessageCircle size={26} />
        )}
      </button>
    </>
  );
}
