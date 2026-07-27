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
import { Briefcase, Calendar as CalendarIcon, Check, Plus, Trash2, Save, Flame, Trophy, Pencil } from "lucide-react";
import { eventStore, AppEvent } from "@/lib/eventStore";
import { EjLeadFunnelModal } from "./EjLeadFunnelModal";
import { ejDataStore, EjData, Task, ReuniaoNota } from "@/lib/ejDataStore";
import { activityStore } from "@/lib/activityStore";
import { mentionStore } from "@/lib/mentionStore";
import { ejsList } from "@/lib/data";
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
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskText, setEditingTaskText] = useState("");
  const [editingReuniaoId, setEditingReuniaoId] = useState<number | null>(null);
  const [editingReuniaoText, setEditingReuniaoText] = useState("");
  
  const [desafio, setDesafio] = useState("");
  const [dores, setDores] = useState("");
  const [proximaReuniao, setProximaReuniao] = useState("");
  const [reunioes, setReunioes] = useState<ReuniaoNota[]>([]);
  const [novaReuniao, setNovaReuniao] = useState("");
  const [apostas, setApostas] = useState<Record<string, boolean>>({});
  
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const uniqueGuardians = Array.from(new Set(ejsList.map(ej => ej.guardian))).sort();

  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewTaskText(val);
    
    const cursor = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf('@');
    
    if (lastAt !== -1 && (lastAt === 0 || textBeforeCursor[lastAt - 1] === ' ' || textBeforeCursor[lastAt - 1] === '\n')) {
      const textAfterAt = textBeforeCursor.slice(lastAt + 1);
      if (textAfterAt.length < 30 && !textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt.toLowerCase());
        return;
      }
    }
    setMentionSearch(null);
  };

  const insertMention = (guardianName: string) => {
    const cursor = newTaskText.lastIndexOf('@');
    if (cursor !== -1) {
      const newText = newTaskText.slice(0, cursor) + `@${guardianName} ` + newTaskText.slice(newTaskText.length);
      setNewTaskText(newText);
    }
    setMentionSearch(null);
  };

  React.useEffect(() => {
    if (open) {
      setEvents(eventStore.getEvents().filter(e => e.status !== 'completed'));
      
      // Load saved data for this EJ
      const ejName = ejData?.name || "";
      if (ejName) {
        const data = ejDataStore.getEjData(ejName);
        setTasks(data?.tarefas || []);
        setDesafio(data?.desafio || "");
        setDores(data?.dores || "");
        setProximaReuniao(data?.proximaReuniao || "");
        
        let loadedReunioes = data?.reunioes || [];
        if (loadedReunioes.length === 0 && data?.notasReuniao) {
          loadedReunioes = [{ id: 1, date: new Date().toLocaleDateString('pt-BR'), text: data.notasReuniao }];
        }
        setReunioes(loadedReunioes);
        
        setApostas(data?.apostas || {});
      } else {
        setTasks([]);
        setDesafio("");
        setDores("");
        setProximaReuniao("");
        setReunioes([]);
        setApostas({});
      }
    }

    const handleUpdate = () => {
      setEvents(eventStore.getEvents().filter(e => e.status !== 'completed'));
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
      reunioes,
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
    if (JSON.stringify(reunioes) !== JSON.stringify(previousData.reunioes || [])) {
      hasChanges = true;
      activityStore.addActivity({ ejName, description: `Anotações de reunião atualizadas`, type: "update" });
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

  const handleSaveReuniao = () => {
    if (!novaReuniao.trim()) return;
    
    const ejName = ejData?.name || "Nova EJ";
    
    const novaNota = {
      id: Date.now(),
      date: new Date().toLocaleDateString("pt-BR"),
      text: novaReuniao
    };
    
    const novasReunioes = [novaNota, ...reunioes];
    setReunioes(novasReunioes);
    
    ejDataStore.saveEjData(ejName, { reunioes: novasReunioes });
    activityStore.addActivity({ ejName, description: "Nova anotação de reunião adicionada", type: "update" });
    
    setNovaReuniao("");
    toast.success("Anotação da reunião salva com sucesso!");
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    
    const ejName = ejData?.name || "Nova EJ";
    mentionStore.extractAndSaveMentions(newTaskText, ejName, "Dailys");
    
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
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const isNowCompleted = !t.completed;
        return { 
          ...t, 
          completed: isNowCompleted,
          completedAt: isNowCompleted ? new Date().toLocaleString('pt-BR') : undefined
        };
      }
      return t;
    }));
  };

  const removeTask = (id: number) => {
    if (window.confirm("Ação não pode ser desfeita. Tem certeza que deseja apagar essa tarefa?")) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const saveEditedTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, text: editingTaskText } : t));
    setEditingTaskId(null);
    setEditingTaskText("");
  };

  const removeReuniao = (id: number) => {
    if (window.confirm("Ação não pode ser desfeita. Tem certeza que deseja apagar essa anotação?")) {
      const novasReunioes = reunioes.filter(r => r.id !== id);
      setReunioes(novasReunioes);
      ejDataStore.saveEjData(ejData?.name || "Nova EJ", { reunioes: novasReunioes });
    }
  };

  const saveEditedReuniao = (id: number) => {
    const novasReunioes = reunioes.map(r => r.id === id ? { ...r, text: editingReuniaoText } : r);
    setReunioes(novasReunioes);
    ejDataStore.saveEjData(ejData?.name || "Nova EJ", { reunioes: novasReunioes });
    setEditingReuniaoId(null);
    setEditingReuniaoText("");
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return b.id - a.id;
  });

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
                    <span className="text-[10px] uppercase font-bold text-muted-foreground mt-1.5 px-1 tracking-wider text-center">CM</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-4">
                <Button variant="ghost" className="text-muted-foreground hover:bg-muted/50" onClick={() => onOpenChange(false)}>
                  Fechar sem Salvar
                </Button>
                <Button className="font-semibold text-white px-8" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Dados
                </Button>
              </div>
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
                    <h3 className="font-semibold text-lg text-foreground">Saídas</h3>
                    
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          placeholder="Adicionar nova tarefa... Digite @ para mencionar guardiões" 
                          value={newTaskText}
                          onChange={handleTaskChange}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        />
                        {mentionSearch !== null && (
                          <div className="absolute top-12 left-0 right-0 bg-white border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/30 border-b">
                              Mencionar Guardião
                            </div>
                            {uniqueGuardians.filter(g => g.toLowerCase().includes(mentionSearch)).map(g => (
                              <div 
                                key={g} 
                                className="px-4 py-3 hover:bg-primary/5 cursor-pointer text-sm font-medium transition-colors"
                                onClick={() => insertMention(g)}
                              >
                                <span className="text-primary mr-1">@</span>{g}
                              </div>
                            ))}
                            {uniqueGuardians.filter(g => g.toLowerCase().includes(mentionSearch)).length === 0 && (
                              <div className="px-4 py-3 text-sm text-muted-foreground">Nenhum guardião encontrado... (você pode continuar digitando)</div>
                            )}
                          </div>
                        )}
                      </div>
                      <Button onClick={handleAddTask}>Adicionar</Button>
                    </div>

                    <div className="space-y-3">
                      {sortedTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors group">
                          <Checkbox 
                            checked={task.completed}
                            onCheckedChange={() => toggleTask(task.id)}
                          />
                          <div className="flex-1">
                            {editingTaskId === task.id ? (
                              <div className="flex items-center gap-2">
                                <Input 
                                  value={editingTaskText} 
                                  onChange={(e) => setEditingTaskText(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && saveEditedTask(task.id)}
                                  autoFocus
                                  className="h-8 text-sm"
                                />
                                <Button size="sm" onClick={() => saveEditedTask(task.id)}><Check className="w-4 h-4" /></Button>
                              </div>
                            ) : (
                              <>
                                <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {task.text}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Registrado em: {task.date}
                                  {task.completedAt && ` • Concluído em: ${task.completedAt}`}
                                </p>
                              </>
                            )}
                          </div>
                          {editingTaskId !== task.id && (
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setEditingTaskId(task.id); setEditingTaskText(task.text); }}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeTask(task.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
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
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-lg text-foreground">Anotações de Reunião</h3>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      <div className="relative">
                        <Textarea 
                          placeholder="Comece a digitar uma nova anotação..." 
                          className="w-full resize-y min-h-[100px] border-border/50 focus-visible:ring-primary/20 bg-muted/5 p-4 rounded-xl"
                          value={novaReuniao}
                          onChange={(e) => setNovaReuniao(e.target.value)}
                        />
                        <Button size="sm" onClick={handleSaveReuniao} className="absolute bottom-3 right-3 text-white">
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar Anotação
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                      {reunioes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Nenhuma reunião salva no histórico.</p>
                        </div>
                      ) : (
                        reunioes.map(reuniao => (
                          <div key={reuniao.id} className="bg-muted/10 border border-border/50 rounded-xl p-4 space-y-2 relative group">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-sm text-[#0A1942]">Anotações</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium bg-white px-2 py-1 rounded text-muted-foreground border">
                                  {reuniao.date}
                                </span>
                                {editingReuniaoId !== reuniao.id && (
                                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => { setEditingReuniaoId(reuniao.id); setEditingReuniaoText(reuniao.text); }}>
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeReuniao(reuniao.id)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {editingReuniaoId === reuniao.id ? (
                              <div className="space-y-2 mt-2">
                                <Textarea 
                                  value={editingReuniaoText} 
                                  onChange={(e) => setEditingReuniaoText(e.target.value)}
                                  className="w-full resize-y min-h-[100px] border-border/50 bg-white"
                                  autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" variant="outline" onClick={() => setEditingReuniaoId(null)}>Cancelar</Button>
                                  <Button size="sm" onClick={() => saveEditedReuniao(reuniao.id)}>Salvar</Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{reuniao.text}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
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
