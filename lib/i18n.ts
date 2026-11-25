// ═══════════════════════════════════════════════════════════
// Skyra i18n — simple ID/EN dictionary with useT() hook.
// Non-exhaustive: covers UI chrome (nav, sections, labels,
// buttons, toasts, status page). Game names/publishers/pricing
// are data and stay as-stored in DB.
// ═══════════════════════════════════════════════════════════

export type Lang = "id" | "en";

type Dict = Record<string, { id: string; en: string }>;

const T: Dict = {
  // ─── Nav ───
  "nav.home": { id: "Home", en: "Home" },
  "nav.track": { id: "Lacak Pesanan", en: "Track Order" },
  "nav.login": { id: "MASUK", en: "LOG IN" },
  "nav.back_home": { id: "← Beranda", en: "← Home" },
  "nav.vouchers": { id: "Kupon/Voucher", en: "Vouchers" },
  "nav.balance": { id: "Saldo", en: "Balance" },

  // ─── Carousel ───
  "carousel.belanja": { id: "Belanja Sekarang", en: "Shop Now" },

  // ─── Section Headers ───
  "sec.special_offer": { id: "Special Offer", en: "Special Offer" },
  "sec.handled_by_skyra": { id: "Handle by Skyra", en: "Handled by Skyra" },
  "sec.joki_skyra": { id: "Joki Skyra", en: "Boost Service" },
  "sec.personal_service": { id: "Jasa Pribadi", en: "Personal Service" },
  "sec.all_mobile": { id: "Semua Mobile Game", en: "All Mobile Games" },
  "sec.voucher_pc": { id: "Voucher & PC Games", en: "Vouchers & PC Games" },
  "sec.game_count": { id: "game", en: "games" },

  // ─── Features Grid ───
  "feat.instant.t": { id: "Instant Delivery", en: "Instant Delivery" },
  "feat.instant.d": { id: "Otomatis proses <5 menit", en: "Auto processed in <5 min" },
  "feat.cheap.t": { id: "Harga Termurah", en: "Best Prices" },
  "feat.cheap.d": { id: "Auto-check multi supplier", en: "Multi-supplier comparison" },
  "feat.refund.t": { id: "Refund 100%", en: "100% Refund" },
  "feat.refund.d": { id: "Gagal = balik modal", en: "Failed = money back" },
  "feat.rating.t": { id: "5.0/5 Rating", en: "5.0/5 Rating" },
  "feat.rating.d": { id: "1000+ customer puas", en: "1000+ happy customers" },

  // ─── Categories ───
  "cat.all": { id: "Semua", en: "All" },
  "cat.mobile": { id: "Mobile Games", en: "Mobile Games" },
  "cat.voucher": { id: "Voucher", en: "Vouchers" },
  "cat.ppob": { id: "PPOB", en: "Bills" },
  "cat.joki": { id: "Joki", en: "Boost" },

  // ─── Game Card CTA ───
  "card.topup_now": { id: "TOP UP SEKARANG", en: "TOP UP NOW" },
  "card.order_now": { id: "ORDER SEKARANG", en: "ORDER NOW" },
  "card.instant": { id: "Instant", en: "Instant" },
  "card.external": { id: "External", en: "External" },

  // ─── Search ───
  "search.placeholder": { id: "Cari game, voucher, atau jasa…", en: "Search games, vouchers, or services…" },
  "search.empty": { id: "Ga nemu nih. Coba keyword lain?", en: "Nothing found. Try another keyword?" },
  "search.more": { id: "hasil lain, scroll down", en: "more results, scroll down" },

  // ─── Carousel fallback ───
  "slide.default_title": { id: "Top Up Game Favoritmu", en: "Top Up Your Favorite Game" },
  "slide.default_sub": { id: "Instant, aman, harga termurah", en: "Instant, secure, best prices" },

  // ─── Toast messages (game detail checkout) ───
  "toast.voucher_not_found_t": { id: "Kode voucher tidak ditemukan", en: "Voucher code not found" },
  "toast.voucher_not_found_d": { id: "Cek ulang code atau mungkin sudah expired.", en: "Double-check the code or it may be expired." },
  "toast.voucher_expired": { id: "Voucher sudah expired", en: "Voucher expired" },
  "toast.voucher_used_up": { id: "Voucher sudah habis terpakai", en: "Voucher has been used up" },
  "toast.voucher_pick_pack": { id: "Pilih paket dulu sebelum apply voucher", en: "Select a package before applying voucher" },
  "toast.voucher_min_buy_t": { id: "Min belanja untuk voucher ini", en: "Minimum purchase for this voucher" },
  "toast.voucher_applied_t": { id: "Voucher diterapkan!", en: "Voucher applied!" },
  "toast.order_create_fail_t": { id: "Gagal buat order", en: "Failed to create order" },
  "toast.order_create_fail_d": { id: "Coba lagi dalam beberapa saat.", en: "Try again in a moment." },
  "toast.payment_not_ready_t": { id: "Payment belum siap", en: "Payment not ready yet" },
  "toast.payment_not_ready_d": { id: "Refresh halaman & coba lagi.", en: "Refresh page & try again." },
  "toast.payment_success": { id: "Pembayaran berhasil!", en: "Payment successful!" },
  "toast.payment_pending": { id: "Pembayaran pending — tunggu konfirmasi", en: "Payment pending — awaiting confirmation" },
  "toast.payment_fail_t": { id: "Pembayaran gagal", en: "Payment failed" },
  "toast.payment_fail_d": { id: "Coba lagi atau pakai WhatsApp fallback.", en: "Try again or use WhatsApp fallback." },
  "toast.network_err_t": { id: "Error jaringan", en: "Network error" },
  "toast.network_err_d": { id: "Cek koneksi & coba lagi.", en: "Check connection & retry." },
  "toast.creating_order": { id: "Membuat order…", en: "Creating order…" },

  // ─── Validation ───
  "validate.pick_pack": { id: "Pilih paket dulu", en: "Select a package first" },
  "validate.phone_required": { id: "Nomor WhatsApp wajib (min 9 digit)", en: "WhatsApp number required (min 9 digits)" },
  "validate.field_required": { id: "Isi field", en: "Please fill field" },

  // ─── Form placeholders ───
  "ph.voucher": { id: "Masukkan kode voucher", en: "Enter voucher code" },
  "ph.notes": { id: "Tulis catatan untuk admin...", en: "Write notes for admin..." },
  "ph.phone": { id: "08123456789", en: "08123456789" },

  // ─── Lacak toasts ───
  "track.toast_empty": { id: "Masukkan kode order dulu ya", en: "Please enter an order code" },
  "track.toast_bad_format_t": { id: "Format kode salah", en: "Wrong format" },
  "track.toast_bad_format_d": { id: "Contoh: SKY-20261125-A3F7B2", en: "Example: SKY-20261125-A3F7B2" },

  // ─── Game Detail ───
  "detail.step_input": { id: "Masukkan Data Akun", en: "Enter Account Data" },
  "detail.step_pack": { id: "Pilih Paket", en: "Select Package" },
  "detail.step_phone": { id: "Nomor WhatsApp", en: "WhatsApp Number" },
  "detail.phone_hint": { id: "Wajib. Buat notifikasi + kontak admin kalau ada pending.", en: "Required. For notifications + admin contact if pending." },
  "detail.qty": { id: "Jumlah Pesanan", en: "Order Quantity" },
  "detail.qty_hint": { id: "Order lebih dari 1 kali? Cukup atur qty — admin proses sekaligus.", en: "Need more than 1? Set qty — admin processes them together." },
  "detail.voucher": { id: "Kode Voucher", en: "Voucher Code" },
  "detail.optional": { id: "opsional", en: "optional" },
  "detail.voucher_placeholder": { id: "Masukkan kode voucher", en: "Enter voucher code" },
  "detail.voucher_check": { id: "CEK", en: "CHECK" },
  "detail.voucher_cancel": { id: "✕ Batal", en: "✕ Cancel" },
  "detail.voucher_save": { id: "hemat", en: "saved" },
  "detail.notes": { id: "Catatan Order", en: "Order Notes" },
  "detail.notes_hint": { id: "Contoh: proses malam ya, hati2 jangan ganti password, dsb.", en: "e.g.: process at night, don't change password, etc." },
  "detail.notes_placeholder": { id: "Tulis catatan untuk admin...", en: "Write notes for admin..." },
  "detail.summary": { id: "Ringkasan Order", en: "Order Summary" },
  "detail.game": { id: "Game", en: "Game" },
  "detail.package": { id: "Paket", en: "Package" },
  "detail.price": { id: "Harga", en: "Price" },
  "detail.subtotal": { id: "Subtotal", en: "Subtotal" },
  "detail.qty_label": { id: "Qty", en: "Qty" },
  "detail.voucher_label": { id: "Voucher", en: "Voucher" },
  "detail.admin_fee": { id: "Admin fee", en: "Admin fee" },
  "detail.total": { id: "TOTAL", en: "TOTAL" },
  "detail.pay_now": { id: "Bayar Sekarang", en: "Pay Now" },
  "detail.processing": { id: "Memproses…", en: "Processing…" },
  "detail.wa_fallback": { id: "Atau pesan via WhatsApp", en: "Or order via WhatsApp" },
  "detail.pay_tip": { id: "Klik Bayar Sekarang → pilih QRIS / E-Wallet / Bank Transfer / CC di popup. Otomatis diproses setelah bayar.", en: "Click Pay Now → pick QRIS / E-Wallet / Bank Transfer / CC in popup. Auto-processed after payment." },

  // ─── Hero Badges ───
  "badge.distributor": { id: "Garansi Aman", en: "Safety Guaranteed" },
  "badge.instant": { id: "Isi Ulang Instan", en: "Instant Top Up" },
  "badge.manual": { id: "Proses 0-120 menit", en: "0-120 min process" },
  "badge.secure": { id: "Pembayaran Aman", en: "Secure Payment" },

  // ─── Status Page ───
  "status.loading": { id: "Loading…", en: "Loading…" },
  "status.not_found_title": { id: "Order tidak ditemukan", en: "Order not found" },
  "status.not_found_desc": { id: "Kode order tidak terdaftar atau sudah dihapus.", en: "This order code isn't registered or has been removed." },
  "status.detail": { id: "Detail Order", en: "Order Details" },
  "status.code": { id: "Kode Order", en: "Order Code" },
  "status.method": { id: "Metode", en: "Method" },
  "status.wa_number": { id: "Nomor WA", en: "WhatsApp" },
  "status.diskon": { id: "Diskon", en: "Discount" },
  "status.contact_admin": { id: "Hubungi Admin via WhatsApp", en: "Contact Admin via WhatsApp" },
  "status.back_home": { id: "Kembali ke Beranda", en: "Back to Home" },
  "status.autorefresh": { id: "Status di-refresh otomatis tiap 5 detik…", en: "Status auto-refreshes every 5 seconds…" },
  "status.retry_tip": { id: "Belum bayar? Tutup tab ini & retry order dari halaman game.", en: "Not paid yet? Close this tab & retry from the game page." },
  "status.label.pending_payment": { id: "Menunggu Pembayaran", en: "Awaiting Payment" },
  "status.label.paid": { id: "Pembayaran Diterima", en: "Payment Received" },
  "status.label.fulfilling": { id: "Sedang Diproses", en: "Processing" },
  "status.label.done": { id: "Selesai", en: "Completed" },
  "status.label.failed": { id: "Gagal", en: "Failed" },
  "status.label.expired": { id: "Kadaluarsa", en: "Expired" },
  "status.label.cancelled": { id: "Dibatalkan", en: "Cancelled" },
  "status.desc.pending_payment": { id: "Silakan selesaikan pembayaran agar order dapat diproses.", en: "Please complete payment so the order can be processed." },
  "status.desc.paid": { id: "Pembayaran berhasil! Order sedang diproses otomatis…", en: "Payment successful! Order being processed automatically…" },
  "status.desc.fulfilling": { id: "Diamond/item sedang dikirim ke akun kamu…", en: "Diamonds/items are being sent to your account…" },
  "status.desc.done": { id: "Order berhasil! Cek akun game kamu — item sudah masuk.", en: "Order succeeded! Check your game account — items delivered." },
  "status.desc.failed": { id: "Order gagal diproses. Hubungi admin untuk refund atau retry.", en: "Order failed. Contact admin for refund or retry." },
  "status.desc.expired": { id: "Waktu pembayaran habis. Silakan buat order baru.", en: "Payment window expired. Please create a new order." },
  "status.desc.cancelled": { id: "Order dibatalkan.", en: "Order cancelled." },

  // ─── Lacak Page ───
  "track.title": { id: "Lacak Pesanan", en: "Track Order" },
  "track.subtitle": { id: "Masukkan kode order kamu di bawah untuk cek status real-time.", en: "Enter your order code below for real-time status." },
  "track.label": { id: "Kode Order", en: "Order Code" },
  "track.valid": { id: "✓ Format valid — klik Cek Status", en: "✓ Valid format — click Check Status" },
  "track.format_hint": { id: "Format: SKY-YYYYMMDD-XXXXXX (dari WhatsApp / email konfirmasi)", en: "Format: SKY-YYYYMMDD-XXXXXX (from WhatsApp / email confirmation)" },
  "track.submit": { id: "Cek Status Order", en: "Check Order Status" },
  "track.opening": { id: "Membuka…", en: "Opening…" },
  "track.help_title": { id: "Lupa kode order?", en: "Forgot your order code?" },
  "track.help_desc": { id: "Cek chat WhatsApp dari admin — kode order dikirim setelah pembayaran. Atau kontak admin via WhatsApp (tombol hijau di pojok kanan bawah).", en: "Check your WhatsApp chat from admin — the order code is sent after payment. Or contact admin via WhatsApp (green button at bottom-right)." },

  // ─── CS Button ───
  "cs.title": { id: "Hubungi Admin", en: "Contact Admin" },
  "cs.hours": { id: "24/7 · Response < 5 menit", en: "24/7 · Response < 5 min" },
  "cs.body": { id: "Punya pertanyaan atau butuh bantuan? Chat admin kami di WhatsApp!", en: "Need help or have a question? Chat with our admin on WhatsApp!" },
  "cs.start": { id: "Mulai Chat", en: "Start Chat" },
  "cs.preset": { id: "Halo admin Skyra, saya butuh bantuan untuk…", en: "Hi Skyra admin, I need help with…" },

  // ─── Splash ───
  "splash.title": { id: "SKYRA STORE", en: "SKYRA STORE" },
  "splash.returning": { id: "SILAHKAN LANJUT BERBELANJA", en: "WELCOME BACK, GAMER" },
  "splash.new": { id: "SELAMAT DATANG, GAMER", en: "WELCOME, GAMER" },
};

export function translate(key: string, lang: Lang): string {
  const entry = T[key];
  if (!entry) return key; // fallback: return the key if missing
  return entry[lang] ?? entry.id ?? key;
}

export function getStoredLang(): Lang {
  if (typeof window === "undefined") return "id";
  const v = localStorage.getItem("skyra_lang");
  return v === "en" ? "en" : "id";
}

export function setStoredLang(l: Lang) {
  if (typeof window === "undefined") return;
  localStorage.setItem("skyra_lang", l);
}
