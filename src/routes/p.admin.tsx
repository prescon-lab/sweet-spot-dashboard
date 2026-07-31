import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, SUPER_ADMIN_EMAIL } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ejListStore } from "@/lib/ejListStore";
import { ShieldCheck, ShieldOff, Loader2, Users, Search, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/p/admin")({
  head: () => ({
    meta: [
      { title: "Administração de Acessos — Painel" },
      { name: "description", content: "Gerencie quem é administrador e quem é guardião no painel de acompanhamento." },
      { property: "og:title", content: "Administração de Acessos — Painel" },
      { property: "og:description", content: "Gerencie quem é administrador e quem é guardião no painel de acompanhamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

type Person = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  isAdmin: boolean;
  guardian_name: string | null;
};

function AdminPage() {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const guardians = ejListStore.getUniqueGuardians();

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, avatar_url, guardian_name").order("email"),
      supabase.from("user_roles").select("user_id, role").eq("role", "admin"),
    ]);
    const adminIds = new Set((roles ?? []).map((r) => r.user_id));
    setPeople(
      (profiles ?? []).map((p) => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        isAdmin: adminIds.has(p.id),
        guardian_name: p.guardian_name,
      })),
    );
    if (showSpinner) setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) void load();
    else setLoading(false);
  }, [isAdmin, load]);

  const toggleAdmin = async (person: Person) => {
    if (person.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
      toast.error("Este e-mail é administrador permanente.");
      return;
    }
    setBusyId(person.id);
    if (person.isAdmin) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", person.id)
        .eq("role", "admin");
      if (error) toast.error("Não foi possível remover o acesso de admin.");
      else toast.success("Salvo — agora é Guardião.");
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: person.id, role: "admin" });
      if (error) toast.error("Não foi possível tornar administrador.");
      else toast.success("Salvo — agora é Administrador.");
    }
    setBusyId(null);
    await load(false);
  };

  const deleteProfile = async (person: Person) => {
    if (person.email?.toLowerCase() === SUPER_ADMIN_EMAIL) {
      toast.error("Não é possível excluir o administrador permanente.");
      return;
    }
    if (!window.confirm(`Tem certeza que deseja excluir o perfil de ${person.full_name || person.email}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setBusyId(person.id);
    const { error } = await supabase.from("profiles").delete().eq("id", person.id);
    if (error) {
      toast.error("Não foi possível excluir o perfil.");
      console.error("Delete profile error:", error);
    } else {
      toast.success("Perfil excluído com sucesso.");
      await load(false);
    }
    setBusyId(null);
  };

  const updateProfileGuardian = async (id: string, guardian_name: string | null) => {
    // Atualização otimista para a interface refletir na hora
    setPeople(prev => prev.map(p => p.id === id ? { ...p, guardian_name } : p));
    
    const { data, error } = await supabase.from("profiles").update({ guardian_name }).eq("id", id).select();
    if (error || !data || data.length === 0) {
      toast.error("O banco ainda não liberou a permissão. Aguarde 1 minuto para a Lovable processar a atualização de segurança e tente novamente.");
      await load(false); // Reverte em caso de erro
    } else {
      toast.success("Perfil atualizado com sucesso!");
      load(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto animate-fade-in">
        <div className="glass-card rounded-3xl p-10 text-center space-y-3">
          <ShieldOff className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Área do administrador</h1>
          <p className="text-muted-foreground">
            Somente administradores podem gerenciar acessos. Fale com o responsável pelo painel.
          </p>
        </div>
      </div>
    );
  }

  const filtered = people.filter((p) =>
    `${p.full_name ?? ""} ${p.email ?? ""}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="p-4 md:p-8 max-w-[1100px] mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Administração de acessos</h1>
        <p className="text-muted-foreground mt-2">
          Todo mundo que entra com o Google aparece aqui como Guardião. Promova a Administrador quem precisa editar tudo.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 space-y-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="pl-9 bg-background/50 min-h-[44px]"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Users className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              Nenhuma pessoa encontrada. Peça para entrarem com o Google uma primeira vez.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background/40 p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={`Foto de ${p.full_name ?? p.email ?? "usuário"}`} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {(p.full_name ?? p.email ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{p.full_name ?? "Sem nome"}</p>
                    <p className="text-sm text-muted-foreground truncate">{p.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
                  <div className="w-[140px] sm:w-48">
                    <Select 
                      value={p.guardian_name || "none"} 
                      onValueChange={(val) => updateProfileGuardian(p.id, val === "none" ? null : val)}
                    >
                      <SelectTrigger className="h-[44px]">
                        <SelectValue placeholder="Vincular a guardião" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {guardians.map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {p.guardian_name && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 h-[44px] max-w-[150px] sm:max-w-[200px]" title={`Vinculado a ${p.guardian_name}`}>
                      <Shield className="w-3 h-3 shrink-0" />
                      <span className="truncate">{p.guardian_name}</span>
                    </div>
                  )}
                  <Badge variant={p.isAdmin ? "default" : "secondary"} className="hidden md:inline-flex">
                    {p.isAdmin ? "Administrador" : "Guardião"}
                  </Badge>
                  <Button
                    variant={p.isAdmin ? "outline" : "default"}
                    className="gap-2 font-semibold min-h-[44px]"
                    disabled={busyId === p.id || p.id === user?.id}
                    onClick={() => toggleAdmin(p)}
                  >
                    {busyId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    {p.isAdmin ? "Tornar Guardião" : "Tornar Administrador"}
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-[44px] min-w-[44px] px-2 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    disabled={busyId === p.id || p.id === user?.id || p.email?.toLowerCase() === SUPER_ADMIN_EMAIL}
                    onClick={() => deleteProfile(p)}
                    title="Excluir perfil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Precisa dos links úteis e demais opções?{" "}
        <Link to="/p/configuracoes" className="text-primary font-medium hover:underline">
          Ir para Configurações
        </Link>
      </p>

      {/* DEV ONLY RESET BUTTON */}
      <div className="mt-12 p-4 border border-red-500/50 bg-red-500/10 rounded-xl max-w-sm space-y-2 opacity-50 hover:opacity-100 transition-opacity">
        <h3 className="font-bold text-red-500">Ferramenta de Limpeza (Para Testes)</h3>
        <p className="text-xs text-muted-foreground">Isso apagará TODOS os dados de EJs, Guardiões, Reuniões e Menções do banco para que você comece do zero. Use com cuidado!</p>
        <Button 
          variant="destructive" 
          className="w-full mt-2 font-bold"
          onClick={async () => {
            if (window.confirm("CUIDADO! Isso vai apagar TODOS os dados da plataforma. Tem certeza?")) {
              toast.info("Limpando banco de dados...");
              
              const emptyData = [
                { key: 'sweet_spot_events', data: [], updated_at: new Date().toISOString() },
                { key: 'sweet_spot_leads', data: [], updated_at: new Date().toISOString() },
                { key: 'vertentes_guardian_customizations', data: {}, updated_at: new Date().toISOString() },
                { key: 'sweet_spot_mentions', data: [], updated_at: new Date().toISOString() },
                { key: 'vertentes_guardian_prescon', data: [], updated_at: new Date().toISOString() },
                { key: 'sweet_spot_activities', data: [], updated_at: new Date().toISOString() },
                { key: 'sweet_spot_ej_data', data: {}, updated_at: new Date().toISOString() },
                { key: 'vertentes_links', data: [], updated_at: new Date().toISOString() }
              ];
              
              await supabase.from('app_data').upsert(emptyData, { onConflict: 'key' });
              await supabase.from('app_data').delete().eq('key', 'vertentes_ej_list');
              
              // Clear local storage too
              localStorage.clear();
              toast.success("Banco limpo! Recarregando a página...");
              setTimeout(() => window.location.reload(), 2000);
            }
          }}
        >
          LIMPAR TODOS OS DADOS E COMEÇAR DO ZERO
        </Button>
      </div>
    </div>
  );
}
