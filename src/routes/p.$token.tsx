import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Target, TrendingUp, Users, Search, PlusCircle, Printer, Pencil, ListChecks, ChevronDown, ChevronRight, Activity as ActivityIcon, Flame, Trophy, Timer, CalendarClock, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { EjDetailModal } from "@/components/ejs/EjDetailModal";
import { EventRegistrationModal } from "@/components/events/EventRegistrationModal";
import { eventStore, AppEvent, EventGoal } from "@/lib/eventStore";
import { leadStore, Lead } from "@/lib/leadStore";
import { ejDataStore } from "@/lib/ejDataStore";
import { ejListStore } from "@/lib/ejListStore";
import { TodayTomorrowMeetings } from "@/components/dashboard/TodayTomorrowMeetings";
import { SquadProgressWidget } from "@/components/dashboard/SquadProgressWidget";
import { activityStore, Activity } from "@/lib/activityStore";
import { mentionStore, Mention } from "@/lib/mentionStore";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAccessRole } from "@/lib/access";

// --- Countdown Component ---
// Datas vêm como "YYYY-MM-DD". Auditoria encerra às 23:59:59 do dia; evento começa à meia-noite.
function parseTarget(date: string, endOfDay: boolean) {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return new Date(date).getTime();
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
    : new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

function useCountdown(targetDate?: string, endOfDay = false) {
  const getTimeLeft = useCallback(() => {
    if (!targetDate) return null;
    const diff = parseTarget(targetDate, endOfDay) - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds };
  }, [targetDate, endOfDay]);

  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, [getTimeLeft]);

  return timeLeft;
}

function CountdownDisplay({ title, targetDate, large = false, color = "text-primary", icon: Icon, endOfDay = false }: { title: string; targetDate?: string; large?: boolean; color?: string; icon: any; endOfDay?: boolean }) {
  const time = useCountdown(targetDate, endOfDay);
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

export const Route = createFileRoute("/p/$token")({
  head: () => ({
    meta: [
      { title: "Painel Geral — Metas e Faturamento da Rede" },
      { name: "description", content: "Acompanhe metas dos eventos, previsão de faturamento e as últimas atualizações de todas as EJs da rede." },
      { property: "og:title", content: "Painel Geral — Metas e Faturamento da Rede" },
      { property: "og:description", content: "Acompanhe metas dos eventos, previsão de faturamento e as últimas atualizações de todas as EJs da rede." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPanel,
});

function DashboardPanel() {
  const { token } = Route.useParams();
  const role = useAccessRole();
  const canEditEvents = role === "admin";
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEjForDetail, setSelectedEjForDetail] = useState<{name: string} | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [eventToEdit, setEventToEdit] = useState<AppEvent | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<EventGoal | null>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsModalOpen, setLeadsModalOpen] = useState(false);
  const [leadsModalStatus, setLeadsModalStatus] = useState<'todos' | 'fechado' | 'quente' | 'morno' | 'frio'>('todos');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [expandedEjUpdates, setExpandedEjUpdates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setEvents(eventStore.getEvents().filter(e => e.status !== 'completed'));
    setLeads(leadStore.getLeads());
    setActivities(activityStore.getActivities());
    setMentions(mentionStore.getMentions().filter(m => !m.read).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    const handleUpdate = () => {
      setEvents(eventStore.getEvents().filter(e => e.status !== 'completed'));
      setLeads(leadStore.getLeads());
      setActivities(activityStore.getActivities());
      setMentions(mentionStore.getMentions().filter(m => !m.read).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };
    window.addEventListener('eventsUpdated', handleUpdate);
    window.addEventListener('leadsUpdated', handleUpdate);
    window.addEventListener('activitiesUpdated', handleUpdate);
    window.addEventListener('mentionsUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('eventsUpdated', handleUpdate);
      window.removeEventListener('leadsUpdated', handleUpdate);
      window.removeEventListener('activitiesUpdated', handleUpdate);
      window.removeEventListener('mentionsUpdated', handleUpdate);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleAddBet = () => {
    setEventToEdit(null);
    setEventModalOpen(true);
  };

  const handleEditEvent = (event: AppEvent) => {
    setEventToEdit(event);
    setEventModalOpen(true);
  };

  return (
    <div className="page-shell space-y-8 animate-scale-in">
      {/* Header and Actions */}
      <div className="flex flex-col lg:flex-row lg:justify-between items-start lg:items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Painel de Acompanhamento</h1>
        </div>
        <div className="flex w-full lg:w-auto flex-wrap items-center gap-2">

          <Button variant="outline" size="icon" onClick={handlePrint} title="Imprimir Relatório">
            <Printer className="h-4 w-4" />
          </Button>
          {canEditEvents && (
            <Button onClick={handleAddBet}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Evento
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards (Grid) -> Replaced by Goal Progress Charts */}
      <div className="grid grid-cols-1 gap-6">
        {events.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
              <Target className="h-8 w-8 mb-4 opacity-50" />
              <p>Nenhum evento cadastrado para acompanhamento.</p>
              {canEditEvents && <p className="text-sm">Clique em "Adicionar Evento" para começar a traçar metas.</p>}
            </CardContent>
          </Card>
        ) : (
          events.map(event => (
            <Card key={event.id} className="glass-card overflow-hidden">
              <CardHeader className="bg-primary/5 border-b border-border/50 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg uppercase tracking-wider text-primary flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {event.name}
                  </CardTitle>
                  <CardDescription>Acompanhamento de metas deste evento</CardDescription>
                </div>
                {canEditEvents && (
                  <Button variant="ghost" size="icon" onClick={() => handleEditEvent(event)}>
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </CardHeader>

              {/* Countdowns */}
              {(event.auditDate || event.startDate || event.endDate) && (() => {
                const auditPassed = event.auditDate ? parseTarget(event.auditDate, true) <= Date.now() : true;
                const eventStart = event.startDate || event.endDate;
                return (
                  <div className="bg-gradient-to-r from-muted/30 to-muted/10 border-b border-border/50 px-6 py-4 flex flex-wrap items-center justify-around gap-6">
                    {!auditPassed && (
                      <CountdownDisplay targetDate={event.auditDate} endOfDay color="text-orange-500" title="Fim das Auditorias" icon={Timer} />
                    )}

                    {eventStart && (
                      <CountdownDisplay targetDate={eventStart} large={auditPassed} color="text-primary" title="Início do Evento" icon={CalendarClock} />
                    )}

                  </div>
                );
              })()}

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(event.ejGoals || []).filter(Boolean).map(goal => {
                    const coreText = String(goal.coreText || "100");
                    const yMatches = coreText.match(/\d+/);
                    const y = yMatches ? parseInt(yMatches[0], 10) : 100; // default to 100 if no number found
                    const x = goal.checkedBy?.length || 0;
                    const pct = Math.min(Math.round((x / y) * 100), 100);

                    return (
                      <div 
                        key={goal.id} 
                        className="space-y-3 bg-muted/10 p-4 rounded-xl border border-border/50 cursor-pointer hover:bg-muted/20 transition-colors"
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
                            <span className="font-medium text-primary">{pct}%</span>
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
          ))
        )}
      </div>

      {/* Squad Progress Widget */}
      <SquadProgressWidget />

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="lg:col-span-1">
            <TodayTomorrowMeetings onEjClick={(ejName) => {
              setSelectedEjForDetail({ name: ejName });
              setDetailModalOpen(true);
            }} />
          </div>
          {/* Global Revenue Card */}
          {(() => {
            const safeLeads = Array.isArray(leads) ? leads : [];
            const fechado = safeLeads.filter(l => l?.status === 'fechado').reduce((acc, lead) => acc + (lead?.expectedValue || 0), 0);
            const quente = safeLeads.filter(l => l?.status === 'quente').reduce((acc, lead) => acc + (lead?.expectedValue || 0), 0);
            const morno = safeLeads.filter(l => l?.status === 'morno').reduce((acc, lead) => acc + (lead?.expectedValue || 0), 0);
            const frio = safeLeads.filter(l => l?.status === 'frio').reduce((acc, lead) => acc + (lead?.expectedValue || 0), 0);
            const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

            return (
              <Card 
                className="glass-card cursor-pointer hover:shadow-lg transition-all border-primary/20"
                onClick={() => { setLeadsModalStatus('todos'); setLeadsModalOpen(true); }}
              >
                <CardHeader className="bg-primary/5 border-b border-border/50 pb-4">
                  <CardTitle className="text-lg uppercase tracking-wider text-primary flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Previsão de Faturamento da Rede
                  </CardTitle>
                  <CardDescription>Clique em cada etapa para ver a lista de contratos</CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4">
                    <button
                      type="button"
                      className="text-left rounded-xl p-3 -m-1 hover:bg-green-500/10 transition-colors min-h-[44px]"
                      onClick={(e) => { e.stopPropagation(); setLeadsModalStatus('fechado'); setLeadsModalOpen(true); }}
                    >
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Contratos Fechados</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-500">{formatBRL(fechado)}</p>
                    </button>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-center flex-1 min-w-[120px] min-h-[44px] hover:bg-red-500/20 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setLeadsModalStatus('quente'); setLeadsModalOpen(true); }}
                      >
                        <p className="text-xs font-bold text-red-600 uppercase mb-1">Quente</p>
                        <p className="text-base font-bold text-red-600 dark:text-red-400">{formatBRL(quente)}</p>
                      </button>
                      <button
                        type="button"
                        className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl text-center flex-1 min-w-[120px] min-h-[44px] hover:bg-orange-500/20 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setLeadsModalStatus('morno'); setLeadsModalOpen(true); }}
                      >
                        <p className="text-xs font-bold text-orange-600 uppercase mb-1">Morno</p>
                        <p className="text-base font-bold text-orange-600 dark:text-orange-400">{formatBRL(morno)}</p>
                      </button>
                      <button
                        type="button"
                        className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-center flex-1 min-w-[120px] min-h-[44px] hover:bg-blue-500/20 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setLeadsModalStatus('frio'); setLeadsModalOpen(true); }}
                      >
                        <p className="text-xs font-bold text-blue-600 uppercase mb-1">Frio</p>
                        <p className="text-base font-bold text-blue-600 dark:text-blue-400">{formatBRL(frio)}</p>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

        </div>

        {/* Sidebar Widgets (Feed) */}
        <div className="space-y-6">
          
          {/* Mentions Widget */}
          {mentions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold tracking-tight text-primary">Menções Recentes</h2>
              <Card className="glass-card bg-primary/5 border-primary/20 shadow-sm max-h-[300px] overflow-auto">
                <CardContent className="p-4 space-y-3">
                  {mentions.map((mention) => (
                    <div 
                      key={mention.id}
                      className="bg-card rounded-lg p-3 border border-primary/10 shadow-sm cursor-pointer hover:border-primary/40 transition-colors"
                      onClick={() => {
                        setSelectedEjForDetail({ name: mention.ejName });
                        setDetailModalOpen(true);
                        mentionStore.markAsRead(mention.id);
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-primary">@{mention.guardianName}</span>
                        <span className="text-xs text-muted-foreground">{new Date(mention.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">Mencionado em <span className="font-medium text-foreground">{mention.ejName}</span> ({mention.source})</p>
                      <p className="text-sm italic text-foreground bg-muted/30 p-2 rounded line-clamp-2">"{mention.contextText}"</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          <h2 className="text-xl font-semibold tracking-tight mt-6">Últimas Atualizações</h2>
          <Card className="glass-card bg-muted/30 border-none shadow-inner h-[400px] overflow-auto">
            <CardContent className="p-6">
              {activities.length === 0 ? (
                <div className="text-center space-y-4 mt-8">
                  <p className="text-muted-foreground">
                    Nada de novo por aqui. O que você quer acompanhar hoje?
                  </p>
                  <Button variant="outline" size="sm">Adicionar nova atividade</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(
                    activities.reduce((acc, activity) => {
                      if (!acc[activity.ejName]) {
                        acc[activity.ejName] = [];
                      }
                      acc[activity.ejName].push(activity);
                      return acc;
                    }, {} as Record<string, Activity[]>)
                  ).map(([ejName, ejActivities]) => {
                    const isExpanded = expandedEjUpdates[ejName];
                    const mostRecent = ejActivities[0]; // Already sorted by timestamp desc
                    
                    return (
                      <div 
                        key={ejName}
                        className="bg-card rounded-xl shadow-sm border border-border/50 overflow-hidden transition-all"
                      >
                        {/* Group Header */}
                        <div 
                          className="p-4 cursor-pointer hover:bg-muted/10 transition-colors flex items-center justify-between"
                          onClick={() => {
                            setSelectedEjForDetail({ name: ejName });
                            setDetailModalOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary">
                              <ActivityIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm text-foreground">{ejName}</h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {ejActivities.length} {ejActivities.length === 1 ? 'atualização' : 'atualizações'}
                              </p>
                            </div>
                          </div>
                          
                          <div 
                            className="p-2 hover:bg-muted/20 rounded-full transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedEjUpdates(prev => ({
                                ...prev,
                                [ejName]: !prev[ejName]
                              }));
                            }}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>

                        {/* Collapsed Content */}
                        {isExpanded && (
                          <div className="border-t border-border/50 bg-muted/5 p-4 space-y-3">
                            {ejActivities.map(activity => (
                              <div key={activity.id} className="flex items-start gap-2 relative group before:absolute before:left-[3px] before:top-4 before:bottom-[-16px] before:w-[2px] before:bg-border last:before:hidden">
                                <div className="w-2 h-2 rounded-full bg-primary/40 mt-1.5 relative z-10 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-foreground/80 whitespace-pre-wrap break-words">{activity.description}</p>
                                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 font-medium uppercase">
                                    {new Date(activity.timestamp).toLocaleString('pt-BR')}
                                  </p>
                                </div>
                                {canEditEvents && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0 -mt-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm("Tem certeza que deseja apagar esta atualização?")) {
                                        activityStore.deleteActivity(activity.id);
                                        toast.success("Atualização apagada com sucesso.");
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EjDetailModal 
        open={detailModalOpen} 
        onOpenChange={(open) => {
          setDetailModalOpen(open);
          if (!open) setSelectedEjForDetail(null);
        }}
        ejData={selectedEjForDetail}
      />
      <EventRegistrationModal
        open={eventModalOpen}
        onOpenChange={(open) => {
          setEventModalOpen(open);
          if (!open) setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
      />
      
      {/* View Goal Checkers Dialog */}
      <Dialog open={!!selectedGoal} onOpenChange={(open) => !open && setSelectedGoal(null)}>
        <DialogContent className="modal-shell max-w-md bg-[#FAF8F5] border-border/50 shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              EJs que concluíram
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <h3 className="font-semibold text-primary mb-4">{selectedGoal?.text}</h3>
            <div className="space-y-2 max-h-60 overflow-auto pr-2">
              {(!selectedGoal?.checkedBy || selectedGoal.checkedBy.length === 0) ? (
                <p className="text-sm text-muted-foreground">Nenhuma EJ concluiu esta meta ainda.</p>
              ) : (
                selectedGoal.checkedBy.map((ejId, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-card p-3 rounded-lg border shadow-sm">
                    <ListChecks className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-sm">{ejId}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global Leads Modal */}
      <Dialog open={leadsModalOpen} onOpenChange={setLeadsModalOpen}>
        <DialogContent className="modal-shell max-w-4xl bg-[#FAF8F5] border-border/50 shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              {leadsModalStatus === 'todos' ? 'Detalhamento de Faturamento'
                : leadsModalStatus === 'fechado' ? 'Contratos Fechados'
                : `Leads ${leadsModalStatus === 'quente' ? 'Quentes' : leadsModalStatus === 'morno' ? 'Mornos' : 'Frios'}`}
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const statuses: Array<'todos' | 'fechado' | 'quente' | 'morno' | 'frio'> = ['todos', 'fechado', 'quente', 'morno', 'frio'];
            const labels: Record<string, string> = { todos: 'Todos', fechado: 'Fechados', quente: 'Quente', morno: 'Morno', frio: 'Frio' };
            const safeLeads = Array.isArray(leads) ? leads : [];
            const visible = safeLeads
              .filter(l => leadsModalStatus === 'todos' ? true : l?.status === leadsModalStatus)
              .sort((a, b) => {
                const ta = a.closingDate ? new Date(a.closingDate).getTime() : NaN;
                const tb = b.closingDate ? new Date(b.closingDate).getTime() : NaN;
                const va = Number.isNaN(ta), vb = Number.isNaN(tb);
                if (va && vb) return 0;
                if (va) return 1; // sem data por último
                if (vb) return -1;
                return ta - tb;
              });
            const total = visible.reduce((acc, l) => acc + (l?.expectedValue || 0), 0);

            return (
              <>
                <div className="flex flex-wrap gap-2">
                  {statuses.map(s => (
                    <Button
                      key={s}
                      type="button"
                      size="sm"
                      variant={leadsModalStatus === s ? 'default' : 'outline'}
                      className="rounded-full min-h-[36px]"
                      onClick={() => setLeadsModalStatus(s)}
                    >
                      {labels[s]}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {visible.length} contrato(s) • Total {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                </p>
                <div className="py-2 max-h-[60vh] overflow-auto">
                  {visible.length === 0 ? (
                    <p className="text-center text-muted-foreground p-8 bg-card rounded-xl border">Nenhum contrato nesta etapa ainda.</p>
                  ) : (
                    <div className="space-y-4">
                      {visible.map(lead => (
                        <div key={lead.id} className="bg-card p-4 rounded-xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary uppercase text-[10px]">
                                {lead.ejId}
                              </Badge>
                              <span className="font-bold text-foreground">{lead.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{lead.observations || 'Sem observações detalhadas'}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold text-primary text-lg">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.expectedValue)}
                              </p>
                            </div>
                            <div className="w-24 text-center">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${
                                lead.status === 'fechado' ? 'bg-green-600 text-white' :
                                lead.status === 'quente' ? 'bg-red-500 text-white' : 
                                lead.status === 'morno' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                              }`}>
                                {lead.status}
                              </span>
                            </div>
                            <div className="w-28 text-right">
                              <p className="text-xs text-muted-foreground uppercase font-semibold">Vencimento</p>
                              <p className="text-sm font-medium">
                                {lead.closingDate ? new Date(lead.closingDate).toLocaleDateString('pt-BR') : 'Sem data'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
