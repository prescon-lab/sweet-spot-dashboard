import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EjDetailModal } from "@/components/ejs/EjDetailModal";
import { Search } from "lucide-react";

export const Route = createFileRoute("/p/ejs")({
  component: EjsPanel,
});

// Mock data for the EJs
const mockEjs = Array.from({ length: 20 }).map((_, i) => ({
  id: i + 1,
  name: `NOME DA EJ ${i + 1}`,
  guardian: `GUARDIÃO ${i % 3 + 1}`,
  isBet: i % 4 === 0,
}));

function EjsPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGuardian, setFilterGuardian] = useState(false);
  const [filterBets, setFilterBets] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEj, setSelectedEj] = useState<any>(null);

  const filteredEjs = mockEjs.filter((ej) => {
    const matchesSearch = ej.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ej.guardian.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBets = filterBets ? ej.isBet : true;
    // For now, the guardian filter just acts as a toggle example
    return matchesSearch && matchesBets;
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
          <Button 
            variant="ghost" 
            className={`rounded-full px-8 h-10 font-bold border-2 border-transparent transition-all ${filterGuardian ? 'bg-white text-[#0A1942]' : 'bg-[#152452] text-white hover:bg-[#1C2F6A]'}`}
            onClick={() => setFilterGuardian(!filterGuardian)}
          >
            GUARDIÃO
          </Button>
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
        {filteredEjs.map((ej) => (
          <div 
            key={ej.id}
            onClick={() => handleCardClick(ej)}
            className="bg-[#0A1942] rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transform transition-all hover:scale-105 hover:shadow-xl group"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#E0F2FE] to-[#86EFAC] mb-4 overflow-hidden border-4 border-transparent group-hover:border-white/20 transition-all">
              {/* Fallback image style as in mockup (light blue sky, green hill) */}
              <div className="w-full h-[60%] bg-[#E0F2FE]"></div>
              <div className="w-full h-[40%] bg-[#84CC16] rounded-t-[50%] -mt-2"></div>
            </div>
            <h3 className="text-white font-bold text-sm tracking-wider uppercase">{ej.name}</h3>
            <p className="text-white/80 text-xs font-semibold uppercase mt-1">{ej.guardian}</p>
          </div>
        ))}
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
