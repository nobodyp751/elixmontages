import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { signPosters } from "./previews.server";

function publicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Configuration du serveur manquante");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

type RawVideo = {
  id: string;
  title: string;
  poster_url: string | null;
  duration_category: Database["public"]["Enums"]["duration_category"];
  style: Database["public"]["Enums"]["video_style"];
  position: number;
};

export type PortfolioItem = RawVideo & { src: string | null };

function publicPreviews(videos: RawVideo[]): PortfolioItem[] {
  return videos
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((v) => ({ ...v, src: null }));
}

const VIDEO_COLS = "id, title, poster_url, duration_category, style, position";

export const listEditors = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("editor_profiles")
    .select(
      `id, display_name, avatar_url, headline, styles, available, is_demo, rating_avg, rating_count, completed_orders,
       portfolio_videos(${VIDEO_COLS}), offers(id, kind, price_cents, videos_count, active)`,
    )
    .eq("published", true)
    .order("is_demo", { ascending: true })
    .order("rating_avg", { ascending: false });
  if (error) throw new Error(error.message);
  const all = await signPosters(publicPreviews((data ?? []).flatMap((e) => e.portfolio_videos)));
  const byId = new Map(all.map((v) => [v.id, v]));
  return (data ?? []).map((e) => {
    const activeOffers = e.offers.filter((o) => o.active);
    const prices = activeOffers.filter((o) => o.kind === "unit").map((o) => o.price_cents);
    const fallback = activeOffers.map((o) => Math.round(o.price_cents / o.videos_count));
    const pool = prices.length ? prices : fallback;
    return {
      id: e.id,
      display_name: e.display_name,
      avatar_url: e.avatar_url,
      headline: e.headline,
      styles: e.styles,
      available: e.available,
      is_demo: e.is_demo,
      rating_avg: Number(e.rating_avg),
      rating_count: e.rating_count,
      completed_orders: e.completed_orders,
      has_pack: activeOffers.some((o) => o.kind === "pack"),
      from_price_cents: pool.length ? Math.min(...pool) : null,
      portfolio: e.portfolio_videos
        .map((v) => byId.get(v.id))
        .filter((v): v is PortfolioItem => !!v)
        .sort((a, b) => a.position - b.position),
    };
  });
});

export type EditorSummary = Awaited<ReturnType<typeof listEditors>>[number];

export const getEditor = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: e, error } = await sb
      .from("editor_profiles")
      .select(
        `id, user_id, display_name, avatar_url, headline, bio, styles, available, is_demo, rating_avg, rating_count, completed_orders, created_at,
         portfolio_videos(${VIDEO_COLS}),
         offers(id, kind, title, description, price_cents, videos_count, included_revisions, extra_revision_cents, delivery_days, active),
         reviews(id, reviewer_name, rating, comment, created_at)`,
      )
      .eq("id", data.id)
      .eq("published", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!e) return null;
    const portfolio = await signPosters(publicPreviews(e.portfolio_videos));
    return {
      ...e,
      rating_avg: Number(e.rating_avg),
      portfolio,
      offers: e.offers
        .filter((o) => o.active)
        .sort((a, b) => (a.kind === b.kind ? a.price_cents - b.price_cents : a.kind === "unit" ? -1 : 1)),
      reviews: e.reviews.sort((a, b) => b.created_at.localeCompare(a.created_at)),
    };
  });

export type EditorDetail = NonNullable<Awaited<ReturnType<typeof getEditor>>>;
