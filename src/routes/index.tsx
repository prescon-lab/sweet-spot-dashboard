import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Building2, BarChart3, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SquadProgressWidget } from "@/components/dashboard/SquadProgressWidget";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel de Acompanhamento de EJs e Guardiões" },
      { name: "description", content: "Centro de controle para acompanhar metas, dailys, apostas e a saúde das Empresas Juniores e seus Guardiões." },
      { property: "og:title", content: "Painel de Acompanhamento de EJs e Guardiões" },
      { property: "og:description", content: "Centro de controle para acompanhar metas, dailys, apostas e a saúde das Empresas Juniores e seus Guardiões." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      // Exemplo: Criar um novo token admin ou painel
      // Para demonstração, vamos apenas navegar para um painel gerado.
      // Em produção, isso bateria na sua API ou tabela access_tokens.
      setTimeout(() => {
        toast.success("Painel configurado com sucesso!", {
          description: "Bem-vindo ao Sweet Spot Dashboard.",
        });
        navigate({ to: "/p/$token", params: { token: "demo-token" } });
      }, 1500);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao iniciar o painel.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8 animate-scale-in">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Início
          </h1>
        </div>

        <div className="grid md:grid-cols-3 max-w-5xl mx-auto gap-6 mt-12">
          <Card className="glass-card cursor-pointer hover:border-primary/50 transition-all group" onClick={() => navigate({ to: "/p/ejs" })}>
            <CardHeader>
              <Building2 className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>Painel de EJs</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Acompanhe o progresso individual de cada EJ, incluindo metas cumpridas, apostas, anotações de reuniões e dailys.
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground">
                Acessar EJs
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card className="glass-card cursor-pointer hover:border-primary/50 transition-all group" onClick={() => navigate({ to: "/p/guardioes" })}>
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>Painel de Guardiões</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Visualize as atualizações recentes de cada guardião, gerencie menções e acompanhe as EJs sob a responsabilidade de cada um.
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground">
                Acessar Guardiões
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
          <Card className="glass-card cursor-pointer hover:border-primary/50 transition-all group" onClick={() => navigate({ to: "/p/calendario" })}>
            <CardHeader>
              <CalendarIcon className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle>Painel de Calendário</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Acesse o calendário completo para visualizar e agendar reuniões com as Empresas Juniores.
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground">
                Acessar Calendário
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>

        <SquadProgressWidget />

      </div>
    </div>
  );
}
