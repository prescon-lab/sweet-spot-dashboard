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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Flame, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

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
              newEvents[dateKey].push({ ejName: "Evento", title: evt.name, isMultiDay: daysInterval.length > 1, type: "system_event" });
            });
          }
        }
        
        if (evt.auditDate) {
          const auditD = new Date(evt.auditDate + "T12:00:00");
          if (!isNaN(auditD.getTime())) {
            const dateKey = format(auditD, "yyyy-MM-dd");
            if (!newEvents[dateKey]) newEvents[dateKey] = [];
            newEvents[dateKey].push({ ejName: "Auditoria", title: evt.name, isMultiDay: false, type: "system_audit" });
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
  };

  const handleSaveMeeting = () => {
    if (!selectedEj || !selectedDate) {
      toast.error("Selecione uma EJ");
      return;
    }
    
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    ejDataStore.saveEjData(selectedEj, { proximaReuniao: dateStr });
    toast.success(`Reunião com ${selectedEj} agendada!`);
    
    setSelectedEj("");
    setIsScheduleOpen(false);
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
    <div className="flex flex-col lg:flex-row gap-6 mx-auto w-full">
      {/* Coluna Principal do Calendário */}
      <div className="flex-1 bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-3 sm:p-5 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-foreground">
              <CalendarIcon className="w-6 h-6 text-primary" />
              Agendamentos Gerais
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="outline" size="icon" onClick={handlePrevMonth} className="rounded-full shrink-0 h-9 w-9">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-sm sm:text-base min-w-[120px] sm:min-w-[150px] text-center capitalize text-foreground">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextMonth} className="rounded-full shrink-0 h-9 w-9">
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button 
              onClick={() => setIsScheduleOpen(true)}
              size="sm" 
              className="ml-2 gap-1 rounded-full px-4"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Reunião</span>
            </Button>
          </div>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map(day => (
              <div key={day} className="text-center font-semibold text-[10px] sm:text-sm text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 auto-rows-fr">
            {days.map((day, idx) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDay[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const dailyDay = isDailyDay(day);
              
              // Check if day has a system event/audit to style the cell background
              const hasSystemEvent = dayEvents.find(e => e.type === 'system_event');
              const hasSystemAudit = dayEvents.find(e => e.type === 'system_audit');
              
              let cellBg = isToday ? "bg-primary/5 border-primary/30" : "bg-card border-border/40 hover:bg-muted/10";
              if (hasSystemAudit) {
                cellBg = "bg-red-500/10 border-red-500/30";
              } else if (hasSystemEvent) {
                cellBg = "bg-blue-500/10 border-blue-500/30";
              }
              
              if (!isCurrentMonth) cellBg = "bg-muted/10 opacity-50 border-transparent";
              
              const ringClass = isSelected ? "ring-2 ring-primary ring-offset-1 sm:ring-offset-2 ring-offset-background" : "hover:border-primary/50";
              
              return (
                <div 
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[60px] sm:min-h-[75px] p-1 sm:p-1.5 rounded-xl border transition-all cursor-pointer group flex flex-col overflow-hidden ${cellBg} ${ringClass}`}
                >
                  <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                    <span className={`text-xs sm:text-sm font-medium w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full ${
                      isToday ? "bg-primary text-primary-foreground" : hasSystemAudit ? "text-red-700 dark:text-red-400" : hasSystemEvent ? "text-blue-700 dark:text-blue-400" : "text-foreground"
                    }`}>
                      {format(day, "d")}
                    </span>
                    <div className="flex gap-1 items-center">
                      {dailyDay && (
                        <div title="Dia de Daily">
                          <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-0.5 sm:gap-1 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Render global event text directly on the cell instead of a pill, if it's the only thing */}
                    {hasSystemAudit && (
                      <div className="text-[9px] sm:text-[11px] font-bold text-red-700 dark:text-red-400 leading-tight">
                        Fim de Auditoria:<br className="hidden sm:block"/> {hasSystemAudit.title}
                      </div>
                    )}
                    {hasSystemEvent && !hasSystemAudit && (
                      <div className="text-[9px] sm:text-[11px] font-bold text-blue-700 dark:text-blue-400 leading-tight truncate">
                        {hasSystemEvent.title}
                      </div>
                    )}
                    
                    {/* Render normal meetings */}
                    {dayEvents.filter(e => e.type !== 'system_event' && e.type !== 'system_audit').map((evt, i) => (
                      <div 
                        key={i} 
                        className={`text-[9px] sm:text-[11px] px-1 sm:px-2 py-0.5 font-medium rounded-md truncate ${
                          evt.isMultiDay 
                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20" 
                            : "bg-primary/10 text-primary border border-primary/10"
                        }`} 
                        title={`${evt.ejName} - ${evt.title}`}
                      >
                        <span className="font-bold">{evt.ejName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Painel Lateral Fixo de Detalhes - Somente Agenda */}
      <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col lg:sticky lg:top-4 h-fit max-h-none lg:max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar">
        <div className="mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Sua agenda completa para este dia.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
            Compromissos
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
            <p className="text-sm text-muted-foreground italic text-center py-6 bg-muted/30 rounded-xl">
              Nenhum compromisso para este dia.
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
                  <div key={i} className={`p-3 rounded-xl border flex items-center justify-between group ${bgClass}`}>
                    <div>
                      <p className={`font-bold text-sm ${textClass}`}>{evt.ejName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{evt.title}</p>
                    </div>
                    {evt.type === 'reuniao' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Deseja desmarcar a reunião com ${evt.ejName}?`)) {
                            ejDataStore.saveEjData(evt.ejName, { proximaReuniao: "" });
                            toast.success("Reunião desmarcada.");
                            loadMeetings();
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nova Reunião */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agendar Reunião com EJ</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Data da Reunião</label>
              <div className="p-3 bg-muted/30 rounded-xl border flex items-center justify-between">
                <span className="font-semibold">{format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">Para mudar a data, selecione outro dia no calendário.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Selecione a EJ</label>
              <Select value={selectedEj} onValueChange={setSelectedEj}>
                <SelectTrigger className="w-full bg-card h-11 rounded-xl">
                  <SelectValue placeholder="Escolha uma EJ..." />
                </SelectTrigger>
                <SelectContent>
                  {ejListStore.getEjs().map(ej => (
                    <SelectItem key={ej.id} value={ej.name}>{ej.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSaveMeeting} className="w-full h-11 font-bold mt-4">
              Confirmar Agendamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
