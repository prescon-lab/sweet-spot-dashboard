import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Target, TrendingUp, Users, Search, PlusCircle, Printer } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/p/$token")({
  component: DashboardPanel,
});

function DashboardPanel() {
  const { token } = Route.useParams();
  const [searchTerm, setSearchTerm] = useState("");

  const handlePrint = () => {
    window.print();
  };

  const handleAddBet = () => {
    toast.info("Abrindo modal para adicionar nova aposta...", {
      description: "Esta funcionalidade será integrada à API em breve."
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-scale-in">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Acompanhamento</h1>
          <p className="text-muted-foreground mt-1">
            Visualizando dados do painel: <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{token}</code>
          </p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por EJ, Guardião..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={handlePrint} title="Imprimir Relatório">
            <Printer className="h-4 w-4" />
          </Button>
          <Button onClick={handleAddBet}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar aposta
          </Button>
        </div>
      </div>

      {/* KPI Cards (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score de Saúde</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92/100</div>
            <p className="text-xs text-muted-foreground">
              +4% em relação ao último mês
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Apostas Cumpridas</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground">
              3 pendentes nesta semana
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EJs Acompanhadas</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Todas com guardião ativo
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card border-destructive/20 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Atenção</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">2</div>
            <p className="text-xs text-destructive/80">
              EJs sem atualização há +7 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">EJs Recentes</h2>
          
          {/* List of EJs - Stacked Cards */}
          <div className="space-y-4">
            {/* Example Card */}
            <Card className="glass-card hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">EJ Exemplo Tech</h3>
                      <Badge variant="default" className="badge-pulse bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                        Saudável
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Guardião: João Silva • Última daily há 2 dias
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Registrar reunião</Button>
                    <Button variant="secondary" size="sm">Ver detalhes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Empty State */}
            {searchTerm && (
              <div className="text-center p-12 border-2 border-dashed rounded-xl bg-muted/30">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold">Nenhuma EJ encontrada</h3>
                <p className="text-sm text-muted-foreground">
                  Tente buscar por outro nome ou termo.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets (Feed) */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Últimas Atualizações</h2>
          <Card className="glass-card bg-muted/30 border-none shadow-inner h-[500px] overflow-auto">
            <CardContent className="p-6">
              <div className="text-center space-y-4 mt-8">
                <p className="text-muted-foreground">
                  Nada de novo por aqui. O que você quer acompanhar hoje?
                </p>
                <Button variant="outline" size="sm">Adicionar nova atividade</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
