"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SiteNav } from "@/components/site-nav";
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
      <main style={{ minHeight: "calc(100vh - 62px)", padding: "28px 16px 80px", background: "#f8fafc" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#2970ff,#1a52b8)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(41,112,255,.3)" }}>
              <Ticket size={22} />
            </div>
            <h1 style={{ fontFamily: "'Fredoka'", fontSize: "1.6rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Kupon & Voucher</h1>
          </div>
          <p style={{ fontSize: ".88rem", color: "#64748b", marginBottom: 22, fontWeight: 500 }}>
            Klaim voucher di sini, auto-tersedia di checkout saat kamu belanja.
          </p>

          {/* Top tabs */}
          <div style={{ display: "flex", gap: 4, background: "#eef2ff", padding: 4, borderRadius: 12, marginBottom: 16 }}>
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
    <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8", fontSize: ".9rem", fontWeight: 500, background: "#fff", borderRadius: 16, border: "1px dashed #e2e8ff" }}>
      {text}
    </div>
  );
}
