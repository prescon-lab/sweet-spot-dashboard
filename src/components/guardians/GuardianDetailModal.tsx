import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Users, AlertCircle, TrendingUp, Check, Flame, Trophy } from "lucide-react";
import { ejsList } from "@/lib/data";
import { guardianStore } from "@/lib/guardianStore";
import { ejDataStore } from "@/lib/ejDataStore";
import { eventStore } from "@/lib/eventStore";
import { mentionStore, Mention } from "@/lib/mentionStore";
import { activityStore } from "@/lib/activityStore";
import { EjDetailModal } from "@/components/ejs/EjDetailModal";
import { Settings, Image as ImageIcon, Trash2 } from "lucide-react";
import Cropper from "react-easy-crop";

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
  const [bannerColor, setBannerColor] = useState(initialConfig.color || '#0A1942');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialConfig.avatarUrl || null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(initialConfig.bannerUrl || null);
  const [bannerOpacity, setBannerOpacity] = useState(initialConfig.bannerOpacity ?? 0.2);
  const [quote, setQuote] = useState(initialConfig.quote || '');
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Crop states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'avatar' | 'banner'>('avatar');

  // Fetch the EJs for this guardian
  const guardianEjs = ejsList.filter(ej => ej.guardian === guardianData?.name);

  const [mentions, setMentions] = useState<Mention[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // Sync mentions and config when modal opens
  React.useEffect(() => {
    if (open && guardianData?.name) {
      setMentions(mentionStore.getMentions().filter(m => m.guardianName === guardianData.name && !m.read).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      
      const guardianEjNames = ejsList.filter(ej => ej.guardian === guardianData.name).map(ej => ej.name);
      setActivities(activityStore.getActivities().filter(a => guardianEjNames.includes(a.ejName)));
      
      const config = guardianStore.get(guardianData.name);
      setBannerColor(config.color || '#0A1942');
      setAvatarUrl(config.avatarUrl || null);
      setBannerUrl(config.bannerUrl || null);
      setBannerOpacity(config.bannerOpacity ?? 0.2);
      setQuote(config.quote || '');
    }
    
    const handleUpdate = () => {
      if (guardianData?.name) {
        setMentions(mentionStore.getMentions().filter(m => m.guardianName === guardianData.name && !m.read).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        const guardianEjNames = ejsList.filter(ej => ej.guardian === guardianData.name).map(ej => ej.name);
        setActivities(activityStore.getActivities().filter(a => guardianEjNames.includes(a.ejName)));
      }
    };
    
    window.addEventListener('mentionsUpdated', handleUpdate);
    window.addEventListener('activitiesUpdated', handleUpdate);
    return () => {
      window.removeEventListener('mentionsUpdated', handleUpdate);
      window.removeEventListener('activitiesUpdated', handleUpdate);
    };
  }, [open, guardianData?.name]);

  const handleClearMentions = () => {
    mentions.forEach(m => mentionStore.markAsRead(m.id));
  };

  const handleDeleteMention = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    mentionStore.markAsRead(id);
  };

  // Sync to store on change
  React.useEffect(() => {
    if (guardianData?.name) {
      guardianStore.set(guardianData.name, {
        color: bannerColor,
        bannerUrl: bannerUrl || "",
        bannerOpacity: bannerOpacity,
        avatarUrl: avatarUrl || "",
        quote: quote
      });
    }
  }, [bannerColor, bannerUrl, bannerOpacity, quote, avatarUrl, guardianData?.name]);

  if (!guardianData) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageUrl(reader.result as string);
        setCropType(type);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSaveCrop = async () => {
    if (!tempImageUrl || !croppedAreaPixels) return;
    
    const img = new Image();
    img.src = tempImageUrl;
    await new Promise((resolve) => (img.onload = resolve));
    
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      256,
      256
    );
    
    const compressedDataUrl = canvas.toDataURL("image/png");
    if (cropType === 'avatar') {
      setAvatarUrl(compressedDataUrl);
    } else {
      setBannerUrl(compressedDataUrl);
    }
    setCropModalOpen(false);
    setTempImageUrl(null);
  };


  // We no longer need mockGoals


  const handleEjClick = (ej: any) => {
    setSelectedEj(ej);
    setDetailModalOpen(true);
  };

  return (
    <>
      {/* Cropper Modal */}
      <Dialog open={cropModalOpen} onOpenChange={(open) => {
        setCropModalOpen(open);
        if (!open) setTempImageUrl(null);
      }}>
        <DialogContent className="max-w-md glass-modal p-6 rounded-3xl z-[100] border-none">
          <h3 className="text-xl font-bold mb-4 text-foreground text-center">Ajustar Foto</h3>
          <div className="relative w-full h-[300px] bg-black/5 rounded-2xl overflow-hidden mb-6">
            {tempImageUrl && (
              <Cropper
                image={tempImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={cropType === 'avatar' ? 1 : undefined}
                cropShape={cropType === 'avatar' ? "round" : "rect"}
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 rounded-xl hover:bg-accent" onClick={() => {
              setCropModalOpen(false);
              setTempImageUrl(null);
            }}>Cancelar</Button>
            <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl" onClick={handleSaveCrop}>Salvar Foto</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col overflow-hidden gap-0 border-none shadow-2xl rounded-[32px] transition-colors duration-300"
          style={{ backgroundColor: bannerColor }}
          hideCloseButton
        >
          {bannerUrl && (
            <div 
              className="absolute inset-0 pointer-events-none z-0" 
              style={{ 
                backgroundImage: `url(${bannerUrl})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                opacity: bannerOpacity 
              }} 
            />
          )}
          
          {/* Main scrollable area */}
          <div className="flex-1 overflow-auto rounded-[32px] custom-scrollbar relative z-10">
            {/* Customizable Banner Area */}
            <div 
              className="relative w-full min-h-[250px] flex items-end p-5 sm:p-8 md:p-12 z-20"
            >
              {/* Settings Toggle Button */}
              <div className="absolute top-4 left-4 z-30">
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
                <div className="absolute top-16 left-4 z-40 bg-card/95 backdrop-blur-xl p-4 rounded-xl shadow-xl w-72 space-y-4 animate-in fade-in zoom-in duration-200 text-foreground border border-border/40">
                  <h4 className="font-bold text-sm text-foreground">Configurações Visuais</h4>
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
                    <label className="text-xs font-semibold text-muted-foreground">Foto de fundo</label>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'banner')}
                      className="text-xs file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    
                    {bannerUrl && (
                      <div className="space-y-3 mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-semibold text-muted-foreground">Opacidade</label>
                            <span className="text-[10px] text-muted-foreground font-mono">{Math.round(bannerOpacity * 100)}%</span>
                          </div>
                          <input 
                            type="range" 
                            min="0.05" 
                            max="1" 
                            step="0.05"
                            value={bannerOpacity}
                            onChange={(e) => setBannerOpacity(parseFloat(e.target.value))}
                            className="w-full accent-primary h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setBannerUrl(null)} className="w-full text-xs text-red-500 h-7 bg-red-50 hover:bg-red-100 hover:text-red-600">
                          Remover Fundo
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Guardian Info Content */}
              <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
                {/* Photo */}
                <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fileInputRef.current?.click()}>
                  <Avatar 
                    className="h-40 w-40 md:h-48 md:w-48 border-0 transition-transform group-hover:scale-105 bg-black/5 overflow-hidden flex flex-col items-center justify-center shadow-md"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-muted-foreground/50">
                        {guardianData?.name ? guardianData.name.substring(0, 2).toUpperCase() : "GU"}
                      </span>
                    )}
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => handleImageUpload(e, 'avatar')} 
                    accept="image/*" 
                    className="hidden" 
                  />
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
            <div className="flex flex-col md:flex-row min-h-[300px] rounded-3xl overflow-hidden mx-3 sm:mx-4 md:mx-8 mb-6 sm:mb-8 gap-4">
              {/* Left Column - Menções (Integrated Color) */}
              <div 
                className="flex-1 min-w-0 p-5 sm:p-8 flex flex-col h-[400px] rounded-3xl bg-black/10 backdrop-blur-md"
                style={{ color: getContrastColor(bannerColor) }}
              >
                <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: `${getContrastColor(bannerColor)}33` }}>
                  <h3 className="text-xl font-semibold tracking-wide">
                    Menções
                  </h3>
                  {mentions.length > 0 && (
                    <button 
                      onClick={handleClearMentions}
                      className="text-xs font-bold uppercase tracking-wider opacity-70 hover:opacity-100 transition-opacity bg-black/10 px-3 py-1.5 rounded-full"
                    >
                      Limpar Lidas
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {mentions.length === 0 ? (
                    <p className="text-sm opacity-70 text-center py-4">Nenhuma menção para você no momento.</p>
                  ) : (
                    mentions.map((mention) => {
                      const linkedEj = ejsList.find(ej => ej.name === mention.ejName);
                      return (
                        <div 
                          key={mention.id} 
                          onClick={() => {
                            if (linkedEj) handleEjClick(linkedEj);
                            mentionStore.markAsRead(mention.id);
                          }}
                          className={`flex gap-4 p-4 rounded-3xl bg-black/10 border transition-all cursor-pointer hover:scale-[1.02] relative group border-white/20`}
                        >
                          <div className="flex flex-col items-center gap-2 mt-1">
                            <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
                            <div className="w-px h-full bg-black/20" style={{ backgroundColor: `${getContrastColor(bannerColor)}33` }}></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-col items-start mb-1">
                              <span className="text-[10px] opacity-60 font-semibold tracking-widest mb-0.5">{new Date(mention.date).toLocaleDateString('pt-BR')}</span>
                              <span className="text-xs font-bold uppercase tracking-wider opacity-70">{mention.source} - {mention.ejName}</span>
                            </div>
                            <p className="text-sm opacity-90 pr-6 italic line-clamp-2">"{mention.contextText}"</p>
                          </div>
                          {/* Delete Button (Trash) */}
                          <button
                            onClick={(e) => handleDeleteMention(e, mention.id)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 opacity-50 hover:opacity-100 hover:bg-black/40 transition-all text-white shadow-sm"
                            title="Marcar como lida"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column - Atualizações (Light) */}
              <div 
                className="flex-1 min-w-0 p-5 sm:p-8 flex flex-col h-[400px] rounded-3xl bg-white/20 backdrop-blur-md"
                style={{ color: getContrastColor(bannerColor) }}
              >
                <h3 className="text-xl font-semibold mb-6 tracking-wide border-b pb-4" style={{ borderColor: `${getContrastColor(bannerColor)}33` }}>
                  Atualizações das EJs
                </h3>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {activities.map((activity) => (
                    <div key={activity.id} className="bg-black/10 p-4 rounded-3xl border border-transparent">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-sm">{activity.ejName}</h4>
                        <span className="text-[10px] font-semibold opacity-70">
                          {new Date(activity.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm opacity-90">{activity.description}</p>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <p className="text-sm opacity-50 text-center py-8">Nenhuma atualização recente.</p>
                  )}
                </div>
              </div>
            </div>

            {/* EJs List Area */}
            <div 
              className="p-5 sm:p-8 md:p-12 mx-3 sm:mx-4 md:mx-8 mb-6 sm:mb-8 rounded-3xl bg-black/10 backdrop-blur-md"
              style={{ color: getContrastColor(bannerColor) }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-bold">EJs Acompanhadas ({guardianEjs.length})</h3>
                <p className="opacity-70 text-sm">Clique em uma EJ para visualizar seus detalhes.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {guardianEjs.map(ej => {
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
                      onClick={() => handleEjClick(ej)}
                      className="bg-black/10 rounded-3xl p-4 pr-6 flex items-center gap-5 cursor-pointer shadow-sm hover:bg-black/20 hover:scale-[1.02] transition-all border border-transparent group relative"
                    >
                      {/* Icons Badge Area */}
                      <div className="absolute -top-2 -right-2 flex gap-1 z-10">
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

                      {/* Pill Avatar */}
                      <div className="w-16 h-16 rounded-full bg-black/10 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-inner">
                        {ejSavedData?.avatarUrl ? (
                          <img src={ejSavedData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl font-bold opacity-50">{ej.name.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg truncate group-hover:opacity-80 transition-opacity">{ej.name}</h4>
                        <p className="text-[10px] uppercase mt-0.5 tracking-wider font-semibold opacity-70">Acompanhamento</p>
                      </div>
                    </div>
                  );
                })}
                
                {guardianEjs.length === 0 && (
                  <div className="col-span-full text-center py-12 border-2 border-dashed border-black/20 rounded-3xl bg-black/5">
                    <p className="opacity-70">Nenhuma EJ atribuída a este guardião.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Event Tracking Area */}
            {eventStore.getEvents().filter(e => e.status !== 'completed').length > 0 && (
              <div 
                className="p-5 sm:p-8 md:p-12 mx-3 sm:mx-4 md:mx-8 mb-6 sm:mb-8 rounded-3xl bg-black/10 backdrop-blur-md"
                style={{ color: getContrastColor(bannerColor) }}
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold">VISÃO GERAL</h3>
                  <p className="opacity-70 text-sm">Progresso das metas pelas EJs sob sua responsabilidade.</p>
                </div>
                
                <div className="space-y-6">
                  {eventStore.getEvents().filter(e => e.status !== 'completed').map(event => (
                    <div key={event.id} className="bg-black/10 rounded-2xl p-6 border border-transparent">
                      <h4 className="font-bold text-lg mb-4 uppercase">{event.name}</h4>
                      {event.ejGoals.length === 0 ? (
                        <p className="text-sm opacity-70">Nenhuma meta cadastrada para este evento.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {guardianEjs.map(ej => {
                            const completedGoals = event.ejGoals.filter(g => g.checkedBy?.includes(ej.name) || g.checked);
                            const totalGoals = event.ejGoals.length;
                            const progress = totalGoals === 0 ? 0 : Math.round((completedGoals.length / totalGoals) * 100);
                            
                            return (
                              <div key={ej.name} className="bg-white/5 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-bold">{ej.name}</span>
                                  <span className="text-xs font-bold px-2 py-1 bg-black/20 rounded-full">
                                    {completedGoals.length}/{totalGoals} Metas ({progress}%)
                                  </span>
                                </div>
                                <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden mt-3">
                                  <div 
                                    className="h-2 rounded-full transition-all duration-500 bg-green-500 shadow-sm" 
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom Actions Bar */}
          <div className="bg-black/20 backdrop-blur-md p-4 flex justify-end gap-3 z-20">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full px-6 font-bold hover:bg-white/10 text-white">Fechar sem salvar</Button>
            <Button onClick={() => onOpenChange(false)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 font-bold shadow-lg">Salvar e Fechar</Button>
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
