import { useState, useEffect } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
import { ejDataStore, EjData } from "@/lib/ejDataStore";

export function TodayTomorrowMeetings() {
  const [todayMeetings, setTodayMeetings] = useState<string[]>([]);
  const [tomorrowMeetings, setTomorrowMeetings] = useState<string[]>([]);

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
              todayMeetings.map(ej => (
                <div key={ej} className="bg-background rounded-lg p-3 text-sm font-medium border flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  {ej}
                </div>
              ))
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
              tomorrowMeetings.map(ej => (
                <div key={ej} className="bg-background rounded-lg p-3 text-sm font-medium border flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  {ej}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
