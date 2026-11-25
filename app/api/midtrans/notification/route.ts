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
      // Emit diagnostic breadcrumbs (no secrets) so Midtrans notif history shows
      // which fields were present. The key material stays server-side.
      return NextResponse.json({
        error: "Invalid signature",
        debug: {
          order_id: payload.order_id,
          status_code: payload.status_code,
          gross_amount: payload.gross_amount,
          got_sig_prefix: typeof payload.signature_key === "string" ? payload.signature_key.slice(0, 8) : null,
          got_sig_length: typeof payload.signature_key === "string" ? payload.signature_key.length : 0,
        },
      }, { status: 403 });
    }

    // ─── Map Midtrans status to our status ───
    const newStatus = mapMidtransStatus({
      transaction_status: payload.transaction_status,
      fraud_status: payload.fraud_status,
    });

    if (!newStatus) {
      return NextResponse.json({ ok: true, info: "unmapped status" });
    }

    // ─── Branch: wallet topup orders use WLT- prefix ───
    if (typeof payload.order_id === "string" && payload.order_id.startsWith("WLT-")) {
      return handleWalletTopup(payload, newStatus);
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

// ─── Wallet topup handler ───
// payload.order_id = 'WLT-<nonce>-<ts>'
// On 'paid': look up the pre-registered topup, credit via apply_wallet_tx RPC
async function handleWalletTopup(payload: Record<string, unknown>, newStatus: string) {
  const midtransOrderId = String(payload.order_id);

  const { data: topup, error: fetchErr } = await supabaseAdmin
    .from("wallet_topups")
    .select("midtrans_order_id, user_id, amount_idr, status")
    .eq("midtrans_order_id", midtransOrderId)
    .maybeSingle();

  if (fetchErr || !topup) {
    // Return 200 so Midtrans stops retrying this orphan. The topup row
    // predates the wallet_topups table (migration 24) or was wiped manually.
    // Nothing to credit — just acknowledge.
    console.warn("Wallet topup not found (acked to stop retry):", midtransOrderId);
    return NextResponse.json({ ok: true, info: "topup row not found — acked" });
  }

  if (topup.status === "paid") {
    return NextResponse.json({ ok: true, info: "topup already applied" });
  }

  if (newStatus === "paid") {
    // Credit the wallet atomically via RPC (balance update + ledger row in one tx)
    const { error: rpcErr } = await supabaseAdmin.rpc("apply_wallet_tx", {
      p_user_id: topup.user_id,
      p_tx_type: "topup",
      p_amount_idr: topup.amount_idr,
      p_description: `Topup via ${payload.payment_type || "Midtrans"}`,
      p_midtrans_order_id: midtransOrderId,
    });
    if (rpcErr) {
      console.error("apply_wallet_tx failed:", rpcErr);
      return NextResponse.json({ error: "Credit failed" }, { status: 500 });
    }

    await supabaseAdmin
      .from("wallet_topups")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("midtrans_order_id", midtransOrderId);

    return NextResponse.json({ ok: true, topup: midtransOrderId, credited: topup.amount_idr });
  }

  if (["failed", "expired", "cancelled"].includes(newStatus)) {
    await supabaseAdmin
      .from("wallet_topups")
      .update({ status: newStatus === "failed" ? "failed" : newStatus })
      .eq("midtrans_order_id", midtransOrderId);
  }

  return NextResponse.json({ ok: true, topup: midtransOrderId, status: newStatus });
}

// GET buat testing di browser — confirm endpoint reachable
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "midtrans notification webhook",
    note: "Midtrans will POST here with transaction notifications",
  });
}
