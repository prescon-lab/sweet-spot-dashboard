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

// Helper function to calculate brightness and return black or white for text contrast
function getContrastColor(hexColor: string) {
  if (!hexColor) return '#FFFFFF';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
}

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
  const [bannerColor, setBannerColor] = useState(guardianData?.bannerColor || '#0A1942');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(guardianData?.avatarUrl || null);
  const [quote, setQuote] = useState(guardianData?.quote || '');
  const [showSettings, setShowSettings] = useState(false);

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

  const [notifications, setNotifications] = useState(mockNotifications);

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleDeleteNotification = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (!guardianData) return null;

  // Sync to store on change
  React.useEffect(() => {
    if (guardianData?.name) {
      guardianStore.set(guardianData.name, {
        color: bannerColor,
        bannerUrl: "",
        avatarUrl: avatarUrl,
        quote: quote
      });
    }
  }, [bannerColor, quote, avatarUrl, guardianData?.name]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
        <DialogContent 
          className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden gap-0 border-none shadow-2xl rounded-[32px] transition-colors duration-300"
          style={{ backgroundColor: bannerColor }}
        >
          
          {/* Main scrollable area */}
          <div className="flex-1 overflow-auto rounded-[32px] custom-scrollbar">
            {/* Customizable Banner Area */}
            <div 
              className="relative w-full min-h-[250px] flex items-end p-8 md:p-12"
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
                <div className="absolute top-16 right-4 z-20 bg-white p-4 rounded-xl shadow-xl w-72 space-y-4 animate-in fade-in zoom-in duration-200 text-black">
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
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Foto do Guardião</label>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    {avatarUrl && (
                      <Button variant="ghost" size="sm" onClick={() => setAvatarUrl("")} className="w-full text-xs text-red-500 h-6">
                        Remover Foto
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Guardian Info Content */}
              <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
                {/* Photo */}
                <div className="relative group cursor-pointer flex-shrink-0">
                  <Avatar 
                    className="h-32 w-32 md:h-40 md:w-40 border-4 border-white/20 shadow-2xl transition-transform group-hover:scale-105 bg-black/10 overflow-hidden flex flex-col items-center justify-center"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-muted-foreground/50">
                        {guardianData?.name ? guardianData.name.substring(0, 2).toUpperCase() : "GU"}
                      </span>
                    )}
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm" onClick={() => setShowSettings(true)}>
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Name and Quote */}
                <div className="flex-1 text-center md:text-left space-y-2 mb-2">
                  <Input
                    defaultValue={guardianData?.name || "NOME DO GUARDIÃO"}
                    className="text-3xl md:text-4xl font-bold h-14 border-transparent bg-transparent hover:bg-black/10 focus-visible:bg-black/20 transition-colors px-2 -ml-2 w-full max-w-md uppercase tracking-wider"
                    style={{ color: getContrastColor(bannerColor) }}
                  />
                  <div className="inline-block w-full max-w-lg mt-2">
                    <Input 
                      placeholder="FRASE DO DIA" 
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                      className="h-auto py-2 text-sm md:text-base bg-black/20 border-transparent w-full rounded-2xl px-6 text-center md:text-left focus-visible:ring-white/30 uppercase tracking-widest" 
                      style={{ color: getContrastColor(bannerColor) }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications and Results Area (2 columns) */}
            <div className="flex flex-col md:flex-row min-h-[300px] rounded-3xl overflow-hidden mx-4 md:mx-8 mb-8 gap-4">
              {/* Left Column - Notificações (Integrated Color) */}
              <div 
                className="flex-1 p-8 flex flex-col h-[400px] rounded-3xl bg-black/10 backdrop-blur-md"
                style={{ color: getContrastColor(bannerColor) }}
              >
                <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: `${getContrastColor(bannerColor)}33` }}>
                  <h3 className="text-xl font-semibold tracking-wide">
                    Notificações
                  </h3>
                  {notifications.length > 0 && (
                    <button 
                      onClick={handleClearNotifications}
                      className="text-xs font-bold uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity bg-black/10 px-3 py-1.5 rounded-full"
                    >
                      Limpar Notificações
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {notifications.map((note) => {
                    const linkedEj = guardianEjs.find(ej => ej.name === note.ejName);
                    return (
                      <div 
                        key={note.id} 
                        onClick={() => linkedEj && handleEjClick(linkedEj)}
                        className="flex gap-4 p-4 rounded-3xl bg-black/10 border border-transparent hover:bg-black/20 transition-all cursor-pointer hover:scale-[1.02] relative group"
                      >
                        <div className="flex flex-col items-center gap-2 mt-1">
                          <div className={`w-3 h-3 rounded-full ${note.done ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                          <div className="w-px h-full bg-black/20" style={{ backgroundColor: `${getContrastColor(bannerColor)}33` }}></div>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider opacity-70">{note.type} - {note.ejName}</span>
                            <span className="text-[10px] opacity-80 bg-black/10 px-2 py-0.5 rounded-full">{note.date}</span>
                          </div>
                          <p className="text-sm opacity-90 pr-6">{note.message}</p>
                        </div>
                        {/* Delete Button (X) */}
                        <button
                          onClick={(e) => handleDeleteNotification(e, note.id)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 opacity-0 group-hover:opacity-100 hover:bg-black/20 transition-all text-sm font-bold"
                          title="Excluir notificação"
                        >
                          X
                        </button>
                      </div>
                    );
                  })}
                  {notifications.length === 0 && (
                    <p className="text-sm opacity-50 text-center py-8">Nenhuma notificação sincronizada.</p>
                  )}
                </div>
              </div>

              {/* Right Column - Resultados (Light) */}
              <div 
                className="flex-1 p-8 flex flex-col h-[400px] rounded-3xl bg-white/20 backdrop-blur-md"
                style={{ color: getContrastColor(bannerColor) }}
              >
                <h3 className="text-xl font-semibold mb-6 tracking-wide uppercase border-b pb-4" style={{ borderColor: `${getContrastColor(bannerColor)}33` }}>
                  Acompanhamento de Metas
                </h3>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {mockGoals.map((goal, idx) => (
                    <div key={idx} className="bg-black/10 p-4 rounded-3xl border border-transparent">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold">{goal.ejName}</h4>
                        <span className="text-xs font-bold bg-black/20 px-3 py-1 rounded-full">
                          {goal.completed}/{goal.total} Metas
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all duration-500" 
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {mockGoals.length === 0 && (
                    <p className="text-sm opacity-50 text-center py-8">Nenhuma meta associada.</p>
                  )}
                </div>
              </div>
            </div>

            {/* EJs List Area */}
            <div 
              className="p-8 md:p-12 mx-4 md:mx-8 mb-8 rounded-3xl bg-black/10 backdrop-blur-md"
              style={{ color: getContrastColor(bannerColor) }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold">EJs Acompanhadas ({guardianEjs.length})</h3>
                <p className="opacity-70 text-sm">Clique em uma EJ para visualizar seus detalhes.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guardianEjs.map(ej => (
                  <div 
                    key={ej.id}
                    onClick={() => handleEjClick(ej)}
                    className="bg-black/10 rounded-3xl p-4 pr-6 flex items-center gap-5 cursor-pointer shadow-sm hover:bg-black/20 hover:scale-[1.02] transition-all border border-transparent group"
                  >
                    {/* Pill Avatar */}
                    <div className="w-16 h-16 rounded-full bg-black/10 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-inner">
                      <span className="text-xl font-bold opacity-50">{ej.name.substring(0, 2).toUpperCase()}</span>
                    </div>
                    
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-lg truncate group-hover:opacity-80 transition-opacity">{ej.name}</h4>
                      <p className="text-[10px] uppercase mt-0.5 tracking-wider font-semibold opacity-70">Acompanhamento</p>
                    </div>
                  </div>
                ))}
                
                {guardianEjs.length === 0 && (
                  <div className="col-span-full text-center py-12 border-2 border-dashed border-black/20 rounded-3xl bg-black/5">
                    <p className="opacity-70">Nenhuma EJ atribuída a este guardião.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Bottom Actions Bar */}
          <div className="bg-black/20 backdrop-blur-md p-4 flex justify-end z-20">
            <Button onClick={() => onOpenChange(false)} className="bg-white text-black hover:bg-white/90 rounded-full px-8 font-bold shadow-lg">Salvar e Fechar</Button>
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
