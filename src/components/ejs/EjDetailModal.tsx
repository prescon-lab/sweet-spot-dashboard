import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Briefcase, Calendar as CalendarIcon, Check, Plus, Trash2, Save, Flame, Trophy } from "lucide-react";
import { eventStore, AppEvent } from "@/lib/eventStore";
import { EjLeadFunnelModal } from "./EjLeadFunnelModal";
import { ejDataStore, EjData, Task } from "@/lib/ejDataStore";
import { activityStore } from "@/lib/activityStore";
import { toast } from "sonner";

interface EjDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ejData?: any; // To be typed properly later
}

export function EjDetailModal({ open, onOpenChange, ejData }: EjDetailModalProps) {
  const [funnelModalOpen, setFunnelModalOpen] = useState(false);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  
  const [desafio, setDesafio] = useState("");
  const [dores, setDores] = useState("");
  const [proximaReuniao, setProximaReuniao] = useState("");
  const [notasReuniao, setNotasReuniao] = useState("");
  const [apostas, setApostas] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (open) {
      setEvents(eventStore.getEvents());
      
      // Load saved data for this EJ
      const ejName = ejData?.name || "";
      if (ejName) {
        const data = ejDataStore.getEjData(ejName);
        setTasks(data?.tarefas || []);
        setDesafio(data?.desafio || "");
        setDores(data?.dores || "");
        setProximaReuniao(data?.proximaReuniao || "");
        setNotasReuniao(data?.notasReuniao || "");
        setApostas(data?.apostas || {});
      } else {
        setTasks([]);
        setDesafio("");
        setDores("");
        setProximaReuniao("");
        setNotasReuniao("");
        setApostas({});
      }
    }

    const handleUpdate = () => {
      setEvents(eventStore.getEvents());
    };
    
    window.addEventListener('eventsUpdated', handleUpdate);
    return () => window.removeEventListener('eventsUpdated', handleUpdate);
  }, [open, ejData?.name]);

  const handleSave = () => {
    const ejName = ejData?.name || "Nova EJ";
    const previousData: Partial<EjData> = ejDataStore.getEjData(ejName) || {};
    
    let hasChanges = false;
    
    const truncate = (str: string, length = 40) => {
      if (!str) return "Vazio";
      return str.length > length ? str.substring(0, length) + "..." : str;
    };

    ejDataStore.saveEjData(ejName, {
      desafio,
      dores,
      proximaReuniao,
      notasReuniao,
      tarefas: tasks,
      apostas
    });

    // Registrar atividades específicas para cada alteração
    if (desafio !== (previousData.desafio || "")) {
      hasChanges = true;
      activityStore.addActivity({ ejName, description: `Desafio: "${truncate(desafio)}"`, type: "update" });
    }
    if (dores !== (previousData.dores || "")) {
      hasChanges = true;
      activityStore.addActivity({ ejName, description: `Dores: "${truncate(dores)}"`, type: "update" });
    }
    if (proximaReuniao !== (previousData.proximaReuniao || "")) {
      hasChanges = true;
      const dateStr = proximaReuniao ? new Date(proximaReuniao + "T12:00:00").toLocaleDateString('pt-BR') : 'Remarcada';
      activityStore.addActivity({ ejName, description: `Próxima reunião: ${dateStr}`, type: "update" });
    }
    if (notasReuniao !== (previousData.notasReuniao || "")) {
      hasChanges = true;
      activityStore.addActivity({ ejName, description: `Anotações: "${truncate(notasReuniao)}"`, type: "update" });
    }
    if (JSON.stringify(tasks) !== JSON.stringify(previousData.tarefas || [])) {
      hasChanges = true;
      const completedCount = tasks.filter(t => t.completed).length;
      activityStore.addActivity({ ejName, description: `Tarefas: ${completedCount}/${tasks.length} concluídas`, type: "update" });
    }

    if (!hasChanges) {
      activityStore.addActivity({
        ejName,
        description: "Revisão geral (nenhum dado alterado)",
        type: "update"
      });
    }

    toast.success("Dados salvos com sucesso!");
    onOpenChange(false);
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    setTasks([
      ...tasks,
      {
        id: Date.now(),
        text: newTaskText,
        completed: false,
        date: new Date().toLocaleDateString("pt-BR")
      }
    ]);
    setNewTaskText("");
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] bg-[#FAF8F5] p-0 flex flex-col overflow-hidden gap-0 border-none shadow-2xl">
          {/* Header Area */}
          <div className="flex items-center justify-between p-8 bg-white border-b border-border/40">
            <div className="flex items-center gap-6 flex-1">
              <Avatar className="h-28 w-28 border-4 border-primary/10 shadow-sm">
                <AvatarFallback className="bg-muted text-4xl font-bold">
                  {ejData?.name ? ejData.name.substring(0, 2).toUpperCase() : "NO"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-4 flex-1 max-w-2xl">
                <Input
                  defaultValue={ejData?.name || "Nova EJ"}
                  className="text-4xl font-bold h-16 border-transparent bg-transparent hover:bg-muted/30 focus-visible:bg-white focus-visible:ring-primary/30 transition-colors px-2 -ml-2"
                />
                <div className="flex gap-6">
                  <div className="flex flex-col">
                    <Input placeholder="Guardião" defaultValue={ejData?.guardian || ""} className="h-10 text-base font-medium bg-muted/30 border-transparent w-48" />
                    <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1.5 px-1 tracking-wider">Guardião da EJ</span>
                  </div>
                  <div className="flex flex-col">
                    <Input placeholder="Grupo" defaultValue={ejData?.group || ""} className="h-10 text-base font-medium bg-muted/30 border-transparent w-32 text-center" />
                    <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1.5 px-1 tracking-wider text-center">Grupo</span>
                  </div>
                  <div className="flex flex-col">
                    <Input placeholder="CM" defaultValue={ejData?.cm || ""} className="h-10 text-base font-medium bg-muted/30 border-transparent w-32 text-center" />
                    <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1.5 px-1 tracking-wider text-center">Cluster / CM</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Salvar e Fechar
              </Button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Column - Tabs */}
            <div className="flex-1 overflow-auto p-6 border-r border-border/40">
              <Tabs defaultValue="apostas" className="w-full h-full flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b border-border/40 bg-transparent h-12 p-0 space-x-6">
                  <TabsTrigger 
                    value="apostas" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent px-2 h-full text-base"
                  >
                    Apostas & Metas
                  </TabsTrigger>
                  <TabsTrigger 
                    value="dailys" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent px-2 h-full text-base"
                  >
                    Saídas das Dailys
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reuniao" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent px-2 h-full text-base"
                  >
                    Reunião / Acompanhamento
                  </TabsTrigger>
                </TabsList>

                {/* Aba 1: Apostas & Metas */}
                <TabsContent value="apostas" className="flex-1 pt-6 outline-none space-y-6">
                  {events.length === 0 ? (
                    <div className="bg-white rounded-xl border border-border/50 p-6 space-y-4">
                      <h3 className="font-semibold text-lg text-foreground">Apostas de Eventos</h3>
                      <div className="border border-dashed border-border p-8 rounded-lg text-center text-muted-foreground flex flex-col items-center justify-center gap-4 bg-muted/10">
                        <p>Nenhum evento cadastrado no painel.</p>
                      </div>
                    </div>
                  ) : (
                    events.map(event => (
                      <div key={event.id} className="bg-white rounded-xl border border-border/50 p-6 space-y-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-xl text-[#0A1942] uppercase">{event.name}</h3>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t space-y-3">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Meta da EJ ({ejData?.name})</h4>
                              
                              <label className="flex items-center gap-2 cursor-pointer bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors border border-orange-200">
                                <Checkbox 
                                  checked={!!apostas[event.id]}
                                  onCheckedChange={(checked) => {
                                    setApostas(prev => ({...prev, [event.id]: !!checked}));
                                  }}
                                  className="border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                />
                                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Flame className="w-3.5 h-3.5" />
                                  EJ é Aposta
                                </span>
                              </label>
                            </div>
                            {event.ejGoals.map(goal => {
                              const isChecked = goal.checkedBy ? goal.checkedBy.includes(ejData?.name || 'unknown') : !!goal.checked;
                              return (
                                <div key={goal.id} className="bg-muted/20 p-3 rounded-lg hover:bg-muted/40 transition-colors">
                                  <div className="flex items-start gap-3">
                                    <Checkbox 
                                      checked={isChecked}
                                      onCheckedChange={() => eventStore.toggleGoal(event.id, goal.id, ejData?.name || 'unknown')}
                                      className="mt-1 border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:text-white"
                                    />
                                    <p className={`text-sm flex-1 ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>
                                      {goal.text}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {event.ejGoals.length === 0 && (
                            <p className="text-sm text-muted-foreground">Nenhuma meta específica definida.</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* Aba 2: Saídas das Dailys */}
                <TabsContent value="dailys" className="flex-1 pt-6 outline-none">
                  <div className="bg-white rounded-xl border border-border/50 p-6 space-y-6">
                    <h3 className="font-semibold text-lg text-foreground">Tarefas e Checklist</h3>
                    
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Adicionar nova tarefa..." 
                        value={newTaskText}
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      />
                      <Button onClick={handleAddTask}>Adicionar</Button>
                    </div>

                    <div className="space-y-3">
                      {tasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                          <Checkbox 
                            checked={task.completed}
                            onCheckedChange={() => toggleTask(task.id)}
                          />
                          <div className="flex-1">
                            <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {task.text}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Registrado em: {task.date}</p>
                          </div>
                        </div>
                      ))}
                      {tasks.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma saída cadastrada.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Aba 3: Reunião / Acompanhamento */}
                <TabsContent value="reuniao" className="flex-1 pt-6 outline-none flex flex-col h-full">
                  <div className="bg-white rounded-xl border border-border/50 p-6 flex-1 flex flex-col min-h-[400px]">
                    <h3 className="font-semibold text-lg text-foreground mb-4">Bloco de Notas da Reunião</h3>
                    <Textarea 
                      placeholder="Comece a digitar as anotações do acompanhamento..." 
                      className="flex-1 resize-none border-none shadow-none focus-visible:ring-0 text-base p-0"
                      value={notasReuniao}
                      onChange={(e) => setNotasReuniao(e.target.value)}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Sidebar */}
            <div className="w-80 overflow-auto p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Desafio do Ciclo</label>
                <Textarea 
                  placeholder="Ex: Melhorar engajamento..." 
                  className="bg-white min-h-[100px] resize-y"
                  value={desafio}
                  onChange={(e) => setDesafio(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Dores da EJ</label>
                <Textarea 
                  placeholder="Ex: Falta de leads..." 
                  className="bg-white min-h-[100px] resize-y"
                  value={dores}
                  onChange={(e) => setDores(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Próxima Reunião</label>
                <div className="relative">
                  <Input 
                    type="date" 
                    className="bg-white pl-10" 
                    value={proximaReuniao}
                    onChange={(e) => setProximaReuniao(e.target.value)}
                  />
                  <CalendarIcon className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => setFunnelModalOpen(true)}
                  className="w-full flex flex-col items-center justify-center p-6 bg-[#F3ECE0] hover:bg-[#E9DDC9] rounded-xl border border-[#D9CDB9] transition-all cursor-pointer shadow-sm group"
                >
                  <Briefcase className="w-6 h-6 text-[#8B7355] mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold text-[#5A4A35]">Funil de Vendas</h4>
                  <p className="text-xs text-[#8B7355] mt-1">Gerenciar leads e faturamento</p>
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EjLeadFunnelModal 
        open={funnelModalOpen}
        onOpenChange={setFunnelModalOpen}
        ejId={ejData?.name || ''}
      />
    </>
  );
}
