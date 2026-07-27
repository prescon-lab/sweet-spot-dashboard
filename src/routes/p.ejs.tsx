import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EjDetailModal } from "@/components/ejs/EjDetailModal";
import { Search, ChevronDown, Flame, Trophy } from "lucide-react";
import { ejDataStore } from "@/lib/ejDataStore";
import { eventStore } from "@/lib/eventStore";

export const Route = createFileRoute("/p/ejs")({
  head: () => ({
    meta: [
      { title: "Painel de EJs — Progresso e Apostas" },
      { name: "description", content: "Veja o progresso individual de cada Empresa Júnior: metas cumpridas, apostas, reuniões e dailys." },
      { property: "og:title", content: "Painel de EJs — Progresso e Apostas" },
      { property: "og:description", content: "Veja o progresso individual de cada Empresa Júnior: metas cumpridas, apostas, reuniões e dailys." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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
      
      {/* Top Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:w-96">
          <Input 
            type="search" 
            placeholder="BUSCAR POR NOME DE EJ OU GUARDIÃO" 
            className="w-full bg-background/50 text-foreground placeholder:text-muted-foreground rounded-full h-10 px-6 font-semibold border border-border/50 focus:border-primary/50 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
          <div className="relative">
            <select
              className={`appearance-none outline-none cursor-pointer rounded-full pl-6 pr-10 h-10 font-bold border transition-all ${filterGuardian ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/50 text-foreground border-border/50 hover:border-primary/50 hover:bg-accent/50'}`}
              value={filterGuardian}
              onChange={(e) => setFilterGuardian(e.target.value)}
            >
              <option value="">GUARDIÃO</option>
              {uniqueGuardians.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <ChevronDown className={`absolute right-3 top-2.5 w-5 h-5 pointer-events-none ${filterGuardian ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
          </div>

          <Button 
            variant="ghost" 
            className={`rounded-full px-8 h-10 font-bold border transition-all ${filterBets ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/50 text-foreground border-border/50 hover:border-primary/50 hover:bg-accent/50'}`}
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
              className="glass-card rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group relative"
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

              <div className={`w-24 h-24 rounded-full mb-5 overflow-hidden transition-all flex flex-col justify-center items-center ring-4 ring-background/50 group-hover:ring-primary/20 ${ejSavedData?.avatarUrl ? 'bg-transparent' : 'bg-gradient-to-br from-primary/20 to-primary/5'}`}>
                {ejSavedData?.avatarUrl ? (
                  <img src={ejSavedData.avatarUrl} alt={ej.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-foreground/30">{ej.name.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
            <h3 className="text-foreground font-bold text-base tracking-wider uppercase truncate w-full group-hover:text-primary transition-colors">{ej.name}</h3>
            <p className="text-muted-foreground text-xs font-semibold uppercase mt-1 truncate w-full">{ej.guardian}</p>
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
