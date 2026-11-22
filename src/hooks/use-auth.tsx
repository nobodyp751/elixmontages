import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = { session: Session | null; ready: boolean };
const AuthContext = createContext<AuthState>({ session: null, ready: false });

/** Single auth listener for the whole app (mounted once in the root route). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ session: null, ready: false });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setState({ session: data.session, ready: true }));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setState({ session, ready: true });
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const { session, ready } = useContext(AuthContext);
  const userId = session?.user.id ?? null;

  const profile = useQuery({
    queryKey: ["me", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ data: p }, { data: isAdmin }, { data: editor }] = await Promise.all([
        supabase.from("profiles").select("id, display_name, avatar_url, account_type").eq("id", userId!).maybeSingle(),
        supabase.rpc("has_role", { _user_id: userId!, _role: "admin" }),
        supabase.from("editor_profiles").select("id, published").eq("user_id", userId!).maybeSingle(),
      ]);
      return { profile: p, isAdmin: !!isAdmin, editor };
    },
  });

  return {
    ready,
    session,
    user: session?.user ?? null,
    profile: profile.data?.profile ?? null,
    editor: profile.data?.editor ?? null,
    isAdmin: profile.data?.isAdmin ?? false,
    loadingProfile: profile.isLoading,
  };
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/", replace: true });
  };
}
