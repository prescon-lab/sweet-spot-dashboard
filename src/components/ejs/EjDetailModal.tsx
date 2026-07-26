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
import { Briefcase, Calendar as CalendarIcon, Check, Plus, Trash2 } from "lucide-react";

interface EjDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ejData?: any; // To be typed properly later
}

export function EjDetailModal({ open, onOpenChange, ejData }: EjDetailModalProps) {
  const [funnelModalOpen, setFunnelModalOpen] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, text: "Exemplo de tarefa cadastrada", completed: false, date: "10/05/2026" }
  ]);
  const [newTaskText, setNewTaskText] = useState("");

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
          <div className="flex items-center justify-between p-6 bg-white border-b border-border/40">
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="h-16 w-16 border-2 border-primary/10">
                <AvatarFallback className="bg-muted text-lg font-bold">
                  NO
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1 max-w-xl">
                <Input
                  defaultValue="Nova EJ"
                  className="text-2xl font-bold h-12 border-primary/20 bg-primary/5 focus-visible:ring-primary/30"
                />
                <div className="flex gap-2">
                  <Input placeholder="Guardião" defaultValue="João Silva" className="h-8 text-sm bg-muted/30 border-transparent" />
                  <Input placeholder="Grupo" defaultValue="Grupo A" className="h-8 text-sm bg-muted/30 border-transparent" />
                  <Input placeholder="CM" className="h-8 text-sm bg-muted/30 border-transparent" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => onOpenChange(false)}>Salvar e Fechar</Button>
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
                <TabsContent value="apostas" className="flex-1 pt-6 outline-none">
                  <div className="bg-white rounded-xl border border-border/50 p-6 space-y-4">
                    <h3 className="font-semibold text-lg text-foreground">Aposta Livre (Custom)</h3>
                    <div className="border border-dashed border-border p-8 rounded-lg text-center text-muted-foreground flex flex-col items-center justify-center gap-4 bg-muted/10">
                      <p>Nenhuma aposta cadastrada.</p>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar nova aposta (Evento)
                      </Button>
                    </div>
                  </div>
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
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Dores da EJ</label>
                <Textarea 
                  placeholder="Ex: Falta de leads..." 
                  className="bg-white min-h-[100px] resize-y"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Próxima Reunião</label>
                <div className="relative">
                  <Input type="date" className="bg-white pl-10" />
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

      {/* Funnel Sub-Modal */}
      <Dialog open={funnelModalOpen} onOpenChange={setFunnelModalOpen}>
        <DialogContent className="max-w-3xl glass-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Briefcase className="text-primary w-5 h-5" />
              Funil de Vendas e Leads
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Cadastre aqui as informações de faturamentos próximos e novos leads em negociação.
            </p>
            <div className="border rounded-lg p-8 text-center text-muted-foreground bg-muted/30">
              (Interface do Funil de Vendas - Em construção)
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setFunnelModalOpen(false)}>Fechar</Button>
              <Button>Adicionar Lead</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
