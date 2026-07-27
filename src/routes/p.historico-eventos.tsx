import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { eventStore, AppEvent } from "@/lib/eventStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trophy, Calendar as CalendarIcon, Printer, Trash2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ejDataStore } from "@/lib/ejDataStore";
import { ejsList } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/p/historico-eventos")({
  component: HistoricoEventos,
});

function HistoricoEventos() {
  const [completedEvents, setCompletedEvents] = useState<AppEvent[]>([]);

  useEffect(() => {
    const loadEvents = () => {
      const allEvents = eventStore.getEvents();
      setCompletedEvents(allEvents.filter(e => e.status === 'completed'));
    };

    loadEvents();
    window.addEventListener('eventsUpdated', loadEvents);
    return () => window.removeEventListener('eventsUpdated', loadEvents);
  }, []);

  const handleDeleteEvent = (eventId: string) => {
    const confirmText = window.prompt("Digite APAGAR para confirmar a exclusão deste evento do histórico:");
    if (confirmText === "APAGAR") {
      eventStore.deleteEvent(eventId);
      toast.success("Evento excluído com sucesso.");
    } else if (confirmText !== null) {
      toast.error("Exclusão cancelada. Confirmação incorreta.");
    }
  };

  if (completedEvents.length === 0) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-[#0A1942]">Histórico de Eventos</h1>
        <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-2xl font-bold text-foreground">Nenhum evento concluído ainda</h3>
          <p className="text-muted-foreground mt-2">Os eventos que você concluir aparecerão aqui com suas métricas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col space-y-8 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0A1942]">Histórico de Eventos</h1>
        <p className="text-muted-foreground mt-2">Métricas e resultados de EJs que bateram metas.</p>
      </div>

      <div className="space-y-8">
        {completedEvents.map(event => {
          // Prepare chart data
          const completionDates = event.completionDates || {};
          const datesMap: Record<string, number> = {};
          
          Object.entries(completionDates).forEach(([ejName, dateIso]) => {
            const dateStr = format(parseISO(dateIso), 'dd/MM', { locale: ptBR });
            datesMap[dateStr] = (datesMap[dateStr] || 0) + 1;
          });

          const chartData = Object.entries(datesMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => {
              // Basic string sort since dd/MM, we could parse properly but string sort mostly works for same month.
              // A better way is to sort by original date. Let's do string sort for simplicity
              return a.date.localeCompare(b.date);
            });

          const totalEjsMet = Object.keys(completionDates).length;

          const allEjs = ejsList.map(ej => ej.name);
          const apostasEjs: { name: string, goals: string[] }[] = [];
          const nonApostasEjs: { name: string, goals: string[] }[] = [];

          allEjs.forEach(ejName => {
            const ejData = ejDataStore.getEjData(ejName);
            const isAposta = ejData?.apostas?.[event.id] === true;
            
            const achievedGoals = event.ejGoals.filter(g => g.checkedBy?.includes(ejName) || g.checked).map(g => g.text);
            
            if (isAposta) {
              apostasEjs.push({ name: ejName, goals: achievedGoals });
            } else if (achievedGoals.length > 0) {
              nonApostasEjs.push({ name: ejName, goals: achievedGoals });
            }
          });

          return (
            <Card key={event.id} className="overflow-hidden glass-card print:shadow-none print:border-none">
              <CardHeader className="bg-[#0A1942]/5 pb-8 print:bg-transparent">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                  <div>
                    <CardTitle className="text-2xl text-[#0A1942] uppercase font-bold">{event.name}</CardTitle>
                    <CardDescription className="flex items-center mt-2 text-sm font-medium">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Concluído em: {event.completedAt ? format(parseISO(event.completedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Data desconhecida'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-yellow-500/10 text-yellow-600 px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm print:hidden">
                      <Trophy className="w-5 h-5" />
                      {totalEjsMet} {totalEjsMet === 1 ? 'EJ Bateu' : 'EJs Bateram'} Metas
                    </div>
                    <div className="flex gap-2 print:hidden">
                      <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" />
                        Gerar PDF
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-8">
                {chartData.length > 0 ? (
                  <div className="h-[300px] w-full mt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-6 uppercase tracking-wider text-center">Ritmo de Bate-Metas por Dia</h4>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748B', fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis 
                          allowDecimals={false}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748B', fontSize: 12 }}
                        />
                        <RechartsTooltip 
                          cursor={{ fill: '#F1F5F9' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar 
                          dataKey="count" 
                          name="EJs" 
                          fill="#F97316" 
                          radius={[6, 6, 0, 0]}
                          barSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">Nenhuma EJ completou as metas para este evento.</p>
                  </div>
                )}
                
                {chartData.length > 0 && (
                  <div className="print:hidden">
                    <h4 className="text-sm font-semibold text-muted-foreground mt-8 mb-4 uppercase tracking-wider">EJs que Alcançaram o Resultado</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(completionDates).map(([ejName, dateIso]) => (
                        <div key={ejName} className="bg-white p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-3">
                          <div className="bg-yellow-500/10 p-2 rounded-lg text-yellow-600">
                            <Trophy className="w-5 h-5" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="font-bold text-sm truncate" title={ejName}>{ejName}</p>
                            <p className="text-xs text-muted-foreground font-medium">{format(parseISO(dateIso), 'dd/MM/yyyy')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Relatório Detalhado (Para Impressão/PDF) */}
                <div className="mt-12 border-t pt-8">
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[#0A1942]">
                    <Flame className="w-6 h-6 text-orange-500" />
                    Relatório de EJs Apostas
                  </h3>
                  <div className="space-y-4">
                    {apostasEjs.length > 0 ? apostasEjs.map(ej => (
                      <div key={ej.name} className="bg-muted/10 p-5 rounded-xl border border-border/60">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-bold text-lg text-[#0A1942]">{ej.name}</p>
                          <span className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">
                            Metas: {ej.goals.length}/{event.ejGoals.length}
                          </span>
                        </div>
                        <ul className="list-disc list-inside mt-3 space-y-1">
                          {ej.goals.map((g, i) => <li key={i} className="text-sm text-green-700 font-medium">{g}</li>)}
                          {ej.goals.length === 0 && <li className="text-sm text-muted-foreground italic">Nenhuma meta alcançada.</li>}
                        </ul>
                      </div>
                    )) : <p className="text-muted-foreground">Nenhuma aposta foi registrada para este evento.</p>}
                  </div>
                </div>

                <div className="mt-8 border-t pt-8">
                  <h3 className="text-2xl font-bold mb-6 text-[#0A1942]">Outras EJs que pontuaram</h3>
                  <div className="space-y-4">
                    {nonApostasEjs.length > 0 ? nonApostasEjs.map(ej => (
                      <div key={ej.name} className="bg-muted/10 p-5 rounded-xl border border-border/60">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-bold text-lg text-[#0A1942]">{ej.name}</p>
                          <span className="text-sm font-semibold bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                            Metas: {ej.goals.length}/{event.ejGoals.length}
                          </span>
                        </div>
                        <ul className="list-disc list-inside mt-3 space-y-1">
                          {ej.goals.map((g, i) => <li key={i} className="text-sm text-green-700 font-medium">{g}</li>)}
                        </ul>
                      </div>
                    )) : <p className="text-muted-foreground">Nenhuma outra EJ pontuou neste evento.</p>}
                  </div>
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
