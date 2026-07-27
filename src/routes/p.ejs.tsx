import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EjDetailModal } from "@/components/ejs/EjDetailModal";
import { Search, ChevronDown, Flame, Trophy } from "lucide-react";
import { ejDataStore } from "@/lib/ejDataStore";
import { eventStore } from "@/lib/eventStore";

export const Route = createFileRoute("/p/ejs")({
  component: EjsPanel,
});

import { ejsList } from "@/lib/data";

function EjsPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGuardian, setFilterGuardian] = useState("");
  const [filterBets, setFilterBets] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEj, setSelectedEj] = useState<any>(null);

  // Derivar lista de guardiões únicos
  const uniqueGuardians = Array.from(new Set(ejsList.map(ej => ej.guardian))).sort();

  const filteredEjs = ejsList.filter((ej) => {
    const ejSavedData = ejDataStore.getEjData(ej.name);
    const allEvents = eventStore.getEvents().filter(e => e.status !== 'completed');
    const activeEventIds = allEvents.map(e => e.id);
    const isAposta = Object.entries(ejSavedData?.apostas || {})
      .some(([eventId, isTrue]) => isTrue && activeEventIds.includes(eventId));

    const matchesSearch = ej.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ej.guardian.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGuardian = filterGuardian ? ej.guardian === filterGuardian : true;
    const matchesBets = filterBets ? isAposta : true;
    
    return matchesSearch && matchesGuardian && matchesBets;
  });

  const handleCardClick = (ej: any) => {
    setSelectedEj(ej);
    setDetailModalOpen(true);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-fade-in space-y-6">
      
      {/* Top Bar (Dark Blue) */}
      <div className="bg-[#0A1942] rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-lg">
        <div className="relative w-full md:w-96">
          <Input 
            type="search" 
            placeholder="BUSCAR POR NOME DE EJ OU GUARDIÃO" 
            className="w-full bg-white text-[#0A1942] placeholder:text-[#0A1942]/60 rounded-full h-10 px-6 font-semibold border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <select
              className={`appearance-none outline-none cursor-pointer rounded-full pl-6 pr-10 h-10 font-bold border-2 border-transparent transition-all ${filterGuardian ? 'bg-white text-[#0A1942]' : 'bg-[#152452] text-white hover:bg-[#1C2F6A]'}`}
              value={filterGuardian}
              onChange={(e) => setFilterGuardian(e.target.value)}
            >
              <option value="">GUARDIÃO</option>
              {uniqueGuardians.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <ChevronDown className={`absolute right-3 top-2.5 w-5 h-5 pointer-events-none ${filterGuardian ? 'text-[#0A1942]' : 'text-white'}`} />
          </div>

          <Button 
            variant="ghost" 
            className={`rounded-full px-8 h-10 font-bold border-2 border-transparent transition-all ${filterBets ? 'bg-white text-[#0A1942]' : 'bg-[#152452] text-white hover:bg-[#1C2F6A]'}`}
            onClick={() => setFilterBets(!filterBets)}
          >
            APOSTAS
          </Button>
        </div>
      </div>

      {/* Grid of EJs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {filteredEjs.map((ej) => {
          const ejSavedData = ejDataStore.getEjData(ej.name);
          const allEvents = eventStore.getEvents().filter(e => e.status !== 'completed');
          const activeEventIds = allEvents.map(e => e.id);
          const isAposta = Object.entries(ejSavedData?.apostas || {})
            .some(([eventId, isTrue]) => isTrue && activeEventIds.includes(eventId));
          
          const allGoals = allEvents.flatMap(e => e.ejGoals || []);
          const allGoalsMet = allGoals.length > 0 && allGoals.every(g => g.checkedBy?.includes(ej.name) || g.checked);

          return (
            <div 
              key={ej.id}
              onClick={() => handleCardClick(ej)}
              className="bg-[#0A1942] rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transform transition-all hover:scale-105 hover:shadow-xl group relative"
            >
              {/* Icons Badge Area */}
              <div className="absolute top-3 right-3 flex gap-1 z-10">
                {isAposta && !allGoalsMet && (
                  <div className="bg-orange-500 text-white p-1.5 rounded-full shadow-md" title="EJ é Aposta">
                    <Flame className="w-4 h-4" />
                  </div>
                )}
                {allGoalsMet && (
                  <div className="bg-yellow-500 text-white p-1.5 rounded-full shadow-md" title="Bateu todas as metas">
                    <Trophy className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div className={`w-24 h-24 rounded-full mb-4 overflow-hidden transition-all flex flex-col justify-center items-center ${ejSavedData?.avatarUrl ? 'bg-transparent' : 'bg-gradient-to-b from-[#E0F2FE] to-[#86EFAC]'}`}>
                {ejSavedData?.avatarUrl ? (
                  <img src={ejSavedData.avatarUrl} alt={ej.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-black/20">{ej.name.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
            <h3 className="text-white font-bold text-sm tracking-wider uppercase truncate w-full">{ej.name}</h3>
            <p className="text-white/80 text-xs font-semibold uppercase mt-1 truncate w-full">{ej.guardian}</p>
          </div>
          );
        })}
      </div>

      {filteredEjs.length === 0 && (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-foreground">Nenhuma EJ encontrada</h3>
          <p className="text-muted-foreground">Tente ajustar seus filtros de busca.</p>
        </div>
      )}

      {/* Detailed Modal */}
      <EjDetailModal 
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        ejData={selectedEj}
      />
    </div>
  );
}
