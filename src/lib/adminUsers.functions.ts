import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AdminProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  guardian_name: string | null;
};

export const listProfilesWithEmail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminProfile[]> => {
    const { data: roles, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin");

    if (roleError) throw roleError;
    if (!roles || roles.length === 0) {
      throw new Response("Forbidden", { status: 403 });
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, avatar_url, guardian_name")
      .order("email");

    if (error) throw error;
    return (data ?? []) as AdminProfile[];
  });
