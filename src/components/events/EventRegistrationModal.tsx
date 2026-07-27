import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { eventStore } from "@/lib/eventStore";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface EventRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventRegistrationModal({ open, onOpenChange }: EventRegistrationModalProps) {
  const [eventName, setEventName] = useState("");
  const [coreGoal, setCoreGoal] = useState("");
  const [ejGoals, setEjGoals] = useState([{ id: Date.now().toString(), text: "", checked: false }]);

  const handleAddGoal = () => {
    setEjGoals([...ejGoals, { id: Date.now().toString(), text: "", checked: false }]);
  };

  const handleGoalChange = (id: string, text: string) => {
    setEjGoals(ejGoals.map(g => g.id === id ? { ...g, text } : g));
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
      coreGoal,
      ejGoals: filteredGoals,
      createdAt: new Date().toISOString()
    });

    toast.success("Evento cadastrado com sucesso!");
    onOpenChange(false);
    
    // Reset form
    setEventName("");
    setCoreGoal("");
    setEjGoals([{ id: Date.now().toString(), text: "", checked: false }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] bg-[#a8b1b8] border-none shadow-2xl p-8 rounded-3xl">
        <div className="flex flex-col space-y-8 text-white">
          <h2 className="text-4xl font-light text-center tracking-widest text-white uppercase">
            Cadastro de Evento
          </h2>

          <div className="flex justify-center w-full">
            <Input 
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="NOME DO EVENTO: EX: RV DO FAÍSCA" 
              className="w-full max-w-2xl bg-white/95 border-0 text-black placeholder:text-gray-500 h-14 rounded-2xl px-6 text-center text-lg font-medium shadow-inner"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
            {/* Left Column - Metas da EJ */}
            <div className="space-y-4 flex flex-col items-center">
              <h3 className="text-xl uppercase tracking-wider text-center text-[#2A313C]">Metas da EJ</h3>
              
              <div className="w-full space-y-3">
                {ejGoals.map((goal, index) => (
                  <div key={goal.id} className="relative flex items-center bg-white/95 rounded-2xl h-12 px-4 shadow-inner">
                    <Checkbox 
                      checked={goal.checked}
                      onCheckedChange={(checked) => handleGoalCheck(goal.id, checked as boolean)}
                      className="border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:text-white z-10 w-5 h-5 rounded"
                    />
                    <Input 
                      value={goal.text}
                      onChange={(e) => handleGoalChange(goal.id, e.target.value)}
                      className="absolute inset-0 pl-12 pr-4 h-full border-0 bg-transparent text-black shadow-none focus-visible:ring-0"
                    />
                  </div>
                ))}
              </div>

              <Button 
                variant="ghost" 
                onClick={handleAddGoal}
                className="text-xs uppercase text-[#2A313C] hover:bg-black/10 self-start"
              >
                + Adicionar Metas
              </Button>
            </div>

            {/* Right Column - Meta do Núcleo */}
            <div className="space-y-4 flex flex-col items-center">
              <h3 className="text-xl uppercase tracking-wider text-center text-[#2A313C]">Meta do Núcleo</h3>
              <Input 
                value={coreGoal}
                onChange={(e) => setCoreGoal(e.target.value)}
                className="w-full bg-white/95 border-0 text-black h-12 rounded-2xl px-4 shadow-inner"
              />
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <Button 
              onClick={handleSave}
              className="bg-[#2A313C] hover:bg-[#2A313C]/90 text-white px-12 py-6 rounded-2xl text-lg uppercase tracking-widest font-semibold shadow-xl transition-transform hover:scale-105"
            >
              Cadastrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
