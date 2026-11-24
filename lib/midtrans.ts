// ═══════════════════════════════════════════════════════════
// Midtrans Snap integration — Edge-runtime compatible (Web Crypto)
// Docs: https://docs.midtrans.com/reference/snap-api
// ═══════════════════════════════════════════════════════════

const MIDTRANS_ENV = process.env.NEXT_PUBLIC_MIDTRANS_ENV || "sandbox";
const IS_PROD = MIDTRANS_ENV === "production";

export const SNAP_API_URL = IS_PROD
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

export const SNAP_JS_URL = IS_PROD
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";

export type SnapTransactionInput = {
  orderCode: string;
  grossAmount: number;
  itemName: string;
  itemId: string;
  customerPhone: string;
  customerName?: string;
  customerEmail?: string;
  finishRedirectUrl?: string;
  expiryMinutes?: number;
};

export type SnapTransactionResult = {
  token: string;
  redirect_url: string;
};

// ─────────────────────────────────────────────
// Web Crypto SHA-512 (edge-compatible)
// ─────────────────────────────────────────────
async function sha512Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-512", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─────────────────────────────────────────────
// Base64 encode (edge-compatible, no Buffer)
// ─────────────────────────────────────────────
function base64(input: string): string {
  if (typeof btoa !== "undefined") return btoa(input);
  // fallback for Node runtime
  return Buffer.from(input).toString("base64");
}

// ─────────────────────────────────────────────
// Create Snap transaction → returns snap token for frontend
// ─────────────────────────────────────────────
export async function createSnapTransaction(input: SnapTransactionInput): Promise<SnapTransactionResult> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY not set");

  const body = {
    transaction_details: {
      order_id: input.orderCode,
      gross_amount: Math.round(input.grossAmount),
    },
    item_details: [
      {
        id: input.itemId,
        price: Math.round(input.grossAmount),
        quantity: 1,
        name: input.itemName.slice(0, 50),
      },
    ],
    customer_details: {
      first_name: input.customerName || "Customer",
      phone: input.customerPhone,
      email: input.customerEmail || `${input.customerPhone.replace(/\D/g, "")}@skyra.id`,
    },
    callbacks: input.finishRedirectUrl ? { finish: input.finishRedirectUrl } : undefined,
    expiry: {
      unit: "minutes",
      duration: input.expiryMinutes || 60,
    },
  };

  const auth = base64(`${serverKey}:`);

  const res = await fetch(SNAP_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(`Midtrans Snap error: ${JSON.stringify(data)}`);
  }
  return data as SnapTransactionResult;
}

// ─────────────────────────────────────────────
// Verify notification signature (webhook)
// Formula: SHA512(order_id + status_code + gross_amount + SERVER_KEY)
// ─────────────────────────────────────────────
export async function verifyNotificationSignature(payload: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}): Promise<boolean> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return false;

  const expected = await sha512Hex(
    payload.order_id + payload.status_code + payload.gross_amount + serverKey
  );

  return expected === payload.signature_key;
}

// ─────────────────────────────────────────────
// Map Midtrans notification → our order status
// Ref: https://docs.midtrans.com/reference/transaction-status
// ─────────────────────────────────────────────
export function mapMidtransStatus(notification: {
  transaction_status: string;
  fraud_status?: string;
}): "paid" | "pending_payment" | "expired" | "cancelled" | "failed" | null {
  const { transaction_status, fraud_status } = notification;

  if (transaction_status === "capture") {
    if (fraud_status === "accept") return "paid";
    if (fraud_status === "challenge") return "pending_payment";
    return "failed";
  }
  if (transaction_status === "settlement") return "paid";
  if (transaction_status === "pending") return "pending_payment";
  if (transaction_status === "expire") return "expired";
  if (transaction_status === "cancel") return "cancelled";
  if (transaction_status === "deny" || transaction_status === "failure") return "failed";
  if (transaction_status === "refund" || transaction_status === "partial_refund") return "cancelled";

  return null;
}
