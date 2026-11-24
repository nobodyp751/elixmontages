import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/elix";

type Search = { mode?: "signin" | "signup"; role?: "creator" | "editor"; redirect?: string };

/** Only same-site paths are allowed as a post-sign-in destination. */
function safeRedirect(v: unknown): string | undefined {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : undefined;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    if (s["mode"] === "signin" || s["mode"] === "signup") out.mode = s["mode"];
    if (s["role"] === "creator" || s["role"] === "editor") out.role = s["role"];
    const redirect = safeRedirect(s["redirect"]);
    if (redirect) out.redirect = redirect;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Connexion — Elix" },
      { name: "description", content: "Connectez-vous ou créez votre compte créateur ou monteur sur Elix." },
      { property: "og:title", content: "Connexion — Elix" },
      { property: "og:description", content: "Rejoignez la marketplace du montage vertical." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState(search.mode ?? "signin");
  const [role, setRole] = useState(search.role ?? "creator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name, account_type: role } },
        });
        if (error) throw error;
        toast.success("Vérifiez votre boîte mail pour confirmer votre compte.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (search.redirect) navigate({ href: search.redirect });
        else navigate({ to: "/dashboard" });
      }
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const social = async (provider: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (r.error) toast.error(errorMessage(r.error));
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-4xl font-extrabold">{mode === "signup" ? "Créer un compte" : "Se connecter"}</h1>
      <form onSubmit={submit} className="mt-8 space-y-3">
        {mode === "signup" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {(["creator", "editor"] as const).map((r) => (
                <Button key={r} type="button" variant={role === r ? "default" : "outline"} onClick={() => setRole(r)}>
                  {r === "creator" ? "Je suis créateur" : "Je suis monteur"}
                </Button>
              ))}
            </div>
            <Input placeholder="Nom affiché" value={name} onChange={(e) => setName(e.target.value)} required />
          </>
        )}
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Mot de passe" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" variant="hero" className="w-full" disabled={busy}>
          {mode === "signup" ? "Créer mon compte" : "Se connecter"}
        </Button>
      </form>
      <div className="mt-4 grid gap-2">
        <Button variant="outline" onClick={() => void social("google")}>Continuer avec Google</Button>
        <Button variant="outline" onClick={() => void social("lovable")}>Continuer avec Lovable</Button>
      </div>
      <button type="button" className="mt-6 text-sm text-muted-foreground underline" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}>
        {mode === "signup" ? "Déjà un compte ? Se connecter" : "Pas de compte ? En créer un"}
      </button>
    </div>
  );
}
