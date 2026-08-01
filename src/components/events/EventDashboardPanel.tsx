import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Target, Timer, CalendarClock, ListChecks } from "lucide-react";
import { eventStore, AppEvent, EventGoal } from "@/lib/eventStore";

export function useCountdown(targetDate?: string) {
  const getTimeLeft = useCallback(() => {
    if (!targetDate) return null;
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds };
  }, [targetDate]);

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [getTimeLeft]);

  return timeLeft;
}

export function CountdownDisplay({ title, targetDate, large = false, color = "text-primary", icon: Icon }: { title: string; targetDate?: string; large?: boolean; color?: string; icon: any }) {
  const time = useCountdown(targetDate);
  if (!targetDate || !time) return null;

  const bgClass = color === "text-primary" ? "bg-primary/10" : color.replace('text-', 'bg-').replace('-500', '-500/10');

  return (
    <div className={`flex items-center gap-3 md:gap-4 ${large ? 'py-2' : 'py-1'}`}>
      <div className={`flex shrink-0 items-center justify-center rounded-2xl ${bgClass} ${large ? 'w-12 h-12 md:w-14 md:h-14' : 'w-10 h-10 md:w-12 md:h-12'}`}>
        <Icon className={`${color} ${large ? 'w-6 h-6 md:w-7 md:h-7' : 'w-5 h-5 md:w-6 md:h-6'}`} />
      </div>
      <div className="flex flex-col items-start justify-center gap-0.5">
        <div className={`flex items-baseline gap-1 font-black tracking-tight ${color} ${large ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'}`}>
          {time.days > 0 && <span>{time.days}d</span>}
          <span>{String(time.hours).padStart(2,'0')}h</span>
          <span>{String(time.minutes).padStart(2,'0')}m</span>
          <span>{String(time.seconds).padStart(2,'0')}s</span>
        </div>
        <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${color}/70`}>{title}</span>
      </div>
    </div>
  );
}

export function EventDashboardPanel() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<EventGoal | null>(null);

  useEffect(() => {
    setEvents(eventStore.getEvents().filter(e => e.status !== 'completed'));
    
    const handleUpdate = () => {
      setEvents(eventStore.getEvents().filter(e => e.status !== 'completed'));
    };
    window.addEventListener('eventsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('eventsUpdated', handleUpdate);
    };
  }, []);

  if (events.length === 0) {
    return null; // Do not show anything if there are no active events
  }

  return (
    <div className="space-y-6">
      {events.map(event => (
        <Card key={event.id} className="glass-card overflow-hidden border-primary/20 shadow-md">
          <CardHeader className="bg-primary/5 border-b border-border/50 pb-4">
            <div>
              <CardTitle className="text-lg sm:text-xl uppercase tracking-wider text-primary flex items-center gap-2">
                <Target className="h-6 w-6" />
                {event.name}
              </CardTitle>
              <CardDescription className="text-sm mt-1">Acompanhamento de metas deste evento</CardDescription>
            </div>
          </CardHeader>

          {/* Countdowns */}
          {(event.auditDate || event.endDate) && (() => {
            const auditPassed = event.auditDate ? new Date(event.auditDate).getTime() <= Date.now() : true;
            return (
              <div className="bg-gradient-to-r from-muted/30 to-muted/10 border-b border-border/50 px-6 py-4 flex flex-wrap items-center justify-around gap-6">
                {!auditPassed && (
                  <CountdownDisplay targetDate={event.auditDate} color="text-orange-500" title="Fim das Auditorias" icon={Timer} />
                )}
                {event.endDate && (
                  <CountdownDisplay targetDate={event.endDate} large={auditPassed} color="text-primary" title="Data do Evento" icon={CalendarClock} />
                )}
              </div>
            );
          })()}

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {(event.ejGoals || []).filter(Boolean).map(goal => {
                const coreText = String(goal.coreText || "100");
                const yMatches = coreText.match(/\d+/);
                const y = yMatches ? parseInt(yMatches[0], 10) : 100;
                const x = goal.checkedBy?.length || 0;
                const pct = Math.min(Math.round((x / y) * 100), 100);

                return (
                  <div 
                    key={goal.id} 
                    className="space-y-3 bg-muted/10 p-4 rounded-xl border border-border/50 cursor-pointer hover:bg-muted/20 transition-colors shadow-sm"
                    onClick={() => setSelectedGoal(goal)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <p className="text-sm font-semibold leading-tight flex-1 text-foreground">{goal.text}</p>
                      <Badge variant="outline" className="shrink-0 bg-card">
                        {x} / {goal.coreText || "-"}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progresso</span>
                        <span className="font-bold text-primary">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  </div>
                );
              })}
              {(event.ejGoals || []).filter(Boolean).length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full">Sem metas específicas cadastradas.</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Goal Details Modal */}
      <Dialog open={!!selectedGoal} onOpenChange={(open) => !open && setSelectedGoal(null)}>
        <DialogContent className="modal-shell max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              EJs que concluíram a meta
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium mb-4">{selectedGoal?.text}</p>
            <div className="space-y-2 max-h-[50vh] overflow-auto pr-2">
              {(!selectedGoal?.checkedBy || selectedGoal.checkedBy.length === 0) ? (
                <p className="text-sm text-muted-foreground bg-card p-4 rounded-xl border">Nenhuma EJ concluiu esta meta ainda.</p>
              ) : (
                selectedGoal.checkedBy.map((ejId, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-card p-3 rounded-lg border shadow-sm">
                    <ListChecks className="h-4 w-4 text-green-500" />
                    <span className="font-bold text-sm text-primary">{ejId}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
