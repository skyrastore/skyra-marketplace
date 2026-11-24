"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase, fmtIDR, type Game, type Product } from "@/lib/supabase";
import { CATEGORY_ICON_URLS } from "@/lib/categoryIcons";
import { toast } from "sonner";
import {
  Gift, Calendar, CalendarDays, Moon, Star, Trophy, CreditCard, Package, Gem,
  CheckCircle2, Zap, Lock, Clock, Phone, Ticket, Pencil, ClipboardList,
  MessageCircle, Flame, ArrowLeft, Minus, Plus, Lightbulb, type LucideIcon,
} from "lucide-react";

const LOGO_URL = "https://lh3.googleusercontent.com/d/1HmBuyY8D5ccBUUAP-GsCuiTNxpxsaDsu";
const SNAP_JS_URL =
  (process.env.NEXT_PUBLIC_MIDTRANS_ENV || "sandbox") === "production"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

type InputField = { key: string; label: string; type: string; placeholder?: string; required?: boolean };

// ─────────────────────────────────────────────
// Product category classifier (name-based)
// Groups denoms into user-friendly tabs so long lists aren't a wall of text.
// ─────────────────────────────────────────────
function categorizeProduct(name: string): { key: string; label: string; Icon: LucideIcon } {
  const n = name.toLowerCase();
  if (/first\s*(recharge|topup)|1st\s*topup|2x\s*diamond/.test(n)) return { key: "first", label: "First Recharge", Icon: Gift };
  if (/weekly.*(pass|diamond)|elite.*pack/.test(n)) return { key: "weekly", label: "Weekly Pass", Icon: Calendar };
  if (/monthly.*(pass|bundle|epic|ticket|card)/.test(n)) return { key: "monthly", label: "Monthly Pass", Icon: CalendarDays };
  if (/twilight/.test(n)) return { key: "twilight", label: "Twilight Pass", Icon: Moon };
  if (/starlight/.test(n)) return { key: "starlight", label: "Starlight", Icon: Star };
  if (/battle.*pass|season.*pass|royale.*pass|elite.*pass/.test(n)) return { key: "season", label: "Season Pass", Icon: Trophy };
  if (/membership|member\b|m-card/.test(n)) return { key: "member", label: "Membership", Icon: CreditCard };
  if (/bundle|pack|gift|voucher.*(bundle|special)/.test(n)) return { key: "bundle", label: "Bundle", Icon: Gift };
  if (/sub\s*package|package|paket/.test(n)) return { key: "paket", label: "Paket", Icon: Package };
  // Default: regular topup currency (Diamonds, UC, VP, Gold, etc.)
  return { key: "topup", label: "Top Up", Icon: Gem };
}

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

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
        toast.error("Kode voucher tidak ditemukan", { description: "Cek ulang code atau mungkin sudah expired." });
        return;
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error("Voucher sudah expired");
        return;
      }
      if (data.max_uses && data.used_count >= data.max_uses) {
        toast.error("Voucher sudah habis terpakai");
        return;
      }
      if (!selected) {
        toast.warning("Pilih paket dulu sebelum apply voucher");
        return;
      }
      if (selected.price_idr < data.min_purchase_idr) {
        toast.error(`Min belanja untuk voucher ini`, { description: fmtIDR(data.min_purchase_idr) });
        return;
      }
      toast.success(`Voucher ${data.code} diterapkan!`, { description: data.description });
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

  // Qty hanya aktif buat manual products — UniPlay fulfill satu-per-order
  const isManualProduct = selected?.supplier === "manual";
  const effectiveQty = isManualProduct ? qty : 1;
  const subtotal = selected ? selected.price_idr * effectiveQty : 0;

  const discountAmount = (() => {
    if (!voucherApplied || !subtotal) return 0;
    if (voucherApplied.discount_type === "percentage") {
      const d = Math.floor((subtotal * voucherApplied.discount_value) / 100);
      return voucherApplied.max_discount_idr ? Math.min(d, voucherApplied.max_discount_idr) : d;
    }
    return voucherApplied.discount_value;
  })();
  const finalPrice = Math.max(0, subtotal - discountAmount);

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
    return <div style={{ textAlign: "center", padding: 80, color: "#0f172a", display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}><Clock size={18} /> Loading...</div>;
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
      (isManualProduct && qty > 1 ? `🔢 Qty: ${qty}×\n` : "") +
      `💵 Subtotal: ${fmtIDR(subtotal)}\n` +
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
    if (err) { toast.warning(err); return; }
    if (paying) return;
    setPaying(true);

    const loadingToast = toast.loading("Membuat order…");
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
          qty: effectiveQty,
        }),
      });

      const data = await res.json();
      toast.dismiss(loadingToast);

      if (!res.ok || !data.snapToken) {
        toast.error("Gagal buat order", { description: data.error || "Coba lagi dalam beberapa saat." });
        return;
      }

      const snap = (window as SnapWindow).snap;
      if (!snap) {
        toast.error("Payment belum siap", { description: "Refresh halaman & coba lagi." });
        return;
      }

      snap.pay(data.snapToken, {
        onSuccess: () => {
          toast.success("Pembayaran berhasil!");
          window.location.href = `/order/${data.orderCode}?status=success`;
        },
        onPending: () => {
          toast.info("Pembayaran pending — tunggu konfirmasi");
          window.location.href = `/order/${data.orderCode}?status=pending`;
        },
        onError: (e) => {
          console.error("Snap error:", e);
          toast.error("Pembayaran gagal", { description: "Coba lagi atau pakai WhatsApp fallback." });
        },
        onClose: () => {
          // user closed popup — order tetap tersimpan sbg pending
        },
      });
    } catch (e) {
      console.error(e);
      toast.dismiss(loadingToast);
      toast.error("Error jaringan", { description: "Cek koneksi & coba lagi." });
    } finally {
      setPaying(false);
    }
  };

  // ─── Fallback: WhatsApp manual ───
  const handleWhatsApp = () => {
    const err = validateInputs();
    if (err) { toast.warning(err); return; }
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
                boxShadow: "0 12px 36px rgba(15,23,42,.22)",
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
                {/* Badges row ABOVE title — all unified blue */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {[
                    { Icon: CheckCircle2, label: "Distributor Resmi" },
                    { Icon: isInstant ? Zap : Clock, label: isInstant ? "Isi Ulang Instan" : "Proses 0-120 menit" },
                    { Icon: Lock, label: "Pembayaran Aman" },
                  ].map((b, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "4px 10px",
                        background: "linear-gradient(135deg,rgba(123,195,255,.22),rgba(123,195,255,.12))",
                        border: "1px solid rgba(123,195,255,.5)",
                        borderRadius: 99,
                        color: "#2272dc",
                        fontSize: ".68rem",
                        fontWeight: 800,
                        letterSpacing: ".02em",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <b.Icon size={12} strokeWidth={2.5} />
                      {b.label}
                    </span>
                  ))}
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
            <Lightbulb size={14} style={{ display: "inline", verticalAlign: "-3px", marginRight: 6 }} />{game.instructions}
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
                  boxShadow: "0 10px 30px rgba(15,23,42,.18)",
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

            {/* Step 2: Pick denom — with category filter */}
            {(() => {
              // Compute categories present in this game's products
              const cats = new Map<string, { label: string; Icon: LucideIcon; count: number }>();
              for (const p of products) {
                const c = categorizeProduct(p.name);
                const cur = cats.get(c.key);
                if (cur) cur.count++;
                else cats.set(c.key, { label: c.label, Icon: c.Icon, count: 1 });
              }
              const catList = Array.from(cats.entries()).map(([key, v]) => ({ key, ...v }));
              const activeCat = selectedCategory ?? catList[0]?.key ?? null;
              const filtered = activeCat
                ? products.filter((p) => categorizeProduct(p.name).key === activeCat)
                : products;

              return (
                <div
                  style={{
                    padding: 22,
                    background: "#ffffff",
                    border: "1px solid #e2e8ff",
                    borderRadius: 16,
                    marginBottom: 20,
                    color: "#0f172a",
                    boxShadow: "0 10px 30px rgba(15,23,42,.18)",
                  }}
                >
                  <h3 style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: "1.1rem", marginBottom: 14 }}>
                    {inputFields.length > 0 ? "2." : "1."} Pilih Paket
                  </h3>

                  {/* Category filter pills — only show if 2+ categories */}
                  {catList.length > 1 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 16,
                        paddingBottom: 14,
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      {catList.map((c) => {
                        const on = c.key === activeCat;
                        const imgUrl = CATEGORY_ICON_URLS[c.key];
                        return (
                          <button
                            key={c.key}
                            onClick={() => { setSelectedCategory(c.key); setSelected(null); }}
                            style={{
                              padding: "8px 14px",
                              borderRadius: 99,
                              border: on ? "1.5px solid #f59e0b" : "1px solid #e2e8ff",
                              background: on
                                ? "linear-gradient(135deg,rgba(245,158,11,.14),rgba(245,158,11,.06))"
                                : "#fff",
                              color: on ? "#b45309" : "#334155",
                              fontFamily: "inherit",
                              fontSize: ".82rem",
                              fontWeight: 800,
                              cursor: "pointer",
                              transition: ".15s",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            {imgUrl ? (
                              <img src={imgUrl} alt="" style={{ width: 20, height: 20, objectFit: "contain", borderRadius: 4 }} />
                            ) : (
                              <c.Icon size={16} strokeWidth={2.2} />
                            )}
                            <span>{c.label}</span>
                            <span style={{ opacity: .5, fontSize: ".7rem" }}>({c.count})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 20, opacity: 0.7, fontSize: ".85rem" }}>
                      Belum ada paket tersedia
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "grid",
                        gap: 10,
                        gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))",
                      }}
                    >
                      {filtered.map((p) => {
                        const isSelected = selected?.id === p.id;
                        const cat = categorizeProduct(p.name);
                        const itemImg = CATEGORY_ICON_URLS[cat.key];
                        return (
                          <button
                            key={p.id}
                            onClick={() => setSelected(p)}
                            style={{
                              padding: "12px 14px",
                              borderRadius: 12,
                              border: isSelected ? "2px solid #f59e0b" : "1px solid #e2e8ff",
                              background: isSelected ? "linear-gradient(135deg,#fff7ed,#fffbeb)" : "#f8fafc",
                              color: "#0f172a",
                              cursor: "pointer",
                              fontFamily: "inherit",
                              textAlign: "left",
                              transition: ".15s",
                              boxShadow: isSelected ? "0 0 0 3px rgba(245,158,11,.15)" : "none",
                              position: "relative",
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
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
                                <Flame size={9} style={{ display: "inline", verticalAlign: "-1px" }} /> HOT
                              </span>
                            )}
                            <div
                              style={{
                                width: 42,
                                height: 42,
                                flexShrink: 0,
                                borderRadius: 10,
                                background: isSelected
                                  ? "linear-gradient(135deg,#fbbf24,#f59e0b)"
                                  : "linear-gradient(135deg,#e0eefe,#f0e7fd)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.3rem",
                                overflow: "hidden",
                              }}
                            >
                              {itemImg ? (
                                <img src={itemImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : (
                                <cat.Icon size={20} strokeWidth={2.2} color={isSelected ? "#fff" : "#2272dc"} />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: ".9rem",
                                  fontWeight: 700,
                                  color: "#0f172a",
                                  lineHeight: 1.25,
                                  marginBottom: 2,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {p.name}
                              </div>
                              <div
                                style={{
                                  fontSize: ".95rem",
                                  fontWeight: 800,
                                  color: "#ea580c",
                                  letterSpacing: "-.01em",
                                }}
                              >
                                {fmtIDR(p.price_idr)}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Qty selector — manual products only */}
            {selected && isManualProduct && (
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
                <h3 style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: "1.1rem", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <Package size={14} /> Jumlah Pesanan
                </h3>
                <div style={{ fontSize: ".75rem", color: "#64748b", marginBottom: 12, fontWeight: 600 }}>
                  Order lebih dari 1 kali? Cukup atur qty — admin proses sekaligus.
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    style={{
                      width: 44, height: 44, borderRadius: 10,
                      border: "1px solid #e2e8ff",
                      background: qty <= 1 ? "#f1f5f9" : "#fff",
                      color: qty <= 1 ? "#cbd5e1" : "#0f172a",
                      cursor: qty <= 1 ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "inherit",
                    }}
                  >
                    <Minus size={18} />
                  </button>
                  <div
                    style={{
                      minWidth: 60, textAlign: "center",
                      fontSize: "1.3rem", fontWeight: 800, color: "#0f172a",
                      fontFamily: "'Fredoka'",
                    }}
                  >
                    {qty}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.min(100, q + 1))}
                    disabled={qty >= 100}
                    style={{
                      width: 44, height: 44, borderRadius: 10,
                      border: "1px solid #e2e8ff",
                      background: qty >= 100 ? "#f1f5f9" : "#fff",
                      color: qty >= 100 ? "#cbd5e1" : "#0f172a",
                      cursor: qty >= 100 ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "inherit",
                    }}
                  >
                    <Plus size={18} />
                  </button>
                  <div style={{ marginLeft: "auto", fontSize: ".9rem", fontWeight: 700, color: "#64748b" }}>
                    {qty} × {fmtIDR(selected.price_idr)} = <span style={{ color: "#ea580c", fontWeight: 800 }}>{fmtIDR(subtotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Contact / Phone */}
            <div
              style={{
                padding: 22,
                marginTop: 0,
                background: "#ffffff",
                border: "1.5px solid rgba(236,72,153,.35)",
                borderRadius: 16,
                color: "#0f172a",
                boxShadow: "0 10px 30px rgba(15,23,42,.18)",
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: "1.1rem", marginBottom: 6 }}>
                {inputFields.length > 0 ? "3." : "2."} <Phone size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} /> Nomor WhatsApp
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
                boxShadow: "0 10px 30px rgba(15,23,42,.18)",
                marginBottom: 20,
              }}
            >
              <h3 style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: "1.1rem", marginBottom: 6 }}>
                <Ticket size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} /> Kode Voucher <span style={{ fontSize: ".7rem", opacity: .7, fontFamily: "inherit" }}>(opsional)</span>
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
                  <CheckCircle2 size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} /> {voucherApplied.message} — hemat {fmtIDR(discountAmount)}
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
                boxShadow: "0 10px 30px rgba(15,23,42,.18)",
              }}
            >
              <h3 style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: "1.1rem", marginBottom: 6 }}>
                <Pencil size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} /> Catatan Order <span style={{ fontSize: ".7rem", opacity: .7, fontFamily: "inherit" }}>(opsional)</span>
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
                boxShadow: "0 14px 40px rgba(15,23,42,.25)",
                animation: "fadeInUp .35s ease",
              }}
            >
              <h3 style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: "1rem", marginBottom: 14 }}>
                <ClipboardList size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} /> Ringkasan Order
              </h3>
              {[
                ["Game", game.name.split(":")[0]],
                ["Paket", selected?.name || "—"],
                ...(isManualProduct
                  ? ([
                      ["Qty", `${qty}×`],
                      ["Subtotal", fmtIDR(subtotal)],
                    ] as [string, string][])
                  : ([["Harga", selected ? fmtIDR(selected.price_idr) : "Rp 0"]] as [string, string][])),
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
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {paying ? <Clock size={16} /> : <CreditCard size={16} />}
                  {paying ? "Memproses…" : "Bayar Sekarang"}
                </span>
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
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <MessageCircle size={16} />
                  Atau pesan via WhatsApp
                </span>
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
                <Lightbulb size={12} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} /> Klik <b>Bayar Sekarang</b> → pilih QRIS / E-Wallet / Bank Transfer / CC di popup. Otomatis diproses setelah bayar.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
