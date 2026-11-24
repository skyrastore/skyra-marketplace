"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { supabase, fmtIDR } from "@/lib/supabase";
import {
  Clock, Wallet, Settings, CheckCircle2, XCircle, Hourglass, Ban,
  MessageCircle, Home, ClipboardList, Lightbulb, type LucideIcon,
} from "lucide-react";

const LOGO_URL = "https://lh3.googleusercontent.com/d/1HmBuyY8D5ccBUUAP-GsCuiTNxpxsaDsu";
const ADMIN_WA = "6285183346300";

type Order = {
  id: string;
  order_code: string;
  game_name: string;
  product_name: string;
  phone: string;
  total_idr: number;
  subtotal_idr: number;
  voucher_code: string | null;
  voucher_discount_idr: number;
  status: string;
  supplier: string;
  payment_channel: string | null;
  uniplay_order_id: string | null;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  fulfilled_at: string | null;
};

const STATUS_INFO: Record<string, { label: string; Icon: LucideIcon; color: string; desc: string }> = {
  pending_payment: {
    label: "Menunggu Pembayaran",
    Icon: Clock,
    color: "#f59e0b",
    desc: "Silakan selesaikan pembayaran agar order dapat diproses.",
  },
  paid: {
    label: "Pembayaran Diterima",
    Icon: Wallet,
    color: "#3b82f6",
    desc: "Pembayaran berhasil! Order sedang diproses otomatis...",
  },
  fulfilling: {
    label: "Sedang Diproses",
    Icon: Settings,
    color: "#8b5cf6",
    desc: "Diamond/item sedang dikirim ke akun kamu...",
  },
  done: {
    label: "Selesai",
    Icon: CheckCircle2,
    color: "#10b981",
    desc: "Order berhasil! Cek akun game kamu — item sudah masuk.",
  },
  failed: {
    label: "Gagal",
    Icon: XCircle,
    color: "#ef4444",
    desc: "Order gagal diproses. Hubungi admin untuk refund atau retry.",
  },
  expired: {
    label: "Kadaluarsa",
    Icon: Hourglass,
    color: "#9ca3af",
    desc: "Waktu pembayaran habis. Silakan buat order baru.",
  },
  cancelled: {
    label: "Dibatalkan",
    Icon: Ban,
    color: "#9ca3af",
    desc: "Order dibatalkan.",
  },
};

export default function OrderStatusPage() {
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Fetch & auto-refresh
  useEffect(() => {
    let active = true;
    async function fetchOrder() {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("order_code", params.code)
        .maybeSingle();
      if (!active) return;
      if (!data) {
        setNotFound(true);
      } else {
        setOrder(data as Order);
      }
      setLoading(false);
    }
    fetchOrder();

    // Auto-refresh every 5s if not terminal state
    const interval = setInterval(() => {
      if (order && ["done", "failed", "expired", "cancelled"].includes(order.status)) {
        clearInterval(interval);
        return;
      }
      fetchOrder();
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80, color: "#0f172a", display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}><Clock size={18} /> Loading...</div>;
  }

  if (notFound) {
    return (
      <div style={{ textAlign: "center", padding: 80, color: "#0f172a" }}>
        <h2 style={{ fontFamily: "'Fredoka'", marginBottom: 16 }}>Order tidak ditemukan</h2>
        <div style={{ fontSize: ".9rem", opacity: .75, marginBottom: 20 }}>
          Kode order <code>{params.code}</code> tidak terdaftar atau sudah dihapus.
        </div>
        <Link href="/" style={{ color: "#2272dc", fontWeight: 700 }}>← Kembali ke beranda</Link>
      </div>
    );
  }

  const status = STATUS_INFO[order!.status] || { label: order!.status, Icon: Clock, color: "#9ca3af", desc: "" };

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <img src={LOGO_URL} alt="Skyra" />
            <span className="brand">SKYRA STORE</span>
          </Link>
          <div style={{ marginLeft: "auto" }}>
            <Link href="/" className="nav-cta">← Beranda</Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 680, margin: "20px auto 60px", padding: "0 24px", position: "relative", zIndex: 1 }}>
        {/* Status Hero */}
        <div
          style={{
            padding: 32,
            textAlign: "center",
            background: "#ffffff",
            border: `2px solid ${status.color}50`,
            borderRadius: 20,
            marginBottom: 20,
            color: "#0f172a",
            boxShadow: `0 10px 40px ${status.color}30`,
          }}
        >
          <div style={{ marginBottom: 8, lineHeight: 1, color: status.color }}>
            <status.Icon size={64} strokeWidth={1.8} />
          </div>
          <h1
            style={{
              fontFamily: "'Fredoka'",
              fontSize: "1.8rem",
              fontWeight: 700,
              marginBottom: 8,
              color: status.color,
            }}
          >
            {status.label}
          </h1>
          <div style={{ fontSize: ".9rem", opacity: .85, fontWeight: 600, lineHeight: 1.5 }}>
            {status.desc}
          </div>

          {!["done", "failed", "expired", "cancelled"].includes(order!.status) && (
            <div style={{ fontSize: ".75rem", opacity: .6, marginTop: 14 }}>
              Status di-refresh otomatis tiap 5 detik…
            </div>
          )}
        </div>

        {/* Order Detail */}
        <div
          style={{
            padding: 22,
            background: "#ffffff",
            border: "1px solid #e2e8ff",
            borderRadius: 16,
            color: "#0f172a",
            boxShadow: "0 10px 30px rgba(15,23,42,.18)",
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: "1rem", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <ClipboardList size={16} /> Detail Order
          </h3>
          {[
            ["Kode Order", order!.order_code],
            ["Game", order!.game_name],
            ["Paket", order!.product_name],
            ["Nomor WA", order!.phone],
            ...(order!.voucher_code ? [[`Voucher`, order!.voucher_code]] : []),
            ...(order!.payment_channel ? [["Metode", order!.payment_channel.toUpperCase()]] : []),
            ...(order!.uniplay_order_id ? [["UniPlay Ref", order!.uniplay_order_id]] : []),
            ["Harga", fmtIDR(order!.subtotal_idr)],
            ...(order!.voucher_discount_idr ? [[`Diskon`, `-${fmtIDR(order!.voucher_discount_idr)}`]] : []),
          ].map(([k, v]) => (
            <div
              key={k}
              style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: ".85rem", fontWeight: 600, color: "#334155", borderBottom: "1px dashed #e2e8ff" }}
            >
              <span>{k}</span>
              <span style={{ color: "#0f172a", fontWeight: 700, textAlign: "right" }}>{v}</span>
            </div>
          ))}
          <div
            style={{
              marginTop: 10,
              paddingTop: 14,
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 800,
              fontSize: "1.05rem",
            }}
          >
            <span>TOTAL</span>
            <span style={{ color: "#2272dc", fontSize: "1.2rem" }}>{fmtIDR(order!.total_idr)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "grid", gap: 10 }}>
          {order!.status === "pending_payment" && (
            <div
              style={{
                padding: "14px 18px",
                borderRadius: 12,
                background: "rgba(123,195,255,.14)",
                border: "1.5px solid rgba(123,195,255,.5)",
                color: "#1e40af",
                fontSize: ".85rem",
                fontWeight: 600,
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              <Lightbulb size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
              Belum bayar? Tutup tab ini & retry order dari halaman game.
            </div>
          )}

          {order!.status === "failed" && (
            <a
              href={`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(`Halo admin, order saya ${order!.order_code} gagal. Mohon bantuannya 🙏`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: 14,
                borderRadius: 12,
                background: "linear-gradient(135deg,#25D366,#128C7E)",
                color: "#fff",
                textAlign: "center",
                fontFamily: "'Fredoka'",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: ".95rem",
                boxShadow: "0 6px 20px rgba(37,211,102,.4)",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <MessageCircle size={16} /> Hubungi Admin via WhatsApp
              </span>
            </a>
          )}

          <Link
            href="/"
            style={{
              padding: 14,
              borderRadius: 12,
              background: "#f8fafc",
              border: "1px solid #e2e8ff",
              color: "#0f172a",
              textAlign: "center",
              fontFamily: "'Fredoka'",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: ".95rem",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Home size={16} /> Kembali ke Beranda
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
