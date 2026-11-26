import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DOWNLOAD_LINK_SECONDS, downloadInputSchema, setCodeInputSchema } from "./portfolio-security";

export const setPortfolioCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => setCodeInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = data.code === null
      ? await context.supabase.rpc("revoke_portfolio_download_code", { _video_id: data.videoId })
      : await context.supabase.rpc("set_portfolio_download_code", { _video_id: data.videoId, _code: data.code });
    if (error) throw new Error(error.message);
    return { saved: true };
  });

export const downloadPortfolio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => downloadInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: path, error } = await context.supabase.rpc("authorize_portfolio_download", { _video_id: data.videoId, _code: data.code });
    if (error || !path) return { url: null, error: "Téléchargement refusé : code incorrect, fichier indisponible ou limite de 5 essais atteinte. Réessayez après 15 minutes." };
    // Privileged signing is allowed only after the database has checked the code,
    // publication status, owner-bound path and durable attempt limit.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error: signError } = await supabaseAdmin.storage.from("portfolio").createSignedUrl(path, DOWNLOAD_LINK_SECONDS, { download: true });
    if (signError || !signed) return { url: null, error: "Le fichier n’est pas disponible." };
    const browserBase = import.meta.env["VITE_SUPABASE_URL"];
    const serverBase = process.env["SUPABASE_URL"];
    const url = serverBase && browserBase ? signed.signedUrl.replace(serverBase, browserBase) : signed.signedUrl;
    return { url, error: null };
  });