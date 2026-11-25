"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import { VoucherCard, type VoucherInfo } from "@/components/voucher-card";
import { Ticket } from "lucide-react";

export const runtime = "edge";

type ClaimRow = {
  voucher_code: string;
  claimed_at: string;
  used_at: string | null;
  voucher: VoucherInfo & { is_active: boolean };
};

type Tab = "available" | "mine";
type MineFilter = "active" | "used" | "expired";

export default function KuponPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("available");
  const [mineFilter, setMineFilter] = useState<MineFilter>("active");

  const [available, setAvailable] = useState<VoucherInfo[]>([]);
  const [mine, setMine] = useState<{ active: ClaimRow[]; used: ClaimRow[]; expired: ClaimRow[] }>({ active: [], used: [], expired: [] });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/kupon");
  }, [authLoading, user, router]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const headers = { Authorization: `Bearer ${session?.access_token ?? ""}` };

    const [avRes, miRes] = await Promise.all([
      fetch("/api/vouchers/available", { headers }).then((r) => r.json()),
      fetch("/api/vouchers/mine", { headers }).then((r) => r.json()),
    ]);

    setAvailable(avRes.vouchers ?? []);
    setMine({ active: miRes.active ?? [], used: miRes.used ?? [], expired: miRes.expired ?? [] });
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const claim = async (code: string) => {
    setClaiming(code);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch("/api/vouchers/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setClaiming(null);
    if (!res.ok) {
      const map: Record<string, string> = {
        already_claimed: "Voucher ini udah pernah kamu klaim",
        voucher_exhausted: "Voucher udah habis diklaim orang lain",
        voucher_expired: "Voucher udah kadaluwarsa",
      };
      toast.error(map[data.error] || "Gagal klaim voucher", { description: data.error });
      return;
    }
    toast.success("Voucher berhasil diklaim!", { description: `Code: ${code} — cek tab Milikku` });
    fetchAll();
  };

  if (authLoading || !user) return null;

  const mineCurrent = mine[mineFilter];

  return (
    <>
      <SiteNav />
      <main
        style={{
          minHeight: "calc(100vh - 62px)",
          padding: "0 0 80px",
          background: "linear-gradient(180deg,#eff6ff 0%,#f8fafc 180px,#f8fafc 100%)",
          position: "relative",
        }}
      >
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: 20, left: "10%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(168,85,247,.18),transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 60, right: "8%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(41,112,255,.18),transparent 70%)", filter: "blur(30px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 16px 0", position: "relative" }}>
          {/* Hero card */}
          <div
            style={{
              background: "linear-gradient(135deg,#1a52b8 0%,#2970ff 50%,#a855f7 100%)",
              color: "#fff",
              borderRadius: 20,
              padding: "26px 22px",
              marginBottom: 20,
              boxShadow: "0 18px 50px rgba(41,112,255,.4)",
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
                <Ticket size={26} />
              </div>
              <div>
                <h1 style={{ fontFamily: "'Fredoka'", fontSize: "1.5rem", fontWeight: 700, margin: 0, lineHeight: 1.1 }}>Kupon & Voucher</h1>
                <p style={{ fontSize: ".82rem", opacity: .92, margin: "4px 0 0", fontWeight: 500 }}>
                  Klaim, dan hemat saat checkout!
                </p>
              </div>
            </div>
          </div>

          {/* Top tabs */}
          <div style={{ display: "flex", gap: 4, background: "#fff", padding: 4, borderRadius: 12, marginBottom: 16, boxShadow: "0 4px 14px rgba(15,23,42,.08)" }}>
            <TabBtn active={tab === "available"} onClick={() => setTab("available")}>Tersedia ({available.length})</TabBtn>
            <TabBtn active={tab === "mine"} onClick={() => setTab("mine")}>Milikku ({mine.active.length + mine.used.length + mine.expired.length})</TabBtn>
          </div>

          {/* Sub filter chips (for Mine tab) */}
          {tab === "mine" && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <Chip active={mineFilter === "active"} onClick={() => setMineFilter("active")}>Siap pakai ({mine.active.length})</Chip>
              <Chip active={mineFilter === "used"} onClick={() => setMineFilter("used")}>Terpakai ({mine.used.length})</Chip>
              <Chip active={mineFilter === "expired"} onClick={() => setMineFilter("expired")}>Kedaluwarsa ({mine.expired.length})</Chip>
            </div>
          )}

          {/* Cards */}
          {loading ? (
            <EmptyState text="Memuat voucher..." />
          ) : tab === "available" ? (
            available.length === 0 ? (
              <EmptyState text="Belum ada voucher baru untuk diklaim. Cek berkala!" />
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {available.map((v) => (
                  <VoucherCard key={v.code} voucher={v} status="available" claiming={claiming === v.code} onClaim={() => claim(v.code)} />
                ))}
              </div>
            )
          ) : mineCurrent.length === 0 ? (
            <EmptyState
              text={
                mineFilter === "active" ? "Belum ada voucher yang kamu klaim." :
                mineFilter === "used" ? "Belum ada voucher yang kamu pakai." :
                "Ga ada voucher yang kadaluwarsa."
              }
            />
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {mineCurrent.map((c) => (
                <VoucherCard
                  key={c.voucher_code}
                  voucher={c.voucher}
                  status={mineFilter === "active" ? "claimed" : mineFilter === "used" ? "used" : "expired"}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "9px 14px",
        borderRadius: 9,
        border: 0,
        background: active ? "#fff" : "transparent",
        color: active ? "#0f172a" : "#64748b",
        fontFamily: "inherit",
        fontSize: ".85rem",
        fontWeight: 800,
        cursor: "pointer",
        boxShadow: active ? "0 2px 6px rgba(15,23,42,.08)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 999,
        border: active ? 0 : "1px solid #e2e8ff",
        background: active ? "linear-gradient(135deg,#2970ff,#1a52b8)" : "#fff",
        color: active ? "#fff" : "#475569",
        fontFamily: "inherit",
        fontSize: ".78rem",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
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
        <Ticket size={32} />
      </div>
      <div style={{ color: "#64748b", fontSize: ".92rem", fontWeight: 600, lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}
