import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ejsList } from "@/lib/data";
import { EjDetailModal } from "@/components/ejs/EjDetailModal";

interface GuardianDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guardianData?: any; 
}

export function GuardianDetailModal({ open, onOpenChange, guardianData }: GuardianDetailModalProps) {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEj, setSelectedEj] = useState<any>(null);

  // Fetch the EJs for this guardian
  const guardianEjs = ejsList.filter(ej => ej.guardian === guardianData?.name);

  const handleEjClick = (ej: any) => {
    setSelectedEj(ej);
    setDetailModalOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] h-[80vh] bg-[#FAF8F5] p-0 flex flex-col overflow-hidden gap-0 border-none shadow-2xl">
          {/* Header Area */}
          <div className="flex items-center justify-between p-6 bg-white border-b border-border/40">
            <div className="flex items-center gap-6 flex-1">
              {/* Photo */}
              <div className="relative group cursor-pointer">
                <Avatar className="h-20 w-20 border-2 border-primary/10 transition-transform group-hover:scale-105">
                  <AvatarFallback className="bg-gradient-to-tr from-[#0A1942] to-[#1C2F6A] text-white text-2xl font-bold">
                    {guardianData?.name ? guardianData.name.substring(0, 2).toUpperCase() : "GU"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-xs font-semibold">Editar</span>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-3 flex-1 max-w-xl">
                <Input
                  defaultValue={guardianData?.name || "Nome do Guardião"}
                  className="text-3xl font-bold h-14 border-transparent bg-transparent hover:bg-muted/30 focus-visible:bg-white focus-visible:ring-primary/30 transition-colors px-2 -ml-2"
                />
                <div className="flex gap-2 items-center">
                  <span className="text-sm font-semibold text-muted-foreground">Status:</span>
                  <Input 
                    placeholder="Status atual (ex: Disponível)" 
                    defaultValue={guardianData?.status || "Disponível"} 
                    className="h-8 text-sm bg-green-100 text-green-800 font-medium border-transparent w-64 rounded-full px-4 focus-visible:ring-green-500/50" 
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => onOpenChange(false)} className="bg-[#0A1942] hover:bg-[#1C2F6A] rounded-full px-8">Salvar Perfil</Button>
            </div>
          </div>

          {/* Body Content - EJs List */}
          <div className="flex-1 overflow-auto p-6 md:p-10">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[#0A1942]">EJs Acompanhadas ({guardianEjs.length})</h3>
              <p className="text-muted-foreground text-sm">Clique em uma EJ para visualizar seus detalhes.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {guardianEjs.map(ej => (
                <div 
                  key={ej.id}
                  onClick={() => handleEjClick(ej)}
                  className="bg-white border border-border/50 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-b from-[#E0F2FE] to-[#86EFAC] overflow-hidden flex flex-col justify-end">
                    <div className="w-full h-[40%] bg-[#84CC16] rounded-t-[50%]"></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0A1942] group-hover:text-primary transition-colors">{ej.name}</h4>
                    <p className="text-xs text-muted-foreground uppercase mt-0.5">Acompanhamento</p>
                  </div>
                </div>
              ))}
              
              {guardianEjs.length === 0 && (
                <div className="col-span-full text-center py-12 border-2 border-dashed rounded-2xl">
                  <p className="text-muted-foreground">Nenhuma EJ atribuída a este guardião.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* EJ Detail Modal */}
      <EjDetailModal 
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        ejData={selectedEj}
      />
    </>
  );
}
