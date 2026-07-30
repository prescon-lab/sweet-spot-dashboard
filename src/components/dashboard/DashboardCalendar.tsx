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

type CalendarDayData = {
  ejName: string;
  title: string;
  isMultiDay?: boolean;
};

export function DashboardCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [eventsByDay, setEventsByDay] = useState<Record<string, CalendarDayData[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEj, setSelectedEj] = useState("");
  const [eventType, setEventType] = useState("reuniao"); // "reuniao" or "evento"
  const [eventTitle, setEventTitle] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadMeetings = () => {
    const allData = ejDataStore.getAllData();
    const newEvents: Record<string, CalendarDayData[]> = {};
    
    Object.values(allData).forEach((data: EjData) => {
      if (data.proximaReuniao) {
        if (!newEvents[data.proximaReuniao]) newEvents[data.proximaReuniao] = [];
        if (!newEvents[data.proximaReuniao].some(e => e.ejName === data.ejName && e.title === "Reunião")) {
          newEvents[data.proximaReuniao].push({ ejName: data.ejName, title: "Reunião" });
        }
      }

      if (data.calendarioEventos) {
        data.calendarioEventos.forEach(evt => {
          try {
            const start = new Date(evt.startDate + "T12:00:00");
            const end = new Date((evt.endDate || evt.startDate) + "T12:00:00");
            if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
            const daysInterval = eachDayOfInterval({ start, end });
            daysInterval.forEach(d => {
              const dateKey = format(d, "yyyy-MM-dd");
              if (!newEvents[dateKey]) newEvents[dateKey] = [];
              newEvents[dateKey].push({ ejName: data.ejName, title: evt.title, isMultiDay: daysInterval.length > 1 });
            });
          } catch (e) {
            console.error(e);
          }
        });
      }
    });
    
    setEventsByDay(newEvents);
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
    setEventType("reuniao");
    setEventTitle("");
    setEndDate(format(day, "yyyy-MM-dd"));
    setIsModalOpen(true);
  };

  const handleSaveMeeting = () => {
    if (!selectedEj || !selectedDate) {
      toast.error("Selecione uma EJ");
      return;
    }
    
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    
    if (eventType === "reuniao") {
      ejDataStore.saveEjData(selectedEj, { proximaReuniao: dateStr });
      toast.success(`Reunião com ${selectedEj} agendada!`);
    } else {
      if (!eventTitle || !endDate) {
        toast.error("Preencha título e data final do evento");
        return;
      }
      const existingData = ejDataStore.getEjData(selectedEj);
      const existingEvents = existingData?.calendarioEventos || [];
      const newEvent = {
        id: crypto.randomUUID(),
        title: eventTitle,
        startDate: dateStr,
        endDate: endDate,
        type: eventType
      };
      ejDataStore.saveEjData(selectedEj, { calendarioEventos: [...existingEvents, newEvent] });
      toast.success(`Evento "${eventTitle}" agendado para ${selectedEj}!`);
    }
    
    setIsModalOpen(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-6 shadow-sm animate-fade-in max-w-4xl mx-auto w-full">
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
          const dayEvents = eventsByDay[dateKey] || [];
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
              
              <div className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar mt-1">
                {dayEvents.map((evt, i) => (
                  <div 
                    key={i} 
                    className={`text-xs px-2 py-1 font-medium rounded-md truncate ${
                      evt.isMultiDay 
                        ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20" 
                        : "bg-primary/10 text-primary border border-primary/10"
                    }`} 
                    title={`${evt.ejName} - ${evt.title}`}
                  >
                    <span className="font-bold">{evt.ejName}</span>: {evt.title}
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
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Tipo de Agendamento</label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="w-full bg-card h-12 rounded-xl text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reuniao">Reunião Simples</SelectItem>
                  <SelectItem value="evento">Evento / Auditoria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {eventType === "evento" && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Título do Evento</label>
                  <input 
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Ex: Auditoria Final"
                    className="flex h-12 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Data Final (23:59)</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMeeting}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
