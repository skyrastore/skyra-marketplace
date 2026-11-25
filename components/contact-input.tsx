"use client";

import { useState } from "react";
import { Phone, Mail, ChevronDown } from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "@/lib/countryCodes";
import { useI18n } from "./i18n-provider";

export type ContactValue =
  | { kind: "phone"; phone: string; country: Country }
  | { kind: "email"; email: string };

export function ContactInput({
  value,
  onChange,
}: {
  value: ContactValue;
  onChange: (v: ContactValue) => void;
}) {
  const { t } = useI18n();
  const [showCountryList, setShowCountryList] = useState(false);
  const [search, setSearch] = useState("");

  const kind = value.kind;
  const filtered = COUNTRIES.filter((c) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return c.name.toLowerCase().includes(s) || c.dial.includes(s) || c.code.toLowerCase().includes(s);
  });

  return (
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
        <Phone size={14} /> {t("detail.step_contact")}
      </h3>
      <div style={{ fontSize: ".78rem", color: "#64748b", marginBottom: 12, fontWeight: 600 }}>
        {t("detail.contact_hint")}
      </div>

      {/* Toggle tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, padding: 4, background: "#f1f5f9", borderRadius: 10 }}>
        <button
          type="button"
          onClick={() =>
            onChange({ kind: "phone", phone: kind === "phone" ? value.phone : "", country: kind === "phone" ? value.country : DEFAULT_COUNTRY })
          }
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 7,
            border: 0,
            background: kind === "phone" ? "#fff" : "transparent",
            color: kind === "phone" ? "#0f172a" : "#64748b",
            fontFamily: "inherit",
            fontSize: ".82rem",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: kind === "phone" ? "0 2px 6px rgba(15,23,42,.08)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Phone size={13} /> WhatsApp
        </button>
        <button
          type="button"
          onClick={() => onChange({ kind: "email", email: kind === "email" ? value.email : "" })}
          style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: 7,
            border: 0,
            background: kind === "email" ? "#fff" : "transparent",
            color: kind === "email" ? "#0f172a" : "#64748b",
            fontFamily: "inherit",
            fontSize: ".82rem",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: kind === "email" ? "0 2px 6px rgba(15,23,42,.08)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Mail size={13} /> Email
        </button>
      </div>

      {/* Phone input w/ country code dropdown */}
      {kind === "phone" && (
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowCountryList((o) => !o)}
              style={{
                padding: "12px 10px",
                borderRadius: 10,
                background: "#f8fafc",
                border: "1px solid #e2e8ff",
                color: "#0f172a",
                fontFamily: "inherit",
                fontSize: ".9rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                minWidth: 96,
              }}
            >
              <img
                src={`https://flagcdn.com/w40/${value.country.code.toLowerCase()}.png`}
                alt={value.country.code}
                width={20}
                height={14}
                style={{ borderRadius: 2, objectFit: "cover" }}
              />
              <span>+{value.country.dial}</span>
              <ChevronDown size={14} style={{ opacity: .6 }} />
            </button>
            <input
              type="tel"
              placeholder="8123456789"
              value={value.phone}
              onChange={(e) => onChange({ ...value, phone: e.target.value.replace(/[^0-9]/g, "") })}
              style={{
                flex: 1,
                padding: "12px 14px",
                borderRadius: 10,
                background: "#f8fafc",
                border: "1px solid #e2e8ff",
                color: "#0f172a",
                fontFamily: "inherit",
                fontSize: ".95rem",
                fontWeight: 700,
                outline: "none",
                letterSpacing: ".5px",
              }}
            />
          </div>

          {showCountryList && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                maxHeight: 280,
                overflowY: "auto",
                background: "#fff",
                border: "1px solid #e2e8ff",
                borderRadius: 12,
                boxShadow: "0 20px 50px rgba(15,23,42,.25)",
                zIndex: 20,
              }}
            >
              <div style={{ padding: 8, borderBottom: "1px solid #f1f5f9", position: "sticky", top: 0, background: "#fff" }}>
                <input
                  type="text"
                  placeholder={t("contact.search_country")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#f1f5f9",
                    border: "1px solid #e2e8ff",
                    color: "#0f172a",
                    fontSize: ".85rem",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
              </div>
              {filtered.length === 0 && (
                <div style={{ padding: 20, textAlign: "center", color: "#64748b", fontSize: ".85rem" }}>{t("contact.no_match")}</div>
              )}
              {filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    onChange({ kind: "phone", phone: value.phone, country: c });
                    setShowCountryList(false);
                    setSearch("");
                  }}
                  style={{
                    display: "flex",
                    width: "100%",
                    padding: "10px 14px",
                    gap: 12,
                    alignItems: "center",
                    background: value.country.code === c.code ? "#dbeafe" : "transparent",
                    border: 0,
                    borderBottom: "1px solid #f8fafc",
                    color: "#0f172a",
                    fontFamily: "inherit",
                    fontSize: ".86rem",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <img
                    src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                    alt={c.code}
                    width={22}
                    height={15}
                    style={{ borderRadius: 2, objectFit: "cover", flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, fontWeight: 600 }}>{c.name}</span>
                  <span style={{ color: "#64748b", fontWeight: 700 }}>+{c.dial}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email input */}
      {kind === "email" && (
        <input
          type="email"
          placeholder="email@contoh.com"
          value={value.email}
          onChange={(e) => onChange({ kind: "email", email: e.target.value.trim() })}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 10,
            background: "#f8fafc",
            border: "1px solid #e2e8ff",
            color: "#0f172a",
            fontFamily: "inherit",
            fontSize: ".95rem",
            fontWeight: 700,
            outline: "none",
          }}
        />
      )}
    </div>
  );
}

// Export helper to get a canonical string for backend
export function toPhoneString(c: ContactValue): string {
  if (c.kind !== "phone") return "";
  const digits = c.phone.replace(/^0+/, ""); // strip leading zero (common ID format)
  return `+${c.country.dial}${digits}`;
}
