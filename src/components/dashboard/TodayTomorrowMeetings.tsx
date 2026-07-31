import { useState, useEffect } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, Plus } from "lucide-react";
import { ejDataStore, EjData } from "@/lib/ejDataStore";
import { ejListStore } from "@/lib/ejListStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface TodayTomorrowMeetingsProps {
  onEjClick?: (ejName: string) => void;
}

export function TodayTomorrowMeetings({ onEjClick }: TodayTomorrowMeetingsProps = {}) {
  const [todayMeetings, setTodayMeetings] = useState<string[]>([]);
  const [tomorrowMeetings, setTomorrowMeetings] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEj, setSelectedEj] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [responsavel, setResponsavel] = useState("");

  const handleSaveMeeting = () => {
    if (!selectedEj || !selectedDate) {
      toast.error("Preencha todos os campos");
      return;
    }
    ejDataStore.saveEjData(selectedEj, { 
      proximaReuniao: selectedDate,
      responsavelReuniao: responsavel || undefined
    });
    toast.success(`Reunião com ${selectedEj} agendada!`);
    setIsModalOpen(false);
    setSelectedEj("");
    setSelectedDate("");
    setResponsavel("");
  };

  const loadMeetings = () => {
    const allData = ejDataStore.getAllData();
    const today: string[] = [];
    const tomorrow: string[] = [];
    
    Object.values(allData).forEach((data: EjData) => {
      if (data.proximaReuniao) {
        // Assume data.proximaReuniao is YYYY-MM-DD
        const dateObj = new Date(data.proximaReuniao + "T12:00:00"); 
        
        if (isToday(dateObj)) {
          today.push(data.ejName);
        } else if (isTomorrow(dateObj)) {
          tomorrow.push(data.ejName);
        }
      }
    });
    
    setTodayMeetings(today);
    setTomorrowMeetings(tomorrow);
  };

  useEffect(() => {
    loadMeetings();
    const handleUpdate = () => loadMeetings();
    window.addEventListener("ejDataUpdated", handleUpdate);
    return () => window.removeEventListener("ejDataUpdated", handleUpdate);
  }, []);

  return (
    <div className="glass-card rounded-3xl p-6 mt-6 animate-fade-in w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/20 p-2 rounded-xl text-primary">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Reuniões Imediatas</h2>
          <p className="text-sm text-muted-foreground">Confira as EJs agendadas para hoje e amanhã</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} size="sm" className="ml-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nova Reunião
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Hoje */}
        <div className="bg-card/50 rounded-2xl p-4 border border-border/50">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Hoje
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              {format(new Date(), "dd/MM", { locale: ptBR })}
            </span>
          </h3>
          <div className="space-y-2">
            {todayMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nenhuma reunião para hoje.</p>
            ) : (
              todayMeetings.map(ej => {
                const data = ejDataStore.getEjData(ej);
                return (
                  <div 
                    key={ej} 
                    className="bg-background rounded-lg p-3 text-sm font-medium border flex flex-col gap-1 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => onEjClick && onEjClick(ej)}
                  >
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      {ej}
                    </div>
                    {data?.responsavelReuniao && (
                      <span className="text-xs text-muted-foreground ml-6">
                        Responsável: {data.responsavelReuniao}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Amanhã */}
        <div className="bg-card/50 rounded-2xl p-4 border border-border/50">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            Amanhã
            <span className="text-xs text-muted-foreground font-normal ml-auto">
              {format(new Date(Date.now() + 86400000), "dd/MM", { locale: ptBR })}
            </span>
          </h3>
          <div className="space-y-2">
            {tomorrowMeetings.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nenhuma reunião para amanhã.</p>
            ) : (
              tomorrowMeetings.map(ej => {
                const data = ejDataStore.getEjData(ej);
                return (
                  <div 
                    key={ej} 
                    className="bg-background rounded-lg p-3 text-sm font-medium border flex flex-col gap-1 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => onEjClick && onEjClick(ej)}
                  >
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      {ej}
                    </div>
                    {data?.responsavelReuniao && (
                      <span className="text-xs text-muted-foreground ml-6">
                        Responsável: {data.responsavelReuniao}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] glass-modal rounded-3xl">
          <DialogHeader>
            <DialogTitle>Agendar Nova Reunião</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Data da Reunião</label>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-card h-12 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Selecione a EJ</label>
              <Select value={selectedEj} onValueChange={setSelectedEj}>
                <SelectTrigger className="w-full bg-card h-12 rounded-xl text-foreground">
                  <SelectValue placeholder="Escolha uma EJ..." />
                </SelectTrigger>
                <SelectContent>
                  {(ejListStore.getEjs() || []).map(ej => (
                    <SelectItem key={ej.id} value={ej.name}>{ej.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Quem vai fazer a reunião?</label>
              <Input 
                type="text" 
                placeholder="Ex: João Silva"
                value={responsavel} 
                onChange={(e) => setResponsavel(e.target.value)}
                className="bg-card h-12 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMeeting}>Salvar Reunião</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
