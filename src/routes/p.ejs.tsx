import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EjDetailModal } from "@/components/ejs/EjDetailModal";
import { Search, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/p/ejs")({
  component: EjsPanel,
});

// Dados reais das EJs fornecidos
const ejsList = [
  { id: 1, name: "Alpha", guardian: "Kennedy", isBet: false },
  { id: 2, name: "Arché", guardian: "Gustavo", isBet: false },
  { id: 3, name: "Arq Jr.", guardian: "Débora", isBet: false },
  { id: 4, name: "ATP", guardian: "Débora", isBet: false },
  { id: 5, name: "Automic", guardian: "Marcos", isBet: false },
  { id: 6, name: "Beta Tech", guardian: "Ana Luiza", isBet: false },
  { id: 7, name: "Cade Jr", guardian: "Kennedy", isBet: false },
  { id: 8, name: "CHC", guardian: "Marcos", isBet: false },
  { id: 9, name: "Ciali", guardian: "Guilherme", isBet: false },
  { id: 10, name: "Civil Jr.", guardian: "Ana Luiza", isBet: false },
  { id: 11, name: "Completur", guardian: "Gustavo", isBet: false },
  { id: 12, name: "Consecon", guardian: "Ana Clara", isBet: false },
  { id: 13, name: "Diferencial", guardian: "Castanha", isBet: false },
  { id: 14, name: "Dinâmica", guardian: "Castanha", isBet: false },
  { id: 15, name: "EJEL", guardian: "Castanha", isBet: false },
  { id: 16, name: "Equip", guardian: "Débora", isBet: false },
  { id: 17, name: "Estoma Care", guardian: "Ana Luiza", isBet: false },
  { id: 18, name: "Estruturar", guardian: "Luiza", isBet: false },
  { id: 19, name: "Formulare", guardian: "Cora", isBet: false },
  { id: 20, name: "Ideal", guardian: "Luiza", isBet: false },
  { id: 21, name: "Linked", guardian: "Kennedy", isBet: false },
  { id: 22, name: "Locus", guardian: "Cora", isBet: false },
  { id: 23, name: "Make Soft", guardian: "Guilherme", isBet: false },
  { id: 24, name: "Minera", guardian: "Guilherme", isBet: false },
  { id: 25, name: "Mosaico", guardian: "Gustavo", isBet: false },
  { id: 26, name: "Office", guardian: "Débora", isBet: false },
  { id: 27, name: "Perfil", guardian: "Ana Luiza", isBet: false },
  { id: 28, name: "Proinova", guardian: "Ana Clara", isBet: false },
  { id: 29, name: "Projet", guardian: "Alan", isBet: false },
  { id: 30, name: "Reaction", guardian: "Guilherme", isBet: false },
  { id: 31, name: "Rever", guardian: "Ana Clara", isBet: false },
  { id: 32, name: "Safra Jr", guardian: "Alan", isBet: false },
  { id: 33, name: "Scoupe", guardian: "Alan", isBet: false },
  { id: 34, name: "Sempre", guardian: "Alan", isBet: false },
  { id: 35, name: "Singular", guardian: "Cora", isBet: false },
  { id: 36, name: "Tristate", guardian: "Castanha", isBet: false },
  { id: 37, name: "Verbalize", guardian: "Gustavo", isBet: false },
  { id: 38, name: "Voluta", guardian: "Guilherme", isBet: false },
  { id: 39, name: "Ômega Jr", guardian: "Ana Clara", isBet: false }
];

function EjsPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGuardian, setFilterGuardian] = useState("");
  const [filterBets, setFilterBets] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEj, setSelectedEj] = useState<any>(null);

  // Derivar lista de guardiões únicos
  const uniqueGuardians = Array.from(new Set(ejsList.map(ej => ej.guardian))).sort();

  const filteredEjs = ejsList.filter((ej) => {
    const matchesSearch = ej.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ej.guardian.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGuardian = filterGuardian ? ej.guardian === filterGuardian : true;
    const matchesBets = filterBets ? ej.isBet : true;
    
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
        {filteredEjs.map((ej) => (
          <div 
            key={ej.id}
            onClick={() => handleCardClick(ej)}
            className="bg-[#0A1942] rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transform transition-all hover:scale-105 hover:shadow-xl group"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#E0F2FE] to-[#86EFAC] mb-4 overflow-hidden border-4 border-transparent group-hover:border-white/20 transition-all flex flex-col justify-end">
              {/* Fallback image style as in mockup (light blue sky, green hill) */}
              <div className="w-full h-full bg-[#E0F2FE] relative overflow-hidden flex flex-col justify-end">
                <div className="w-full h-[40%] bg-[#84CC16] rounded-t-[50%] absolute bottom-0 translate-y-2 group-hover:translate-y-1 transition-transform"></div>
              </div>
            </div>
            <h3 className="text-white font-bold text-sm tracking-wider uppercase truncate w-full">{ej.name}</h3>
            <p className="text-white/80 text-xs font-semibold uppercase mt-1 truncate w-full">{ej.guardian}</p>
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
