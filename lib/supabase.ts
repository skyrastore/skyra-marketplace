import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─────────────────────────────────────────────
// Types (match Supabase schema)
// ─────────────────────────────────────────────

export type Game = {
  id: string;
  slug: string;
  name: string;
  publisher: string | null;
  icon_emoji: string;
  image_url: string | null;
  color_theme: string;
  category: string;
  input_type: string;
  instructions: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
};

export type Product = {
  id: string;
  game_id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  price_idr: number;
  cost_idr: number | null;
  supplier: string;
  supplier_sku: string | null;
  notes: string | null;
  is_hot: boolean;
  is_available: boolean;
  sort_order: number;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export async function fetchGameWithProducts(slug: string) {
  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (gameErr || !game) return { game: null, products: [] };

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("game_id", game.id)
    .eq("is_available", true)
    .order("sort_order", { ascending: true });

  return { game: game as Game, products: (products || []) as Product[] };
}

export async function fetchAllGames() {
  const { data } = await supabase
    .from("games")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data || []) as Game[];
}

export function fmtIDR(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}
