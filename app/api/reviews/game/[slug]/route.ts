import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "edge";

// GET /api/reviews/game/[slug]
// Returns { avg, count, reviews:[{rating, comment, display_name, created_at}...] }
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ error: "slug_required" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: game } = await admin.from("games").select("id").eq("slug", slug).maybeSingle();
  if (!game) return NextResponse.json({ avg: null, count: 0, reviews: [] });

  const [statsRes, listRes] = await Promise.all([
    admin.from("game_rating_stats").select("avg_rating, review_count").eq("game_id", game.id).maybeSingle(),
    admin
      .from("reviews")
      .select("rating, comment, display_name, created_at, is_featured")
      .eq("game_id", game.id)
      .eq("is_public", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return NextResponse.json({
    avg: statsRes.data?.avg_rating ?? null,
    count: statsRes.data?.review_count ?? 0,
    reviews: listRes.data ?? [],
  });
}
