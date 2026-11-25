import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "edge";

// GET /api/reviews/order/[code]
// Public — returns { exists: boolean, rating?, comment? }
// Used by /order/[code] to decide whether to show the "submit review" form.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!code) return NextResponse.json({ exists: false });

  const admin = getSupabaseAdmin();
  const { data: order } = await admin
    .from("orders")
    .select("id")
    .eq("order_code", code)
    .maybeSingle();
  if (!order) return NextResponse.json({ exists: false });

  const { data: review } = await admin
    .from("reviews")
    .select("rating, comment, display_name, created_at")
    .eq("order_id", order.id)
    .maybeSingle();

  if (!review) return NextResponse.json({ exists: false });
  return NextResponse.json({ exists: true, ...review });
}
