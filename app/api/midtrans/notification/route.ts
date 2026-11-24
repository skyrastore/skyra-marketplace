// ═══════════════════════════════════════════════════════════
// POST /api/midtrans/notification
// Midtrans webhook endpoint
// - Verify signature
// - Update order status based on transaction_status
// - If paid → mark status='paid' (VPS worker poller akan ambil & fulfill)
// Setup URL di: Midtrans Dashboard → Settings → Configuration → Payment Notification URL
// ═══════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyNotificationSignature, mapMidtransStatus } from "@/lib/midtrans";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // ─── Verify signature ───
    const valid = await verifyNotificationSignature({
      order_id: payload.order_id,
      status_code: payload.status_code,
      gross_amount: payload.gross_amount,
      signature_key: payload.signature_key,
    });

    if (!valid) {
      console.warn("Invalid Midtrans signature for order:", payload.order_id);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // ─── Map Midtrans status to our status ───
    const newStatus = mapMidtransStatus({
      transaction_status: payload.transaction_status,
      fraud_status: payload.fraud_status,
    });

    if (!newStatus) {
      return NextResponse.json({ ok: true, info: "unmapped status" });
    }

    // ─── Fetch current order ───
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from("orders")
      .select("id, status, order_code")
      .eq("order_code", payload.order_id)
      .single();

    if (fetchErr || !order) {
      console.warn("Order not found for notification:", payload.order_id);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // ─── Idempotency: ga perlu update kalo udah done/fulfilling ───
    if (["done", "fulfilling"].includes(order.status) && newStatus === "paid") {
      return NextResponse.json({ ok: true, info: "already fulfilled" });
    }

    // ─── Update order ───
    const updates: Record<string, unknown> = {
      status: newStatus,
      midtrans_transaction_id: payload.transaction_id || null,
      payment_channel: payload.payment_type || null,
      midtrans_raw: payload,
    };

    if (newStatus === "paid") {
      updates.paid_at = new Date().toISOString();
    }

    const { error: updateErr } = await supabaseAdmin
      .from("orders")
      .update(updates)
      .eq("id", order.id);

    if (updateErr) {
      console.error("Order update error:", updateErr);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, orderCode: order.order_code, newStatus });
  } catch (err) {
    console.error("Midtrans notification error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET buat testing di browser — confirm endpoint reachable
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "midtrans notification webhook",
    note: "Midtrans will POST here with transaction notifications",
  });
}
