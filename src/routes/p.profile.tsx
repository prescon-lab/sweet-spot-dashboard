import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bell, User, CheckCircle2 } from "lucide-react";
import { guardianStore } from "@/lib/guardianStore";
import { GuardianCard } from "@/components/guardians/GuardianCard";

export const Route = createFileRoute("/p/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("id, full_name, avatar_url, guardian_name, created_at").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    }
  });

  if (!user) return <div className="p-8">Carregando...</div>;

  const guardianConfig = profile?.guardian_name ? guardianStore.get(profile.guardian_name) : null;

  return (
    <div className="page-shell space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Acompanhe suas atualizações e menções.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lado Esquerdo: Perfil e Guardian Card */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Dados da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-lg">{profile?.full_name || 'Sem nome definido'}</p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </CardContent>
          </Card>

          {profile?.guardian_name ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">Seu Card de Guardião</h3>
              <GuardianCard 
                name={profile.guardian_name} 
                config={guardianConfig!} 
                onClick={() => {}}
              />
            </div>
          ) : (
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>Nenhum guardião vinculado a este perfil.</p>
                <p className="text-sm mt-2">Solicite a um administrador que vincule sua conta na Gestão de Acessos.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Lado Direito: Notificações */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notificações
          </h3>

          {isLoading ? (
            <div className="p-8 text-center">Carregando notificações...</div>
          ) : notifications.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="p-12 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma notificação por enquanto.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {notifications.map(notif => (
                <Card 
                  key={notif.id} 
                  className={`transition-colors ${notif.is_read ? 'bg-muted/10 opacity-75' : 'bg-card border-primary/20 shadow-md'}`}
                >
                  <CardContent className="p-4 flex gap-4 items-start">
                    <div className="mt-1">
                      {notif.type === 'mention' ? (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">@</div>
                      ) : (
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className={`font-semibold ${notif.is_read ? '' : 'text-primary'}`}>{notif.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm mt-1 text-foreground/80">{notif.content}</p>
                    </div>
                    {!notif.is_read && (
                      <button 
                        onClick={() => markAsRead.mutate(notif.id)}
                        className="text-xs text-primary font-medium hover:underline whitespace-nowrap"
                      >
                        Marcar como lida
                      </button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
