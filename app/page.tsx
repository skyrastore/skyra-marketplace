"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase, fmtIDR, type Game, type Promo } from "@/lib/supabase";

const LOGO_URL = "https://lh3.googleusercontent.com/d/1HmBuyY8D5ccBUUAP-GsCuiTNxpxsaDsu";

const CATEGORIES = [
  { key: "all", label: "Semua", icon: "🎮" },
  { key: "mobile", label: "Mobile Games", icon: "📱" },
  { key: "pc", label: "PC Games", icon: "💻" },
  { key: "voucher", label: "Voucher", icon: "🎫" },
  { key: "ppob", label: "PPOB", icon: "⚡" },
];

export default function Home() {
  const [splashHide, setSplashHide] = useState(false);
  const [slide, setSlide] = useState(0);
  const [cat, setCat] = useState<string>("all");
  const [promos, setPromos] = useState<Promo[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // Hide splash after animation
  useEffect(() => {
    const t = setTimeout(() => setSplashHide(true), 2000);
    return () => clearTimeout(t);
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

  const filteredGames = cat === "all" ? games : games.filter((g) => g.category === cat);

  return (
    <>
      {/* ═══════════ SPLASH SCREEN ═══════════ */}
      {!splashHide && (
        <div className="splash">
          <div className="splash-logo">
            <img src={LOGO_URL} alt="Skyra Store" />
          </div>
          <div className="splash-title">SKYRA STORE</div>
          <div className="splash-sub">TOP UP · HEART · RUN</div>
        </div>
      )}

      <canvas id="stars" aria-hidden="true"></canvas>

      {/* ═══════════ TOP STRIP ═══════════ */}
      <div className="top-strip">
        <div>⚡ INSTANT TOP UP · AMAN · TERPERCAYA</div>
        <div className="right">
          🇮🇩 Indonesia
          <div className="lang-sw">
            <button className="on">ID</button>
            <button>EN</button>
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
          <div className="nav-menu-main">
            <Link href="/">Game</Link>
            <Link href="/">Promo</Link>
            <Link href="/">Lacak</Link>
            <Link href="/">Bantuan</Link>
          </div>
          <div className="nav-search">
            <input placeholder="Cari game atau voucher..." />
          </div>
          <Link href="/login" className="nav-cta">
            MASUK
          </Link>
        </div>
      </nav>

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
                    <div className="slide-content">
                      <div className="slide-brand">SKYRA STORE</div>
                      <div className="slide-title" style={{ whiteSpace: "pre-line" }}>
                        {p.title}
                      </div>
                      {p.subtitle && <div className="slide-sub">{p.subtitle}</div>}
                      {p.cta_text && (
                        <span className="slide-cta">
                          {p.cta_text} →
                        </span>
                      )}
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

      {/* ═══════════ GAME GRID (from Supabase LIVE) ═══════════ */}
      <div className="section">
        <div className="sec-head">
          <h2>
            <span className="ic">🎮</span>
            {cat === "all" ? "Semua Game" : CATEGORIES.find((c) => c.key === cat)?.label}
          </h2>
          <div className="meta">{loading ? "Loading..." : `${filteredGames.length} game`}</div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,.7)" }}>
            ⏳ Loading catalog...
          </div>
        ) : filteredGames.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,.7)" }}>
            📭 Belum ada game di kategori ini.
          </div>
        ) : (
          <div className="games-grid">
            {filteredGames.map((g) => (
              <Link href={`/game/${g.slug}`} key={g.id} className="gg-card">
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
              </Link>
            ))}
          </div>
        )}
      </div>

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
