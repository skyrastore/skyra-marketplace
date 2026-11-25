"use client";

import { Ticket, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";

export type VoucherInfo = {
  code: string;
  title?: string | null;
  description?: string | null;
  discount_type: "percentage" | "fixed" | string;
  discount_value: number;
  max_discount_idr: number | null;
  min_purchase_idr: number;
  expires_at?: string | null;
};

type Status = "available" | "claimed" | "used" | "expired";

export function VoucherCard({
  voucher,
  status,
  onClaim,
  claiming,
}: {
  voucher: VoucherInfo;
  status: Status;
  onClaim?: () => void;
  claiming?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const discountLabel =
    voucher.discount_type === "percentage"
      ? `${voucher.discount_value}% OFF`
      : `Rp ${Number(voucher.discount_value).toLocaleString("id-ID")}`;

  const minBuyLabel = `Min belanja Rp ${Number(voucher.min_purchase_idr).toLocaleString("id-ID")}`;
  const capLabel = voucher.discount_type === "percentage" && voucher.max_discount_idr
    ? ` · Maks Rp ${Number(voucher.max_discount_idr).toLocaleString("id-ID")}`
    : "";

  const validUntil = voucher.expires_at
    ? new Date(voucher.expires_at).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" })
    : null;

  const statusColor: Record<Status, string> = {
    available: "#10b981",
    claimed:   "#2970ff",
    used:      "#94a3b8",
    expired:   "#ef4444",
  };
  const statusLabel: Record<Status, string> = {
    available: "TERSEDIA",
    claimed:   "DIKLAIM",
    used:      "TERPAKAI",
    expired:   "KEDALUWARSA",
  };

  const dim = status === "used" || status === "expired";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e2e8ff",
        overflow: "hidden",
        opacity: dim ? 0.7 : 1,
        transition: "all .2s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          padding: 14,
          gap: 14,
          borderBottom: open ? "1px dashed #e2e8ff" : "none",
        }}
      >
        <div
          style={{
            width: 60,
            minWidth: 60,
            borderRadius: 12,
            background: "linear-gradient(135deg,#dbeafe,#bfdbfe)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2970ff",
          }}
        >
          <Ticket size={28} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Fredoka'", fontSize: "1.3rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.1 }}>
                {discountLabel}
              </div>
              <div style={{ fontSize: ".78rem", color: "#475569", fontWeight: 600, marginTop: 4, lineHeight: 1.4 }}>
                {voucher.title || voucher.description || minBuyLabel}
              </div>
              <div style={{ fontSize: ".7rem", color: "#64748b", marginTop: 4, fontWeight: 500 }}>
                {minBuyLabel}{capLabel}
              </div>
            </div>
            <span
              style={{
                background: `${statusColor[status]}15`,
                color: statusColor[status],
                fontSize: ".65rem",
                fontWeight: 800,
                padding: "4px 8px",
                borderRadius: 6,
                letterSpacing: ".5px",
                whiteSpace: "nowrap",
              }}
            >
              {statusLabel[status]}
            </span>
          </div>
        </div>
      </div>
      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f8fafc",
          gap: 10,
        }}
      >
        <div style={{ fontSize: ".72rem", color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={12} /> {validUntil ? `Berlaku s/d ${validUntil}` : "Tanpa batas waktu"}
        </div>
        {status === "available" && onClaim ? (
          <button
            onClick={onClaim}
            disabled={claiming}
            style={{
              padding: "7px 18px",
              borderRadius: 8,
              background: "linear-gradient(135deg,#2970ff,#1a52b8)",
              color: "#fff",
              border: 0,
              fontFamily: "inherit",
              fontSize: ".78rem",
              fontWeight: 700,
              cursor: claiming ? "wait" : "pointer",
              boxShadow: "0 4px 12px rgba(41,112,255,.3)",
            }}
          >
            {claiming ? "..." : "KLAIM"}
          </button>
        ) : status === "claimed" ? (
          <span style={{ fontSize: ".72rem", color: "#2970ff", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
            <CheckCircle2 size={14} /> Siap dipakai
          </span>
        ) : (
          <button
            onClick={() => setOpen((o) => !o)}
            style={{ background: "none", border: 0, color: "#64748b", fontSize: ".72rem", fontWeight: 700, cursor: "pointer" }}
          >
            {open ? "Tutup" : "Detail"}
          </button>
        )}
      </div>
      {open && voucher.description && (
        <div style={{ padding: "12px 14px", fontSize: ".78rem", color: "#334155", lineHeight: 1.5, borderTop: "1px solid #f1f5f9" }}>
          {voucher.description}
        </div>
      )}
    </div>
  );
}
