import { useQuery } from "@tanstack/react-query";
import { squadStore, Squad } from "@/lib/squadStore";
import { eventStore, AppEvent } from "@/lib/eventStore";
import { ejListStore } from "@/lib/ejListStore";
import { leadStore } from "@/lib/leadStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, Trophy, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { SquadDetailModal } from "@/components/squads/SquadDetailModal";

export function SquadProgressWidget() {
  const { data: squads = [], isLoading } = useQuery({
    queryKey: ["squads"],
    queryFn: squadStore.getSquads,
  });

  const [events, setEvents] = useState<AppEvent[]>([]);
  const [ejs, setEjs] = useState(ejListStore.getEjs());
  const [leads, setLeads] = useState(leadStore.getLeads());
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    setEvents(eventStore.getEvents().filter(e => e.status !== 'completed'));
    
    const handleEventsUpdate = () => {
      setEvents(eventStore.getEvents().filter(e => e.status !== 'completed'));
    };
    
    const handleEjsUpdate = () => {
      setEjs(ejListStore.getEjs());
    };
    
    const handleLeadsUpdate = () => {
      setLeads(leadStore.getLeads());
    };

    window.addEventListener('eventsUpdated', handleEventsUpdate);
    window.addEventListener('ejListUpdated', handleEjsUpdate);
    window.addEventListener('leadsUpdated', handleLeadsUpdate);
    
    return () => {
      window.removeEventListener('eventsUpdated', handleEventsUpdate);
      window.removeEventListener('ejListUpdated', handleEjsUpdate);
      window.removeEventListener('leadsUpdated', handleLeadsUpdate);
    };
  }, []);

  if (isLoading || squads.length === 0) {
    return null; // Don't show if no squads or loading
  }

  // Calculate metrics
  const squadMetrics = squads.map(squad => {
    // 1. Find all guardians in this squad
    const guardianNames = squad.squad_members?.map(m => m.guardian_name) || [];
    // Also include the leader? Usually yes.
    if (!guardianNames.includes(squad.leader)) {
      guardianNames.push(squad.leader);
    }

    // 2. Find all EJs belonging to these guardians
    const squadEjs = ejs.filter(ej => guardianNames.includes(ej.guardian));
    const squadEjNames = squadEjs.map(ej => ej.name);

    // 3. Calculate "Soma das metas de todas as EJs" in active events
    let totalPossibleEjGoals = 0;
    let completedEjGoals = 0;

    events.forEach(event => {
      event.ejGoals.forEach(goal => {
        // For each goal, each EJ in the squad can complete it
        totalPossibleEjGoals += squadEjNames.length;
        
        // Count how many EJs in the squad actually completed it
        squadEjNames.forEach(ejName => {
          if (goal.checkedBy?.includes(ejName) || goal.checked) {
            completedEjGoals++;
          }
        });
      });
    });

    const progressPercentage = totalPossibleEjGoals > 0 
      ? Math.round((completedEjGoals / totalPossibleEjGoals) * 100) 
      : 0;
      
    // 4. Calculate Faturamento Fechado
    const squadLeads = leads.filter(lead => squadEjNames.includes(lead.ejId));
    const faturamentoFechado = squadLeads
      .filter(l => l.status === 'fechado')
      .reduce((acc, lead) => acc + (lead.expectedValue || 0), 0);

    return {
      ...squad,
      squadEjsCount: squadEjNames.length,
      totalPossibleEjGoals,
      completedEjGoals,
      progressPercentage,
      faturamentoFechado
    };
  });

  // Sort by progress
  squadMetrics.sort((a, b) => b.progressPercentage - a.progressPercentage);

  return (
    <Card className="glass-card mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Ranking de Squads
        </CardTitle>
        <CardDescription>
          Acompanhamento consolidado das metas de EJs por squad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {squadMetrics.map((squad, index) => (
            <div 
              key={squad.id} 
              className="space-y-2 p-3 rounded-lg border border-transparent hover:border-primary/20 hover:bg-muted/10 cursor-pointer transition-colors"
              onClick={() => {
                setSelectedSquad(squad);
                setDetailModalOpen(true);
              }}
            >
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    {index === 0 && <span className="text-xl">🥇</span>}
                    {index === 1 && <span className="text-xl">🥈</span>}
                    {index === 2 && <span className="text-xl">🥉</span>}
                    {squad.name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {squad.squad_members?.length || 0} membros • {squad.squadEjsCount} EJs vinculadas
                  </p>
                  <p className="text-xs text-primary mt-1 flex items-center gap-1 font-medium">
                    <TrendingUp className="w-3 h-3" />
                    Faturamento: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(squad.faturamentoFechado)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-primary">{squad.progressPercentage}%</span>
                  <p className="text-xs text-muted-foreground">
                    {squad.completedEjGoals} / {squad.totalPossibleEjGoals} metas
                  </p>
                </div>
              </div>
              <Progress value={squad.progressPercentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>

      <SquadDetailModal 
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        squad={selectedSquad}
      />
    </Card>
  );
}
