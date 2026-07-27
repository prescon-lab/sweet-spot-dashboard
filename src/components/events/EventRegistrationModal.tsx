import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { eventStore } from "@/lib/eventStore";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface EventRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventRegistrationModal({ open, onOpenChange }: EventRegistrationModalProps) {
  const [eventName, setEventName] = useState("");
  const [ejGoals, setEjGoals] = useState([{ id: Date.now().toString(), text: "", coreText: "", checked: false }]);

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

    eventStore.addEvent({
      id: Date.now().toString(),
      name: eventName,
      ejGoals: filteredGoals,
      createdAt: new Date().toISOString()
    });

    toast.success("Evento cadastrado com sucesso!");
    onOpenChange(false);
    
    // Reset form
    setEventName("");
    setEjGoals([{ id: Date.now().toString(), text: "", coreText: "", checked: false }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] bg-[#FAF8F5] border-border/50 shadow-2xl p-8 rounded-3xl">
        <div className="flex flex-col space-y-8">
          <h2 className="text-3xl font-bold text-center tracking-tight text-[#0A1942] uppercase">
            Cadastro de Evento
          </h2>

          <div className="flex justify-center w-full">
            <Input 
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="NOME DO EVENTO: EX: RV DO FAÍSCA" 
              className="w-full max-w-2xl bg-white border border-border/50 text-foreground placeholder:text-muted-foreground h-14 rounded-2xl px-6 text-center text-lg font-medium shadow-sm"
            />
          </div>

          <div className="pt-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <h3 className="text-lg uppercase tracking-wider text-center text-muted-foreground font-semibold">
                Metas da EJ
              </h3>
              <h3 className="text-lg uppercase tracking-wider text-center text-muted-foreground font-semibold">
                Meta do Núcleo
              </h3>
            </div>
            
            <div className="space-y-4">
              {ejGoals.map((goal) => (
                <div key={goal.id} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  {/* Left - Meta da EJ */}
                  <div className="relative flex items-center bg-white rounded-2xl h-12 px-4 shadow-sm border border-border/50 transition-all hover:border-primary/30">
                    <Checkbox 
                      checked={goal.checked}
                      onCheckedChange={(checked) => handleGoalCheck(goal.id, checked as boolean)}
                      className="border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:text-white z-10 w-5 h-5 rounded"
                    />
                    <Input 
                      value={goal.text}
                      onChange={(e) => handleGoalChange(goal.id, 'text', e.target.value)}
                      placeholder="Descreva a meta..."
                      className="absolute inset-0 pl-12 pr-4 h-full border-0 bg-transparent text-foreground shadow-none focus-visible:ring-0"
                    />
                  </div>

                  {/* Right - Meta do Núcleo */}
                  <div className="flex items-center bg-white rounded-2xl h-12 shadow-sm border border-border/50 transition-all hover:border-primary/30">
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

          <div className="flex justify-center pt-8 border-t border-border/30">
            <Button 
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-6 rounded-2xl text-lg uppercase tracking-widest font-semibold shadow-lg transition-transform hover:-translate-y-1"
            >
              Cadastrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
