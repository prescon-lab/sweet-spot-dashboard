import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AccessRole = "admin" | "guardian";

export const SUPER_ADMIN_EMAIL = "prescon@nucleovertentes.com";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  role: AccessRole;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  role: "guardian",
  isAdmin: false,
  loading: true,
  signOut: async () => {},
  refreshRole: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRole = async (userId: string | undefined, userEmail: string | undefined) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }

    const emailLower = (userEmail || "").toLowerCase();
    if (emailLower === SUPER_ADMIN_EMAIL || emailLower === "prescon.nucleovertentes@gmail.com" || emailLower === "prescon@nucleovertentes") {
      setIsAdmin(true);
      return;
    }

    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(Boolean(data));
  };

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;
      setSession(newSession);
      void loadRole(newSession?.user?.id, newSession?.user?.email);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadRole(data.session?.user?.id, data.session?.user?.email);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    role: isAdmin ? "admin" : "guardian",
    isAdmin,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
      setSession(null);
      setIsAdmin(false);
    },
    refreshRole: async () => loadRole(session?.user?.id, session?.user?.email),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
