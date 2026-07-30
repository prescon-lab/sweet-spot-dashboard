import React, { useState, useEffect } from "react";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ejDataStore, EjData } from "@/lib/ejDataStore";
import { ejsList } from "@/lib/data";
import { toast } from "sonner";

export function DashboardCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [meetings, setMeetings] = useState<Record<string, string[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEj, setSelectedEj] = useState("");

  const loadMeetings = () => {
    const allData = ejDataStore.getAllData();
    const newMeetings: Record<string, string[]> = {};
    
    Object.values(allData).forEach((data: EjData) => {
      if (data.proximaReuniao) {
        if (!newMeetings[data.proximaReuniao]) {
          newMeetings[data.proximaReuniao] = [];
        }
        if (!newMeetings[data.proximaReuniao].includes(data.ejName)) {
          newMeetings[data.proximaReuniao].push(data.ejName);
        }
      }
    });
    
    setMeetings(newMeetings);
  };

  useEffect(() => {
    loadMeetings();
    
    const handleUpdate = () => loadMeetings();
    window.addEventListener("ejDataUpdated", handleUpdate);
    return () => window.removeEventListener("ejDataUpdated", handleUpdate);
  }, []);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setSelectedEj("");
    setIsModalOpen(true);
  };

  const handleSaveMeeting = () => {
    if (!selectedEj || !selectedDate) {
      toast.error("Selecione uma EJ");
      return;
    }
    
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    ejDataStore.saveEjData(selectedEj, { proximaReuniao: dateStr });
    toast.success(`Reunião com ${selectedEj} agendada!`);
    setIsModalOpen(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-6 shadow-sm mt-12 animate-fade-in max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <CalendarIcon className="w-6 h-6 text-primary" />
            Calendário de Reuniões
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe e agende suas próximas reuniões com as EJs.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-lg min-w-[150px] text-center capitalize text-foreground">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="rounded-full">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => (
          <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
            {day}
          </div>
        ))}
        
        {days.map((day, idx) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayMeetings = meetings[dateKey] || [];
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={idx}
              onClick={() => handleDayClick(day)}
              className={`min-h-[100px] p-2 rounded-xl border transition-all cursor-pointer hover:border-primary/50 group flex flex-col ${
                !isCurrentMonth ? "bg-muted/10 opacity-50 border-transparent" : 
                isToday ? "bg-primary/5 border-primary/30" : "bg-card border-border/40 hover:bg-muted/10"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                }`}>
                  {format(day, "d")}
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar">
                {dayMeetings.map(ejName => (
                  <div key={ejName} className="text-xs px-2 py-1 bg-primary/10 text-primary font-medium rounded-md truncate" title={ejName}>
                    {ejName}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] glass-modal rounded-3xl">
          <DialogHeader>
            <DialogTitle>Agendar Reunião</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Data Selecionada</label>
              <div className="p-3 bg-muted/20 rounded-xl font-medium text-foreground">
                {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Selecione a EJ</label>
              <Select value={selectedEj} onValueChange={setSelectedEj}>
                <SelectTrigger className="w-full bg-card h-12 rounded-xl text-foreground">
                  <SelectValue placeholder="Escolha uma EJ..." />
                </SelectTrigger>
                <SelectContent>
                  {ejsList.map(ej => (
                    <SelectItem key={ej.id} value={ej.name}>{ej.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
