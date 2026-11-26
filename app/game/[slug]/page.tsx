"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase, fmtIDR, type Game, type Product } from "@/lib/supabase";
import { CATEGORY_ICON_URLS } from "@/lib/categoryIcons";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n-provider";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ContactInput, type ContactValue, toPhoneString } from "@/components/contact-input";
import { ReviewCard, StarRow, type ReviewData } from "@/components/review-card";
import { DEFAULT_COUNTRY } from "@/lib/countryCodes";
import { useAuth } from "@/components/auth-provider";
import {
  Gift, Calendar, CalendarDays, Moon, Star, Trophy, CreditCard, Package, Gem,
  CheckCircle2, Zap, Lock, Clock, Phone, Ticket, Pencil, ClipboardList,
  MessageCircle, Flame, ArrowLeft, Minus, Plus, Lightbulb, Eye, EyeOff, Wallet,
  type LucideIcon,
} from "lucide-react";

type ClaimedVoucher = {
  voucher_code: string;
  voucher: {
    code: string;
    title: string | null;
    description: string | null;
    discount_type: string;
    discount_value: number;
    max_discount_idr: number | null;
    min_purchase_idr: number;
  };
};

const LOGO_URL = "https://lh3.googleusercontent.com/d/1HmBuyY8D5ccBUUAP-GsCuiTNxpxsaDsu";
const SNAP_JS_URL =
  (process.env.NEXT_PUBLIC_MIDTRANS_ENV || "sandbox") === "production"
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

type InputField = { key: string; label: string; type: string; placeholder?: string; required?: boolean; hint?: string; inputmode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search" };

// ─────────────────────────────────────────────
// Product category classifier (name-based)
// Groups denoms into user-friendly tabs so long lists aren't a wall of text.
// ─────────────────────────────────────────────
// Returns key + Icon only — label is resolved at render time via t("pack.<key>")
function categorizeProduct(name: string): { key: string; Icon: LucideIcon } {
  const n = name.toLowerCase();
  // Guard GAMG first — biar gak ketangkep "monthly" / "bundle" regex
  if (/\bgamg\b/.test(n)) return { key: "gamg", Icon: Lock };
  if (/first\s*(recharge|topup)|1st\s*topup|2x\s*diamond/.test(n)) return { key: "first", Icon: Gift };
  if (/weekly.*(pass|diamond)|elite.*pack/.test(n)) return { key: "weekly", Icon: Calendar };
  if (/monthly.*(pass|bundle|epic|ticket|card)/.test(n)) return { key: "monthly", Icon: CalendarDays };
  if (/twilight/.test(n)) return { key: "twilight", Icon: Moon };
  if (/starlight/.test(n)) return { key: "starlight", Icon: Star };
  if (/battle.*pass|season.*pass|royale.*pass|elite.*pass/.test(n)) return { key: "season", Icon: Trophy };
  if (/membership|member\b|m-card/.test(n)) return { key: "member", Icon: CreditCard };
  if (/bundle|pack|gift|voucher.*(bundle|special)/.test(n)) return { key: "bundle", Icon: Gift };
  if (/sub\s*package|package|paket/.test(n)) return { key: "paket", Icon: Package };
  return { key: "topup", Icon: Gem };
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
  const { t } = useI18n();
  const [game, setGame] = useState<Game | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const { user } = useAuth();
  const [selected, setSelected] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [contact, setContact] = useState<ContactValue>({ kind: "phone", phone: "", country: DEFAULT_COUNTRY });
  const [notes, setNotes] = useState("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [claimedVouchers, setClaimedVouchers] = useState<ClaimedVoucher[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"midtrans" | "wallet">("midtrans");
  const [vip, setVip] = useState<{ isVip: boolean; voucherCode?: string; gameSlugs?: string[] | null } | null>(null);
  // Derived string for display + API + WA fallback
  const phoneString = contact.kind === "phone" ? toPhoneString(contact) : "";
  const emailString = contact.kind === "email" ? contact.email : "";
  const contactDisplay = contact.kind === "phone"
    ? (contact.phone ? `${contact.country.flag} +${contact.country.dial}${contact.phone.replace(/^0+/, "")}` : "")
    : contact.email;
  const contactValid = contact.kind === "phone"
    ? contact.phone.replace(/\D/g, "").length >= 7
    : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email);
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
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});

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

  // ─── Fetch wallet balance + claimed vouchers for signed-in user ───
  useEffect(() => {
    if (!user) { setWalletBalance(null); setClaimedVouchers([]); setVip(null); return; }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { Authorization: `Bearer ${session?.access_token ?? ""}` };
      const [w, v, vipRes] = await Promise.all([
        fetch("/api/wallet", { headers }).then((r) => r.json()),
        fetch("/api/vouchers/mine", { headers }).then((r) => r.json()),
        fetch("/api/me/vip", { headers }).then((r) => r.json()),
      ]);
      setWalletBalance(Number(w.balance_idr ?? 0));
      setClaimedVouchers((v.active ?? []) as ClaimedVoucher[]);
      setVip(vipRes);
    })();
  }, [user]);

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
        toast.error(t("toast.voucher_not_found_t"), { description: t("toast.voucher_not_found_d") });
        return;
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error(t("toast.voucher_expired"));
        return;
      }
      if (data.max_uses && data.used_count >= data.max_uses) {
        toast.error(t("toast.voucher_used_up"));
        return;
      }
      if (!selected) {
        toast.warning(t("toast.voucher_pick_pack"));
        return;
      }
      if (selected.price_idr < data.min_purchase_idr) {
        toast.error(t("toast.voucher_min_buy_t"), { description: fmtIDR(data.min_purchase_idr) });
        return;
      }
      // Logged-in: enforce claim + per-user usage so we don't apply something
      // the backend will silently drop at checkout.
      if (user) {
        const { data: claim } = await supabase
          .from("vouchers_claimed")
          .select("used_at")
          .eq("user_id", user.id)
          .eq("voucher_code", data.code)
          .maybeSingle();
        if (!claim) {
          toast.error("Voucher belum di-klaim", { description: "Klaim dulu di /kupon sebelum pakai" });
          return;
        }
        if (claim.used_at) {
          toast.error("Voucher sudah dipakai", { description: "Satu voucher cuma bisa dipakai 1x" });
          return;
        }
      }
      toast.success(`${t("toast.voucher_applied_t")} (${data.code})`, { description: data.description });
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

  // VIP eligibility: user is VIP AND this game is in VIP voucher's game_slugs
  // (or voucher's game_slugs is null = all games).
  const isVipEligibleGame = !!(vip?.isVip && game && (!vip.gameSlugs || vip.gameSlugs.length === 0 || vip.gameSlugs.includes(game.slug)));
  const effectivePriceOf = (p: Product) => (isVipEligibleGame && p.price_vip_idr ? p.price_vip_idr : p.price_idr);

  const selectedPrice = selected ? effectivePriceOf(selected) : 0;
  const subtotal = selected ? selectedPrice * effectiveQty : 0;

  // VIP savings = selisih NON VIP vs VIP. Hanya ditampilkan di summary kalau
  // user VIP eligible untuk game ini dan produk ini punya price_vip_idr yang
  // beda dari price_idr.
  const vipSaving = selected && isVipEligibleGame && selected.price_vip_idr && selected.price_vip_idr !== selected.price_idr
    ? (selected.price_idr - selected.price_vip_idr) * effectiveQty
    : 0;
  const subtotalNonVip = selected ? selected.price_idr * effectiveQty : 0;

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
          .order("sort_order", { ascending: true })
          .order("price_idr");
        setGame(g as Game);
        setProducts((p || []) as Product[]);
      }
      setLoading(false);
    }
    load();
  }, [params.slug, router]);

  if (loading) {
    return <div style={{ textAlign: "center", padding: 80, color: "#0f172a", display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}><Clock size={18} /> {t("status.loading")}</div>;
  }
  if (!game) {
    return (
      <div style={{ textAlign: "center", padding: 80, color: "#0f172a" }}>
        <h2 style={{ fontFamily: "'Fredoka'", marginBottom: 16 }}>{t("status.not_found_title")}</h2>
        <Link href="/" style={{ color: "#2272dc" }}>{t("nav.back_home")}</Link>
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
      `📱 Kontak: ${contactDisplay}\n` +
      `━━━━━━━━━━━━━━━━━\n` +
      `*Data Akun:*\n${dataLines}\n` +
      (notes ? `━━━━━━━━━━━━━━━━━\n📝 Catatan: ${notes}\n` : "") +
      `━━━━━━━━━━━━━━━━━\n` +
      `Mohon konfirmasi total & info pembayaran ya kak 🙏`
    );
  };

  // ─── Validate order inputs ───
  const validateInputs = (): string | null => {
    if (!selected) return t("validate.pick_pack");
    if (!contactValid) return t("validate.phone_required");
    for (const f of inputFields) {
      if (f.required && !formData[f.key]) return `${t("validate.field_required")} ${f.label}`;
    }
    return null;
  };

  // ─── Primary checkout: Midtrans Snap OR Wallet ───
  const handlePayNow = async () => {
    const err = validateInputs();
    if (err) { toast.warning(err); return; }
    if (paying) return;

    // Wallet-specific guards (only if user chose wallet)
    if (paymentMethod === "wallet") {
      if (!user) { toast.warning("Login dulu buat bayar pakai saldo"); return; }
      if (walletBalance === null || walletBalance < finalPrice) {
        toast.error("Saldo kamu kurang", { description: `Butuh ${fmtIDR(finalPrice)} · Topup di /saldo` });
        return;
      }
    }

    setPaying(true);
    const loadingToast = toast.loading(t("toast.creating_order"));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          gameSlug: game!.slug,
          productId: selected!.id,
          phone: phoneString || undefined,
          email: emailString || undefined,
          customData: formData,
          notes: notes || undefined,
          voucherCode: voucherApplied?.code || undefined,
          qty: effectiveQty,
          useWallet: paymentMethod === "wallet",
        }),
      });

      const data = await res.json();
      toast.dismiss(loadingToast);

      if (!res.ok) {
        toast.error(t("toast.order_create_fail_t"), { description: data.error || t("toast.order_create_fail_d") });
        return;
      }

      // ─── Wallet branch: order is already paid, bounce to status page ───
      if (data.paid) {
        toast.success(t("toast.payment_success"), { description: `Saldo tersisa: ${fmtIDR(data.newBalance ?? 0)}` });
        window.location.href = `/order/${data.orderCode}?status=success`;
        return;
      }

      // ─── Midtrans branch ───
      if (!data.snapToken) {
        toast.error(t("toast.order_create_fail_t"), { description: data.error || t("toast.order_create_fail_d") });
        return;
      }

      const snap = (window as SnapWindow).snap;
      if (!snap) {
        toast.error(t("toast.payment_not_ready_t"), { description: t("toast.payment_not_ready_d") });
        return;
      }

      snap.pay(data.snapToken, {
        onSuccess: () => {
          toast.success(t("toast.payment_success"));
          window.location.href = `/order/${data.orderCode}?status=success`;
        },
        onPending: () => {
          toast.info(t("toast.payment_pending"));
          window.location.href = `/order/${data.orderCode}?status=pending`;
        },
        onError: (e) => {
          console.error("Snap error:", e);
          toast.error(t("toast.payment_fail_t"), { description: t("toast.payment_fail_d") });
        },
        onClose: () => { /* user closed popup — order tetap pending */ },
      });
    } catch (e) {
      console.error(e);
      toast.dismiss(loadingToast);
      toast.error(t("toast.network_err_t"), { description: t("toast.network_err_d") });
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
      <SiteNav />

      <div className="game-detail-wrap">
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
                    { Icon: CheckCircle2, label: t("badge.distributor") },
                    { Icon: isInstant ? Zap : Clock, label: isInstant ? t("badge.instant") : t("badge.manual") },
                    { Icon: Lock, label: t("badge.secure") },
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

        {/* VIP banner — kalau user VIP + game eligible, show diskon aktif */}
        {isVipEligibleGame && (
          <div
            style={{
              marginBottom: 24,
              padding: "14px 18px",
              borderRadius: 14,
              background: "linear-gradient(135deg,#fbbf24,#f59e0b,#d97706)",
              color: "#fff",
              boxShadow: "0 8px 24px rgba(245,158,11,.35)",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Star size={22} fill="#fff" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: ".95rem", fontFamily: "'Fredoka'" }}>Member VIP aktif</div>
              <div style={{ fontSize: ".78rem", opacity: .95, fontWeight: 600 }}>
                Harga di game ini otomatis pakai rate VIP ({vip?.voucherCode})
              </div>
            </div>
          </div>
        )}

        {/* Only show instructions if NOT just a website URL (sync sets "Website: ..." which is noise) */}
        {game.instructions && !/^(website:|https?:\/\/)/i.test(game.instructions.trim()) && (
          <div
            style={{
              padding: "14px 18px",
              background: "rgba(255,255,255,.95)",
              border: "1.5px solid rgba(123,195,255,.5)",
              borderRadius: 12,
              color: "#1e40af",
              fontSize: ".82rem",
              fontWeight: 600,
              marginBottom: 24,
              lineHeight: 1.5,
              boxShadow: "0 4px 14px rgba(15,23,42,.1)",
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
                  1. {t("detail.step_input")}
                </h3>
                <div style={{ display: "grid", gap: 12 }}>
                  {inputFields.map((f) => (
                    <div key={f.key}>
                      <label
                        style={{ display: "block", fontSize: ".78rem", fontWeight: 700, marginBottom: 6, color: "#334155" }}
                      >
                        {f.label}
                        {f.required && (
                          <span style={{ color: "#dc2626", marginLeft: 6, fontSize: ".68rem", fontWeight: 800 }}>
                            * wajib
                          </span>
                        )}
                      </label>
                      {(() => {
                        const isPassword = f.type === "password";
                        const isShown = showPass[f.key];
                        const effType = isPassword && isShown ? "text" : (f.type || "text");
                        return (
                          <div style={{ position: "relative" }}>
                            <input
                              type={effType}
                              inputMode={f.inputmode || (f.type === "email" ? "email" : undefined)}
                              placeholder={f.placeholder || ""}
                              value={formData[f.key] || ""}
                              onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                              style={{
                                width: "100%",
                                padding: isPassword ? "12px 44px 12px 14px" : "12px 14px",
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
                            {isPassword && (
                              <button
                                type="button"
                                aria-label={isShown ? t("detail.hide_pass") : t("detail.show_pass")}
                                title={isShown ? t("detail.hide_pass") : t("detail.show_pass")}
                                onClick={() => setShowPass((s) => ({ ...s, [f.key]: !s[f.key] }))}
                                style={{
                                  position: "absolute",
                                  right: 8,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  border: 0,
                                  background: "transparent",
                                  color: "#64748b",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {isShown ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            )}
                          </div>
                        );
                      })()}
                      {f.hint && (
                        <div style={{ marginTop: 6, fontSize: ".72rem", color: "#b45309", fontWeight: 600, display: "flex", alignItems: "flex-start", gap: 4, lineHeight: 1.4 }}>
                          <Lightbulb size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                          <span>{f.hint}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Pick denom — with category filter */}
            {(() => {
              // Compute categories present in this game's products
              const cats = new Map<string, { Icon: LucideIcon; count: number }>();
              for (const p of products) {
                const c = categorizeProduct(p.name);
                const cur = cats.get(c.key);
                if (cur) cur.count++;
                else cats.set(c.key, { Icon: c.Icon, count: 1 });
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
                  <h3 style={{ fontFamily: "'Fredoka'", fontWeight: 600, fontSize: "1.1rem", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                    {inputFields.length > 0 ? "2." : "1."} {t("detail.step_pack")}
                    <span style={{ color: "#dc2626", fontSize: ".68rem", fontWeight: 800 }}>*wajib</span>
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
                            <span>{t(`pack.${c.key}`)}</span>
                            <span style={{ opacity: .5, fontSize: ".7rem" }}>({c.count})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {filtered.length === 0 ? (
                    <div style={{
                      textAlign: "center",
                      padding: "28px 20px",
                      background: "#fff7ed",
                      border: "1.5px dashed #fdba74",
                      borderRadius: 12,
                      color: "#9a3412",
                      fontSize: ".88rem",
                      fontWeight: 700,
                    }}>
                      🚫 Stok habis — semua pilihan sedang tidak tersedia.<br />
                      <span style={{ fontWeight: 600, fontSize: ".78rem", opacity: .85 }}>
                        Admin lagi isi ulang saldo supplier, cek lagi 15-60 menit lagi ya 🙏
                      </span>
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
                                  display: "flex",
                                  alignItems: "baseline",
                                  gap: 6,
                                }}
                              >
                                {fmtIDR(effectivePriceOf(p))}
                                {isVipEligibleGame && p.price_vip_idr && p.price_vip_idr !== p.price_idr && (
                                  <span style={{ fontSize: ".65rem", fontWeight: 600, color: "#94a3b8", textDecoration: "line-through" }}>
                                    {fmtIDR(p.price_idr)}
                                  </span>
                                )}
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
                  <Package size={14} /> {t("detail.qty")}
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
                    {qty} × {fmtIDR(selectedPrice)} = <span style={{ color: "#ea580c", fontWeight: 800 }}>{fmtIDR(subtotal)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Contact: WhatsApp (w/ country code) or Email */}
            <ContactInput value={contact} onChange={setContact} />

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
                <Ticket size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} /> {t("detail.voucher")} <span style={{ fontSize: ".7rem", opacity: .7, fontFamily: "inherit" }}>({t("detail.optional")})</span>
              </h3>

              {/* Claimed voucher picker (logged-in users with claims) */}
              {user && claimedVouchers.length > 0 && !voucherApplied && (
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: ".7rem", color: "#64748b", fontWeight: 700, display: "block", marginBottom: 4 }}>
                    Voucher Milikku
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      setVoucherCode(e.target.value);
                      // Trigger validation after state update
                      setTimeout(() => checkVoucher(), 0);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "#faf5ff",
                      border: "1.5px solid rgba(168,85,247,.35)",
                      color: "#0f172a",
                      fontFamily: "inherit",
                      fontSize: ".85rem",
                      fontWeight: 700,
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">— Pilih dari {claimedVouchers.length} voucher —</option>
                    {claimedVouchers.map((c) => {
                      const v = c.voucher;
                      const label = v.discount_type === "percentage"
                        ? `${v.discount_value}% OFF`
                        : `Rp ${Number(v.discount_value).toLocaleString("id-ID")}`;
                      const minLabel = v.min_purchase_idr ? ` · min ${fmtIDR(v.min_purchase_idr)}` : "";
                      return (
                        <option key={c.voucher_code} value={c.voucher_code}>
                          {v.code} — {label}{minLabel}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder={t("ph.voucher")}
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
                    {t("detail.voucher_cancel")}
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
                    {voucherChecking ? "..." : t("detail.voucher_check")}
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
                  <CheckCircle2 size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} /> {voucherApplied.message} — {t("detail.voucher_save")} {fmtIDR(discountAmount)}
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
                <Pencil size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} /> {t("detail.notes")} <span style={{ fontSize: ".7rem", opacity: .7, fontFamily: "inherit" }}>({t("detail.optional")})</span>
              </h3>
              <div style={{ fontSize: ".75rem", color: "#64748b", marginBottom: 10, fontWeight: 600 }}>
                {t("detail.notes_hint")}
              </div>
              <textarea
                placeholder={t("ph.notes")}
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

          {/* Summary: appear ONLY after ALL required inputs are valid
              (selected pack + contact + every required input_field). Prevents
              premature display with half-filled form + a misleading VIP line. */}
          {selected && contactValid && inputFields.every((f) => !f.required || formData[f.key]?.trim()) && (
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
                <ClipboardList size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} /> {t("detail.summary")}
              </h3>
              {[
                [t("detail.game"), game.name.split(":")[0]],
                [t("detail.package"), selected?.name || "—"],
                ...(isManualProduct
                  ? ([
                      [t("detail.qty_label"), `${qty}×`],
                      [t("detail.subtotal"), fmtIDR(vipSaving > 0 ? subtotalNonVip : subtotal)],
                    ] as [string, string][])
                  : ([[t("detail.price"), selected ? fmtIDR(vipSaving > 0 ? subtotalNonVip : selectedPrice) : "Rp 0"]] as [string, string][])),
                ...(vipSaving > 0
                  ? ([[`Diskon VIP (${vip?.voucherCode})`, `-${fmtIDR(vipSaving)}`]] as [string, string][])
                  : ([] as [string, string][])),
                ...(voucherApplied
                  ? ([[`${t("detail.voucher_label")} (${voucherApplied.code})`, `-${fmtIDR(discountAmount)}`]] as [string, string][])
                  : ([] as [string, string][])),
                [t("detail.admin_fee"), "Rp 0"],
              ].map(([k, v]) => {
                const isDiscount = (voucherApplied && k.startsWith("Voucher")) || k.startsWith("Diskon VIP");
                return (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: ".86rem", fontWeight: 700, color: "#334155" }}>
                    <span>{k}</span>
                    <span style={{ color: isDiscount ? "#10b981" : "#0f172a", fontWeight: 800 }}>{v}</span>
                  </div>
                );
              })}
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
                <span>{t("detail.total")}</span>
                <span style={{ color: "#2272dc", fontSize: "1.3rem" }}>{fmtIDR(finalPrice)}</span>
              </div>

              {/* Payment Method Selector — only for signed-in users with a wallet */}
              {user && walletBalance !== null && (
                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("midtrans")}
                    style={{
                      padding: "11px 10px",
                      borderRadius: 10,
                      border: paymentMethod === "midtrans" ? "2px solid #2272dc" : "1.5px solid #e2e8ff",
                      background: paymentMethod === "midtrans" ? "#eff6ff" : "#fff",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#1a52b8", fontWeight: 800, fontSize: ".8rem" }}>
                      <CreditCard size={14} /> Pembayaran Otomatis
                    </div>
                    <div style={{ fontSize: ".68rem", color: "#64748b", marginTop: 2, fontWeight: 600 }}>QRIS · Bank · E-Wallet · CC</div>
                  </button>
                  <button
                    type="button"
                    disabled={walletBalance < finalPrice}
                    onClick={() => walletBalance >= finalPrice && setPaymentMethod("wallet")}
                    style={{
                      padding: "11px 10px",
                      borderRadius: 10,
                      border: paymentMethod === "wallet" ? "2px solid #10b981" : "1.5px solid #e2e8ff",
                      background: paymentMethod === "wallet" ? "#ecfdf5" : "#fff",
                      cursor: walletBalance < finalPrice ? "not-allowed" : "pointer",
                      textAlign: "left",
                      opacity: walletBalance < finalPrice ? 0.5 : 1,
                      fontFamily: "inherit",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#059669", fontWeight: 800, fontSize: ".8rem" }}>
                      <Wallet size={14} /> Saldo Skyra
                    </div>
                    <div style={{ fontSize: ".68rem", color: walletBalance < finalPrice ? "#ef4444" : "#64748b", marginTop: 2, fontWeight: 600 }}>
                      {fmtIDR(walletBalance)} {walletBalance < finalPrice && "· kurang"}
                    </div>
                  </button>
                </div>
              )}

              {/* Primary: pay button (Midtrans or Wallet) */}
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
                  {paying ? t("detail.processing") : t("detail.pay_now")}
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
                  {t("detail.wa_fallback")}
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
                <Lightbulb size={12} style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }} /> {t("detail.pay_tip")}
              </div>
            </div>
          )}
        </div>
      </div>

      {game && <ReviewsSection gameSlug={game.slug} />}
      <SiteFooter />
    </>
  );
}

function ReviewsSection({ gameSlug }: { gameSlug: string }) {
  const [data, setData] = useState<{ avg: number | null; count: number; reviews: ReviewData[] }>({ avg: null, count: 0, reviews: [] });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/reviews/game/${gameSlug}`).then((r) => r.json()).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [gameSlug]);
  if (loading || data.count === 0) return null;
  return (
    <div className="game-detail-wrap" style={{ marginTop: 20 }}>
      <div style={{
        background: "#fff", borderRadius: 18, padding: 22,
        border: "1px solid #e2e8ff", boxShadow: "0 10px 30px rgba(15,23,42,.18)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <h3 style={{ fontFamily: "'Fredoka'", fontWeight: 700, fontSize: "1.2rem", color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Star size={18} fill="#f59e0b" color="#f59e0b" /> Ulasan Customer
          </h3>
          {data.avg !== null && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg,#fef3c7,#fde68a)", padding: "8px 14px", borderRadius: 12 }}>
              <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "#92400e" }}>{data.avg}</span>
              <StarRow value={data.avg} size={14} />
              <span style={{ fontSize: ".78rem", color: "#92400e", fontWeight: 700 }}>({data.count} review)</span>
            </div>
          )}
        </div>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))" }}>
          {data.reviews.map((r, i) => <ReviewCard key={i} review={r} />)}
        </div>
      </div>
    </div>
  );
}
