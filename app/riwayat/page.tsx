"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth-provider";
import { supabase, fmtIDR } from "@/lib/supabase";
import { Clock, CheckCircle2, XCircle, Hourglass, Settings, Wallet, CreditCard, Package, Ban, ChevronRight, type LucideIcon } from "lucide-react";

export const runtime = "edge";

type Order = {
  id: string;
  order_code: string;
  game_name: string;
  product_name: string;
  total_idr: number;
  qty: number;
  status: string;
  payment_method: string | null;
  payment_channel: string | null;
  voucher_code: string | null;
  created_at: string;
  paid_at: string | null;
};

type Filter = "all" | "pending" | "paid" | "done" | "failed";

const STATUS_META: Record<string, { label: string; color: string; Icon: LucideIcon }> = {
  pending_payment: { label: "Menunggu Bayar", color: "#f59e0b", Icon: Clock },
  paid:           { label: "Pembayaran OK",  color: "#3b82f6", Icon: Wallet },
  fulfilling:     { label: "Diproses",       color: "#8b5cf6", Icon: Settings },
  done:           { label: "Selesai",        color: "#10b981", Icon: CheckCircle2 },
  failed:         { label: "Gagal",          color: "#ef4444", Icon: XCircle },
  expired:        { label: "Kadaluarsa",     color: "#9ca3af", Icon: Hourglass },
  cancelled:      { label: "Dibatalkan",     color: "#9ca3af", Icon: Ban },
};

export default function RiwayatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/riwayat");
  }, [authLoading, user, router]);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, order_code, game_name, product_name, total_idr, qty, status, payment_method, payment_channel, voucher_code, created_at, paid_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setOrders((data || []) as Order[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (authLoading || !user) return null;

  const filtered = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "pending") return ["pending_payment", "paid", "fulfilling"].includes(o.status);
    if (filter === "done") return o.status === "done";
    if (filter === "failed") return ["failed", "expired", "cancelled"].includes(o.status);
    if (filter === "paid") return ["paid", "fulfilling"].includes(o.status);
    return true;
  });

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => ["pending_payment", "paid", "fulfilling"].includes(o.status)).length,
    done: orders.filter((o) => o.status === "done").length,
    failed: orders.filter((o) => ["failed", "expired", "cancelled"].includes(o.status)).length,
  };

  return (
    <>
      <SiteNav />
      <main
        style={{
          minHeight: "calc(100dvh - 62px)",
          padding: "0 0 80px",
          background: "linear-gradient(180deg,#eff6ff 0%,#f8fafc 180px,#f8fafc 100%)",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 20, left: "10%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,185,129,.18),transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 60, right: "8%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(41,112,255,.18),transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px 0", position: "relative" }}>
          {/* Hero */}
          <div
            style={{
              background: "linear-gradient(135deg,#059669 0%,#1a52b8 100%)",
              color: "#fff",
              borderRadius: 20,
              padding: "26px 22px",
              marginBottom: 20,
              boxShadow: "0 18px 50px rgba(16,185,129,.35)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.1)" }} />
            <div style={{ position: "absolute", bottom: -40, left: -20, width: 130, height: 130, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
              <div
                style={{
                  width: 54, height: 54, borderRadius: 14,
                  background: "rgba(255,255,255,.2)",
                  border: "1.5px solid rgba(255,255,255,.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backdropFilter: "blur(8px)",
                }}
              >
                <Package size={26} />
              </div>
              <div>
                <h1 style={{ fontFamily: "'Fredoka'", fontSize: "1.5rem", fontWeight: 700, margin: 0, lineHeight: 1.1 }}>Riwayat Pesanan</h1>
                <p style={{ fontSize: ".82rem", opacity: .92, margin: "4px 0 0", fontWeight: 500 }}>
                  Semua order kamu — klik buat lihat detail.
                </p>
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>Semua ({counts.all})</Chip>
            <Chip active={filter === "pending"} onClick={() => setFilter("pending")}>Berlangsung ({counts.pending})</Chip>
            <Chip active={filter === "done"} onClick={() => setFilter("done")}>Selesai ({counts.done})</Chip>
            <Chip active={filter === "failed"} onClick={() => setFilter("failed")}>Gagal ({counts.failed})</Chip>
          </div>

          {loading ? (
            <EmptyState text="Memuat riwayat..." />
          ) : filtered.length === 0 ? (
            <EmptyState
              text={filter === "all" ? "Belum ada order. Yuk belanja pertamamu!" : "Tidak ada order di kategori ini."}
              cta={filter === "all" ? { label: "Jelajahi Game", href: "/" } : undefined}
            />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {filtered.map((o) => (
                <OrderCard key={o.id} order={o} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function OrderCard({ order }: { order: Order }) {
  const meta = STATUS_META[order.status] || STATUS_META.pending_payment;
  const dt = new Date(order.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  const methodLabel = order.payment_method === "wallet" ? "Saldo Skyra" : (order.payment_channel?.toUpperCase() || "—");

  return (
    <Link
      href={`/order/${order.order_code}`}
      style={{
        display: "block",
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e2e8ff",
        padding: 14,
        color: "#0f172a",
        textDecoration: "none",
        boxShadow: "0 6px 18px rgba(15,23,42,.06)",
        transition: "all .15s",
        position: "relative",
      }}
    >
      {/* Left accent stripe matching status */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: meta.color, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, paddingLeft: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: ".95rem", color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {order.game_name}
          </div>
          <div style={{ fontSize: ".78rem", color: "#64748b", fontWeight: 600, marginTop: 2 }}>
            {order.product_name}{order.qty > 1 ? ` ×${order.qty}` : ""}
          </div>
        </div>
        <span
          style={{
            background: `${meta.color}15`,
            color: meta.color,
            fontSize: ".66rem",
            fontWeight: 800,
            padding: "4px 8px",
            borderRadius: 6,
            letterSpacing: ".3px",
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <meta.Icon size={11} /> {meta.label.toUpperCase()}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px dashed #f1f5f9", paddingLeft: 8 }}>
        <div style={{ fontSize: ".7rem", color: "#94a3b8", fontWeight: 600 }}>
          {dt} · {order.payment_method === "wallet" ? <Wallet size={10} style={{ display: "inline", verticalAlign: "-1px" }} /> : <CreditCard size={10} style={{ display: "inline", verticalAlign: "-1px" }} />} {methodLabel}
          {order.voucher_code && <> · 🎫 {order.voucher_code}</>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontWeight: 800, fontSize: ".95rem", color: "#0f172a" }}>{fmtIDR(order.total_idr)}</span>
          <ChevronRight size={16} color="#94a3b8" />
        </div>
      </div>
    </Link>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 999,
        border: active ? 0 : "1px solid #e2e8ff",
        background: active ? "linear-gradient(135deg,#059669,#1a52b8)" : "#fff",
        color: active ? "#fff" : "#475569",
        fontFamily: "inherit",
        fontSize: ".8rem",
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: active ? "0 4px 12px rgba(16,185,129,.3)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function EmptyState({ text, cta }: { text: string; cta?: { label: string; href: string } }) {
  return (
    <div
      style={{
        padding: "50px 24px",
        textAlign: "center",
        background: "#fff",
        borderRadius: 18,
        border: "1.5px dashed #cbd5e1",
        boxShadow: "0 4px 14px rgba(15,23,42,.05)",
      }}
    >
      <div
        style={{
          width: 72, height: 72, margin: "0 auto 14px",
          borderRadius: "50%",
          background: "linear-gradient(135deg,#f1f5f9,#e2e8f0)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#94a3b8",
        }}
      >
        <Package size={32} />
      </div>
      <div style={{ color: "#64748b", fontSize: ".92rem", fontWeight: 600, lineHeight: 1.5, marginBottom: cta ? 16 : 0 }}>{text}</div>
      {cta && (
        <Link
          href={cta.href}
          style={{
            display: "inline-block",
            padding: "10px 20px",
            borderRadius: 10,
            background: "linear-gradient(135deg,#059669,#1a52b8)",
            color: "#fff",
            textDecoration: "none",
            fontSize: ".85rem",
            fontWeight: 800,
            boxShadow: "0 6px 18px rgba(16,185,129,.35)",
          }}
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
