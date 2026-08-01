import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ejListStore } from "@/lib/ejListStore";
import { guardianStore } from "@/lib/guardianStore";
import { GuardianDetailModal } from "@/components/guardians/GuardianDetailModal";
import { GuardianCard } from "@/components/guardians/GuardianCard";
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
    <div className="page-shell animate-fade-in space-y-6">
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
            <GuardianCard 
              key={i} 
              name={guardian.name} 
              config={config} 
              onClick={() => handleCardClick(guardian)} 
            />
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
