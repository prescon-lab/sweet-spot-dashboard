import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDirtyGuard } from "@/hooks/useDirtyGuard";
import { eventStore, AppEvent, EventGoal } from "@/lib/eventStore";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";

interface EventRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventToEdit?: AppEvent | null;
}

export function EventRegistrationModal({ open, onOpenChange, eventToEdit }: EventRegistrationModalProps) {
  const dirtyGuard = useDirtyGuard(open);
  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ejGoals, setEjGoals] = useState<EventGoal[]>([{ id: Date.now().toString(), text: "", coreText: "", checked: false }]);

  React.useEffect(() => {
    if (open && eventToEdit) {
      setEventName(eventToEdit.name);
      setStartDate(eventToEdit.startDate || "");
      setEndDate(eventToEdit.endDate || "");
      setEjGoals(eventToEdit.ejGoals.length > 0 ? eventToEdit.ejGoals : [{ id: Date.now().toString(), text: "", coreText: "", checked: false }]);
    } else if (open && !eventToEdit) {
      setEventName("");
      setStartDate("");
      setEndDate("");
      setEjGoals([{ id: Date.now().toString(), text: "", coreText: "", checked: false }]);
    }
  }, [open, eventToEdit]);

  const handleAddGoal = () => {
    setEjGoals([...ejGoals, { id: Date.now().toString(), text: "", coreText: "", checked: false }]);
  };

  const handleGoalChange = (id: string, field: 'text' | 'coreText', value: string) => {
    setEjGoals(ejGoals.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const handleGoalCheck = (id: string, checked: boolean) => {
    setEjGoals(ejGoals.map(g => g.id === id ? { ...g, checked } : g));
  };

  const handleSave = () => {
    if (!eventName.trim()) {
      toast.error("Preencha o nome do evento");
      return;
    }

    const filteredGoals = ejGoals.filter(g => g.text.trim() !== "");

    if (eventToEdit) {
      eventStore.updateEvent({
        ...eventToEdit,
        name: eventName,
        startDate,
        endDate,
        ejGoals: filteredGoals,
      });
      toast.success("Evento atualizado com sucesso!");
    } else {
      eventStore.addEvent({
        id: Date.now().toString(),
        name: eventName,
        startDate,
        endDate,
        ejGoals: filteredGoals,
        createdAt: new Date().toISOString()
      });
      toast.success("Evento cadastrado com sucesso!");
    }

    dirtyGuard.markClean();
    onOpenChange(false);
    
    // Reset form
    setEventName("");
    setStartDate("");
    setEndDate("");
    setEjGoals([{ id: Date.now().toString(), text: "", coreText: "", checked: false }]);
  };

  const handleDelete = () => {
    if (eventToEdit) {
      if (confirm("Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.")) {
        eventStore.deleteEvent(eventToEdit.id);
        toast.success("Evento excluído com sucesso!");
        onOpenChange(false);
      }
    }
  };

  const handleComplete = () => {
    if (eventToEdit) {
      if (confirm("Deseja concluir este evento? Ele será movido para o histórico.")) {
        eventStore.updateEvent({
          ...eventToEdit,
          status: 'completed',
          completedAt: new Date().toISOString()
        });
        toast.success("Evento concluído com sucesso!");
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={dirtyGuard.guardOpenChange(onOpenChange)}>
      <DialogContent {...dirtyGuard.containerProps} className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto bg-[#FAF8F5] border-border/50 shadow-2xl p-5 sm:p-8 rounded-3xl">
        <div className="flex flex-col space-y-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center tracking-tight text-foreground uppercase">
            {eventToEdit ? "Editar Evento" : "Cadastro de Evento"}
          </h2>

          <div className="flex justify-center w-full">
            <Input 
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="NOME DO EVENTO: EX: RV DO FAÍSCA" 
              className="w-full max-w-2xl bg-card border border-border/50 text-foreground placeholder:text-muted-foreground h-14 rounded-2xl px-6 text-center text-lg font-medium shadow-sm"
            />
          </div>

          <div className="flex justify-center w-full gap-4 max-w-2xl mx-auto">
            <div className="w-full">
              <label className="text-sm font-semibold text-muted-foreground ml-2">Data de Início</label>
              <Input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-card border border-border/50 text-foreground h-12 rounded-2xl px-4 mt-1"
              />
            </div>
            <div className="w-full">
              <label className="text-sm font-semibold text-muted-foreground ml-2">Data de Término (23:59)</label>
              <Input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-card border border-border/50 text-foreground h-12 rounded-2xl px-4 mt-1"
              />
            </div>
          </div>

          <div className="pt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12">
              <h3 className="text-lg uppercase tracking-wider text-center text-muted-foreground font-semibold">
                Metas da EJ
              </h3>
              <h3 className="text-lg uppercase tracking-wider text-center text-muted-foreground font-semibold">
                Meta do Núcleo
              </h3>
            </div>
            
            <div className="space-y-4">
              {ejGoals.map((goal) => (
                <div key={goal.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 items-center">
                  {/* Left - Meta da EJ */}
                  <div className="relative flex items-center bg-card rounded-2xl h-12 px-4 shadow-sm border border-border/50 transition-all hover:border-primary/30">
                    <Input 
                      value={goal.text}
                      onChange={(e) => handleGoalChange(goal.id, 'text', e.target.value)}
                      placeholder="Descreva a meta..."
                      className="w-full h-full border-0 bg-transparent text-foreground shadow-none focus-visible:ring-0 px-2"
                    />
                  </div>

                  {/* Right - Meta do Núcleo */}
                  <div className="flex items-center bg-card rounded-2xl h-12 shadow-sm border border-border/50 transition-all hover:border-primary/30">
                    <Input 
                      value={goal.coreText}
                      onChange={(e) => handleGoalChange(goal.id, 'coreText', e.target.value)}
                      placeholder="Ex: 5 EJs batendo, 20%..."
                      className="w-full h-full border-0 bg-transparent px-4 text-foreground shadow-none focus-visible:ring-0 rounded-2xl"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button 
              variant="ghost" 
              onClick={handleAddGoal}
              className="text-sm font-semibold text-primary hover:bg-primary/10 self-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Metas
            </Button>
          </div>

          <div className="flex justify-between items-center pt-8 border-t border-border/30 gap-4">
            {eventToEdit ? (
              <>
                <Button variant="destructive" size="icon" onClick={handleDelete} title="Excluir Evento" className="h-12 w-12 rounded-2xl">
                  <Trash2 className="w-5 h-5" />
                </Button>
                
                <div className="flex gap-4 flex-1">
                  <Button variant="outline" onClick={handleComplete} className="flex-1 h-12 text-base font-semibold border-green-500 text-green-600 hover:bg-green-50 rounded-2xl">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Concluir Evento
                  </Button>
                  
                  <Button onClick={handleSave} className="flex-1 h-12 text-base font-semibold rounded-2xl shadow-sm hover:shadow-md transition-all">
                    Salvar Alterações
                  </Button>
                </div>
              </>
            ) : (
              <Button onClick={handleSave} className="w-full h-12 text-base font-semibold rounded-2xl shadow-sm hover:shadow-md transition-all">
                Cadastrar Evento
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
