"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase, fmtIDR, type Game, type Promo } from "@/lib/supabase";
import { useI18n } from "@/components/i18n-provider";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PaginatedGrid } from "@/components/paginated-grid";
import {
  Gamepad2, Smartphone, Ticket, Zap, Swords, Sparkles, Star, Flame, Target,
  Wallet, ShieldCheck, Clock, ArrowUpRight, Search as SearchIcon,
  type LucideIcon,
} from "lucide-react";

const LOGO_URL = "https://lh3.googleusercontent.com/d/1HmBuyY8D5ccBUUAP-GsCuiTNxpxsaDsu";

const CATEGORIES: { key: string; tKey: string; Icon: LucideIcon }[] = [
  { key: "all", tKey: "cat.all", Icon: Gamepad2 },
  { key: "mobile", tKey: "cat.mobile", Icon: Smartphone },
  { key: "voucher", tKey: "cat.voucher", Icon: Ticket },
  { key: "ppob", tKey: "cat.ppob", Icon: Zap },
  { key: "joki", tKey: "cat.joki", Icon: Swords },
];

// Helper: card component (handles external_url redirect)
function GameCard({ g }: { g: Game }) {
  const { t } = useI18n();
  const content = (
    <>
      <div
        className={g.image_url ? "gg-ic" : "gg-ic gg-ic-fallback"}
        style={g.image_url ? { backgroundImage: `url(${g.image_url})` } : {}}
      >
        {!g.image_url && <span>{g.icon_emoji}</span>}
        {g.is_featured && <span className="gg-badge hot">HOT</span>}
      </div>
      <div className="gg-info">
        <div className="gg-name">{g.name}</div>
        <div className="gg-pub">{g.publisher || "—"}</div>
      </div>
    </>
  );
  if (g.external_url) {
    return (
      <a href={g.external_url} target="_blank" rel="noopener noreferrer" className="gg-card">
        {content}
      </a>
    );
  }
  return (
    <Link href={`/game/${g.slug}`} className="gg-card">
      {content}
    </Link>
  );
}

// Helper: portrait special/joki card
function SpecialCard({ g, badge }: { g: Game; badge?: "SPECIAL" | "JOKI" }) {
  const { t } = useI18n();
  // Derive method variant from slug suffix so split-method games
  // (roblox-login vs roblox-username, sky-via-id vs sky-via-login vs sky-via-gift)
  // are visually distinguishable even when sharing cover art.
  const m = g.slug.match(/-via-(\w+)$|-(login|username)$/i);
  const rawVariant = (m?.[1] || m?.[2] || "").toLowerCase();
  const variant = rawVariant ? rawVariant.charAt(0).toUpperCase() + rawVariant.slice(1) : "";

  const content = (
    <>
      {g.external_url && <span className="sp-ext-badge">EXTERNAL</span>}
      {badge === "SPECIAL" && !variant && <span className="sp-hot-badge">FLASHSALE</span>}
      {badge === "JOKI" && <span className="sp-hot-badge" style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>JOKI</span>}
      {variant && (
        <span
          className="sp-hot-badge"
          style={{
            background:
              variant === "Login"
                ? "linear-gradient(135deg,#f97316,#ef4444)"
                : variant === "Username"
                ? "linear-gradient(135deg,#10b981,#059669)"
                : variant === "Id"
                ? "linear-gradient(135deg,#3b82f6,#1d4ed8)"
                : variant === "Gift"
                ? "linear-gradient(135deg,#ec4899,#a855f7)"
                : "linear-gradient(135deg,#64748b,#475569)",
          }}
        >
          Via {variant === "Id" ? "ID" : variant}
        </span>
      )}
      <img
        src={g.image_url || "https://via.placeholder.com/300x400/1a52b8/ffffff?text=" + encodeURIComponent(g.name)}
        alt={g.name}
        className="sp-img"
        loading="lazy"
      />
      <div className="sp-info">
        <div>
          <div className="sp-name">{g.name}</div>
          {g.instructions && <div className="sp-desc">{g.instructions}</div>}
        </div>
        <div className="sp-btn">
          {g.external_url ? t("card.order_now") : t("card.topup_now")}
        </div>
      </div>
    </>
  );
  if (g.external_url) {
    return (
      <a href={g.external_url} target="_blank" rel="noopener noreferrer" className="sp-card">
        {content}
      </a>
    );
  }
  return (
    <Link href={`/game/${g.slug}`} className="sp-card">
      {content}
    </Link>
  );
}

export default function Home() {
  const [splashHide, setSplashHide] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [slide, setSlide] = useState(0);
  const [cat, setCat] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [searchFocus, setSearchFocus] = useState(false);
  const { t } = useI18n();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // Hide splash after animation + track returning visitor
  useEffect(() => {
    if (typeof window !== "undefined") {
      const visited = sessionStorage.getItem("skyra_visited");
      if (visited) setIsReturning(true);
      sessionStorage.setItem("skyra_visited", "1");
    }
    const timer = setTimeout(() => setSplashHide(true), 3200);
    return () => clearTimeout(timer);
  }, []);

  // Fetch promos + games
  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: g }] = await Promise.all([
        supabase.from("promos").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("games").select("*").eq("is_active", true).order("name"),
      ]);
      setPromos((p || []) as Promo[]);
      setGames((g || []) as Game[]);
      setLoading(false);
    }
    load();
  }, []);

  // Auto-slide carousel (every 6s if there are promos)
  useEffect(() => {
    if (promos.length < 2) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % promos.length), 6000);
    return () => clearInterval(id);
  }, [promos.length]);

  // Stars effect
  useEffect(() => {
    const c = document.getElementById("stars") as HTMLCanvasElement | null;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let stars: { x: number; y: number; r: number; ph: number; sp: number }[] = [];
    function resize() {
      c!.width = window.innerWidth;
      c!.height = window.innerHeight;
      make();
    }
    function make() {
      stars = [];
      const n = Math.min(Math.max(Math.floor((c!.width * c!.height) / 9000), 50), 120);
      for (let i = 0; i < n; i++)
        stars.push({
          x: Math.random() * c!.width,
          y: Math.random() * c!.height * 0.55,
          r: Math.random() * 1.3 + 0.3,
          ph: Math.random() * Math.PI * 2,
          sp: Math.random() * 0.01 + 0.004,
        });
    }
    function draw(t: number) {
      ctx.clearRect(0, 0, c!.width, c!.height);
      for (const s of stars) {
        const a = 0.2 + 0.7 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.sp * 60 + s.ph));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.283);
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(draw);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const slideCount = promos.length || 1; // 1 fallback for default slide
  const changeSlide = (dir: number) => setSlide((s) => (s + dir + slideCount) % slideCount);

  const q = search.trim().toLowerCase();
  const filteredGames = games.filter((g) => {
    if (cat !== "all" && g.category !== cat) return false;
    if (!q) return true;
    return (
      g.name.toLowerCase().includes(q) ||
      (g.publisher || "").toLowerCase().includes(q) ||
      g.slug.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* ═══════════ SPLASH SCREEN ═══════════ */}
      {!splashHide && (
        <div className="splash">
          <div className="splash-logo">
            <img src={LOGO_URL} alt="Skyra Store" />
          </div>
          <div className="splash-title">{t("splash.title")}</div>
          <div className="splash-sub">
            {isReturning ? t("splash.returning") : t("splash.new")}
          </div>
        </div>
      )}

      <canvas id="stars" aria-hidden="true"></canvas>

      {/* Unified nav for every route — logo + ID/EN + MASUK + burger-only sidebar */}
      <SiteNav />

      <main id="main-content">
      {/* ═══════════ SEARCH BAR (full-width below nav) ═══════════ */}
      <div className="search-bar-wrap">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            placeholder={t("search.placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setTimeout(() => setSearchFocus(false), 200)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearch("");
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label={t("a11y.clear")}
              className="search-clear"
            >
              ×
            </button>
          )}
          {search && searchFocus && filteredGames.length > 0 && (
            <div className="search-dropdown" onMouseDown={(e) => e.preventDefault()}>
              {filteredGames.slice(0, 8).map((g) => {
                const inner = (
                  <>
                    <div
                      className="sd-thumb"
                      style={g.image_url ? { backgroundImage: `url(${g.image_url})` } : {}}
                    >
                      {!g.image_url && <span style={{ fontSize: "1.5rem" }}>{g.icon_emoji}</span>}
                    </div>
                    <div className="sd-info">
                      <div className="sd-name">{g.name}</div>
                      <div className="sd-tag">
                        {g.external_url ? t("card.external") : t("card.instant")}
                      </div>
                    </div>
                  </>
                );
                return g.external_url ? (
                  <a
                    key={g.id}
                    href={g.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sd-row"
                    onClick={() => setSearch("")}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link
                    key={g.id}
                    href={`/game/${g.slug}`}
                    className="sd-row"
                    onClick={() => setSearch("")}
                  >
                    {inner}
                  </Link>
                );
              })}
              {filteredGames.length > 8 && (
                <div className="sd-more">+{filteredGames.length - 8} {t("search.more")} ↓</div>
              )}
            </div>
          )}
          {search && searchFocus && filteredGames.length === 0 && (
            <div className="search-dropdown" onMouseDown={(e) => e.preventDefault()}>
              <div className="sd-empty">📭 Ga ada hasil untuk &quot;{search}&quot;</div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ HERO CAROUSEL ═══════════ */}
      <div className="hero-wrap">
        <div className="hero-slider">
          <div className="slides" style={{ transform: `translateX(-${slide * 100}%)` }}>
            {promos.length > 0 ? (
              promos.map((p, i) => {
                const slideInner = (
                  <>
                    {p.image_url && (
                      <div className="slide-bg">
                        <img src={p.image_url} alt={p.title} />
                      </div>
                    )}
                    {/* Text overlay: always visible when NO image, hover-only when image exists */}
                    <div className="slide-content">
                      <div className="slide-brand">SKYRA STORE</div>
                      <div className="slide-title" style={{ whiteSpace: "pre-line" }}>
                        {p.title}
                      </div>
                      {p.subtitle && <div className="slide-sub">{p.subtitle}</div>}
                    </div>
                    {!p.image_url && <div className="slide-art"><Sparkles size={110} /></div>}
                  </>
                );
                const bg = p.background_gradient || "linear-gradient(135deg,#1a52b8,#2272dc,#4a8dff)";
                return p.cta_url ? (
                  <Link key={i} href={p.cta_url} className="slide slide-link" style={{ background: bg }}>
                    {slideInner}
                  </Link>
                ) : (
                  <div key={i} className="slide" style={{ background: bg }}>
                    {slideInner}
                  </div>
                );
              })
            ) : (
              <div className="slide slide-default">
                <div className="slide-content">
                  <div className="slide-brand">SKYRA STORE</div>
                  <div className="slide-title">{t("slide.default_title")}</div>
                  <div className="slide-sub">Hemat · Cepat · Aman. QRIS, PayPal, Wise — proses instant.</div>
                </div>
                <div className="slide-art"><Gamepad2 size={110} /></div>
              </div>
            )}
          </div>
          {promos.length > 1 && (
            <>
              <button className="slider-nav prev" onClick={() => changeSlide(-1)} aria-label={t("a11y.prev_slide")}>
                ‹
              </button>
              <button className="slider-nav next" onClick={() => changeSlide(1)} aria-label={t("a11y.next_slide")}>
                ›
              </button>
              <div className="slider-dots">
                {promos.map((_, i) => (
                  <button
                    key={i}
                    className={`dot ${slide === i ? "on" : ""}`}
                    onClick={() => setSlide(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══════════ CATEGORY TABS ═══════════ */}
      <div className="cats-wrap">
        <div className="cats">
          {CATEGORIES.map((c) => (
            <button key={c.key} className={`cat ${cat === c.key ? "on" : ""}`} onClick={() => setCat(c.key)}>
              <c.Icon size={16} strokeWidth={2.2} /> {t(c.tKey)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="section" style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,.7)" }}>
          <Clock size={18} style={{ display: "inline", verticalAlign: "-3px", marginRight: 6 }} /> Loading catalog...
        </div>
      ) : search ? (
        /* ─── SEARCH MODE: flat grid of filtered results ─── */
        <div className="section">
          <div className="sec-head">
            <h2>
              <span className="ic">🔍</span> Hasil pencarian: &quot;{search}&quot;
            </h2>
            <div className="meta">{filteredGames.length} {t("sec.game_count")}</div>
          </div>
          {filteredGames.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.7)" }}>
              📭 Ga ada game yang cocok dengan &quot;{search}&quot;. Coba kata lain ya.
            </div>
          ) : (
            <PaginatedGrid
              items={filteredGames}
              keyFn={(g) => g.id}
              renderItem={(g) => <GameCard g={g} />}
            />
          )}
        </div>
      ) : (
        <>
          {/* ═══════════ SPECIAL OFFER (always show when 'all' or 'mobile') ═══════════ */}
          {(cat === "all" || cat === "mobile") &&
            games.filter((g) => g.is_special_offer).length > 0 && (
              <div className="section">
                <div className="sec-head">
                  <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Star size={22} fill="currentColor" /> {t("sec.special_offer")}
                  </h2>
                  <div className="meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Flame size={12} /> {t("sec.handled_by_skyra")}
                  </div>
                </div>
                <div className="special-grid">
                  {games
                    .filter((g) => g.is_special_offer)
                    .map((g) => (
                      <SpecialCard key={g.id} g={g} badge="SPECIAL" />
                    ))}
                </div>
              </div>
            )}

          {/* ═══════════ JOKI SECTION (show when 'all' or 'joki') ═══════════ */}
          {(cat === "all" || cat === "joki") &&
            games.filter((g) => g.category === "joki").length > 0 && (
              <div className="section">
                <div className="sec-head">
                  <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Target size={22} /> {t("sec.joki_skyra")}
                  </h2>
                  <div className="meta" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Swords size={12} /> {t("sec.personal_service")}
                  </div>
                </div>
                <div className="special-grid">
                  {games
                    .filter((g) => g.category === "joki")
                    .map((g) => (
                      <SpecialCard key={g.id} g={g} badge="JOKI" />
                    ))}
                </div>
              </div>
            )}

          {/* ═══════════ ALL GAMES (split by Mobile vs Voucher when 'all') ═══════════ */}
          {cat === "all" ? (
            <>
              {/* Mobile section */}
              <div className="section">
                <div className="sec-head">
                  <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Smartphone size={22} /> {t("sec.all_mobile")}
                  </h2>
                  <div className="meta">
                    {games.filter((g) => g.category === "mobile" && !g.is_special_offer).length} game
                  </div>
                </div>
                <PaginatedGrid
                  items={games.filter((g) => g.category === "mobile" && !g.is_special_offer)}
                  keyFn={(g) => g.id}
                  renderItem={(g) => <GameCard g={g} />}
                />
              </div>

              {/* Voucher section */}
              {games.filter((g) => g.category === "voucher").length > 0 && (
                <div className="section">
                  <div className="sec-head">
                    <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Ticket size={22} /> {t("sec.voucher_pc")}
                    </h2>
                    <div className="meta">
                      {games.filter((g) => g.category === "voucher").length} voucher
                    </div>
                  </div>
                  <PaginatedGrid
                    items={games.filter((g) => g.category === "voucher")}
                    keyFn={(g) => g.id}
                    renderItem={(g) => <GameCard g={g} />}
                  />
                </div>
              )}
            </>
          ) : cat !== "joki" ? (
            /* Specific category (mobile / voucher / ppob) - flat grid */
            <div className="section">
              <div className="sec-head">
                <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {(() => {
                    const C = CATEGORIES.find((c) => c.key === cat)?.Icon;
                    return C ? <C size={22} strokeWidth={2.2} /> : null;
                  })()}
                  {t(CATEGORIES.find((c) => c.key === cat)?.tKey || "cat.all")}
                </h2>
                <div className="meta">{filteredGames.length} {t("sec.game_count")}</div>
              </div>
              {filteredGames.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.7)" }}>
                  📭 Belum ada game di kategori ini.
                </div>
              ) : (
                <PaginatedGrid
                  items={filteredGames}
                  keyFn={(g) => g.id}
                  renderItem={(g) => <GameCard g={g} />}
                />
              )}
            </div>
          ) : null}
        </>
      )}

      </main>

      <SiteFooter />
    </>
  );
}
