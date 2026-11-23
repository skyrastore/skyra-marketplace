"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase, fmtIDR, type Game, type Product } from "@/lib/supabase";

const LOGO_URL = "https://lh3.googleusercontent.com/d/1HmBuyY8D5ccBUUAP-GsCuiTNxpxsaDsu";

type InputField = { key: string; label: string; type: string; placeholder?: string; required?: boolean };

export default function GameDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [payment, setPayment] = useState("QRIS");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: g } = await supabase
        .from("games")
        .select("*")
        .eq("slug", params.slug)
        .eq("is_active", true)
        .single();
      if (g) {
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
  }, [params.slug]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80, color: "#fff" }}>⏳ Loading...</div>;
  }
  if (!game) {
    return (
      <div style={{ textAlign: "center", padding: 80, color: "#fff" }}>
        <h2 style={{ fontFamily: "var(--font-fredoka)", marginBottom: 16 }}>Game tidak ditemukan</h2>
        <Link href="/" style={{ color: "#7bc3ff" }}>← Kembali ke beranda</Link>
      </div>
    );
  }

  const inputFields: InputField[] = Array.isArray(game.instructions as unknown)
    ? []
    : ((game as unknown as { input_fields?: InputField[] }).input_fields || []);

  const handleCheckout = () => {
    if (!selected) {
      alert("Pilih paket dulu");
      return;
    }
    for (const f of inputFields) {
      if (f.required && !formData[f.key]) {
        alert(`Isi field ${f.label}`);
        return;
      }
    }
    alert(
      `Order siap dikirim ke admin:\n\n` +
        `Game: ${game.name}\n` +
        `Paket: ${selected.name}\n` +
        `Harga: ${fmtIDR(selected.price_idr)}\n` +
        `Payment: ${payment}\n\n` +
        `Data:\n` +
        Object.entries(formData)
          .map(([k, v]) => `  ${k}: ${v}`)
          .join("\n") +
        `\n\n(Checkout + Midtrans integration coming soon!)`
    );
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
        {/* Game Hero */}
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "center",
            padding: 24,
            background: "rgba(9,20,55,.92)",
            border: "1.5px solid rgba(123,195,255,.3)",
            borderRadius: 20,
            marginBottom: 28,
            color: "#fff",
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
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: ".7rem", fontWeight: 900, letterSpacing: ".3em", opacity: 0.75, marginBottom: 6 }}>
              {game.category.toUpperCase()}
            </div>
            <h1
              style={{
                fontFamily: "var(--font-fredoka)",
                fontSize: "clamp(1.5rem,3vw,2.2rem)",
                fontWeight: 700,
                lineHeight: 1.1,
                marginBottom: 4,
              }}
            >
              {game.name}
            </h1>
            <div style={{ fontSize: ".85rem", opacity: 0.85, fontWeight: 600 }}>{game.publisher || "—"}</div>
          </div>
        </div>

        {game.instructions && (
          <div
            style={{
              padding: "14px 18px",
              background: "rgba(245,158,11,.14)",
              border: "1.5px solid rgba(245,158,11,.4)",
              borderRadius: 12,
              color: "#fff",
              fontSize: ".82rem",
              fontWeight: 600,
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            💡 {game.instructions}
          </div>
        )}

        <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr 340px" }}>
          <div>
            {/* Step 1: Input */}
            {inputFields.length > 0 && (
              <div
                style={{
                  padding: 22,
                  background: "rgba(9,20,55,.92)",
                  border: "1.5px solid rgba(123,195,255,.3)",
                  borderRadius: 16,
                  marginBottom: 20,
                  color: "#fff",
                  boxShadow: "0 6px 24px rgba(0,0,0,.35)",
                }}
              >
                <h3 style={{ fontFamily: "var(--font-fredoka)", fontWeight: 600, fontSize: "1.1rem", marginBottom: 14 }}>
                  1. Masukkan Data Akun
                </h3>
                <div style={{ display: "grid", gap: 12 }}>
                  {inputFields.map((f) => (
                    <div key={f.key}>
                      <label
                        style={{ display: "block", fontSize: ".78rem", fontWeight: 700, marginBottom: 6, color: "rgba(255,255,255,.9)" }}
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
                          background: "rgba(5,12,36,.9)",
                          border: "1.5px solid rgba(123,195,255,.3)",
                          color: "#fff",
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
                background: "rgba(9,20,55,.92)",
                border: "1.5px solid rgba(123,195,255,.3)",
                borderRadius: 16,
                marginBottom: 20,
                color: "#fff",
                boxShadow: "0 6px 24px rgba(0,0,0,.35)",
              }}
            >
              <h3 style={{ fontFamily: "var(--font-fredoka)", fontWeight: 600, fontSize: "1.1rem", marginBottom: 14 }}>
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
                        background: selected?.id === p.id ? "rgba(34,114,220,.55)" : "rgba(5,12,36,.88)",
                        color: "#fff",
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
                      <div style={{ fontFamily: "var(--font-fredoka)", fontSize: "1rem", fontWeight: 700, marginBottom: 4 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: ".92rem", fontWeight: 800, color: "#7bc3ff" }}>{fmtIDR(p.price_idr)}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3: Payment */}
            <div
              style={{
                padding: 22,
                background: "rgba(9,20,55,.92)",
                border: "1.5px solid rgba(123,195,255,.3)",
                borderRadius: 16,
                color: "#fff",
                boxShadow: "0 6px 24px rgba(0,0,0,.35)",
              }}
            >
              <h3 style={{ fontFamily: "var(--font-fredoka)", fontWeight: 600, fontSize: "1.1rem", marginBottom: 14 }}>
                {inputFields.length > 0 ? "3." : "2."} Metode Pembayaran
              </h3>
              <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))" }}>
                {["QRIS", "PayPal", "Wise"].map((pm) => (
                  <button
                    key={pm}
                    onClick={() => setPayment(pm)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: payment === pm ? "2px solid #7bc3ff" : "1.5px solid rgba(123,195,255,.25)",
                      background: payment === pm ? "rgba(34,114,220,.55)" : "rgba(5,12,36,.88)",
                      color: "#fff",
                      fontFamily: "inherit",
                      fontWeight: 800,
                      fontSize: ".88rem",
                      cursor: "pointer",
                    }}
                  >
                    {pm === "QRIS" ? "📱" : pm === "PayPal" ? "💳" : "🏦"} {pm}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Summary (sticky) */}
          <div
            style={{
              position: "sticky",
              top: 90,
              alignSelf: "start",
              padding: 22,
              background: "rgba(5,12,36,.96)",
              border: "1.5px solid rgba(123,195,255,.35)",
              borderRadius: 16,
              color: "#fff",
              boxShadow: "0 8px 30px rgba(0,0,0,.45)",
            }}
          >
            <h3 style={{ fontFamily: "var(--font-fredoka)", fontWeight: 600, fontSize: "1rem", marginBottom: 14 }}>
              📋 Ringkasan Order
            </h3>
            {[
              ["Game", game.name.split(":")[0]],
              ["Paket", selected?.name || "—"],
              ["Payment", payment],
              ["Harga", selected ? fmtIDR(selected.price_idr) : "Rp 0"],
              ["Admin", "Rp 0"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: ".86rem", fontWeight: 700, color: "rgba(255,255,255,.85)" }}>
                <span>{k}</span>
                <span style={{ color: "#fff", fontWeight: 800 }}>{v}</span>
              </div>
            ))}
            <div
              style={{
                borderTop: "1.5px solid rgba(255,255,255,.2)",
                marginTop: 8,
                paddingTop: 14,
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 800,
                fontSize: "1.1rem",
              }}
            >
              <span>TOTAL</span>
              <span style={{ color: "#7bc3ff", fontSize: "1.3rem" }}>{selected ? fmtIDR(selected.price_idr) : "Rp 0"}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={!selected}
              style={{
                marginTop: 16,
                width: "100%",
                padding: 14,
                border: 0,
                borderRadius: 12,
                background: selected
                  ? "linear-gradient(135deg,#1452b4,#2272dc,#4a8dff)"
                  : "rgba(255,255,255,.15)",
                color: "#fff",
                fontFamily: "var(--font-fredoka)",
                fontSize: ".95rem",
                fontWeight: 600,
                cursor: selected ? "pointer" : "not-allowed",
                letterSpacing: ".3px",
                boxShadow: selected ? "0 6px 24px rgba(34,114,220,.5)" : "none",
                opacity: selected ? 1 : 0.5,
                transition: ".2s",
              }}
            >
              💳 Bayar Sekarang
            </button>
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 8,
                background: "rgba(16,185,129,.14)",
                border: "1.5px solid rgba(16,185,129,.3)",
                fontSize: ".7rem",
                color: "#6ee7b7",
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              🔒 Pembayaran aman & terenkripsi.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
