// ═══════════════════════════════════════════════════════════
// POST /api/orders/create
// Body: { gameSlug, productId, phone, customData, notes?, voucherCode? }
// Response: { orderCode, snapToken, totalIdr }
// ═══════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSnapTransaction } from "@/lib/midtrans";

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
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateOrderBody;

    // ─── Validate required fields ───
    if (!body.gameSlug || !body.productId) {
      return NextResponse.json(
        { error: "gameSlug & productId wajib diisi" },
        { status: 400 }
      );
    }

    // Need phone OR email
    const rawPhone = (body.phone || "").trim();
    const rawEmail = (body.email || "").trim();
    const cleanPhone = rawPhone ? rawPhone.replace(/[^\d+]/g, "") : "";
    const cleanEmail = rawEmail.toLowerCase();

    const phoneValid = cleanPhone && cleanPhone.replace(/\D/g, "").length >= 8;
    const emailValid = cleanEmail && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail);

    if (!phoneValid && !emailValid) {
      return NextResponse.json(
        { error: "Isi nomor WhatsApp (min 8 digit) atau Email yang valid" },
        { status: 400 }
      );
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
      .select("id, name, price_idr, supplier, supplier_sku, is_available, game_id")
      .eq("id", body.productId)
      .single();

    if (prodErr || !product || product.game_id !== game.id || !product.is_available) {
      return NextResponse.json({ error: "Produk tidak tersedia" }, { status: 404 });
    }

    // Note: entitas_id ga perlu dipopulate di sini — UniPlay rotates per call,
    // fulfill.js akan resolve fresh entitas_id + denom_id dari API pake
    // stable name-based supplier_sku (slug--slug).

    // ─── Validate voucher (if provided) ───
    let voucherDiscount = 0;
    let voucherCode: string | null = null;
    if (body.voucherCode) {
      const code = body.voucherCode.trim().toUpperCase();
      const { data: voucher } = await supabaseAdmin
        .from("vouchers")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .single();

      if (voucher) {
        const now = new Date();
        const expired = voucher.expires_at && new Date(voucher.expires_at) < now;
        const maxed = voucher.max_uses && voucher.used_count >= voucher.max_uses;
        const belowMin = voucher.min_purchase_idr && product.price_idr < voucher.min_purchase_idr;

        if (!expired && !maxed && !belowMin) {
          if (voucher.discount_type === "percentage") {
            voucherDiscount = Math.floor((product.price_idr * voucher.discount_value) / 100);
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

    // Qty: only manual products allow qty > 1 (UniPlay is per-denom)
    const qty = product.supplier === "manual"
      ? Math.max(1, Math.min(100, Math.floor(Number(body.qty) || 1)))
      : 1;
    const subtotal = product.price_idr * qty;

    // Recompute voucher based on actual subtotal (qty × price) since frontend qty is untrusted
    if (body.voucherCode && voucherCode) {
      const { data: v } = await supabaseAdmin
        .from("vouchers")
        .select("discount_type,discount_value,max_discount_idr")
        .eq("code", voucherCode)
        .single();
      if (v) {
        if (v.discount_type === "percentage") {
          voucherDiscount = Math.floor((subtotal * v.discount_value) / 100);
          if (v.max_discount_idr && voucherDiscount > v.max_discount_idr) voucherDiscount = v.max_discount_idr;
        } else {
          voucherDiscount = v.discount_value;
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

    // ─── Create Midtrans Snap token ───
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
      return NextResponse.json(
        { error: "Gagal membuat sesi pembayaran. Coba beberapa saat lagi." },
        { status: 502 }
      );
    }

    // ─── Insert order ───
    const { error: insertErr } = await supabaseAdmin.from("orders").insert({
      order_code: orderCode,
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
      payment_method: "midtrans",
      midtrans_snap_token: snapToken,
      status: "pending_payment",
    });

    if (insertErr) {
      console.error("Insert order error:", insertErr);
      return NextResponse.json({ error: "Gagal menyimpan order" }, { status: 500 });
    }

    return NextResponse.json({
      orderCode,
      snapToken,
      totalIdr: total,
      voucherDiscount,
    });
  } catch (err) {
    console.error("Order create error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
