import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ejsList } from "@/lib/data";
import { guardianStore } from "@/lib/guardianStore";
import { GuardianDetailModal } from "@/components/guardians/GuardianDetailModal";
import React from "react";

export const Route = createFileRoute("/p/guardioes")({
  component: GuardiansPanel,
});

// Helper function to calculate brightness and return black or white for text contrast
function getContrastColor(hexColor: string) {
  if (!hexColor) return '#FFFFFF';
  
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate relative luminance (YIQ)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // Return black for bright colors, white for dark colors
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

function GuardiansPanel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState<any>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  React.useEffect(() => {
    const handleUpdate = () => setUpdateTrigger(prev => prev + 1);
    window.addEventListener('guardianStoreUpdated', handleUpdate);
    return () => window.removeEventListener('guardianStoreUpdated', handleUpdate);
  }, []);

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
        {filteredGuardians.map((guardian, i) => {
          const config = guardianStore.get(guardian.name);
          return (
            <div 
              key={i}
              onClick={() => handleCardClick(guardian)}
              className="rounded-[32px] p-8 flex flex-col items-center justify-center text-center cursor-pointer transform transition-all hover:scale-105 hover:shadow-xl hover:brightness-110 group relative overflow-hidden h-72"
              style={{ backgroundColor: config.color || '#0A1942' }}
            >
              {/* Avatar Circle */}
              <div 
                className="w-32 h-32 rounded-full mb-6 flex flex-col items-center justify-center bg-gradient-to-b from-muted to-muted/50 overflow-hidden shadow-lg border-4 border-white/10"
              >
                {config.avatarUrl ? (
                  <img src={config.avatarUrl} alt={guardian.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-muted-foreground/50">
                    {guardian.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Guardian Name */}
              <h3 
                className="font-bold text-2xl md:text-3xl tracking-widest uppercase w-full px-2 z-10 drop-shadow-sm leading-tight break-words"
                style={{ color: getContrastColor(config.color || '#0A1942') }}
              >
                {guardian.name}
              </h3>

              {/* Number of EJs - Discrete badge */}
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                <p className="text-white text-[10px] font-bold uppercase">{guardian.ejCount} {guardian.ejCount === 1 ? 'EJ' : 'EJs'}</p>
              </div>
          </div>
          );
        })}
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
