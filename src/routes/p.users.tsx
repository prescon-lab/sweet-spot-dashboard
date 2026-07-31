import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ejListStore } from "@/lib/ejListStore";
import { User, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/p/users")({
  component: UsersManagementPage,
});

function UsersManagementPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const guardians = ejListStore.getUniqueGuardians();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const updateProfileGuardian = useMutation({
    mutationFn: async ({ id, guardian_name }: { id: string; guardian_name: string | null }) => {
      const { error } = await supabase.from("profiles").update({ guardian_name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (err) => {
      toast.error("Erro ao atualizar perfil: " + err.message);
    }
  });

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Você não tem permissão para acessar esta página.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Acessos</h1>
        <p className="text-muted-foreground mt-1">Vincule os usuários cadastrados aos seus respectivos cards de Guardião.</p>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center p-8">Carregando usuários...</div>
        ) : (
          profiles.map(profile => (
            <Card key={profile.id} className="flex flex-row items-center justify-between p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{profile.full_name || 'Sem nome'}</h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-64">
                  <Select 
                    value={profile.guardian_name || "none"} 
                    onValueChange={(val) => updateProfileGuardian.mutate({ id: profile.id, guardian_name: val === "none" ? null : val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vincular a um guardião" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum Guardião</SelectItem>
                      {guardians.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {profile.guardian_name && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                    <Shield className="w-3 h-3" />
                    Vinculado
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
