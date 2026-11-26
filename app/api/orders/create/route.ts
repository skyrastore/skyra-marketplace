// ═══════════════════════════════════════════════════════════
// POST /api/orders/create
// Body: { gameSlug, productId, phone?, email?, customData, notes?,
//         voucherCode?, qty?, useWallet? }
// Response (midtrans): { orderCode, snapToken, totalIdr, voucherDiscount }
// Response (wallet):   { orderCode, totalIdr, voucherDiscount, paid: true, newBalance }
// ═══════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSnapTransaction } from "@/lib/midtrans";
import { env } from "@/lib/env";

export const runtime = "edge";

type CreateOrderBody = {
  gameSlug: string;
  productId: string;
  phone?: string;
  email?: string;
  customData?: Record<string, unknown>;
  notes?: string;
  voucherCode?: string;
  qty?: number;
  useWallet?: boolean;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateOrderBody;

    if (!body.gameSlug || !body.productId) {
      return NextResponse.json({ error: "gameSlug & productId wajib diisi" }, { status: 400 });
    }

    // ─── Resolve auth user (optional — guest checkout stays supported) ───
    const auth = req.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    let userId: string | null = null;
    let userEmail: string | null = null;
    if (token) {
      const userClient = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: u } = await userClient.auth.getUser();
      if (u?.user) {
        userId = u.user.id;
        userEmail = u.user.email ?? null;
      }
    }

    // Wallet pay requires auth
    if (body.useWallet && !userId) {
      return NextResponse.json({ error: "Login dulu untuk bayar pakai Saldo" }, { status: 401 });
    }

    // ─── Contact validation ───
    // If paying with wallet AND signed in, we can lean on the user's email so
    // the phone/email requirement doesn't double-up as a guest-checkout gate.
    const rawPhone = (body.phone || "").trim();
    const rawEmail = (body.email || userEmail || "").trim();
    const cleanPhone = rawPhone ? rawPhone.replace(/[^\d+]/g, "") : "";
    const cleanEmail = rawEmail.toLowerCase();

    const phoneValid = cleanPhone && cleanPhone.replace(/\D/g, "").length >= 8;
    const emailValid = cleanEmail && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail);

    if (!phoneValid && !emailValid) {
      return NextResponse.json({ error: "Isi nomor WhatsApp (min 8 digit) atau Email yang valid" }, { status: 400 });
    }

    // ─── Fetch game + product ───
    const { data: game, error: gameErr } = await supabaseAdmin
      .from("games")
      .select("id, name, slug, is_active")
      .eq("slug", body.gameSlug)
      .single();

    if (gameErr || !game || !game.is_active) {
      return NextResponse.json({ error: "Game tidak ditemukan" }, { status: 404 });
    }

    const { data: product, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, name, price_idr, price_vip_idr, supplier, supplier_sku, is_available, game_id")
      .eq("id", body.productId)
      .single();

    if (prodErr || !product || product.game_id !== game.id) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }
    if (!product.is_available) {
      return NextResponse.json({ error: "Stok habis — item ini sedang tidak tersedia. Coba refresh halaman atau pilih denom lain." }, { status: 409 });
    }

    // ─── Qty ───
    const qty = product.supplier === "manual"
      ? Math.max(1, Math.min(100, Math.floor(Number(body.qty) || 1)))
      : 1;

    // ─── VIP detection (via claimed vip_mode voucher) ───
    // A VIP user owns an active voucher with vip_mode=true that lists this
    // game's slug in game_slugs. If so, we price the order at price_vip_idr
    // instead of price_idr (exact rate swap, no %/fixed discount applied).
    let isVipOrder = false;
    let vipVoucherCode: string | null = null;
    if (userId && product.price_vip_idr) {
      const { data: vipClaim } = await supabaseAdmin
        .from("vouchers_claimed")
        .select("voucher_code, voucher:vouchers!inner(code, is_active, vip_mode, game_slugs)")
        .eq("user_id", userId)
        .maybeSingle();
      const v = (vipClaim as unknown as { voucher?: { is_active: boolean; vip_mode: boolean; game_slugs: string[] | null } } | null)?.voucher;
      if (v?.is_active && v.vip_mode && (!v.game_slugs || v.game_slugs.length === 0 || v.game_slugs.includes(game.slug))) {
        isVipOrder = true;
        vipVoucherCode = (vipClaim as { voucher_code: string }).voucher_code;
      }
    }

    // Price per unit: VIP price when eligible, otherwise NON VIP
    const unitPrice = isVipOrder && product.price_vip_idr ? product.price_vip_idr : product.price_idr;
    const subtotal = unitPrice * qty;

    // ─── Regular voucher (non-VIP). Skip if VIP already applied — stacking
    // regular voucher ON TOP of VIP rate is a loss leader we don't want. ───
    let voucherDiscount = 0;
    let voucherCode: string | null = isVipOrder ? vipVoucherCode : null;
    if (body.voucherCode && !isVipOrder) {
      const code = body.voucherCode.trim().toUpperCase();
      const { data: voucher } = await supabaseAdmin
        .from("vouchers")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (voucher && !voucher.vip_mode) {
        const now = new Date();
        const expired = voucher.expires_at && new Date(voucher.expires_at) < now;
        const maxed = voucher.max_uses && voucher.used_count >= voucher.max_uses;
        const belowMin = voucher.min_purchase_idr && subtotal < voucher.min_purchase_idr;

        let claimedOK = true;
        if (userId) {
          const { data: claim } = await supabaseAdmin
            .from("vouchers_claimed")
            .select("voucher_code, used_at")
            .eq("user_id", userId)
            .eq("voucher_code", code)
            .maybeSingle();
          claimedOK = !!claim && !claim.used_at;
        }

        if (!expired && !maxed && !belowMin && claimedOK) {
          if (voucher.discount_type === "percentage") {
            voucherDiscount = Math.floor((subtotal * voucher.discount_value) / 100);
            if (voucher.max_discount_idr && voucherDiscount > voucher.max_discount_idr) {
              voucherDiscount = voucher.max_discount_idr;
            }
          } else {
            voucherDiscount = voucher.discount_value;
          }
          voucherCode = code;
        }
      }
    }

    const total = Math.max(0, subtotal - voucherDiscount);

    // ─── Generate order_code ───
    const { data: codeData, error: codeErr } = await supabaseAdmin.rpc("generate_order_code");
    if (codeErr || !codeData) {
      return NextResponse.json({ error: "Gagal generate order code" }, { status: 500 });
    }
    const orderCode = codeData as string;

    // Common order payload
    const baseOrder = {
      order_code: orderCode,
      user_id: userId,
      game_id: game.id,
      game_slug: game.slug,
      game_name: game.name,
      product_id: product.id,
      product_name: product.name,
      product_price_idr: product.price_idr,
      supplier: product.supplier,
      supplier_sku: product.supplier_sku,
      phone: phoneValid ? cleanPhone : null,
      email: emailValid ? cleanEmail : null,
      custom_data: body.customData || {},
      notes: body.notes || null,
      voucher_code: voucherCode,
      voucher_discount_idr: voucherDiscount,
      subtotal_idr: subtotal,
      total_idr: total,
      qty,
    };

    // ═══ BRANCH A: Pay with Wallet ═══
    if (body.useWallet) {
      // Insert order first (status=paid), then deduct via RPC. If RPC fails
      // we roll back the order row to keep ledger + orders consistent.
      const { data: orderRow, error: insErr } = await supabaseAdmin
        .from("orders")
        .insert({ ...baseOrder, payment_method: "wallet", status: "paid", paid_at: new Date().toISOString() })
        .select("id")
        .single();

      if (insErr || !orderRow) {
        console.error("Insert wallet-order error:", insErr);
        return NextResponse.json({ error: "Gagal menyimpan order" }, { status: 500 });
      }

      const { data: txRes, error: rpcErr } = await supabaseAdmin.rpc("apply_wallet_tx", {
        p_user_id: userId!,
        p_tx_type: "spend",
        p_amount_idr: -total,
        p_description: `Order ${orderCode} — ${game.name} · ${product.name}`,
        p_related_order_id: orderRow.id,
        p_midtrans_order_id: null,
      });

      if (rpcErr) {
        // Rollback order
        await supabaseAdmin.from("orders").delete().eq("id", orderRow.id);
        const msg = rpcErr.message.includes("Insufficient") ? "Saldo kamu kurang untuk order ini" : rpcErr.message;
        return NextResponse.json({ error: msg }, { status: 400 });
      }

      // Mark voucher as used — SKIP for VIP voucher (unlimited use)
      if (voucherCode && userId && !isVipOrder) {
        await markVoucherUsed(userId, voucherCode, orderRow.id);
      }

      const newBalance = (txRes as { balance?: number } | null)?.balance ?? null;
      return NextResponse.json({ orderCode, totalIdr: total, voucherDiscount, paid: true, newBalance, isVip: isVipOrder });
    }

    // ═══ BRANCH B: Midtrans Snap ═══
    let snapToken: string | null = null;
    try {
      const qtySuffix = qty > 1 ? ` ×${qty}` : "";
      const snap = await createSnapTransaction({
        orderCode,
        grossAmount: total,
        itemName: `${game.name} — ${product.name}${qtySuffix}`,
        itemId: product.id,
        customerPhone: phoneValid ? cleanPhone : "0000000000",
        customerEmail: emailValid ? cleanEmail : undefined,
      });
      snapToken = snap.token;
    } catch (err) {
      console.error("Midtrans snap error:", err);
      return NextResponse.json({ error: "Gagal membuat sesi pembayaran. Coba beberapa saat lagi." }, { status: 502 });
    }

    const { data: orderRow, error: insertErr } = await supabaseAdmin
      .from("orders")
      .insert({ ...baseOrder, payment_method: "midtrans", midtrans_snap_token: snapToken, status: "pending_payment" })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Insert order error:", insertErr);
      return NextResponse.json({ error: "Gagal menyimpan order" }, { status: 500 });
    }

    // Reserve the voucher now (set used_at) so it can't be picked twice in
    // overlapping Snap sessions. VIP vouchers skip this — unlimited use.
    if (voucherCode && userId && !isVipOrder) {
      await markVoucherUsed(userId, voucherCode, orderRow.id);
    }

    return NextResponse.json({ orderCode, snapToken, totalIdr: total, voucherDiscount, isVip: isVipOrder });
  } catch (err) {
    console.error("Order create error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function markVoucherUsed(userId: string, code: string, orderId: string) {
  await supabaseAdmin
    .from("vouchers_claimed")
    .update({ used_at: new Date().toISOString(), used_order_id: orderId })
    .eq("user_id", userId)
    .eq("voucher_code", code)
    .is("used_at", null);
  // Bump voucher usage count (best-effort; a stat row inconsistency isn't a hard
  // failure — the per-user used_at above already prevents re-use.)
  await supabaseAdmin.rpc("increment_voucher_usage", { p_code: code }).then(
    () => {},
    () => { /* RPC optional; log silent */ }
  );
}
