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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Flame, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ejDataStore, EjData } from "@/lib/ejDataStore";
import { ejListStore } from "@/lib/ejListStore";
import { toast } from "sonner";
import { isDailyDay } from "@/lib/dailyStore";
import { eventStore } from "@/lib/eventStore";

type CalendarDayData = {
  ejName: string;
  title: string;
  isMultiDay?: boolean;
  type?: "reuniao" | "evento" | "system_event" | "system_audit";
};

export function DashboardCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [eventsByDay, setEventsByDay] = useState<Record<string, CalendarDayData[]>>({});
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEj, setSelectedEj] = useState("");
  const [eventType, setEventType] = useState("reuniao"); // "reuniao" or "evento"
  const [eventTitle, setEventTitle] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadMeetings = () => {
    const allData = ejDataStore.getAllData();
    const newEvents: Record<string, CalendarDayData[]> = {};
    
    // Load EJs meetings and events
    Object.values(allData).forEach((data: EjData) => {
      if (data.proximaReuniao) {
        if (!newEvents[data.proximaReuniao]) newEvents[data.proximaReuniao] = [];
        if (!newEvents[data.proximaReuniao].some(e => e.ejName === data.ejName && e.title === "Reunião")) {
          newEvents[data.proximaReuniao].push({ ejName: data.ejName, title: "Reunião", type: "reuniao" });
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
              newEvents[dateKey].push({ ejName: data.ejName, title: evt.title, isMultiDay: daysInterval.length > 1, type: "evento" });
            });
          } catch (e) {
            console.error(e);
          }
        });
      }
    });
    
    // Load System Global Events (from eventStore)
    const globalEvents = eventStore.getEvents().filter(e => e.status !== "completed");
    globalEvents.forEach(evt => {
      try {
        if (evt.startDate) {
          const endStr = evt.endDate || evt.startDate;
          const start = new Date(evt.startDate + "T12:00:00");
          const end = new Date(endStr + "T12:00:00");
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const daysInterval = eachDayOfInterval({ start, end });
            daysInterval.forEach(d => {
              const dateKey = format(d, "yyyy-MM-dd");
              if (!newEvents[dateKey]) newEvents[dateKey] = [];
              newEvents[dateKey].push({ ejName: "Evento Global", title: evt.name, isMultiDay: daysInterval.length > 1, type: "system_event" });
            });
          }
        }
        
        if (evt.auditDate) {
          const auditD = new Date(evt.auditDate + "T12:00:00");
          if (!isNaN(auditD.getTime())) {
            const dateKey = format(auditD, "yyyy-MM-dd");
            if (!newEvents[dateKey]) newEvents[dateKey] = [];
            newEvents[dateKey].push({ ejName: "Auditoria", title: `Prazo: ${evt.name}`, isMultiDay: false, type: "system_audit" });
          }
        }
      } catch (e) { console.error(e); }
    });

    setEventsByDay(newEvents);
  };

  useEffect(() => {
    loadMeetings();
    
    const handleUpdate = () => loadMeetings();
    window.addEventListener("ejDataUpdated", handleUpdate);
    window.addEventListener("dailyConfigUpdated", handleUpdate); 
    window.addEventListener("eventsUpdated", handleUpdate);
    return () => {
      window.removeEventListener("ejDataUpdated", handleUpdate);
      window.removeEventListener("dailyConfigUpdated", handleUpdate);
      window.removeEventListener("eventsUpdated", handleUpdate);
    };
  }, []);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setSelectedEj("");
    setEventType("reuniao");
    setEventTitle("");
    setEndDate(format(day, "yyyy-MM-dd"));
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
    
    setSelectedEj("");
    setEventTitle("");
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const gridEndDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: gridEndDate });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Helper for rendering selected day events
  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const selectedDayEvents = selectedDateKey ? (eventsByDay[selectedDateKey] || []) : [];
  const selectedIsDaily = selectedDate ? isDailyDay(selectedDate) : false;

  return (
    <div className="flex flex-col xl:flex-row gap-6 mx-auto w-full">
      {/* Coluna Principal do Calendário */}
      <div className="flex-1 bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-4 sm:p-6 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-foreground">
              <CalendarIcon className="w-6 h-6 text-primary" />
              Agendamentos Gerais
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" size="icon" onClick={handlePrevMonth} className="rounded-full shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <span className="font-semibold text-base sm:text-lg min-w-[120px] sm:min-w-[150px] text-center capitalize text-foreground">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth} className="rounded-full shrink-0">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto pb-2 flex-1">
          <div className="min-w-[650px] h-full flex flex-col">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
              {days.map((day, idx) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayEvents = eventsByDay[dateKey] || [];
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const dailyDay = isDailyDay(day);
                
                return (
                  <div 
                    key={idx}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[100px] p-2 rounded-xl border transition-all cursor-pointer group flex flex-col ${
                      isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5" :
                      !isCurrentMonth ? "bg-muted/10 opacity-50 border-transparent hover:border-primary/30" : 
                      isToday ? "bg-primary/5 border-primary/30 hover:border-primary/50" : "bg-card border-border/40 hover:border-primary/50 hover:bg-muted/10"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                        isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                      }`}>
                        {format(day, "d")}
                      </span>
                      <div className="flex gap-1 items-center">
                        {dailyDay && (
                          <div title="Dia de Daily">
                            <Flame className="w-4 h-4 text-orange-500" />
                          </div>
                        )}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar mt-1">
                      {dayEvents.map((evt, i) => (
                        <div 
                          key={i} 
                          className={`text-[10px] sm:text-xs px-2 py-1 font-medium rounded-md truncate ${
                            evt.type === 'system_audit' 
                              ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                              : evt.type === 'system_event'
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : evt.isMultiDay 
                              ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20" 
                              : "bg-primary/10 text-primary border border-primary/10"
                          }`} 
                          title={`${evt.ejName} - ${evt.title}`}
                        >
                          <span className="font-bold">{evt.ejName}</span>
                          {evt.title && <span>: {evt.title}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Painel Lateral Fixo de Detalhes */}
      <div className="w-full xl:w-[400px] shrink-0 bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col xl:sticky xl:top-6 h-fit max-h-none xl:max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
        <div className="mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Agenda do dia e novos compromissos.
          </p>
        </div>

        <div className="mb-8 space-y-4">
          <h4 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
            Agenda do Dia
            {selectedIsDaily && (
              <div title="Dia de Daily" className="ml-auto">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
            )}
          </h4>
          
          {selectedIsDaily && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex items-start gap-3">
              <Flame className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-orange-700 dark:text-orange-400 text-sm">Momento de Aceleração</p>
                <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">Hoje tem Daily! Mantenha a energia alta.</p>
              </div>
            </div>
          )}

          {selectedDayEvents.length === 0 && !selectedIsDaily ? (
            <p className="text-sm text-muted-foreground italic text-center py-4 bg-muted/30 rounded-xl">
              Nenhum compromisso marcado.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((evt, i) => {
                let bgClass = "border-primary/20 bg-primary/5";
                let textClass = "text-foreground";
                
                if (evt.type === 'system_audit') {
                  bgClass = "border-red-500/20 bg-red-500/5";
                  textClass = "text-red-700 dark:text-red-400";
                } else if (evt.type === 'system_event') {
                  bgClass = "border-blue-500/20 bg-blue-500/5";
                  textClass = "text-blue-700 dark:text-blue-400";
                } else if (evt.isMultiDay) {
                  bgClass = "border-orange-500/20 bg-orange-500/5";
                  textClass = "text-orange-700 dark:text-orange-400";
                }

                return (
                  <div key={i} className={`p-3 rounded-xl border ${bgClass}`}>
                    <p className={`font-bold text-sm ${textClass}`}>{evt.ejName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{evt.title}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t pt-6 space-y-4">
          <h4 className="font-semibold text-lg">Agendar Novo</h4>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Selecione a EJ</label>
            <Select value={selectedEj} onValueChange={setSelectedEj}>
              <SelectTrigger className="w-full bg-card h-11 rounded-xl text-foreground">
                <SelectValue placeholder="Escolha uma EJ..." />
              </SelectTrigger>
              <SelectContent>
                {ejListStore.getEjs().map(ej => (
                  <SelectItem key={ej.id} value={ej.name}>{ej.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Tipo de Agendamento</label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="w-full bg-card h-11 rounded-xl text-foreground">
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
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Data Final (23:59)</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </>
          )}

          <div className="pt-2">
            <Button onClick={handleSaveMeeting} className="w-full h-11 font-bold">Salvar Agendamento</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
