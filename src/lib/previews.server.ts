import { previewPath } from "./media";

/** Signs uploaded storefront cover images (previews only, never original videos). */
export async function signPosters<T extends { poster_url: string | null }>(videos: T[]): Promise<T[]> {
  const paths = videos.map((v) => previewPath(v.poster_url)).filter((p): p is string => !!p);
  if (!paths.length) return videos;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage.from("previews").createSignedUrls(paths, 60 * 60);
  const browserBase = import.meta.env["VITE_SUPABASE_URL"];
  const serverBase = process.env["SUPABASE_URL"];
  const map = new Map<string, string>();
  for (const r of data ?? []) if (r.path && r.signedUrl) map.set(r.path, serverBase && browserBase ? r.signedUrl.replace(serverBase, browserBase) : r.signedUrl);
  return videos.map((v) => { const p = previewPath(v.poster_url); return p ? { ...v, poster_url: map.get(p) ?? null } : v; });
}
