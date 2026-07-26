import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ejsList } from "@/lib/data";
import { GuardianDetailModal } from "@/components/guardians/GuardianDetailModal";

export const Route = createFileRoute("/p/guardioes")({
  component: GuardiansPanel,
});

function GuardiansPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState<any>(null);

  // Derivar lista de guardiões únicos e calcular a quantidade de EJs
  const guardiansMap = new Map<string, number>();
  ejsList.forEach(ej => {
    guardiansMap.set(ej.guardian, (guardiansMap.get(ej.guardian) || 0) + 1);
  });

  const uniqueGuardians = Array.from(guardiansMap.entries()).map(([name, count]) => ({
    name,
    ejCount: count,
    status: "Disponível"
  })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const filteredGuardians = uniqueGuardians.filter((g) => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCardClick = (guardian: any) => {
    setSelectedGuardian(guardian);
    setDetailModalOpen(true);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto animate-fade-in space-y-6">
      
      {/* Top Bar (Dark Blue) */}
      <div className="bg-[#0A1942] rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-lg">
        <div className="relative w-full md:w-96">
          <Input 
            type="search" 
            placeholder="BUSCAR POR NOME DO GUARDIÃO" 
            className="w-full bg-white text-[#0A1942] placeholder:text-[#0A1942]/60 rounded-full h-10 px-6 font-semibold border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Guardians */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {filteredGuardians.map((guardian, i) => (
          <div 
            key={i}
            onClick={() => handleCardClick(guardian)}
            className="bg-white border border-border/50 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transform transition-all hover:scale-105 hover:shadow-xl hover:border-primary/20 group"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#0A1942] to-[#1C2F6A] mb-4 flex items-center justify-center border-4 border-transparent group-hover:border-primary/10 transition-all shadow-inner">
              <span className="text-white text-3xl font-bold">
                {guardian.name.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <h3 className="text-[#0A1942] font-bold text-sm tracking-wider uppercase truncate w-full">{guardian.name}</h3>
            <div className="mt-2 bg-muted/50 rounded-full px-3 py-1">
              <p className="text-muted-foreground text-xs font-semibold uppercase">{guardian.ejCount} {guardian.ejCount === 1 ? 'EJ' : 'EJs'}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredGuardians.length === 0 && (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-foreground">Nenhum Guardião encontrado</h3>
        </div>
      )}

      {/* Detailed Modal */}
      <GuardianDetailModal 
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        guardianData={selectedGuardian}
      />
    </div>
  );
}
