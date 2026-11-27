import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { previewPath } from "./media";

export type Person = { display_name: string; avatar_url: string | null };

const ORDER_COLS =
  "id, title, kind, status, amount_cents, extras_cents, commission_cents, editor_amount_cents, included_revisions, revisions_used, extra_revision_cents, videos_count, delivery_days, payout_status, dispute_reason, creator_id, editor_id, editor_user_id, created_at, paid_at, delivered_at, completed_at";

async function peopleById(ids: string[]): Promise<Record<string, Person>> {
  const unique = [...new Set(ids)];
  if (!unique.length) return {};
  const { data, error } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", unique);
  if (error) throw new Error(error.message);
  return Object.fromEntries((data ?? []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]));
}

async function withCreators<T extends { creator_id: string }>(rows: T[]) {
  const people = await peopleById(rows.map((r) => r.creator_id));
  return rows.map((r) => ({ ...r, creator: people[r.creator_id] ?? null }));
}

/** Orders the signed-in user placed as a creator. */
export const creatorOrdersQuery = (userId: string) =>
  queryOptions({
    queryKey: ["orders", "creator", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`${ORDER_COLS}, editor:editor_profiles(id, display_name, avatar_url)`)
        .eq("creator_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

async function fetchEditorOrders(userId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLS)
    .eq("editor_user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return withCreators(data ?? []);
}

/** Orders the signed-in user received as an editor. */
export const editorOrdersQuery = (userId: string) =>
  queryOptions({
    queryKey: ["orders", "editor", userId],
    queryFn: () => fetchEditorOrders(userId),
  });

export type EditorOrder = Awaited<ReturnType<typeof fetchEditorOrders>>[number];

async function fetchStudio(userId: string) {
  const { data: e, error } = await supabase
    .from("editor_profiles")
    .select("*, portfolio_videos(*), offers(*)")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!e) return null;
  const paths = e.portfolio_videos.map((v) => v.video_path).filter((p): p is string => !!p);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from("portfolio").createSignedUrls(paths, 60 * 60 * 6);
    for (const row of data ?? []) if (row.path && row.signedUrl) signed.set(row.path, row.signedUrl);
  }
  const posterPaths = e.portfolio_videos.map((v) => previewPath(v.poster_url)).filter((p): p is string => !!p);
  const posters = new Map<string, string>();
  if (posterPaths.length) {
    const { data } = await supabase.storage.from("previews").createSignedUrls(posterPaths, 60 * 60 * 6);
    for (const row of data ?? []) if (row.path && row.signedUrl) posters.set(row.path, row.signedUrl);
  }
  const portfolio = [...e.portfolio_videos]
    .sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at))
    .map((v) => {
      const pp = previewPath(v.poster_url);
      return { ...v, poster_url: pp ? (posters.get(pp) ?? null) : v.poster_url, src: v.video_path ? (signed.get(v.video_path) ?? null) : v.video_url };
    });
  const offers = [...e.offers].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return { editor: { ...e, rating_avg: Number(e.rating_avg) }, portfolio, offers };
}

/** The signed-in editor's own storefront, portfolio and offers (drafts included). */
export const studioQuery = (userId: string) =>
  queryOptions({
    queryKey: ["studio", userId],
    queryFn: () => fetchStudio(userId),
  });

export type StudioData = NonNullable<Awaited<ReturnType<typeof fetchStudio>>>;

async function fetchOrder(id: string) {
  const { data: o, error } = await supabase
    .from("orders")
    .select("*, editor:editor_profiles(id, display_name, avatar_url), order_deliveries(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!o) return null;
  const [people, reviewRes] = await Promise.all([
    peopleById([o.creator_id]),
    supabase.from("reviews").select("id, rating, comment, created_at").eq("order_id", id).maybeSingle(),
  ]);
  const deliveries = await Promise.all(
    [...o.order_deliveries]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(async (d) => {
        let fileUrl: string | null = null;
        if (d.file_path) {
          const { data } = await supabase.storage.from("deliveries").createSignedUrl(d.file_path, 60 * 60);
          fileUrl = data?.signedUrl ?? null;
        }
        return { ...d, fileUrl };
      }),
  );
  return { ...o, creator: people[o.creator_id] ?? null, deliveries, review: reviewRes.data ?? null };
}

/** One order with everything needed to follow it. RLS limits it to participants and the founder. */
export const orderQuery = (id: string) =>
  queryOptions({
    queryKey: ["order", id],
    queryFn: () => fetchOrder(id),
  });

export type OrderDetail = NonNullable<Awaited<ReturnType<typeof fetchOrder>>>;

export const orderMessagesQuery = (orderId: string) =>
  queryOptions({
    queryKey: ["order-messages", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_messages")
        .select("id, body, kind, sender_id, created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

/** An offer to order, with its editor. */
export const offerQuery = (offerId: string) =>
  queryOptions({
    queryKey: ["offer", offerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select(
          "*, editor:editor_profiles(id, user_id, display_name, avatar_url, headline, is_demo, published, available, rating_avg, rating_count)",
        )
        .eq("id", offerId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

/** Founder overview. Returns allowed: false for anyone without the admin role. */
export const adminQuery = (userId: string) =>
  queryOptions({
    queryKey: ["admin", userId],
    queryFn: async () => {
      const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (roleError) throw new Error(roleError.message);
      if (!isAdmin) return { allowed: false as const };
      const [ordersRes, editorsRes, profilesRes] = await Promise.all([
        supabase
          .from("orders")
          .select(`${ORDER_COLS}, editor:editor_profiles(id, display_name, avatar_url)`)
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("editor_profiles")
          .select("id, user_id, display_name, avatar_url, headline, published, is_demo, available, rating_avg, rating_count, completed_orders, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, account_type", { count: "exact" }),
      ]);
      if (ordersRes.error) throw new Error(ordersRes.error.message);
      if (editorsRes.error) throw new Error(editorsRes.error.message);
      const orders = await withCreators(ordersRes.data ?? []);
      const accounts = profilesRes.data ?? [];
      return {
        allowed: true as const,
        orders,
        editors: (editorsRes.data ?? []).map((e) => ({ ...e, rating_avg: Number(e.rating_avg) })),
        accounts: {
          total: accounts.length,
          creators: accounts.filter((a) => a.account_type === "creator").length,
          editors: accounts.filter((a) => a.account_type === "editor").length,
        },
      };
    },
  });
