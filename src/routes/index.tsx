import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Building2, BarChart3 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
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
            Bem-vindo ao Painel de Acompanhamento
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            O centro de controle para gerenciar, visualizar e acompanhar de perto todas as informações, metas, dailys e saúde das suas Empresas Juniores (EJs) e Guardiões.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
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
        </div>
      </div>
    </div>
  );
}
