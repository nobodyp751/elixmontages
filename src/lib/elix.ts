import type { Database } from "@/integrations/supabase/types";

export type VideoStyle = Database["public"]["Enums"]["video_style"];
export type DurationCategory = Database["public"]["Enums"]["duration_category"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type OfferKind = Database["public"]["Enums"]["offer_kind"];

export const STYLES: { value: VideoStyle; label: string; emoji: string }[] = [
  { value: "gaming", label: "Gaming", emoji: "🎮" },
  { value: "business", label: "Business", emoji: "💼" },
  { value: "humour", label: "Humour", emoji: "😂" },
  { value: "vlog", label: "Vlog", emoji: "📹" },
  { value: "lifestyle", label: "Lifestyle", emoji: "🌿" },
  { value: "education", label: "Éducation", emoji: "🧠" },
];

export const STYLE_LABEL: Record<VideoStyle, string> = {
  gaming: "Gaming",
  business: "Business",
  humour: "Humour",
  vlog: "Vlog",
  lifestyle: "Lifestyle",
  education: "Éducation",
};

export const DURATIONS: { value: DurationCategory; label: string }[] = [
  { value: "under_30", label: "Moins de 30 s" },
  { value: "s30_60", label: "30 – 60 s" },
  { value: "m1_3", label: "1 – 3 min" },
  { value: "over_3", label: "Plus de 3 min" },
];

export const DURATION_LABEL: Record<DurationCategory, string> = {
  under_30: "Moins de 30 s",
  s30_60: "30 – 60 s",
  m1_3: "1 – 3 min",
  over_3: "+ de 3 min",
};

export type Tone = "neutral" | "progress" | "warning" | "success" | "danger" | "info";

export const STATUS_META: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending_payment: { label: "En attente de paiement", tone: "neutral" },
  in_progress: { label: "En cours de montage", tone: "progress" },
  delivered: { label: "Livrée — à valider", tone: "info" },
  revision_requested: { label: "Retouche demandée", tone: "warning" },
  completed: { label: "Validée", tone: "success" },
  disputed: { label: "Litige en cours", tone: "danger" },
  refunded: { label: "Remboursée", tone: "neutral" },
  cancelled: { label: "Annulée", tone: "neutral" },
};

export const ESCROW_STATUSES: OrderStatus[] = ["in_progress", "delivered", "revision_requested", "disputed"];

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const euroRound = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatEuros(cents: number, round = false): string {
  return (round && cents % 100 === 0 ? euroRound : euro).format(cents / 100);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initials(name: string): string {
  return (
    name
      .replace(/[«»"']/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "E"
  );
}

export function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  return "Une erreur est survenue";
}
