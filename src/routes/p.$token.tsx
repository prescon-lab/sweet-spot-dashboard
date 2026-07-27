import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Target, TrendingUp, Users, Search, PlusCircle, Printer } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { EjDetailModal } from "@/components/ejs/EjDetailModal";
import { EventRegistrationModal } from "@/components/events/EventRegistrationModal";
import { eventStore, AppEvent } from "@/lib/eventStore";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/p/$token")({
  component: DashboardPanel,
});

function DashboardPanel() {
  const { token } = Route.useParams();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [events, setEvents] = useState<AppEvent[]>([]);

  useEffect(() => {
    setEvents(eventStore.getEvents());
    const handleUpdate = () => setEvents(eventStore.getEvents());
    window.addEventListener('eventsUpdated', handleUpdate);
    return () => window.removeEventListener('eventsUpdated', handleUpdate);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleAddBet = () => {
    setEventModalOpen(true);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-scale-in">
      {/* Header and Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Acompanhamento</h1>
        </div>
        <div className="flex w-full md:w-auto items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrint} title="Imprimir Relatório">
            <Printer className="h-4 w-4" />
          </Button>
          <Button onClick={handleAddBet}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Evento
          </Button>
        </div>
      </div>

      {/* KPI Cards (Grid) -> Replaced by Goal Progress Charts */}
      <div className="grid grid-cols-1 gap-6">
        {events.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
              <Target className="h-8 w-8 mb-4 opacity-50" />
              <p>Nenhum evento cadastrado para acompanhamento.</p>
              <p className="text-sm">Clique em "Adicionar Evento" para começar a traçar metas.</p>
            </CardContent>
          </Card>
        ) : (
          events.map(event => (
            <Card key={event.id} className="glass-card overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-border/50 pb-4">
                <CardTitle className="text-lg uppercase tracking-wider text-primary flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {event.name}
                </CardTitle>
                <CardDescription>Acompanhamento de metas deste evento</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {event.ejGoals.map(goal => {
                    const yMatches = goal.coreText.match(/\d+/);
                    const y = yMatches ? parseInt(yMatches[0], 10) : 100; // default to 100 if no number found
                    const x = goal.checkedBy?.length || 0;
                    const pct = Math.min(Math.round((x / y) * 100), 100);

                    return (
                      <div key={goal.id} className="space-y-3 bg-muted/10 p-4 rounded-xl border border-border/50">
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-sm font-semibold leading-tight flex-1 text-[#0A1942]">{goal.text}</p>
                          <Badge variant="outline" className="shrink-0 bg-white">
                            {x} / {goal.coreText}
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progresso</span>
                            <span className="font-medium text-primary">{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                  {event.ejGoals.length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-full">Sem metas específicas cadastradas.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
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
                    <Button variant="secondary" size="sm" onClick={() => setDetailModalOpen(true)}>Ver detalhes</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

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

      <EjDetailModal 
        open={detailModalOpen} 
        onOpenChange={setDetailModalOpen} 
      />
      <EventRegistrationModal
        open={eventModalOpen}
        onOpenChange={setEventModalOpen}
      />
    </div>
  );
}
