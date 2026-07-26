import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ejsList } from "@/lib/data";
import { guardianStore } from "@/lib/guardianStore";
import { EjDetailModal } from "@/components/ejs/EjDetailModal";
import { Settings, Image as ImageIcon } from "lucide-react";

interface GuardianDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guardianData?: any; 
}

export function GuardianDetailModal({ open, onOpenChange, guardianData }: GuardianDetailModalProps) {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEj, setSelectedEj] = useState<any>(null);

  // States for customization
  const initialConfig = guardianStore.get(guardianData?.name || "");
  const [bannerColor, setBannerColor] = useState(initialConfig.color);
  const [showSettings, setShowSettings] = useState(false);

  // Sync to store on change
  React.useEffect(() => {
    if (guardianData?.name) {
      guardianStore.set(guardianData.name, {
        color: bannerColor,
        bannerUrl: "", // Removed per user request
        avatarUrl: ""  // Removed per user request
      });
    }
  }, [bannerColor, guardianData?.name]);

  // Fetch the EJs for this guardian
  const guardianEjs = ejsList.filter(ej => ej.guardian === guardianData?.name);

  // MOCK DATA GENERATION
  const mockNotifications = guardianEjs.map((ej, idx) => ({
    id: idx,
    ejName: ej.name,
    type: idx % 2 === 0 ? "Daily" : "Funil de Vendas",
    message: idx % 2 === 0 ? "Saídas da daily registradas." : "Novo lead cadastrado no funil.",
    date: "Hoje",
    done: idx % 3 === 0
  }));

  const mockGoals = guardianEjs.map((ej, idx) => {
    const total = 5 + (idx % 3);
    const completed = 2 + (idx % 4);
    return {
      ejName: ej.name,
      total,
      completed,
      progress: Math.round((completed / total) * 100)
    };
  });

  const handleEjClick = (ej: any) => {
    setSelectedEj(ej);
    setDetailModalOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] bg-[#F8F9FA] p-0 flex flex-col overflow-hidden gap-0 border-none shadow-2xl rounded-2xl">
          
          {/* Main scrollable area */}
          <div className="flex-1 overflow-auto">
            {/* Customizable Banner Area */}
            <div 
              className="relative w-full min-h-[300px] flex items-end p-8 md:p-12 transition-all duration-300 rounded-t-2xl"
              style={{ 
                backgroundColor: bannerColor,
                backgroundImage: bannerImageUrl ? `url(${bannerImageUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Settings Toggle Button */}
              <div className="absolute top-4 right-4 z-20">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>

              {/* Settings Panel (Absolute) */}
              {showSettings && (
                <div className="absolute top-16 right-4 z-20 bg-white p-4 rounded-xl shadow-xl w-72 space-y-4 animate-in fade-in zoom-in duration-200">
                  <h4 className="font-bold text-sm text-[#0A1942]">Personalizar Banner</h4>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Cor do Painel</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={bannerColor}
                        onChange={(e) => setBannerColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      />
                      <Input 
                        value={bannerColor} 
                        onChange={(e) => setBannerColor(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Solid Background overlay is not needed if no bannerImage, but keeping structure clean */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-0 pointer-events-none"></div>

              {/* Guardian Info Content */}
              <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
                {/* Photo */}
                <div className="relative group cursor-pointer flex-shrink-0">
                  <Avatar 
                    className="h-32 w-32 md:h-40 md:w-40 border-4 border-white/20 shadow-2xl transition-transform group-hover:scale-105 bg-white overflow-hidden flex flex-col justify-end bg-gradient-to-b from-[#E0F2FE] to-[#86EFAC]"
                  >
                    <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-1/3 h-1/3 bg-white rounded-full opacity-80 blur-[2px]"></div>
                    <div className="w-full h-[40%] bg-[#84CC16] rounded-t-[50%] absolute bottom-0"></div>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm" onClick={() => setShowSettings(true)}>
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Name and Quote */}
                <div className="flex-1 text-center md:text-left space-y-2 mb-2">
                  <Input
                    defaultValue={guardianData?.name || "NOME DO GUARDIÃO"}
                    className="text-3xl md:text-4xl font-bold h-14 border-transparent bg-transparent text-white hover:bg-black/10 focus-visible:bg-black/20 focus-visible:ring-white/30 transition-colors px-2 -ml-2 w-full max-w-md uppercase tracking-wider placeholder:text-white/50"
                  />
                  <div className="inline-block">
                    <Input 
                      placeholder="FRASE DO DIA" 
                      defaultValue="FRASE DO DIA" 
                      className="h-8 text-xs bg-black/40 text-white font-medium border-transparent w-48 rounded-full px-4 text-center md:text-left focus-visible:ring-white/30 uppercase tracking-widest placeholder:text-white/50" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications and Results Area (2 columns) */}
            <div className="flex flex-col md:flex-row min-h-[300px]">
              {/* Left Column - Notificações (Dark) */}
              <div className="flex-1 bg-black p-8 text-white flex flex-col h-[400px]">
                <h3 className="text-xl font-semibold mb-6 tracking-wide text-white border-b border-white/20 pb-4">
                  Sincronização / Notificações
                </h3>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {mockNotifications.map((note) => (
                    <div key={note.id} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className="flex flex-col items-center gap-2 mt-1">
                        <div className={`w-3 h-3 rounded-full ${note.done ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                        <div className="w-px h-full bg-white/10"></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-white/50">{note.type} - {note.ejName}</span>
                          <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{note.date}</span>
                        </div>
                        <p className="text-sm text-white/90">{note.message}</p>
                      </div>
                    </div>
                  ))}
                  {mockNotifications.length === 0 && (
                    <p className="text-sm text-white/40 text-center py-8">Nenhuma notificação sincronizada.</p>
                  )}
                </div>
              </div>

              {/* Right Column - Resultados (Light) */}
              <div className="flex-1 bg-[#F5F5F5] p-8 flex flex-col h-[400px] border-l border-border/50">
                <h3 className="text-xl font-semibold mb-6 tracking-wide text-[#0A1942] uppercase border-b border-[#0A1942]/10 pb-4">
                  Acompanhamento de Metas
                </h3>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {mockGoals.map((goal, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-border/40">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-[#0A1942]">{goal.ejName}</h4>
                        <span className="text-xs font-bold bg-[#E0F2FE] text-[#0A1942] px-2 py-1 rounded-full">
                          {goal.completed}/{goal.total} Metas
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {mockGoals.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma meta associada.</p>
                  )}
                </div>
              </div>
            </div>

            {/* EJs List Area */}
            <div className="p-8 md:p-12 bg-[#FAF9F6]">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#0A1942]">EJs Acompanhadas ({guardianEjs.length})</h3>
                <p className="text-muted-foreground text-sm">Clique em uma EJ para visualizar seus detalhes.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guardianEjs.map(ej => (
                  <div 
                    key={ej.id}
                    onClick={() => handleEjClick(ej)}
                    className="bg-white rounded-3xl p-4 pr-6 flex items-center gap-5 cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02] transition-all border border-transparent hover:border-primary/10 group"
                  >
                    {/* Pill Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#E0F2FE] to-[#86EFAC] overflow-hidden flex flex-col justify-end flex-shrink-0 shadow-inner">
                      <div className="w-full h-[45%] bg-[#84CC16] rounded-t-[50%]"></div>
                    </div>
                    
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#0A1942] text-lg truncate group-hover:text-primary transition-colors">{ej.name}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase mt-0.5 tracking-wider font-semibold">Acompanhamento</p>
                    </div>
                  </div>
                ))}
                
                {guardianEjs.length === 0 && (
                  <div className="col-span-full text-center py-12 border-2 border-dashed rounded-3xl bg-white/50">
                    <p className="text-muted-foreground">Nenhuma EJ atribuída a este guardião.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Bottom Actions Bar (Optional, for saving explicitly) */}
          <div className="bg-white border-t p-4 flex justify-end">
            <Button onClick={() => onOpenChange(false)} className="bg-[#0A1942] hover:bg-[#1C2F6A] rounded-full px-8">Salvar e Fechar</Button>
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
