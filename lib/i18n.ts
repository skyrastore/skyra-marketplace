// ═══════════════════════════════════════════════════════════
// Skyra copy dictionary — Indonesian-only (ID toggle removed
// 2026-11-25). Key names kept in their namespaces (nav, sec,
// detail, status, …) so the structure still documents where
// each string shows. translate() keeps its (key, lang?) shape
// so the handful of callers that still destructure `lang` from
// useI18n() don't break.
// ═══════════════════════════════════════════════════════════

export type Lang = "id";

const T: Record<string, string> = {
  // ─── Nav ───
  "nav.home": "Home",
  "nav.track": "Lacak Pesanan",
  "nav.login": "MASUK",
  "nav.back_home": "← Beranda",
  "nav.vouchers": "Kupon/Voucher",
  "nav.balance": "Saldo",

  // ─── Carousel ───
  "carousel.belanja": "Belanja Sekarang",

  // ─── Section Headers ───
  "sec.special_offer": "Special Offer",
  "sec.handled_by_skyra": "Handle by Skyra",
  "sec.joki_skyra": "Joki Games",
  "sec.personal_service": "Jasa Pribadi",
  "sec.all_mobile": "Semua Mobile Game",
  "sec.voucher_pc": "Voucher & PC Games",
  "sec.game_count": "game",

  // ─── Features Grid ───
  "feat.instant.t": "Instant Delivery",
  "feat.instant.d": "Otomatis proses <5 menit",
  "feat.cheap.t": "Harga Termurah",
  "feat.cheap.d": "Auto-check multi supplier",
  "feat.refund.t": "Refund 100%",
  "feat.refund.d": "Gagal = balik modal",
  "feat.rating.t": "5.0/5 Rating",
  "feat.rating.d": "1000+ customer puas",

  // ─── Categories ───
  "cat.all": "Semua",
  "cat.mobile": "Mobile Games",
  "cat.voucher": "Voucher",
  "cat.ppob": "PPOB",
  "cat.joki": "Joki",

  // ─── Game Card CTA ───
  "card.topup_now": "TOP UP SEKARANG",
  "card.order_now": "ORDER SEKARANG",
  "card.instant": "Instant",
  "card.external": "External",

  // ─── Search ───
  "search.placeholder": "Cari game, voucher, atau jasa…",
  "search.empty": "Ga nemu nih. Coba keyword lain?",
  "search.more": "hasil lain, scroll down",

  // ─── Carousel fallback ───
  "slide.default_title": "Top Up Game Favoritmu",
  "slide.default_sub": "Instant, aman, harga termurah",

  // ─── Toast messages (game detail checkout) ───
  "toast.voucher_not_found_t": "Kode voucher tidak ditemukan",
  "toast.voucher_not_found_d": "Cek ulang code atau mungkin sudah expired.",
  "toast.voucher_expired": "Voucher sudah expired",
  "toast.voucher_used_up": "Voucher sudah habis terpakai",
  "toast.voucher_pick_pack": "Pilih paket dulu sebelum apply voucher",
  "toast.voucher_min_buy_t": "Min belanja untuk voucher ini",
  "toast.voucher_applied_t": "Voucher diterapkan!",
  "toast.order_create_fail_t": "Gagal buat order",
  "toast.order_create_fail_d": "Coba lagi dalam beberapa saat.",
  "toast.payment_not_ready_t": "Payment belum siap",
  "toast.payment_not_ready_d": "Refresh halaman & coba lagi.",
  "toast.payment_success": "Pembayaran berhasil!",
  "toast.payment_pending": "Pembayaran pending — tunggu konfirmasi",
  "toast.payment_fail_t": "Pembayaran gagal",
  "toast.payment_fail_d": "Coba lagi atau pakai WhatsApp fallback.",
  "toast.network_err_t": "Error jaringan",
  "toast.network_err_d": "Cek koneksi & coba lagi.",
  "toast.creating_order": "Membuat order…",

  // ─── Validation ───
  "validate.pick_pack": "Pilih paket dulu",
  "validate.phone_required": "Nomor WhatsApp wajib (min 9 digit)",
  "validate.field_required": "Isi field",

  // ─── Form placeholders ───
  "ph.voucher": "Masukkan kode voucher",
  "ph.notes": "Tulis catatan untuk admin...",
  "ph.phone": "08123456789",

  // ─── Lacak toasts ───
  "track.toast_empty": "Masukkan kode order dulu ya",
  "track.toast_bad_format_t": "Format kode salah",
  "track.toast_bad_format_d": "Contoh: SKY-20261125-A3F7B2",

  // ─── Game Detail ───
  "detail.step_input": "Masukkan Data Akun",
  "detail.step_pack": "Pilih Paket",
  "detail.step_phone": "Nomor WhatsApp",
  "detail.phone_hint": "Wajib. Buat notifikasi + kontak admin kalau ada pending.",
  "detail.step_contact": "Nomor WhatsApp / Email",
  "detail.show_pass": "Lihat password",
  "detail.hide_pass": "Sembunyikan password",
  "contact.search_country": "Cari negara / kode…",
  "contact.no_match": "Tidak ada hasil",
  "a11y.clear": "Hapus",
  "a11y.prev_slide": "Slide sebelumnya",
  "a11y.next_slide": "Slide berikutnya",
  "a11y.open_menu": "Buka menu",
  "detail.contact_hint": "Wajib. Kami kontak kamu via WhatsApp atau Email kalau ada pending.",
  "detail.qty": "Jumlah Pesanan",
  "detail.qty_hint": "Order lebih dari 1 kali? Cukup atur qty — admin proses sekaligus.",
  "detail.voucher": "Kode Voucher",
  "detail.optional": "opsional",
  "detail.voucher_placeholder": "Masukkan kode voucher",
  "detail.voucher_check": "CEK",
  "detail.voucher_cancel": "✕ Batal",
  "detail.voucher_save": "hemat",
  "detail.notes": "Catatan Order",
  "detail.notes_hint": "Contoh: proses malam ya, hati2 jangan ganti password, dsb.",
  "detail.notes_placeholder": "Tulis catatan untuk admin...",
  "detail.summary": "Ringkasan Order",
  "detail.game": "Game",
  "detail.package": "Paket",
  "detail.price": "Harga",
  "detail.subtotal": "Subtotal",
  "detail.qty_label": "Qty",
  "detail.voucher_label": "Voucher",
  "detail.admin_fee": "Admin fee",
  "detail.total": "TOTAL",
  "detail.pay_now": "Bayar Sekarang",
  "detail.processing": "Memproses…",
  "detail.wa_fallback": "Atau pesan via WhatsApp",
  "detail.pay_tip": "Klik Bayar Sekarang → pilih QRIS / E-Wallet / Bank Transfer / CC di popup. Otomatis diproses setelah bayar.",

  // ─── Hero Badges ───
  "badge.distributor": "Garansi Aman",
  "badge.instant": "Isi Ulang Instan",
  "badge.manual": "Proses 0-120 Menit",
  "badge.secure": "Pembayaran Aman",

  // ─── Status Page ───
  "status.loading": "Loading…",
  "status.not_found_title": "Order tidak ditemukan",
  "status.not_found_desc": "Kode order tidak terdaftar atau sudah dihapus.",
  "status.detail": "Detail Order",
  "status.code": "Kode Order",
  "status.method": "Metode",
  "status.wa_number": "Nomor WA",
  "status.diskon": "Diskon",
  "status.contact_admin": "Hubungi Admin via WhatsApp",
  "status.back_home": "Kembali ke Beranda",
  "status.autorefresh": "Status di-refresh otomatis tiap 5 detik…",
  "status.retry_tip": "Belum bayar? Tutup tab ini & retry order dari halaman game.",
  "status.label.pending_payment": "Menunggu Pembayaran",
  "status.label.paid": "Pembayaran Diterima",
  "status.label.fulfilling": "Sedang Diproses",
  "status.label.done": "Selesai",
  "status.label.failed": "Gagal",
  "status.label.expired": "Kadaluarsa",
  "status.label.cancelled": "Dibatalkan",
  "status.desc.pending_payment": "Silakan selesaikan pembayaran agar order dapat diproses.",
  "status.desc.paid": "Pembayaran berhasil! Order sedang diproses otomatis…",
  "status.desc.fulfilling": "Diamond/item sedang dikirim ke akun kamu…",
  "status.desc.done": "Order berhasil! Cek akun game kamu — item sudah masuk.",
  "status.desc.failed": "Order gagal diproses. Hubungi admin untuk refund atau retry.",
  "status.desc.expired": "Waktu pembayaran habis. Silakan buat order baru.",
  "status.desc.cancelled": "Order dibatalkan.",

  // ─── Lacak Page ───
  "track.title": "Lacak Pesanan",
  "track.subtitle": "Masukkan kode order kamu di bawah untuk cek status real-time.",
  "track.label": "Kode Order",
  "track.valid": "✓ Format valid — klik Cek Status",
  "track.format_hint": "Format: SKY-YYYYMMDD-XXXXXX (dari WhatsApp / email konfirmasi)",
  "track.submit": "Cek Status Order",
  "track.opening": "Membuka…",
  "track.help_title": "Lupa kode order?",
  "track.help_desc": "Cek chat WhatsApp dari admin — kode order dikirim setelah pembayaran. Atau kontak admin via WhatsApp (tombol hijau di pojok kanan bawah).",

  // ─── Category Pills (game detail) ───
  "pack.topup": "Top Up",
  "pack.weekly": "Weekly Pass",
  "pack.monthly": "Monthly Pass",
  "pack.twilight": "Twilight Pass",
  "pack.starlight": "Starlight",
  "pack.season": "Season Pass",
  "pack.member": "Membership",
  "pack.bundle": "Bundle",
  "pack.paket": "Paket",
  "pack.first": "First Recharge",
  "pack.gamg": "GAMG",

  // ─── Footer ───
  "foot.desc": "Top-up game terpercaya untuk Sky: Children of the Light, Mobile Legends, Free Fire & lainnya. Hemat, instant, 24/7.",
  "foot.col_service": "Layanan",
  "foot.col_help": "Bantuan",
  "foot.col_about": "Tentang",
  "foot.topup": "Top Up Game",
  "foot.heart": "Heart Service",
  "foot.run": "Run Service",
  "foot.voucher": "Voucher",
  "foot.cara_order": "Cara Order",
  "foot.lacak": "Lacak Order",
  "foot.refund": "Refund Policy",
  "foot.faq": "FAQ",
  "foot.about": "Tentang Kami",
  "foot.blog": "Blog",
  "foot.tos": "Syarat Layanan",
  "foot.privacy": "Privasi",
  "foot.copy": "© 2026 Skyra Store · All rights reserved",

  // ─── CS Button ───
  "cs.title": "Hubungi Admin",
  "cs.hours": "24/7 · Response < 5 menit",
  "cs.body": "Punya pertanyaan atau butuh bantuan? Chat admin kami di WhatsApp!",
  "cs.start": "Mulai Chat",
  "cs.preset": "Halo admin Skyra, saya butuh bantuan untuk…",

  // ─── Splash ───
  "splash.title": "SKYRA STORE",
  "splash.returning": "SILAHKAN LANJUT BERBELANJA",
  "splash.new": "SELAMAT DATANG, GAMER",
};

// lang param kept for signature compatibility (useI18n still
// returns a `lang` value) but has no behavioural effect.
export function translate(key: string, _lang?: Lang): string {
  return T[key] ?? key;
}
