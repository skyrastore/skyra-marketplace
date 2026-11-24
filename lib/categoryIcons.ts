// ═══════════════════════════════════════════════════════════
// Category Icons
// Paste Google Drive image URL per kategori (optional).
// Format URL: https://lh3.googleusercontent.com/d/FILE_ID
// (bukan https://drive.google.com/file/d/FILE_ID/view — ga bisa hotlink)
//
// Convert dari Google Drive share link:
//   Original: https://drive.google.com/file/d/ABC123/view?usp=sharing
//   Use:      https://lh3.googleusercontent.com/d/ABC123
//
// Kalau URL kosong (""), fallback ke emoji default.
// ═══════════════════════════════════════════════════════════

export const CATEGORY_ICON_URLS: Record<string, string> = {
  topup: "",       // 💎 — Diamond/UC/Gold icon
  weekly: "",      // 📆 — Weekly pack
  monthly: "",     // 🗓️ — Monthly bundle
  twilight: "",    // 🌙 — Twilight pass
  starlight: "",   // ⭐ — Starlight member
  season: "",      // 🏆 — Battle pass
  member: "",      // 💳 — Membership card
  bundle: "",      // 🎀 — Bundle/gift
  paket: "",       // 📦 — Paket
  first: "",       // 🎁 — First recharge bonus
};
