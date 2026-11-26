"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { toast } from "sonner";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, Clock, RefreshCw } from "lucide-react";

const SNAP_JS_URL = (process.env.NEXT_PUBLIC_MIDTRANS_ENV || "sandbox") === "production"
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";

export const runtime = "edge";

type Tx = {
  id: string;
  tx_type: "topup" | "spend" | "refund" | "admin_add" | "admin_sub" | "bonus";
  amount_idr: number;
  balance_after: number;
  description: string | null;
  created_at: string;
};

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks: { onSuccess?: () => void; onPending?: () => void; onError?: (e: unknown) => void; onClose?: () => void }) => void;
    };
  }
}

const TOPUP_OPTIONS = [10_000, 25_000, 50_000, 100_000, 200_000, 500_000];
const CUSTOM_MIN = 10_000;
const CUSTOM_MAX = 10_000_000;
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

export default function SaldoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupLoading, setTopupLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [customAmt, setCustomAmt] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/saldo");
  }, [authLoading, user, router]);

  const fetchWallet = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/wallet", {
      headers: { Authorization: `Bearer ${session?.access_token ?? ""}` },
    });
    const data = await res.json();
    setBalance(data.balance_idr ?? 0);
    setHistory(data.history ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  const startTopup = async (amount: number) => {
    setTopupLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/wallet/topup", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    setTopupLoading(false);
    if (!res.ok || !data.token) {
      toast.error("Gagal memulai topup", { description: data.error || "Coba lagi dalam beberapa saat." });
      return;
    }

    if (!window.snap) {
      toast.error("Payment belum siap", { description: "Refresh halaman & coba lagi." });
      return;
    }

    setSheetOpen(false);
    window.snap.pay(data.token, {
      onSuccess: () => { toast.success("Pembayaran berhasil!", { description: "Saldo akan masuk dalam beberapa detik" }); setTimeout(fetchWallet, 1500); },
      onPending: () => { toast.message("Pembayaran pending", { description: "Tunggu konfirmasi, saldo masuk otomatis saat berhasil" }); },
      onError: () => { toast.error("Pembayaran gagal"); },
      onClose: () => { fetchWallet(); },
    });
  };

  if (authLoading || !user) return null;

  return (
    <>
      {MIDTRANS_CLIENT_KEY && <Script src={SNAP_JS_URL} data-client-key={MIDTRANS_CLIENT_KEY} strategy="afterInteractive" />}
      <SiteNav />
      <main style={{ minHeight: "calc(100dvh - 62px)", padding: "28px 16px 80px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(16,185,129,.3)" }}>
              <Wallet size={22} />
            </div>
            <h1 style={{ fontFamily: "'Fredoka'", fontSize: "1.6rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Saldo Skyra</h1>
          </div>
          <p style={{ fontSize: ".88rem", color: "#64748b", marginBottom: 22, fontWeight: 500 }}>
            Topup saldo sekali, checkout lebih cepat tanpa bayar ulang.
          </p>

          {/* Balance card */}
          <div
            style={{
              background: "linear-gradient(135deg,#1a52b8,#2970ff)",
              color: "#fff",
              borderRadius: 18,
              padding: "26px 22px",
              marginBottom: 16,
              boxShadow: "0 15px 40px rgba(26,82,184,.3)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, position: "relative" }}>
              <div style={{ fontSize: ".78rem", opacity: .85, fontWeight: 600, letterSpacing: ".5px" }}>SALDO TERSEDIA</div>
              <button
                onClick={fetchWallet}
                aria-label="Refresh"
                style={{ background: "rgba(255,255,255,.15)", border: 0, borderRadius: 8, padding: 7, color: "#fff", cursor: "pointer", display: "flex" }}
              >
                <RefreshCw size={14} />
              </button>
            </div>
            <div style={{ fontFamily: "'Fredoka'", fontSize: "2.2rem", fontWeight: 700, lineHeight: 1, marginBottom: 20, position: "relative" }}>
              Rp {balance.toLocaleString("id-ID")}
            </div>
            <button
              onClick={() => setSheetOpen(true)}
              style={{
                background: "#fff",
                color: "#1a52b8",
                border: 0,
                padding: "11px 20px",
                borderRadius: 10,
                fontFamily: "inherit",
                fontSize: ".9rem",
                fontWeight: 800,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                position: "relative",
              }}
            >
              <Plus size={16} /> Topup Saldo
            </button>
          </div>

          {/* History */}
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ fontFamily: "'Fredoka'", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Riwayat Transaksi</h2>
            <span style={{ fontSize: ".72rem", color: "#94a3b8", fontWeight: 600 }}>({history.length} transaksi)</span>
          </div>

          {loading ? (
            <EmptyState text="Memuat riwayat..." />
          ) : history.length === 0 ? (
            <EmptyState text="Belum ada transaksi. Topup saldo pertama kamu!" />
          ) : (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8ff", overflow: "hidden" }}>
              {history.map((tx, i) => (
                <TxRow key={tx.id} tx={tx} isLast={i === history.length - 1} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Topup modal — centered on all viewports */}
      {sheetOpen && (
        <div
          onClick={() => setSheetOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,.65)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            backdropFilter: "blur(6px)",
            animation: "fadeIn .2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: "22px 22px 24px",
              width: "100%",
              maxWidth: 440,
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,.35)",
              animation: "popIn .25s cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontFamily: "'Fredoka'", fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Pilih Nominal Topup</h3>
                <p style={{ fontSize: ".78rem", color: "#64748b", fontWeight: 500, margin: 0 }}>
                  QRIS / E-Wallet / Bank · saldo masuk auto
                </p>
              </div>
              <button
                onClick={() => setSheetOpen(false)}
                aria-label="Tutup"
                style={{ background: "#f1f5f9", border: 0, width: 32, height: 32, borderRadius: 8, color: "#475569", cursor: "pointer", fontSize: "1.1rem", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {TOPUP_OPTIONS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => startTopup(amt)}
                  disabled={topupLoading}
                  style={{
                    padding: "14px 6px",
                    borderRadius: 11,
                    border: "1.5px solid #e2e8ff",
                    background: "#f8fafc",
                    color: "#0f172a",
                    fontFamily: "inherit",
                    fontSize: ".85rem",
                    fontWeight: 800,
                    cursor: topupLoading ? "wait" : "pointer",
                    transition: "all .15s",
                    lineHeight: 1.2,
                  }}
                >
                  Rp {(amt / 1000) >= 1000 ? `${amt / 1_000_000}jt` : `${amt / 1000}k`}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div style={{ marginTop: 16, padding: 14, background: "#f8fafc", borderRadius: 12, border: "1.5px dashed #cbd5e1" }}>
              <label style={{ fontSize: ".78rem", color: "#475569", fontWeight: 700, display: "block", marginBottom: 6 }}>
                Atau nominal custom (Rp {CUSTOM_MIN.toLocaleString("id-ID")} - Rp {CUSTOM_MAX.toLocaleString("id-ID")})
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#fff", border: "1.5px solid #e2e8ff", borderRadius: 10, padding: "0 12px" }}>
                  <span style={{ color: "#64748b", fontWeight: 700, fontSize: ".9rem" }}>Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="50000"
                    value={customAmt ? Number(customAmt).toLocaleString("id-ID") : ""}
                    onChange={(e) => setCustomAmt(e.target.value.replace(/[^0-9]/g, ""))}
                    style={{
                      flex: 1,
                      padding: "11px 8px",
                      border: 0,
                      background: "transparent",
                      fontFamily: "inherit",
                      fontSize: ".95rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      outline: "none",
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    const n = Number(customAmt);
                    if (!n || n < CUSTOM_MIN) return toast.error(`Minimal Rp ${CUSTOM_MIN.toLocaleString("id-ID")}`);
                    if (n > CUSTOM_MAX) return toast.error(`Maksimal Rp ${CUSTOM_MAX.toLocaleString("id-ID")}`);
                    startTopup(n);
                  }}
                  disabled={topupLoading || !customAmt}
                  style={{
                    padding: "0 20px",
                    borderRadius: 10,
                    border: 0,
                    background: customAmt ? "linear-gradient(135deg,#2970ff,#1a52b8)" : "#cbd5e1",
                    color: "#fff",
                    fontFamily: "inherit",
                    fontSize: ".85rem",
                    fontWeight: 800,
                    cursor: (!customAmt || topupLoading) ? "not-allowed" : "pointer",
                  }}
                >
                  Topup
                </button>
              </div>
            </div>

            {topupLoading && (
              <div style={{ textAlign: "center", marginTop: 14, fontSize: ".82rem", color: "#2970ff", fontWeight: 600 }}>Membuat transaksi…</div>
            )}
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes popIn { from { transform: scale(.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          `}</style>
        </div>
      )}
      <SiteFooter />
    </>
  );
}

function TxRow({ tx, isLast }: { tx: Tx; isLast: boolean }) {
  const isCredit = tx.amount_idr > 0;
  const Icon = isCredit ? ArrowDownRight : ArrowUpRight;
  const color = isCredit ? "#10b981" : "#ef4444";
  const labelMap: Record<Tx["tx_type"], string> = {
    topup: "Topup",
    spend: "Pembelian",
    refund: "Refund",
    admin_add: "Penambahan Admin",
    admin_sub: "Pengurangan Admin",
    bonus: "Bonus",
  };
  const dt = new Date(tx.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div style={{ display: "flex", padding: 14, gap: 12, alignItems: "center", borderBottom: isLast ? "none" : "1px solid #f1f5f9" }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: `${color}15`, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: ".88rem", fontWeight: 700, color: "#0f172a" }}>{labelMap[tx.tx_type]}</div>
        <div style={{ fontSize: ".74rem", color: "#64748b", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tx.description || "—"}
        </div>
        <div style={{ fontSize: ".68rem", color: "#94a3b8", fontWeight: 500, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={10} /> {dt}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: ".92rem", fontWeight: 800, color }}>
          {isCredit ? "+" : ""}Rp {Math.abs(tx.amount_idr).toLocaleString("id-ID")}
        </div>
        <div style={{ fontSize: ".7rem", color: "#94a3b8", fontWeight: 600 }}>
          Saldo: Rp {tx.balance_after.toLocaleString("id-ID")}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: ".9rem", fontWeight: 500, background: "#fff", borderRadius: 16, border: "1px dashed #e2e8ff" }}>
      {text}
    </div>
  );
}
