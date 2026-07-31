import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ejListStore } from "@/lib/ejListStore";
import { guardianStore } from "@/lib/guardianStore";
import { GuardianDetailModal } from "@/components/guardians/GuardianDetailModal";
import React from "react";

export const Route = createFileRoute("/p/guardioes")({
  head: () => ({
    meta: [
      { title: "Painel de Guardiões — Acompanhamento" },
      { name: "description", content: "Visualize as EJs sob responsabilidade de cada guardião, menções e atualizações recentes." },
      { property: "og:title", content: "Painel de Guardiões — Acompanhamento" },
      { property: "og:description", content: "Visualize as EJs sob responsabilidade de cada guardião, menções e atualizações recentes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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
  
  useEffect(() => {
    const handleUpdate = () => {
      // Force re-render to fetch new EJs/Guardians
      setSearchTerm(searchTerm);
    };
    window.addEventListener('ejListUpdated', handleUpdate);
    window.addEventListener('guardianStoreUpdated', handleUpdate);
    return () => {
      window.removeEventListener('ejListUpdated', handleUpdate);
      window.removeEventListener('guardianStoreUpdated', handleUpdate);
    };
  }, [searchTerm]);

  const ejs = ejListStore.getEjs();

  // Derivar lista de guardiões únicos e calcular a quantidade de EJs
  const guardiansMap = new Map<string, number>();
  ejs.forEach(ej => {
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
      {/* Top Bar */}
      <div className="glass-card rounded-2xl p-4 mb-6 shadow-sm">
        <div className="relative max-w-md w-full">
          <Input 
            type="search" 
            placeholder="BUSCAR POR NOME DO GUARDIÃO" 
            className="w-full bg-background/50 text-foreground placeholder:text-muted-foreground rounded-full h-10 px-6 font-semibold border border-border/50 focus:border-primary/50 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Guardians */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6">
        {filteredGuardians.map((guardian, i) => {
          const config = guardianStore.get(guardian.name);
          return (
            <div 
              key={i}
              onClick={() => handleCardClick(guardian)}
              className="rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center text-center cursor-pointer transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:brightness-110 group relative overflow-hidden h-48 md:h-56 border border-white/10"
              style={{ backgroundColor: config.color || 'var(--color-primary)' }}
            >
              {/* Avatar Circle */}
              <div 
                className="w-24 h-24 md:w-28 md:h-28 rounded-full mb-4 md:mb-5 flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm overflow-hidden border-2 border-white/20 shadow-inner group-hover:scale-105 transition-transform duration-300"
              >
                {config.avatarUrl ? (
                  <img src={config.avatarUrl} alt={guardian.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl md:text-2xl font-bold text-muted-foreground/50">
                    {guardian.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Guardian Name */}
              <h3 
                className="font-bold text-sm md:text-base tracking-widest uppercase w-full px-1 z-10 drop-shadow-sm leading-tight break-words whitespace-normal"
                style={{ color: getContrastColor(config.color || '#0A1942') }}
              >
                {guardian.name}
              </h3>


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
