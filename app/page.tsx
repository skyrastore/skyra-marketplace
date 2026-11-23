"use client";
import { useState, useEffect, useRef } from "react";

type Slide = { bg: string; brand: string; title: string; sub: string; period: string; cta: string; emoji: string };
const SLIDES: Slide[] = [
  { bg: "slide-1", brand: "SKYRA STORE", title: "PILIH PAKETMU,\nHEMAT MAKSIMAL!", sub: "Diskon spesial semua Season Pass & Candle Sky — hemat sampai 15%", period: "📅 Periode: 23 Nov - 7 Des 2026", cta: "BACA SELENGKAPNYA", emoji: "☁️" },
  { bg: "slide-2", brand: "PROMO SPESIAL", title: "HEARTOPIA LAUNCH\nDISKON 20%!", sub: "Game baru, harga perkenalan — buruan sebelum habis", period: "🔥 Terbatas sampai 30 Nov", cta: "AMBIL PROMO", emoji: "💖" },
  { bg: "slide-3", brand: "CASHBACK HARIAN", title: "BAYAR PAKAI QRIS,\nDAPAT CASHBACK 5%", sub: "Berlaku setiap hari untuk semua top-up game", period: "💚 Cashback otomatis masuk saldo", cta: "PELAJARI LEBIH", emoji: "💳" },
];

type Game = { id: string; name: string; pub: string; icon: string; theme: string; price: string; badge?: string; offer?: boolean };
const SELULER: Game[] = [
  { id: "mlbb", name: "Mobile Legends: BB", pub: "Moonton", icon: "⚔️", theme: "mlbb", price: "1.810", badge: "hot" },
  { id: "ff", name: "Free Fire", pub: "Garena", icon: "🔥", theme: "ff", price: "1.000", badge: "hot" },
  { id: "bloodstrike", name: "Blood Strike", pub: "NetEase", icon: "⚡", theme: "bloodstrike", price: "14.000" },
  { id: "magicchess", name: "Magic Chess: Go Go", pub: "Vizta Games", icon: "♟️", theme: "magicchess", price: "2.004" },
  { id: "hsr", name: "Honkai: Star Rail", pub: "HoYoverse", icon: "⭐", theme: "hsr", price: "16.000", badge: "promo", offer: true },
  { id: "efootball", name: "eFootball Manager", pub: "Nordeus", icon: "⚽", theme: "efootball", price: "27.550", badge: "promo", offer: true },
  { id: "roblox", name: "Roblox", pub: "Roblox Corp", icon: "🎲", theme: "roblox", price: "16.000", badge: "pop" },
  { id: "sky", name: "Sky: CotL", pub: "TGC", icon: "☁️", theme: "sky", price: "49.860", badge: "hot" },
  { id: "heartopia", name: "Heartopia", pub: "Indie", icon: "💖", theme: "heartopia", price: "15.000", badge: "new" },
  { id: "genshin", name: "Genshin Impact", pub: "HoYoverse", icon: "⭐", theme: "genshin", price: "15.500" },
  { id: "pubg", name: "PUBG Mobile", pub: "Tencent", icon: "🎯", theme: "pubg", price: "12.500" },
  { id: "cod", name: "Call of Duty: M", pub: "Activision", icon: "💥", theme: "cod", price: "14.000" },
];
const PC: Game[] = [
  { id: "steam", name: "Steam Wallet", pub: "Valve", icon: "🎮", theme: "steam", price: "15.000", badge: "hot" },
  { id: "valorant", name: "Valorant", pub: "Riot Games", icon: "💥", theme: "valorant", price: "13.500", badge: "hot" },
  { id: "lol", name: "League of Legends", pub: "Riot Games", icon: "⚔️", theme: "lol", price: "12.000" },
  { id: "dota", name: "Dota 2", pub: "Valve", icon: "🛡️", theme: "dota", price: "15.000" },
  { id: "psn", name: "PSN Card", pub: "Sony", icon: "🎮", theme: "psn", price: "75.000", badge: "promo", offer: true },
  { id: "genshinpc", name: "Genshin Impact PC", pub: "HoYoverse", icon: "⭐", theme: "genshin", price: "15.500" },
  { id: "hsrpc", name: "Honkai Star Rail PC", pub: "HoYoverse", icon: "⭐", theme: "hsr", price: "16.000" },
  { id: "efootballpc", name: "eFootball PC", pub: "Konami", icon: "⚽", theme: "efootball", price: "14.000" },
  { id: "netflix", name: "Netflix", pub: "Netflix", icon: "🎬", theme: "netflix", price: "54.000" },
  { id: "spotify", name: "Spotify Premium", pub: "Spotify AB", icon: "🎵", theme: "spotify", price: "54.990" },
  { id: "google", name: "Google Play Card", pub: "Google", icon: "🎮", theme: "steam", price: "20.000" },
  { id: "itunes", name: "iTunes Gift Card", pub: "Apple", icon: "🎮", theme: "psn", price: "75.000" },
];

export default function Home() {
  const [slide, setSlide] = useState(0);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);

  const changeSlide = (dir: number) => setSlide((s) => (s + dir + SLIDES.length) % SLIDES.length);
  const popScroll = (dir: number) => popRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });

  return (
    <>
      <div className="top-strip">
        <div>⚡ INSTANT TOP UP! INSTANT PLAY!</div>
        <div className="right">
          🇮🇩 Indonesia
          <select defaultValue="ID"><option>ID</option><option>EN</option></select>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-inner">
          <a href="#" className="nav-logo">SKYRA STORE</a>
          <div className="nav-menu-main">
            <a href="#">Game</a>
            <a href="#">Promo & Acara</a>
            <a href="#">Heart Service</a>
            <a href="#">Lacak Order</a>
          </div>
          <div className="nav-search">
            <input placeholder="Cari di Skyra Store..." />
          </div>
          <a href="#" className="nav-cta">MASUK</a>
        </div>
      </nav>

      <div className="hero-wrap">
        <div className="hero-slider">
          <div className="slides" style={{ transform: `translateX(-${slide * 100}%)` }}>
            {SLIDES.map((s, i) => (
              <div key={i} className={`slide ${s.bg}`}>
                <div className="slide-left">
                  <div className="slide-brand">{s.brand}</div>
                  <div className="slide-title" style={{ whiteSpace: "pre-line" }}>{s.title}</div>
                  <div className="slide-sub">{s.sub}</div>
                  <div className="slide-period">{s.period}</div><br />
                  <a href="#" className="slide-cta">{s.cta}</a>
                </div>
                <div className="slide-right">{s.emoji}</div>
              </div>
            ))}
          </div>
          <button className="slider-nav prev" onClick={() => changeSlide(-1)}>‹</button>
          <button className="slider-nav next" onClick={() => changeSlide(1)}>›</button>
          <div className="slider-dots">
            {SLIDES.map((_, i) => (
              <button key={i} className={`dot ${slide === i ? "on" : ""}`} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="sec-card">
          <div className="sec-head"><h2>Exclusive Offers</h2><a href="#" className="sec-more">Lainnya ›</a></div>
          <div className="offers">
            <div className="offer-card">
              <div className="offer-head">
                <div className="offer-ic mlbb">⚔️<span className="offer-disc">15%</span></div>
                <div className="offer-info"><div className="offer-name">Mobile Legends: Bang Bang</div><div className="offer-sub">Weekly Diamond Pass</div></div>
              </div>
              <div className="offer-price-row"><div className="offer-price">IDR 25.500</div><div className="offer-orig">30.000</div></div>
            </div>
            <div className="offer-card">
              <div className="offer-head">
                <div className="offer-ic sky">☁️<span className="offer-disc">10%</span></div>
                <div className="offer-info"><div className="offer-name">Sky: Children of the Light</div><div className="offer-sub">35 Season Candles</div></div>
              </div>
              <div className="offer-price-row"><div className="offer-price">IDR 144.900</div><div className="offer-orig">161.000</div></div>
            </div>
            <div className="offer-card">
              <div className="offer-head">
                <div className="offer-ic roblox">🎲<span className="offer-disc">8%</span></div>
                <div className="offer-info"><div className="offer-name">Roblox</div><div className="offer-sub">500 Robux via Xbox</div></div>
              </div>
              <div className="offer-price-row"><div className="offer-price">IDR 73.600</div><div className="offer-orig">80.000</div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="sec-head">
          <h2>Game Populer</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="scroll-btn" onClick={() => popScroll(-1)}>‹</button>
            <button className="scroll-btn" onClick={() => popScroll(1)}>›</button>
          </div>
        </div>
        <div className="popular-wrap">
          <div className="popular-scroll" ref={popRef}>
            {[
              { theme: "mlbb", emoji: "⚔️", logo: "MOBILE LEGENDS", name: "Mobile Legends: BB" },
              { theme: "ff", emoji: "🔥", logo: "FREE FIRE", name: "Free Fire" },
              { theme: "pb", emoji: "☁️", logo: "SKY: COTL", name: "Sky: Children of the Light" },
              { theme: "efootball", emoji: "⚽", logo: "eFOOTBALL", name: "eFootball 2026" },
              { theme: "roblox", emoji: "🎲", logo: "ROBLOX", name: "Roblox" },
              { theme: "gta", emoji: "🚗", logo: "GTA VI", name: "Grand Theft Auto VI" },
              { theme: "pubg", emoji: "🎯", logo: "PUBG MOBILE", name: "PUBG Mobile" },
            ].map((p, i) => (
              <div key={i} className="pop-card">
                <div className={`pop-art ${p.theme}`}>
                  <div className="pop-art-emoji">{p.emoji}</div>
                  <div className="pop-art-logo">{p.logo}</div>
                </div>
                <div className="pop-foot">
                  <div className="pop-name">{p.name}</div>
                  <button className="pop-btn">Top Up</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {[
        { title: "Game Seluler", items: SELULER },
        { title: "Game PC & Console", items: PC },
      ].map((sec, si) => (
        <div className="section" key={si}>
          <div className="sec-card">
            <div className="sec-head"><h2>{sec.title}</h2><a href="#" className="sec-more">Lainnya ›</a></div>
            <div className="games-grid">
              {sec.items.map((g) => (
                <div key={g.id} className="gg-card">
                  <div className={`gg-ic ${g.theme}`}>
                    {g.icon}
                    {g.badge && <span className={`gg-promo ${g.badge}`}>{g.badge === "promo" ? "Promo" : g.badge.toUpperCase()}</span>}
                  </div>
                  <div className="gg-info">
                    <div className="gg-name">{g.name}</div>
                    <div className="gg-pub">{g.pub}</div>
                    <div className="gg-price">dari <b>IDR {g.price}</b></div>
                    {g.offer && <div className="gg-offer">Up To 5% Off</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="sec-foot"><button className="load-more">Lebih Banyak</button></div>
          </div>
        </div>
      ))}

      <div className="feats">
        {[
          { ic: "⚡", t: "Instant Delivery", d: "Otomatis proses <5 menit" },
          { ic: "💰", t: "Harga Termurah", d: "Auto-check 10+ supplier" },
          { ic: "🛡️", t: "Refund 100%", d: "Gagal = balik modal" },
          { ic: "⭐", t: "4.9/5 Rating", d: "1000+ customer puas" },
        ].map((f, i) => (
          <div key={i} className="feat">
            <div className="feat-ic">{f.ic}</div>
            <div><div className="feat-t">{f.t}</div><div className="feat-d">{f.d}</div></div>
          </div>
        ))}
      </div>

      <footer>
        <div className="cols">
          <div className="col">
            <div className="brand-wrap"><span className="brand">SKYRA STORE</span></div>
            <p>Top-up game terpercaya di Indonesia. Hemat, aman, instant. Dari Sky sampai Mobile Legends — semua ada.</p>
            <p style={{ color: "var(--text-mute)", fontSize: ".72rem" }}>📸 @skyra_store2 · 💬 WhatsApp: 6285183346300</p>
          </div>
          <div className="col"><h4>Layanan</h4><a href="#">Top Up Game</a><a href="#">Heart Service</a><a href="#">Run Service</a><a href="#">Voucher Game</a><a href="#">Gift Card</a></div>
          <div className="col"><h4>Bantuan</h4><a href="#">Pusat Bantuan</a><a href="#">Cara Order</a><a href="#">Lacak Order</a><a href="#">Refund Policy</a><a href="#">FAQ</a></div>
          <div className="col"><h4>Tentang</h4><a href="#">Tentang Kami</a><a href="#">Blog</a><a href="#">Promo & Acara</a><a href="#">Syarat Layanan</a><a href="#">Privasi</a></div>
        </div>
        <div className="copy">© 2026 Skyra Store · All rights reserved</div>
      </footer>
    </>
  );
}
