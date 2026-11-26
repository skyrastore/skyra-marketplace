# CLAUDE.md — Skyra Store (handoff dari Claude chat)

> Taruh file ini di root project dengan nama `CLAUDE.md` supaya Claude Code membacanya otomatis.
> Versi: **26/11/2026 sore**. Versi ini menggantikan CLAUDE.md sebelumnya.
> Bahasa user: **Indonesia**, santai. User ngoding pakai **JavaScript**. User kerja sendirian dan gampang capek:
> jelaskan singkat, kerjakan step-by-step, cek ulang hasil sebelum bilang "beres".
> **Pembagian kerja:** sheet diurus di Claude chat. Claude Code mengurus web, sync, dan Supabase, dan menerima sheet apa adanya.

---

## 1. Konteks bisnis

**Skyra Store** adalah toko top-up dan jasa game. Owner: seinaaru@gmail.com, IG @skyra_store2.

| Produk | Modal dari | Harga jual |
|---|---|---|
| **Sky Gift (IAP)** | Saldo Nintendo per gifter (FIFO per lot top-up) | Tier per $ (sheet HARGA di INTERNAL), CEILING ke 250 *(belum dirapikan)* |
| **Sky Login** | Saldo iTunes | Tier per $ (INTERNAL) *(belum dirapikan)* |
| **Sky ID** | Adstore. Modal reseller = harga web × 156000/160500 | modal + Rp500 × USD *(belum dirapikan)* |
| **Heartopia Login** | Saldo iTunes. Rate modal = rata-rata rate top-up iTunes | (rate modal + markup) × USD. NON VIP +Rp1.250/$, VIP +Rp1.000/$. Flat untuk semua nominal |
| **Heartopia Adstore (via ID)** | Adstore. Modal = harga web × 78500/80500 | modal + markup × USD. NON VIP +Rp750/$, VIP +Rp500/$ |
| **Roblox Login** | Saldo Xbox (FIFO; nama akun Xbox rahasia, admin tidak boleh tahu) | ROUND(USD) × (rate modal Xbox aktif + markup). NON VIP +Rp1.250/$, VIP +Rp1.000/$ |
| **Roblox USN** | Adstore, rate per 100 Robux (dari riwayat harga) | (rate + Rp1.250) NON VIP / (rate + Rp1.000) VIP per 100 Robux |
| **MLBB Indonesia** | Mobapay (harga diskon, diketik manual, pengingat tiap Minggu) | Diamond: modal × 1,05 (VIP sementara sama), tanpa pembulatan. Starlight: modal + Rp2.500. WDP & bundle: harga manual ikut poster |
| **Heart (Sky)** & **Joki (Sky)** | Spreadsheet sistem masing-masing (auto import) | — |
| **App premium** (CapCut, Canva, Netflix, dll) | Manual | Manual |

**Denom Xbox Roblox:** hanya 80 ($0,99), 500 ($4,99), 1000 ($9,99), 2000 ($19,99). Paket lain digabung mulai dari pecahan terbesar dulu. Contoh: 5000 = 2000+2000+1000 = $49,97, dan 10000 = 2000×5 = $99,95.

**Fee bayar (kolom BAYAR di HARIAN):**
- QRIS > Rp100rb → ×0,993
- GOPAY POT 1K → −1.000
- PAYPAL → $ × 17.000
- QRIS DANA, BCA, GOPAY NON POT → tanpa potongan

**Konversi Rp → PayPal $:** Rp ÷ rate PayPal (Rp15.500, sel `'HEARTOPIA LOGIN'!L8`), lalu MROUND 0,25.

---

## 2. File Google Sheets (milik seinaaru@gmail.com)

| File | ID | Fungsi |
|---|---|---|
| **LAPORAN PENDAPATAN HARIAN (LPH)**, privat owner | `1yPOht7AnkxZZoVox2dAS0Rjaj4dEDju3RocXg47Q31o` | Pembukuan, database harga, saldo, order web |
| **INTERNAL**, dipakai admin | `1ZDuwoMd21RkyTna2HMESWr1N2xgknCFCJP3kWvcdJ0c` | Order IAP Sky, harga Sky, saldo gifter (tanpa modal) |
| **JEMBATAN SALDO** | `1xSKhaeeR8ycP84L87S88CVdupnzp6B-NUBspO5WZgiA` | `IMPORTRANGE(LPH, "GIFTER!A2:B8")` → INTERNAL |
| **SkyraHeartStore_System** | `1__dPrf7SWd0EiLQmZJYplaXH-mAr0W1WHqbHnQHuHVQ` | Order Heart (MASTER_ORDERS) |
| **SkyraJokiStore_System** | `1xTWg6BsnOEM8TMjzsjF5pm6UVdYwX_x5Icxb6oeTnno` | Order Joki (JOKI_ORDERS) |

**⚠️ Locale Indonesia:** pemisah argumen rumus `;`, desimal `,`.
**Iterative calculation = ON (max 20)** di LPH. Ini wajib, karena dipakai untuk tanggal otomatis dan kunci harga (rumus yang merujuk dirinya sendiri).

### 2a. Standar layout sheet harga (Roblox, Heartopia, MLBB)

- Baris 1 judul, baris 2 legenda, baris 4 header tabel hijau, data mulai **baris 5**.
- Kotak **PENGATURAN** ada di kolom kanan (I:J atau K:L).
- 🟨 **Sel kuning = isi manual** (header bertanda ✏️). Sel putih = rumus, jangan ditulis.
- Setiap sheet supplier punya **tabel RIWAYAT perubahan harga** di bawahnya.

### 2b. Sheet di LPH

1. **HARIAN** (Table1, A:O + P tersembunyi): **hanya untuk order manual** (WA, joki, item tanpa kerangka).
2. **RINGKASAN** — laba per tanggal + per kategori (sudah termasuk ORDER WEB).
3. **HEART** / **JOKI** — import dari sistem masing-masing.
4. **GIFT SKY** — import IAP dari INTERNAL, modal FIFO per gifter.
5. **HEARTOPIA LOGIN** — tabel A5:I21, pengaturan L5:L8, saldo L11:L18, riwayat A25+.
6. **HEARTOPIA ADSTORE** — tabel A5:I21, pengaturan L5:L8, riwayat A26:E (task pagi + onEdit manual).
7. **HEARTOPIA_OLD** (hidden): sheet lama, sudah tidak dirujuk. Akan dihapus.
8. **ID SKY** — belum dirapikan.
9. **ROBLOX LOGIN** — tabel A5:G24, pengaturan J5:J8, saldo J11:J18, riwayat A27+.
10. **ROBLOX USN** — tabel A5:F26, J5 rate modal aktif, riwayat A29:D.
11. **MLBB** — tabel A5:I41, pengaturan L5:L7, riwayat A45:E via onEdit kolom D.
12. **CANVA** — daftar member.
13. **KATA KUNCI** — pemetaan kata ke kategori.
14. **PRODUK** — ARRAYFORMULA/VSTACK: `ITEM | KATEGORI | MODAL | HARGA JUAL (NON VIP) | USD ITUNES | USD XBOX | HARGA VIP`.
15. **KATALOG WEB** — Heartopia untuk web, baris 2–14. SUMBER auto LOGIN/ADSTORE/HABIS.
16. **STOK SALDO** — ledger top-up. Kolom L JENIS = XBOX / ITUNES / NINTENDO.
17. **GIFTER** — saldo per gifter. **Jangan rename** (dipakai JEMBATAN SALDO).
18. **ORDER WEB** (baru): semua order dari web.
    - A–K diisi script `upsertOrder`: WAKTU, ORDER CODE, GAME (slug), PRODUK, QTY, SUBTOTAL, DISKON, TOTAL BAYAR, FEE, METODE, STATUS.
    - L–S dihitung rumus: TANGGAL, ITEM, KATEGORI, SUMBER, MODAL, USD XBOX, USD ITUNES, LABA. Modal, USD, dan sumber **dikunci saat baris masuk**.
    - Status yang dihitung labanya: done / paid / fulfilling.
    - Ikut dihitung di RINGKASAN, di terpakai Xbox (ROBLOX LOGIN J14), dan di terpakai iTunes (HEARTOPIA LOGIN L13).
    - Rumus sudah terpasang sampai baris 2001. Cari baris kosong lewat kolom B, **jangan pakai `getLastRow()`**.

---

## 3. Otomasi yang sudah jalan

**Scheduled task Claude (claude.ai), jam WIB:**

| Jam | Tugas |
|---|---|
| 08:40 | Update Harga ID Sky → `ID SKY!B`. *Belum ada riwayat, nanti saat Sky dirapikan.* |
| 08:45 | Update Harga Robux USN → menambah baris di riwayat `ROBLOX USN!A29:D` kalau harga /100 berubah. |
| 08:50 | Update Harga Heartopia ID → menulis `HEARTOPIA ADSTORE!D5:D21` dan menambah riwayat A27+. Juga melaporkan nama paket yang hilang atau baru. |
| Minggu 08:52 | Pengingat cek Mobapay (hanya baca MLBB A4:I41 + riwayat). |

**Apps Script di LPH (satu project, 3 file):**
- `Sync Web.gs` (punya Claude Code): `doGet` pricelist (PRODUK + KATALOG WEB), `doPost upsert_order` → ORDER WEB.
- `Notif Telegram.gs` v6: notif perubahan harga (PANTAU: ID SKY, ROBUX USN, ROBUX LOGIN, MLBB, HEARTOPIA ADSTORE, HEARTOPIA LOGIN) dan pengingat Mobapay. Token ada di Script Properties `TG_TOKEN` / `TG_CHAT_ID`. **JANGAN tulis token di kode atau commit.**
- `Riwayat Harga.gs`: simple trigger **`onEdit`** yang mencatat ketikan manual di MLBB!D5:D41 dan HEARTOPIA ADSTORE!D5:D21 ke tabel riwayat.
  - ⚠️ **Jangan bikin fungsi `onEdit` lain** di project ini, karena akan bentrok.

**Catatan sumber harga:** adstore.id ada di belakang Cloudflare, jadi IMPORTRANGE/IMPORTXML diblokir. Mobapay adalah halaman JS yang tidak bisa dibaca otomatis.

---

## 4. TODO (sheet, dikerjakan di Claude chat)

1. **Sky**: rapikan gift, ID, dan login ke standar layout, tambah VIP dan riwayat. Termasuk PO via ID (buffer harga belum diputuskan).
2. Hapus HEARTOPIA_OLD setelah user cek.
3. Data entry yang perlu dicek user: SINDI 500 ROBUX 3× (dobel?), DITERIMA kosong di GIFT SKY, saldo real gifter, status IAP masih PENDING.
4. App premium: belum ada database.

## 5. Web (dikerjakan Claude Code)

- Stack: Next.js (`skyra-marketplace`), Supabase (`xyqgopojgnimiisitfvw`), Cloudflare Pages, poller VPS `skyra-sync` (tiap 5 menit, sumber data dari Apps Script `pricelist`).
- Midtrans: menunggu approval, sekarang masih sandbox. **Jangan kirim order sandbox ke sheet.**
- `Sync Web.gs` versi `upsertOrder` → ORDER WEB sudah di-deploy.
- Bersih-bersih produk sampah di tabel `products` (is_available = false): `46337 Robux`, `46352 Robux` ×2, `Rate /$ (auto dari tabel bawah) Robux`.

---

## 6. Komunikasi dengan Claude Chat — tab **CATATAN AI** (di LPH)

- Ini papan pesan dua arah. Kolomnya: WAKTU | DARI | UNTUK | TOPIK | PESAN | STATUS (BARU/DIBACA/SELESAI) | BALASAN.
- **Setiap mulai sesi, baca dulu tab CATATAN AI.** Pesan yang `UNTUK = Claude Code` dan `STATUS = BARU` dikerjakan atau dibalas, lalu STATUS-nya diubah.
- Pertanyaan untuk Claude Chat ditulis sebagai baris baru di bawah, dengan `UNTUK = Claude Chat`, `STATUS = BARU`. Owner akan bilang "cek CATATAN AI" ke Claude Chat.
- Jangan hapus baris lama. Jangan tulis password atau token di sini.

## 7. Aturan kerja

- **Setiap perubahan harga di supplier harus langsung tercatat di tabel RIWAYAT** (tanggal, item/paket, harga lama, harga baru). Hanya catat yang berubah. Ini permintaan tegas owner.
- **Jangan rename sheet atau judul kolom** tanpa memperbarui semua referensi (rumus, IMPORTRANGE, task, script).
- **Jangan copy-paste atau geser baris di HARIAN maupun ORDER WEB**, karena keduanya memakai rumus yang merujuk dirinya sendiri.
- Jangan ubah nama item yang sudah pernah dipesan, karena pencarian harga memakai nama.
- Admin (INTERNAL) tidak boleh melihat modal, laba, atau nama akun Xbox.
- Setiap perubahan besar: catat angka RINGKASAN sebelum dan sesudah, lalu pastikan sama (kecuali memang disengaja).
- Jangan commit kredensial.
- Snapshot 26/11/2026 sore: **RINGKASAN BERSIH −Rp3.592.995**. Laba hari itu termasuk entri HEART +Rp6.000.
