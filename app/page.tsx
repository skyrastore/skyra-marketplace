"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase, fmtIDR, type Game, type Promo } from "@/lib/supabase";

const LOGO_URL = "https://lh3.googleusercontent.com/d/1HmBuyY8D5ccBUUAP-GsCuiTNxpxsaDsu";

const CATEGORIES = [
  { key: "all", label: "Semua", icon: "🎮" },
  { key: "mobile", label: "Mobile Games", icon: "📱" },
  { key: "voucher", label: "Voucher", icon: "🎫" },
  { key: "ppob", label: "PPOB", icon: "⚡" },
  { key: "joki", label: "Joki", icon: "⚔️" },
];

// Helper: card component (handles external_url redirect)
function GameCard({ g }: { g: Game }) {
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
  const content = (
    <>
      {g.external_url && <span className="sp-ext-badge">↗ EXTERNAL</span>}
      {badge === "SPECIAL" && <span className="sp-hot-badge">⚡ FLASHSALE</span>}
      {badge === "JOKI" && <span className="sp-hot-badge" style={{ background: "linear-gradient(135deg,#a855f7,#ec4899)" }}>🎯 JOKI</span>}
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
          {g.external_url ? "ORDER SEKARANG ↗" : "TOP UP SEKARANG →"}
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
  const [lang, setLang] = useState<"id" | "en">("id");
  const [promos, setPromos] = useState<Promo[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // Hide splash after animation + track returning visitor + restore lang
  useEffect(() => {
    if (typeof window !== "undefined") {
      const visited = sessionStorage.getItem("skyra_visited");
      if (visited) setIsReturning(true);
      sessionStorage.setItem("skyra_visited", "1");
      const savedLang = localStorage.getItem("skyra_lang");
      if (savedLang === "en" || savedLang === "id") setLang(savedLang);
    }
    const t = setTimeout(() => setSplashHide(true), 3200);
    return () => clearTimeout(t);
  }, []);

  // Persist lang choice
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("skyra_lang", lang);
    }
  }, [lang]);

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
          <div className="splash-title">SKYRA STORE</div>
          <div className="splash-sub">
            {isReturning ? "SILAHKAN LANJUT BERBELANJA" : "SELAMAT DATANG, GAMER"}
          </div>
        </div>
      )}

      <canvas id="stars" aria-hidden="true"></canvas>

      {/* ═══════════ TOP STRIP ═══════════ */}
      <div className="top-strip">
        <div className="top-menu">
          <Link href="/saldo">💰 Cek Saldo</Link>
          <Link href="/">🏠 Home</Link>
          <Link href="/lacak">📦 Lacak Pesanan</Link>
        </div>
        <div className="right">
          <div className="lang-sw">
            <button className={lang === "id" ? "on" : ""} onClick={() => setLang("id")}>ID</button>
            <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
          </div>
        </div>
      </div>

      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <img src={LOGO_URL} alt="Skyra" />
            <span className="brand">SKYRA STORE</span>
          </Link>
          <Link href="/login" className="nav-cta" style={{ marginLeft: "auto" }}>
            MASUK
          </Link>
        </div>
      </nav>

      {/* ═══════════ SEARCH BAR (full-width below nav) ═══════════ */}
      <div className="search-bar-wrap">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            placeholder="Cari game, voucher, atau jasa..."
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
              aria-label="Clear"
              className="search-clear"
            >
              ×
            </button>
          )}
          {search && searchFocus && filteredGames.length > 0 && (
            <div className="search-dropdown">
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
                        {g.external_url ? "↗ External" : "⚡ Instant"}
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
                <div className="sd-more">+{filteredGames.length - 8} hasil lain, scroll down ↓</div>
              )}
            </div>
          )}
          {search && searchFocus && filteredGames.length === 0 && (
            <div className="search-dropdown">
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
                    {!p.image_url && <div className="slide-art">✨</div>}
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
                  <div className="slide-title">Top Up Game Favoritmu</div>
                  <div className="slide-sub">Hemat · Cepat · Aman. QRIS, PayPal, Wise — proses instant.</div>
                </div>
                <div className="slide-art">🎮</div>
              </div>
            )}
          </div>
          {promos.length > 1 && (
            <>
              <button className="slider-nav prev" onClick={() => changeSlide(-1)} aria-label="Previous slide">
                ‹
              </button>
              <button className="slider-nav next" onClick={() => changeSlide(1)} aria-label="Next slide">
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
              <span className="ic">{c.icon}</span> {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="section" style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,.7)" }}>
          ⏳ Loading catalog...
        </div>
      ) : search ? (
        /* ─── SEARCH MODE: flat grid of filtered results ─── */
        <div className="section">
          <div className="sec-head">
            <h2>
              <span className="ic">🔍</span> Hasil pencarian: &quot;{search}&quot;
            </h2>
            <div className="meta">{filteredGames.length} game</div>
          </div>
          {filteredGames.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.7)" }}>
              📭 Ga ada game yang cocok dengan &quot;{search}&quot;. Coba kata lain ya.
            </div>
          ) : (
            <div className="games-grid">
              {filteredGames.map((g) => (
                <GameCard key={g.id} g={g} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ═══════════ SPECIAL OFFER (always show when 'all' or 'mobile') ═══════════ */}
          {(cat === "all" || cat === "mobile") &&
            games.filter((g) => g.is_special_offer).length > 0 && (
              <div className="section">
                <div className="sec-head">
                  <h2>
                    <span className="ic">⭐</span> Special Offer
                  </h2>
                  <div className="meta">🔥 Handle by Skyra</div>
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
                  <h2>
                    <span className="ic">🎯</span> Joki Skyra
                  </h2>
                  <div className="meta">⚔️ Jasa Pribadi</div>
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
                  <h2>
                    <span className="ic">📱</span> Semua Mobile Game
                  </h2>
                  <div className="meta">
                    {games.filter((g) => g.category === "mobile" && !g.is_special_offer).length} game
                  </div>
                </div>
                <div className="games-grid">
                  {games
                    .filter((g) => g.category === "mobile" && !g.is_special_offer)
                    .map((g) => (
                      <GameCard key={g.id} g={g} />
                    ))}
                </div>
              </div>

              {/* Voucher section */}
              {games.filter((g) => g.category === "voucher").length > 0 && (
                <div className="section">
                  <div className="sec-head">
                    <h2>
                      <span className="ic">🎫</span> Voucher &amp; PC Games
                    </h2>
                    <div className="meta">
                      {games.filter((g) => g.category === "voucher").length} voucher
                    </div>
                  </div>
                  <div className="games-grid">
                    {games
                      .filter((g) => g.category === "voucher")
                      .map((g) => (
                        <GameCard key={g.id} g={g} />
                      ))}
                  </div>
                </div>
              )}
            </>
          ) : cat !== "joki" ? (
            /* Specific category (mobile / voucher / ppob) - flat grid */
            <div className="section">
              <div className="sec-head">
                <h2>
                  <span className="ic">
                    {CATEGORIES.find((c) => c.key === cat)?.icon}
                  </span>{" "}
                  {CATEGORIES.find((c) => c.key === cat)?.label}
                </h2>
                <div className="meta">{filteredGames.length} game</div>
              </div>
              {filteredGames.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.7)" }}>
                  📭 Belum ada game di kategori ini.
                </div>
              ) : (
                <div className="games-grid">
                  {filteredGames.map((g) => (
                    <GameCard key={g.id} g={g} />
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </>
      )}

      {/* ═══════════ FEATURES ═══════════ */}
      <div className="feats">
        {[
          { ic: "⚡", t: "Instant Delivery", d: "Otomatis proses <5 menit" },
          { ic: "💰", t: "Harga Termurah", d: "Auto-check multi supplier" },
          { ic: "🛡️", t: "Refund 100%", d: "Gagal = balik modal" },
          { ic: "⭐", t: "4.9/5 Rating", d: "1000+ customer puas" },
        ].map((f, i) => (
          <div key={i} className="feat">
            <div className="feat-ic">{f.ic}</div>
            <div>
              <div className="feat-t">{f.t}</div>
              <div className="feat-d">{f.d}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer>
        <div className="cols">
          <div className="col">
            <div className="brand-row">
              <img src={LOGO_URL} alt="Skyra" />
              <span>SKYRA STORE</span>
            </div>
            <p>Top-up game terpercaya untuk Sky: Children of the Light, Mobile Legends, Free Fire & lainnya. Hemat, instant, 24/7.</p>
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: ".72rem" }}>📸 @skyra_store2 · 💬 6285183346300</p>
          </div>
          <div className="col">
            <h4>Layanan</h4>
            <Link href="/">Top Up Game</Link>
            <Link href="/">Heart Service</Link>
            <Link href="/">Run Service</Link>
            <Link href="/">Voucher</Link>
          </div>
          <div className="col">
            <h4>Bantuan</h4>
            <Link href="/">Cara Order</Link>
            <Link href="/">Lacak Order</Link>
            <Link href="/">Refund Policy</Link>
            <Link href="/">FAQ</Link>
          </div>
          <div className="col">
            <h4>Tentang</h4>
            <Link href="/">Tentang Kami</Link>
            <Link href="/">Blog</Link>
            <Link href="/">Syarat Layanan</Link>
            <Link href="/">Privasi</Link>
          </div>
        </div>
        <div className="copy">© 2026 Skyra Store · All rights reserved</div>
      </footer>
    </>
  );
}
