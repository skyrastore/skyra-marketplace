"use client";

import Link from "next/link";
import { useI18n } from "./i18n-provider";
import { Shield, Zap, Undo2, Clock, MessageCircle, Mail } from "lucide-react";

function IgSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

const LOGO_URL = "https://lh3.googleusercontent.com/d/1HmBuyY8D5ccBUUAP-GsCuiTNxpxsaDsu";
const ADMIN_WA = "6285183346300";
const SUPPORT_EMAIL = "support@skyra.id";

// Payment method logos — SVG hosted in /public/payment, sourced from
// Wikimedia Commons (QRIS, OVO, DANA, BCA, Mandiri, BRI, BNI, Visa,
// Mastercard, GoPay) and simpleicons.org (ShopeePay).
const PAYMENT_METHODS: { label: string; src: string }[] = [
  { label: "QRIS",       src: "/payment/qris.svg" },
  { label: "GoPay",      src: "/payment/gopay.svg" },
  { label: "OVO",        src: "/payment/ovo.svg" },
  { label: "DANA",       src: "/payment/dana.svg" },
  { label: "ShopeePay",  src: "/payment/shopeepay.svg" },
  { label: "BCA",        src: "/payment/bca.svg" },
  { label: "Mandiri",    src: "/payment/mandiri.svg" },
  { label: "BRI",        src: "/payment/bri.svg" },
  { label: "BNI",        src: "/payment/bni.svg" },
  { label: "Visa",       src: "/payment/visa.svg" },
  { label: "Mastercard", src: "/payment/mastercard.svg" },
];

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <>
      {/* ── Everything below lives on the footer's dark gradient so the
             component works self-contained on both light & dark pages ── */}
      <footer>
        {/* Trust badges strip */}
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto 28px",
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.14)",
            borderRadius: 18,
            padding: "18px 20px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            backdropFilter: "blur(8px)",
          }}
          className="trust-grid"
        >
          <TrustItem Icon={Zap} title="Instant Delivery" sub="UniPlay auto <5 menit" />
          <TrustItem Icon={Shield} title="Pembayaran Aman" sub="Midtrans · Enkripsi SSL" />
          <TrustItem Icon={Undo2} title="Refund 100%" sub="Gagal = uang balik" />
          <TrustItem Icon={Clock} title="24/7 Support" sub="Response < 5 menit" />
        </div>

        {/* Payment methods strip */}
        <div style={{ maxWidth: 1280, margin: "0 auto 32px" }}>
          <div style={{ fontSize: ".7rem", fontWeight: 800, color: "rgba(255,255,255,.55)", letterSpacing: ".15em", marginBottom: 10, textAlign: "center" }}>
            METODE PEMBAYARAN
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", alignItems: "center" }}>
            {PAYMENT_METHODS.map((pm) => (
              <span
                key={pm.label}
                title={pm.label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 36,
                  minWidth: 56,
                  padding: "6px 10px",
                  borderRadius: 7,
                  background: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,.18)",
                  border: "1px solid rgba(255,255,255,.08)",
                }}
              >
                <img
                  src={pm.src}
                  alt={pm.label}
                  style={{ maxHeight: 22, maxWidth: 60, objectFit: "contain", display: "block" }}
                />
              </span>
            ))}
          </div>
        </div>

        <div className="cols">
          <div className="col">
            <div className="brand-row">
              <img src={LOGO_URL} alt="Skyra" />
              <span>SKYRA STORE</span>
            </div>
            <p>{t("foot.desc")}</p>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <SocialIcon
                href="https://instagram.com/skyra_store2"
                label="Instagram @skyra_store2"
                bg="linear-gradient(135deg,#f58529,#dd2a7b,#8134af,#515bd4)"
                shadow="rgba(221,42,123,.4)"
              >
                <IgSvg />
              </SocialIcon>
              <SocialIcon
                href={`https://wa.me/${ADMIN_WA}`}
                label="WhatsApp Admin"
                bg="linear-gradient(135deg,#25D366,#128C7E)"
                shadow="rgba(37,211,102,.4)"
              >
                <MessageCircle size={20} />
              </SocialIcon>
              <SocialIcon
                href={`mailto:${SUPPORT_EMAIL}`}
                label={SUPPORT_EMAIL}
                bg="linear-gradient(135deg,#2970ff,#1a52b8)"
                shadow="rgba(41,112,255,.4)"
              >
                <Mail size={20} />
              </SocialIcon>
            </div>

            {/* Contact box — gives support@ + WA visibility beyond just an icon */}
            <div
              style={{
                marginTop: 18,
                padding: "12px 14px",
                background: "rgba(255,255,255,.05)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: ".65rem", fontWeight: 800, letterSpacing: ".12em", color: "rgba(255,255,255,.55)", marginBottom: 6 }}>
                KONTAK BISNIS
              </div>
              <div style={{ fontSize: ".76rem", color: "rgba(255,255,255,.85)", fontWeight: 600, lineHeight: 1.7 }}>
                <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "rgba(255,255,255,.85)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                  <Mail size={13} /> {SUPPORT_EMAIL}
                </a>
                <a href={`https://wa.me/${ADMIN_WA}`} target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,.85)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                  <MessageCircle size={13} /> +62 851-8334-6300
                </a>
                <div style={{ display: "flex", alignItems: "center", gap: 6, opacity: .7 }}>
                  <Clock size={13} /> Online 24/7
                </div>
              </div>
            </div>
          </div>

          <div className="col">
            <h3>{t("foot.col_service")}</h3>
            <Link href="/">{t("foot.topup")}</Link>
            <Link href="/">{t("foot.heart")}</Link>
            <Link href="/">{t("foot.run")}</Link>
            <Link href="/">{t("foot.voucher")}</Link>
          </div>
          <div className="col">
            <h3>{t("foot.col_help")}</h3>
            <a href={`https://wa.me/${ADMIN_WA}?text=Halo%20admin%2C%20saya%20mau%20tanya%20cara%20order`}>{t("foot.cara_order")}</a>
            <Link href="/lacak">{t("foot.lacak")}</Link>
            <a href={`https://wa.me/${ADMIN_WA}?text=Halo%20admin%2C%20saya%20mau%20tanya%20tentang%20refund`}>{t("foot.refund")}</a>
            <a href={`https://wa.me/${ADMIN_WA}?text=Halo%20admin%2C%20saya%20mau%20bertanya`}>{t("foot.faq")}</a>
          </div>
          <div className="col">
            <h3>{t("foot.col_about")}</h3>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Tentang%20Skyra%20Store`}>{t("foot.about")}</a>
            <a href="https://instagram.com/skyra_store2" target="_blank" rel="noopener noreferrer">{t("foot.blog")}</a>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Syarat%20Layanan`}>{t("foot.tos")}</a>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Kebijakan%20Privasi`}>{t("foot.privacy")}</a>
          </div>
        </div>
        <div className="copy">{t("foot.copy")}</div>
      </footer>

      <style jsx>{`
        @media (max-width: 720px) {
          :global(.trust-grid) {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </>
  );
}

function TrustItem({ Icon, title, sub }: { Icon: React.ElementType; title: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: "linear-gradient(135deg,rgba(123,195,255,.25),rgba(168,85,247,.25))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#7bc3ff",
          flexShrink: 0,
        }}
      >
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: ".78rem", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: ".68rem", color: "rgba(255,255,255,.65)", marginTop: 2, fontWeight: 500 }}>{sub}</div>
      </div>
    </div>
  );
}

function SocialIcon({
  href,
  label,
  bg,
  shadow,
  children,
}: {
  href: string;
  label: string;
  bg: string;
  shadow: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      style={{
        width: 40,
        height: 40,
        borderRadius: 11,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        color: "#fff",
        textDecoration: "none",
        boxShadow: `0 4px 14px ${shadow}`,
        transition: ".2s",
      }}
      onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-2px) scale(1.05)")}
      onMouseOut={(e) => (e.currentTarget.style.transform = "translateY(0) scale(1)")}
    >
      {children}
    </a>
  );
}
