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
            Bem-vindo ao Sweet Spot Dashboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            O centro de controle definitivo para acompanhar as metas, saúde e apostas das suas Empresas Juniores (EJs).
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="glass-card">
            <CardHeader>
              <Building2 className="w-6 h-6 text-primary mb-2" />
              <CardTitle>Gestão Centralizada</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Acompanhe o progresso de múltiplas EJs em um único lugar, com indicadores de saúde e status em tempo real.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <BarChart3 className="w-6 h-6 text-primary mb-2" />
              <CardTitle>Métricas de Valor</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Visualize apostas cumpridas, leads no funil e atualizações recentes de forma clara e objetiva.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="glass-card flex items-center justify-center p-6 text-center border-dashed border-2 bg-muted/30">
            <div className="space-y-4">
              <h3 className="font-semibold">Nenhum painel configurado ainda.</h3>
              <p className="text-sm text-muted-foreground">
                Crie seu primeiro painel de controle e comece a acompanhar os resultados hoje mesmo.
              </p>
              <Button onClick={handleStart} disabled={isLoading} className="w-full">
                {isLoading ? "Configurando..." : "Criar primeiro painel"}
                {!isLoading && <ArrowRight className="ml-2 w-4 h-4" />}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
