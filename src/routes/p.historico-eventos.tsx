import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { eventStore, AppEvent } from "@/lib/eventStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trophy, Calendar as CalendarIcon } from "lucide-react";

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

          return (
            <Card key={event.id} className="overflow-hidden glass-card">
              <CardHeader className="bg-[#0A1942]/5 pb-8">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                  <div>
                    <CardTitle className="text-2xl text-[#0A1942] uppercase font-bold">{event.name}</CardTitle>
                    <CardDescription className="flex items-center mt-2 text-sm font-medium">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      Concluído em: {event.completedAt ? format(parseISO(event.completedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Data desconhecida'}
                    </CardDescription>
                  </div>
                  <div className="bg-yellow-500/10 text-yellow-600 px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm">
                    <Trophy className="w-5 h-5" />
                    {totalEjsMet} {totalEjsMet === 1 ? 'EJ Bateu' : 'EJs Bateram'} Metas
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
                  <>
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
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
