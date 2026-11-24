"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase, fmtIDR, type Game, type Product } from "@/lib/supabase";

const LOGO_URL = "https://lh3.googleusercontent.com/d/1HmBuyY8D5ccBUUAP-GsCuiTNxpxsaDsu";
const SNAP_JS_URL =
  (process.env.NEXT_PUBLIC_MIDTRANS_ENV || "sandbox") === "production"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

type InputField = { key: string; label: string; type: string; placeholder?: string; required?: boolean };

// Snap.js is loaded from CDN — minimal typing so TS doesn't complain
type SnapWindow = Window & {
  snap?: {
    pay: (
      token: string,
      opts?: {
        onSuccess?: (result: unknown) => void;
        onPending?: (result: unknown) => void;
        onError?: (err: unknown) => void;
        onClose?: () => void;
      }
    ) => void;
  };
};

export default function GameDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherChecking, setVoucherChecking] = useState(false);
  const [voucherApplied, setVoucherApplied] = useState<{
    code: string;
    discount_type: string;
    discount_value: number;
    max_discount_idr: number | null;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const ADMIN_WA = "6285183346300";

  // ─── Load Midtrans Snap.js ───
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("midtrans-snap")) return;
    const s = document.createElement("script");
    s.id = "midtrans-snap";
    s.src = SNAP_JS_URL;
    s.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY);
    document.body.appendChild(s);
  }, []);

  const checkVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;
    setVoucherChecking(true);
    setVoucherApplied(null);
    try {
      const { data } = await supabase
        .from("vouchers")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();
      if (!data) {
        alert("Kode voucher tidak ditemukan atau sudah expired 😔");
        return;
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        alert("Voucher sudah expired");
        return;
      }
      if (data.max_uses && data.used_count >= data.max_uses) {
        alert("Voucher sudah habis terpakai");
        return;
      }
      if (!selected) {
        alert("Pilih paket dulu sebelum apply voucher");
        return;
      }
      if (selected.price_idr < data.min_purchase_idr) {
        alert(`Min belanja untuk voucher ini: ${fmtIDR(data.min_purchase_idr)}`);
        return;
      }
      setVoucherApplied({
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        max_discount_idr: data.max_discount_idr,
        message: data.description || "Voucher berhasil diterapkan",
      });
    } finally {
      setVoucherChecking(false);
    }
  };

  const discountAmount = (() => {
    if (!voucherApplied || !selected) return 0;
    if (voucherApplied.discount_type === "percentage") {
      const d = Math.floor((selected.price_idr * voucherApplied.discount_value) / 100);
      return voucherApplied.max_discount_idr ? Math.min(d, voucherApplied.max_discount_idr) : d;
    }
    return voucherApplied.discount_value;
  })();
  const finalPrice = selected ? Math.max(0, selected.price_idr - discountAmount) : 0;

  useEffect(() => {
    async function load() {
      const { data: g } = await supabase
        .from("games")
        .select("*")
        .eq("slug", params.slug)
        .eq("is_active", true)
        .single();
      if (g) {
        if ((g as Game).external_url) {
          window.location.href = (g as Game).external_url!;
          return;
        }
        const { data: p } = await supabase
          .from("products")
          .select("*")
          .eq("game_id", g.id)
          .eq("is_available", true)
          .order("price_idr");
        setGame(g as Game);
        setProducts((p || []) as Product[]);
      }
      setLoading(false);
    }
    load();
  }, [params.slug, router]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80, color: "#0f172a" }}>⏳ Loading...</div>;
  }
  if (!game) {
    return (
      <div style={{ textAlign: "center", padding: 80, color: "#0f172a" }}>
        <h2 style={{ fontFamily: "'Fredoka'", marginBottom: 16 }}>Game tidak ditemukan</h2>
        <Link href="/" style={{ color: "#2272dc" }}>← Kembali ke beranda</Link>
      </div>
    );
  }

  const inputFields: InputField[] = Array.isArray(game.instructions as unknown)
    ? []
    : ((game as unknown as { input_fields?: InputField[] }).input_fields || []);

  // ─── Build WA fallback message ───
  const buildWAMessage = () => {
    const g = game!;
    const dataLines = inputFields
      .map((f) => `• ${f.label}: ${formData[f.key] || "-"}`)
      .join("\n");
    return (
      `🛒 *ORDER SKYRA STORE*\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `🎮 Game: *${g.name}*\n` +
      `💎 Paket: *${selected?.name || "-"}*\n` +
      `💵 Harga: ${selected ? fmtIDR(selected.price_idr) : "-"}\n` +
      (voucherApplied ? `🎟️ Voucher: *${voucherApplied.code}* (-${fmtIDR(discountAmount)})\n` : "") +
      `💰 *TOTAL: ${fmtIDR(finalPrice)}*\n` +
      `📱 WA: ${phone}\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `*Data Akun:*\n${dataLines}\n` +
      (notes ? `━━━━━━━━━━━━━━━━━\n📝 Catatan: ${notes}\n` : "") +
      `━━━━━━━━━━━━━━━━━\n` +
      `Mohon konfirmasi total & info pembayaran ya kak 🙏`
    );
  };

  // ─── Validate order inputs ───
  const validateInputs = (): string | null => {
    if (!selected) return "Pilih paket dulu";
    if (!phone || phone.length < 9) return "Nomor WhatsApp wajib (min 9 digit)";
    for (const f of inputFields) {
      if (f.required && !formData[f.key]) return `Isi field ${f.label}`;
    }
    return null;
  };

  // ─── Primary checkout: Midtrans Snap ───
  const handlePayNow = async () => {
    const err = validateInputs();
    if (err) { alert(err); return; }
    if (paying) return;
    setPaying(true);

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameSlug: game!.slug,
          productId: selected!.id,
          phone,
          customData: formData,
          notes: notes || undefined,
          voucherCode: voucherApplied?.code || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.snapToken) {
        alert(`Gagal buat order: ${data.error || "unknown"}`);
        return;
      }

      const snap = (window as SnapWindow).snap;
      if (!snap) {
        alert("Payment module belum ter-load. Refresh halaman & coba lagi.");
        return;
      }

      snap.pay(data.snapToken, {
        onSuccess: () => {
          window.location.href = `/order/${data.orderCode}?status=success`;
        },
        onPending: () => {
          window.location.href = `/order/${data.orderCode}?status=pending`;
        },
        onError: (e) => {
          console.error("Snap error:", e);
          alert("Pembayaran gagal. Coba lagi atau pakai WhatsApp fallback.");
        },
        onClose: () => {
          // user closed popup — order tetap tersimpan sbg pending
        },
      });
    } catch (e) {
      console.error(e);
      alert("Error jaringan. Coba lagi ya.");
    } finally {
      setPaying(false);
    }
  };

  // ─── Fallback: WhatsApp manual ───
  const handleWhatsApp = () => {
    const err = validateInputs();
    if (err) { alert(err); return; }
    const url = `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(buildWAMessage())}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <img src={LOGO_URL} alt="Skyra" />
            <span className="brand">SKYRA STORE</span>
          </Link>
          <div style={{ marginLeft: "auto" }}>
            <Link href="/" className="nav-cta">
              ← Beranda
            </Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "20px auto 60px", padding: "0 24px", position: "relative", zIndex: 1 }}>
        {/* Game Hero + badges inline */}
        {(() => {
          const hasUniplayProduct = products.some((p) => p.supplier === "uniplay");
          const isInstant = hasUniplayProduct;
          return (
            <div
              style={{
                display: "flex",
                gap: 20,
                alignItems: "center",
                padding: 24,
                background: "#ffffff",
                border: "1px solid #e2e8ff",
                borderRadius: 20,
                marginBottom: 28,
                color: "#0f172a",
                boxShadow: "0 8px 30px rgba(0,0,0,.4)",
              }}
            >
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 18,
                  backgroundImage: game.image_url ? `url(${game.image_url})` : "linear-gradient(135deg,#1a52b8,#4a8dff)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.5rem",
                  flexShrink: 0,
                  boxShadow: "0 8px 24px rgba(0,0,0,.3)",
                }}
              >
                {!game.image_url && game.icon_emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Badges row ABOVE title */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      background: "linear-gradient(135deg,rgba(245,158,11,.22),rgba(245,158,11,.12))",
                      border: "1px solid rgba(245,158,11,.5)",
                      borderRadius: 99,
                      color: "#fbbf24",
                      fontSize: ".68rem",
                      fontWeight: 800,
                      letterSpacing: ".02em",
                    }}
                  >
                    ✓ Distributor Resmi
                  </span>
                  <span
                    style={{
                      padding: "4px 10px",
                      background: isInstant
                        ? "linear-gradient(135deg,rgba(16,185,129,.22),rgba(16,185,129,.12))"
                        : "linear-gradient(135deg,rgba(168,85,247,.22),rgba(168,85,247,.12))",
                      border: isInstant
                        ? "1px solid rgba(16,185,129,.5)"
                        : "1px solid rgba(168,85,247,.5)",
                      borderRadius: 99,
                      color: isInstant ? "#6ee7b7" : "#c4b5fd",
                      fontSize: ".68rem",
                      fontWeight: 800,
                      letterSpacing: ".02em",
                    }}
                  >
                    {isInstant ? "⚡ Isi Ulang Instan" : "⏱ Proses 0-120 menit"}
                  </span>
                  <span
                    style={{
                      padding: "4px 10px",
                      background: "linear-gradient(135deg,rgba(123,195,255,.22),rgba(123,195,255,.12))",
                      border: "1px solid rgba(123,195,255,.5)",
                      borderRadius: 99,
                      color: "#2272dc",
                      fontSize: ".68rem",
                      fontWeight: 800,
                      letterSpacing: ".02em",
                    }}
                  >
                    🔒 Pembayaran Aman
                  </span>
                </div>
                <h1
                  style={{
                    fontFamily: "'Fredoka'",
                    fontSize: "clamp(1.4rem,2.6vw,2rem)",
                    fontWeight: 700,
                    lineHeight: 1.1,
                    marginBottom: 4,
                  }}
                >
                  {game.name}
                </h1>
                <div style={{ fontSize: ".82rem", opacity: 0.8, fontWeight: 600 }}>{game.publisher || "—"}</div>
              </div>
            </div>
          );
        })()}

        {/* Only show instructions if NOT just a website URL (sync sets "Website: ..." which is noise) */}
        {game.instructions && !/^(website:|https?:\/\/)/i.test(game.instructions.trim()) && (
          <div
            style={{
              padding: "14px 18px",
              background: "rgba(245,158,11,.14)",
              border: "1.5px solid rgba(245,158,11,.4)",
              borderRadius: 12,
              color: "#0f172a",
              fontSize: ".82rem",
              fontWeight: 600,
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            💡 {game.instructions}
          </div>
        )}

        <div style={{ display: "grid", gap: 20 }}>
          <div>
            {/* Step 1: Input */}
            {inputFields.length > 0 && (
              <div
                style={{
                  padding: 22,
                  background: "#ffffff",
                  border: "1px solid #e2e8ff",
                  borderRadius: 16,
                  marginBottom: 20,
                  color: "#0f172a",
                  boxShadow: "0 6px 24px rgba(0,0,0,.35)",
                }}
              >
                <h3 style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: "1.1rem", marginBottom: 14 }}>
                  1. Masukkan Data Akun
                </h3>
                <div style={{ display: "grid", gap: 12 }}>
                  {inputFields.map((f) => (
                    <div key={f.key}>
                      <label
                        style={{ display: "block", fontSize: ".78rem", fontWeight: 700, marginBottom: 6, color: "#334155" }}
                      >
                        {f.label} {f.required && <span style={{ color: "#fca5a5" }}>*</span>}
                      </label>
                      <input
                        type={f.type || "text"}
                        placeholder={f.placeholder || ""}
                        value={formData[f.key] || ""}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: 10,
                          background: "#f8fafc",
                          border: "1px solid #e2e8ff",
                          color: "#0f172a",
                          fontFamily: "inherit",
                          fontSize: ".88rem",
                          fontWeight: 600,
                          outline: "none",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Pick denom */}
            <div
              style={{
                padding: 22,
                background: "#ffffff",
                border: "1px solid #e2e8ff",
                borderRadius: 16,
                marginBottom: 20,
                color: "#0f172a",
                boxShadow: "0 6px 24px rgba(0,0,0,.35)",
              }}
            >
              <h3 style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: "1.1rem", marginBottom: 14 }}>
                {inputFields.length > 0 ? "2." : "1."} Pilih Paket
              </h3>
              {products.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, opacity: 0.7, fontSize: ".85rem" }}>
                  Belum ada paket tersedia
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))",
                  }}
                >
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelected(p)}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        border: selected?.id === p.id ? "2px solid #7bc3ff" : "1.5px solid rgba(123,195,255,.25)",
                        background: selected?.id === p.id ? "#dbeafe" : "#f8fafc",
                        color: "#0f172a",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "center",
                        transition: ".2s",
                        boxShadow: selected?.id === p.id ? "0 0 0 3px rgba(123,195,255,.2)" : "none",
                        position: "relative",
                      }}
                    >
                      {p.is_hot && (
                        <span
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            background: "linear-gradient(135deg,#ef4444,#f59e0b)",
                            color: "#fff",
                            fontSize: ".55rem",
                            fontWeight: 900,
                            padding: "3px 7px",
                            borderRadius: 99,
                          }}
                        >
                          🔥 HOT
                        </span>
                      )}
                      <div style={{ fontFamily: "'Fredoka'", fontSize: "1rem", fontWeight: 700, marginBottom: 4 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: ".92rem", fontWeight: 800, color: "#2272dc" }}>{fmtIDR(p.price_idr)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Contact / Phone */}
            <div
              style={{
                padding: 22,
                marginTop: 0,
                background: "#ffffff",
                border: "1.5px solid rgba(236,72,153,.35)",
                borderRadius: 16,
                color: "#0f172a",
                boxShadow: "0 6px 24px rgba(0,0,0,.35)",
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: "1.1rem", marginBottom: 6 }}>
                {inputFields.length > 0 ? "3." : "2."} 📱 Nomor WhatsApp
              </h3>
              <div style={{ fontSize: ".78rem", color: "#64748b", marginBottom: 12, fontWeight: 600 }}>
                Wajib. Buat notifikasi + kontak admin kalau ada pending.
              </div>
              <input
                type="tel"
                placeholder="08123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "#f8fafc",
                  border: "1.5px solid rgba(236,72,153,.4)",
                  color: "#0f172a",
                  fontFamily: "inherit",
                  fontSize: ".95rem",
                  fontWeight: 700,
                  outline: "none",
                  letterSpacing: ".5px",
                }}
              />
            </div>

            {/* Voucher Code */}
            <div
              style={{
                padding: 22,
                background: "#ffffff",
                border: "1.5px solid rgba(168,85,247,.35)",
                borderRadius: 16,
                color: "#0f172a",
                boxShadow: "0 6px 24px rgba(0,0,0,.35)",
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: "1.1rem", marginBottom: 6 }}>
                🎟️ Kode Voucher <span style={{ fontSize: ".7rem", opacity: .7, fontFamily: "inherit" }}>(opsional)</span>
              </h3>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="Masukkan kode voucher"
                  value={voucherCode}
                  onChange={(e) => {
                    setVoucherCode(e.target.value.toUpperCase());
                    if (voucherApplied) setVoucherApplied(null);
                  }}
                  disabled={!!voucherApplied}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#f8fafc",
                    border: "1.5px solid rgba(168,85,247,.35)",
                    color: "#0f172a",
                    fontFamily: "inherit",
                    fontSize: ".9rem",
                    fontWeight: 700,
                    outline: "none",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                />
                {voucherApplied ? (
                  <button
                    onClick={() => { setVoucherApplied(null); setVoucherCode(""); }}
                    style={{
                      padding: "0 18px",
                      borderRadius: 10,
                      border: 0,
                      background: "#ef4444",
                      color: "#fff",
                      fontFamily: "inherit",
                      fontWeight: 800,
                      fontSize: ".85rem",
                      cursor: "pointer",
                    }}
                  >
                    ✕ Batal
                  </button>
                ) : (
                  <button
                    onClick={checkVoucher}
                    disabled={voucherChecking || !voucherCode.trim()}
                    style={{
                      padding: "0 22px",
                      borderRadius: 10,
                      border: 0,
                      background: voucherCode.trim()
                        ? "linear-gradient(135deg,#a855f7,#ec4899)"
                        : "#e2e8ff",
                      color: voucherCode.trim() ? "#fff" : "#64748b",
                      fontFamily: "inherit",
                      fontWeight: 800,
                      fontSize: ".9rem",
                      cursor: voucherCode.trim() ? "pointer" : "not-allowed",
                      opacity: voucherCode.trim() ? 1 : 0.5,
                    }}
                  >
                    {voucherChecking ? "..." : "CEK"}
                  </button>
                )}
              </div>
              {voucherApplied && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "rgba(16,185,129,.2)",
                    border: "1.5px solid rgba(16,185,129,.4)",
                    fontSize: ".78rem",
                    color: "#6ee7b7",
                    fontWeight: 700,
                  }}
                >
                  ✅ {voucherApplied.message} — hemat {fmtIDR(discountAmount)}
                </div>
              )}
            </div>

            {/* Order Notes */}
            <div
              style={{
                padding: 22,
                background: "#ffffff",
                border: "1px solid #e2e8ff",
                borderRadius: 16,
                color: "#0f172a",
                boxShadow: "0 6px 24px rgba(0,0,0,.35)",
              }}
            >
              <h3 style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: "1.1rem", marginBottom: 6 }}>
                📝 Catatan Order <span style={{ fontSize: ".7rem", opacity: .7, fontFamily: "inherit" }}>(opsional)</span>
              </h3>
              <div style={{ fontSize: ".75rem", color: "#64748b", marginBottom: 10, fontWeight: 600 }}>
                Contoh: proses malam ya, hati2 jangan ganti password, dsb.
              </div>
              <textarea
                placeholder="Tulis catatan untuk admin..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={300}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "#f8fafc",
                  border: "1px solid #e2e8ff",
                  color: "#0f172a",
                  fontFamily: "inherit",
                  fontSize: ".88rem",
                  fontWeight: 600,
                  outline: "none",
                  resize: "vertical",
                  minHeight: 70,
                }}
              />
              <div style={{ fontSize: ".68rem", color: "#94a3b8", marginTop: 4, textAlign: "right" }}>
                {notes.length}/300
              </div>
            </div>
          </div>

          {/* Summary: appear after selected + phone valid */}
          {selected && phone.length >= 9 && (
            <div
              style={{
                padding: 22,
                background: "#ffffff",
                border: "1px solid #c7d4f0",
                borderRadius: 16,
                color: "#0f172a",
                boxShadow: "0 8px 30px rgba(0,0,0,.45)",
                animation: "fadeInUp .35s ease",
              }}
            >
              <h3 style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: "1rem", marginBottom: 14 }}>
                📋 Ringkasan Order
              </h3>
              {[
                ["Game", game.name.split(":")[0]],
                ["Paket", selected?.name || "—"],
                ["Harga", selected ? fmtIDR(selected.price_idr) : "Rp 0"],
                ...(voucherApplied
                  ? ([[`Voucher (${voucherApplied.code})`, `-${fmtIDR(discountAmount)}`]] as [string, string][])
                  : ([] as [string, string][])),
                ["Admin fee", "Rp 0"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: ".86rem", fontWeight: 700, color: "#334155" }}>
                  <span>{k}</span>
                  <span style={{ color: voucherApplied && k.startsWith("Voucher") ? "#10b981" : "#fff", fontWeight: 800 }}>{v}</span>
                </div>
              ))}
              <div
                style={{
                  borderTop: "1px solid #e2e8ff",
                  marginTop: 8,
                  paddingTop: 14,
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                }}
              >
                <span>TOTAL</span>
                <span style={{ color: "#2272dc", fontSize: "1.3rem" }}>{fmtIDR(finalPrice)}</span>
              </div>

              {/* Primary: Midtrans Snap */}
              <button
                onClick={handlePayNow}
                disabled={paying || !selected}
                style={{
                  marginTop: 16,
                  width: "100%",
                  padding: 14,
                  border: 0,
                  borderRadius: 12,
                  background: paying
                    ? "#e2e8ff"
                    : "linear-gradient(135deg,#1452b4,#2272dc,#4a8dff)",
                  color: paying ? "#64748b" : "#fff",
                  fontFamily: "'Fredoka'",
                  fontSize: ".98rem",
                  fontWeight: 600,
                  cursor: paying ? "wait" : "pointer",
                  letterSpacing: ".3px",
                  boxShadow: paying ? "none" : "0 6px 24px rgba(34,114,220,.5)",
                  transition: ".2s",
                }}
              >
                {paying ? "⏳ Memproses…" : "💳 Bayar Sekarang"}
              </button>

              {/* Secondary: WA fallback */}
              <button
                onClick={handleWhatsApp}
                style={{
                  marginTop: 10,
                  width: "100%",
                  padding: 11,
                  border: "1.5px solid rgba(37,211,102,.5)",
                  borderRadius: 12,
                  background: "rgba(37,211,102,.1)",
                  color: "#86efac",
                  fontFamily: "'Fredoka'",
                  fontSize: ".88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: ".2s",
                }}
              >
                💬 Atau pesan via WhatsApp
              </button>

              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(123,195,255,.12)",
                  border: "1px solid #e2e8ff",
                  fontSize: ".72rem",
                  color: "#334155",
                  fontWeight: 600,
                  lineHeight: 1.45,
                }}
              >
                💡 Klik <b>Bayar Sekarang</b> → pilih QRIS / E-Wallet / Bank Transfer / CC di popup. Otomatis diproses setelah bayar.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
