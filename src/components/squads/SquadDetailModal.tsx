import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Users, Building2, TrendingUp, Trophy } from "lucide-react";
import { squadStore, Squad } from "@/lib/squadStore";
import { guardianStore } from "@/lib/guardianStore";
import { ejListStore } from "@/lib/ejListStore";
import { leadStore } from "@/lib/leadStore";
import { eventStore, AppEvent } from "@/lib/eventStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface SquadDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  squad: Squad | null;
}

export function SquadDetailModal({ open, onOpenChange, squad }: SquadDetailModalProps) {
  const [ejs, setEjs] = useState(ejListStore.getEjs());
  const [leads, setLeads] = useState(leadStore.getLeads());
  const [events, setEvents] = useState<AppEvent[]>([]);

  useEffect(() => {
    const handleUpdate = () => {
      setEjs(ejListStore.getEjs());
      setLeads(leadStore.getLeads());
      setEvents(eventStore.getEvents().filter(e => e.status !== 'completed'));
    };

    handleUpdate();
    window.addEventListener('ejListUpdated', handleUpdate);
    window.addEventListener('leadsUpdated', handleUpdate);
    window.addEventListener('eventsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('ejListUpdated', handleUpdate);
      window.removeEventListener('leadsUpdated', handleUpdate);
      window.removeEventListener('eventsUpdated', handleUpdate);
    };
  }, []);

  if (!open || !squad) return null;

  const leaderConfig = squad ? guardianStore.get(squad.leader) : null;
  const leaderAvatar = leaderConfig?.avatarUrl;

  const guardianNames = squad.squad_members?.map(m => m.guardian_name) || [];
  if (!guardianNames.includes(squad.leader)) {
    guardianNames.push(squad.leader);
  }

  const squadEjs = ejs.filter(ej => guardianNames.includes(ej.guardian));
  const squadEjNames = squadEjs.map(ej => ej.name);

  // Faturamento
  const squadLeads = leads.filter(lead => squadEjNames.includes(lead.ejId));
  const faturamentoFechado = squadLeads
    .filter(l => l.status === 'fechado')
    .reduce((acc, lead) => acc + (lead.expectedValue || 0), 0);

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Progresso de Metas
  let totalPossibleEjGoals = 0;
  let completedEjGoals = 0;
  events.forEach(event => {
    event.ejGoals.forEach(goal => {
      totalPossibleEjGoals += squadEjNames.length;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="modal-shell max-w-4xl p-0 gap-0 glass-modal border-none shadow-2xl rounded-2xl">
        <div className="w-full h-40 bg-gradient-to-r from-primary/80 to-primary flex items-end p-8 relative rounded-t-2xl">
          <div className="text-white z-10 flex gap-4 items-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl overflow-hidden shrink-0">
            {leaderAvatar ? (
              <img src={leaderAvatar} alt={`Líder ${squad.leader}`} className="w-full h-full object-cover" />
            ) : (
              <Users className="w-10 h-10 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-4xl font-extrabold drop-shadow-md">{squad.name}</h1>
            <p className="text-primary-foreground/90 font-medium text-lg flex items-center gap-2 mt-1">
              Líder: {squad.leader}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          <Card className="glass-card overflow-hidden border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-4">
              <CardTitle className="text-xl flex items-center gap-2 text-primary">
                <Trophy className="w-6 h-6" />
                Desempenho Geral do Squad
              </CardTitle>
              <CardDescription>Resumo de metas e faturamento deste squad</CardDescription>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Faturamento Fechado</span>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-foreground">{formatBRL(faturamentoFechado)}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Valor total de leads marcados como "Fechado" nas EJs deste squad.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground mb-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">Metas dos Eventos</span>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-2xl font-bold">{progressPercentage}%</span>
                    <span className="text-sm font-medium text-muted-foreground mt-2">{completedEjGoals} / {totalPossibleEjGoals}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3 rounded-full" />
                </div>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                EJs do Squad ({squadEjs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {squadEjs.map(ej => (
                  <div key={ej.id} className="p-4 rounded-xl border bg-card flex flex-col justify-center">
                    <h4 className="font-bold">{ej.name}</h4>
                    <p className="text-sm text-muted-foreground">Guardião: {ej.guardian}</p>
                  </div>
                ))}
                {squadEjs.length === 0 && (
                  <p className="text-muted-foreground text-sm col-span-full">Nenhuma EJ vinculada a este squad ainda.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Guardiões ({guardianNames.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {guardianNames.map(name => {
                  const avatar = guardianStore.get(name)?.avatarUrl;
                  return (
                  <li key={name} className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 shadow-sm border border-primary/20">
                      {avatar ? (
                        <img src={avatar} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-bold text-lg">{name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-base leading-tight">{name}</p>
                      {name === squad.leader && (
                        <span className="text-sm text-primary font-bold">Líder</span>
                      )}
                    </div>
                  </li>
                )})}
              </ul>
            </CardContent>
          </Card>
        </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
