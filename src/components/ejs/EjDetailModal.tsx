import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDirtyGuard } from "@/hooks/useDirtyGuard";
import { Checkbox } from "@/components/ui/checkbox";
import { Briefcase, Calendar as CalendarIcon, Check, Plus, Trash2, Save, Flame, Trophy, Pencil, ImageIcon } from "lucide-react";
import Cropper from "react-easy-crop";
import { eventStore, AppEvent } from "@/lib/eventStore";
import { EjLeadFunnelModal } from "./EjLeadFunnelModal";
import { ejDataStore, EjData, Task, ReuniaoNota } from "@/lib/ejDataStore";
import { activityStore } from "@/lib/activityStore";
import { mentionStore } from "@/lib/mentionStore";
import { ejListStore } from "@/lib/ejListStore";

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const truncate = (str: string) => str.length > 50 ? str.slice(0, 50) + "..." : str;

type TabType = "resumo" | "planejamento" | "eventos" | "anotacoes";

interface EjDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ejData?: any; // To be typed properly later
}

export function EjDetailModal({ open, onOpenChange, ejData }: EjDetailModalProps) {
  const dirtyGuard = useDirtyGuard(open);
  const [funnelModalOpen, setFunnelModalOpen] = useState(false);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [presconTasks, setPresconTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newPresconText, setNewPresconText] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskText, setEditingTaskText] = useState("");
  const [editingPresconId, setEditingPresconId] = useState<number | null>(null);
  const [editingPresconText, setEditingPresconText] = useState("");
  const [editingReuniaoId, setEditingReuniaoId] = useState<number | null>(null);
  const [editingReuniaoText, setEditingReuniaoText] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Crop states
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  
  const [desafio, setDesafio] = useState("");
  const [dores, setDores] = useState("");
  const [proximaReuniao, setProximaReuniao] = useState("");
  const [reunioes, setReunioes] = useState<ReuniaoNota[]>([]);
  const [novaReuniao, setNovaReuniao] = useState("");
  const [apostas, setApostas] = useState<Record<string, boolean>>({});
  
  const [mentionSearch, setMentionSearch] = useState<string | null>(null);
  const [guardianName, setGuardianName] = useState("");
  const [mentionUsers, setMentionUsers] = useState<string[]>([]);

  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewTaskText(val);
    
    const cursor = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf('@');
    
    if (lastAt !== -1 && (lastAt === 0 || textBeforeCursor[lastAt - 1] === ' ' || textBeforeCursor[lastAt - 1] === '\n')) {
      const textAfterAt = textBeforeCursor.slice(lastAt + 1);
      if (textAfterAt.length < 30 && !textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt.toLowerCase());
        return;
      }
    }
    setMentionSearch(null);
  };

  const insertMention = (guardianName: string) => {
    const cursor = newTaskText.lastIndexOf('@');
    if (cursor !== -1) {
      const newText = newTaskText.slice(0, cursor) + `@${guardianName} ` + newTaskText.slice(newTaskText.length);
      setNewTaskText(newText);
    }
    setMentionSearch(null);
  };

  React.useEffect(() => {
    if (open) {
      setEvents(eventStore.getEvents().filter(e => e.status !== 'completed'));
      
      // Load saved data for this EJ
      const ejName = ejData?.name || "";
      if (ejName) {
        const data = ejDataStore.getEjData(ejName);
        setTasks(Array.isArray(data?.tarefas) ? data.tarefas : []);
        setPresconTasks(Array.isArray(data?.presconTasks) ? data.presconTasks : []);
        setDesafio(data?.desafio || "");
        setDores(data?.dores || "");
        setProximaReuniao(data?.proximaReuniao || "");
        
        let loadedReunioes = Array.isArray(data?.reunioes) ? data.reunioes : [];
        if (loadedReunioes.length === 0 && data?.notasReuniao) {
          loadedReunioes = [{ id: 1, date: new Date().toLocaleDateString('pt-BR'), text: data.notasReuniao }];
        }
        setReunioes(loadedReunioes);
        
        setApostas(data?.apostas || {});
        setAvatarUrl(data?.avatarUrl || null);
        setGuardianName(ejData.guardian || "");
      } else {
        setTasks([]);
        setPresconTasks([]);
        setDesafio("");
        setDores("");
        setProximaReuniao("");
        setReunioes([]);
        setApostas({});
        setAvatarUrl(null);
        setGuardianName("");
      }
    }

    const handleUpdate = () => {
      setEvents(eventStore.getEvents().filter(e => e.status !== 'completed'));
    };
    
    // Fetch users for mentions
    supabase.from("profiles").select("full_name, guardian_name").then(({ data }) => {
      if (data) {
        const names = data.map(d => d.guardian_name || d.full_name).filter(Boolean) as string[];
        setMentionUsers([...new Set(names)]);
      }
    });

    window.addEventListener('eventsUpdated', handleUpdate);
    return () => window.removeEventListener('eventsUpdated', handleUpdate);
  }, [open, ejData?.name]);

  const handleSave = () => {
    const ejName = ejData?.name || "Nova EJ";
    const previousData: Partial<EjData> = ejDataStore.getEjData(ejName) || {};
    
    let hasChanges = false;
    
    // Check for guardian change
    if (ejName !== "Nova EJ" && guardianName.trim() !== (ejData?.guardian || "")) {
      ejListStore.updateEjGuardian(ejName, guardianName);
      hasChanges = true;
      activityStore.addActivity({ ejName, description: `Guardião alterado para ${guardianName}`, type: "update" });
    }

    const truncate = (str: string, length = 1000) => {
      if (!str) return "";
      return str.length > length ? str.substring(0, length) + "..." : str;
    };

    ejDataStore.saveEjData(ejName, {
      desafio,
      dores,
      proximaReuniao,
      reunioes,
      tarefas: tasks,
      presconTasks,
      apostas,
      avatarUrl: avatarUrl || undefined
    });

    // Registrar atividades específicas para cada alteração
    if (desafio !== (previousData.desafio || "")) {
      hasChanges = true;
      activityStore.addActivity({ ejName, description: `Desafio: "${truncate(desafio)}"`, type: "update" });
    }
    if (dores !== (previousData.dores || "")) {
      hasChanges = true;
      activityStore.addActivity({ ejName, description: `Dores: "${truncate(dores)}"`, type: "update" });
    }
    if (proximaReuniao !== (previousData.proximaReuniao || "")) {
      hasChanges = true;
      const dateStr = proximaReuniao ? new Date(proximaReuniao + "T12:00:00").toLocaleDateString('pt-BR') : 'Remarcada';
      activityStore.addActivity({ ejName, description: `Próxima reunião: ${dateStr}`, type: "update" });
    }
    if (JSON.stringify(reunioes) !== JSON.stringify(previousData.reunioes || [])) {
      hasChanges = true;
      activityStore.addActivity({ ejName, description: `Histórico de reuniões atualizado`, type: "update" });
    }
    if (JSON.stringify(tasks) !== JSON.stringify(previousData.tarefas || [])) {
      hasChanges = true;
      const completedCount = tasks.filter(t => t.completed).length;
      activityStore.addActivity({ ejName, description: `Tarefas: ${completedCount}/${tasks.length} concluídas`, type: "update" });
    }
    if (JSON.stringify(presconTasks) !== JSON.stringify(previousData.presconTasks || [])) {
      hasChanges = true;
      const completedCount = presconTasks.filter(t => t.completed).length;
      activityStore.addActivity({ ejName, description: `Prescon: ${completedCount}/${presconTasks.length} concluídas`, type: "update" });
    }

    if (!hasChanges) {
      activityStore.addActivity({
        ejName,
        description: "Revisão geral (nenhum dado alterado)",
        type: "update"
      });
    }

    dirtyGuard.markClean();
    toast.success("Dados salvos com sucesso!");
    onOpenChange(false);
  };

  const saveProximaReuniaoDate = () => {
    if (ejData?.name) {
      ejDataStore.saveEjData(ejData.name, { proximaReuniao });
      toast.success("Data da próxima reunião salva!");
    }
  };

  const handleSaveReuniao = () => {
    if (!novaReuniao.trim()) return;
    
    const ejName = ejData?.name || "Nova EJ";
    
    const novaNota = {
      id: Date.now(),
      date: new Date().toLocaleDateString("pt-BR"),
      text: novaReuniao
    };
    
    const novasReunioes = [novaNota, ...reunioes];
    setReunioes(novasReunioes);
    
    ejDataStore.saveEjData(ejName, { reunioes: novasReunioes });
    activityStore.addActivity({ ejName, description: `Nova anotação de reunião: "${truncate(novaReuniao)}"`, type: "update" });
    
    setNovaReuniao("");
    toast.success("Anotação da reunião salva com sucesso!");
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    
    const ejName = ejData?.name || "Nova EJ";
    mentionStore.extractAndSaveMentions(newTaskText, ejName, "Dailys");
    
    activityStore.addActivity({ ejName, description: `Nova tarefa adicionada na Daily: "${truncate(newTaskText)}"`, type: "update" });

    setTasks([
      ...tasks,
      {
        id: Date.now(),
        text: newTaskText,
        completed: false,
        date: new Date().toLocaleDateString("pt-BR")
      }
    ]);
    setNewTaskText("");
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const isNowCompleted = !t.completed;
        return { 
          ...t, 
          completed: isNowCompleted,
          completedAt: isNowCompleted ? new Date().toLocaleString('pt-BR') : undefined
        };
      }
      return t;
    }));
  };

  const removeTask = (id: number) => {
    if (window.confirm("Ação não pode ser desfeita. Tem certeza que deseja apagar essa tarefa?")) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const saveEditedTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, text: editingTaskText } : t));
    setEditingTaskId(null);
    setEditingTaskText("");
  };

  const handleAddPrescon = () => {
    if (!newPresconText.trim()) return;
    
    const ejName = ejData?.name || "Nova EJ";
    activityStore.addActivity({ ejName, description: `Nova demanda Prescon adicionada: "${truncate(newPresconText)}"`, type: "update" });

    setPresconTasks([
      {
        id: Date.now(),
        text: newPresconText.trim(),
        completed: false,
        date: new Date().toLocaleDateString("pt-BR")
      },
      ...presconTasks
    ]);
    setNewPresconText("");
  };

  const togglePrescon = (id: number) => {
    setPresconTasks(presconTasks.map(t => {
      if (t.id === id) {
        const isNowCompleted = !t.completed;
        return { 
          ...t, 
          completed: isNowCompleted,
          completedAt: isNowCompleted ? new Date().toLocaleString('pt-BR') : undefined
        };
      }
      return t;
    }));
  };

  const removePrescon = (id: number) => {
    if (window.confirm("Ação não pode ser desfeita. Tem certeza que deseja apagar essa saída?")) {
      setPresconTasks(presconTasks.filter(t => t.id !== id));
    }
  };

  const saveEditedPrescon = (id: number) => {
    setPresconTasks(presconTasks.map(t => t.id === id ? { ...t, text: editingPresconText } : t));
    setEditingPresconId(null);
    setEditingPresconText("");
  };

  const removeReuniao = (id: number) => {
    if (window.confirm("Ação não pode ser desfeita. Tem certeza que deseja apagar essa anotação?")) {
      const novasReunioes = reunioes.filter(r => r.id !== id);
      setReunioes(novasReunioes);
      ejDataStore.saveEjData(ejData?.name || "Nova EJ", { reunioes: novasReunioes });
    }
  };

  const saveEditedReuniao = (id: number) => {
    const novasReunioes = reunioes.map(r => r.id === id ? { ...r, text: editingReuniaoText } : r);
    setReunioes(novasReunioes);
    ejDataStore.saveEjData(ejData?.name || "Nova EJ", { reunioes: novasReunioes });
    setEditingReuniaoId(null);
    setEditingReuniaoText("");
  };

  const sortedTasks = (Array.isArray(tasks) ? [...tasks] : []).sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return b.id - a.id;
  });

  const sortedPresconTasks = (Array.isArray(presconTasks) ? [...presconTasks] : []).sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return b.id - a.id;
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageUrl(reader.result as string);
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
    setAvatarUrl(compressedDataUrl);
    setCropModalOpen(false);
    setTempImageUrl(null);
  };

  const activeEventIds = events.map(e => e.id);
  const isAposta = Object.entries(apostas).some(([eventId, isTrue]) => isTrue && activeEventIds.includes(eventId));

  return (
    <>
      {/* Cropper Modal */}
      <Dialog open={cropModalOpen} onOpenChange={(open) => {
        setCropModalOpen(open);
        if (!open) setTempImageUrl(null);
      }}>
        <DialogContent className="modal-shell max-w-md glass-modal p-6 rounded-3xl z-[100] border-none">
          <h3 className="text-xl font-bold mb-4 text-foreground text-center">Ajustar Foto</h3>
          <div className="relative w-full h-[300px] bg-black/5 rounded-2xl overflow-hidden mb-6">
            {tempImageUrl && (
              <Cropper
                image={tempImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
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

      {open && (
        <div className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 max-w-none w-full h-full m-0 p-0 flex flex-col overflow-hidden gap-0 border-none shadow-none rounded-none bg-background animate-in slide-in-from-right-1/2 z-50" {...dirtyGuard.containerProps}>
          
          {/* Header Area with Back Button */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 sm:p-6 lg:p-8 bg-card/40 backdrop-blur-md border-b border-border/50 shrink-0 overflow-y-auto max-h-[45vh] lg:max-h-none pt-12 lg:pt-8 relative">
            <div className="absolute top-2 left-4 z-50 flex items-center gap-2 lg:hidden">
              <Button 
                variant="ghost" 
                size="sm"
                className="hover:bg-muted text-muted-foreground rounded-full flex items-center gap-1 font-semibold -ml-2"
                onClick={() => { dirtyGuard.markClean(); onOpenChange(false); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                Voltar
              </Button>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
              <div className="hidden lg:flex items-center self-start mt-2 mr-2">
                <Button 
                  variant="ghost" 
                  className="hover:bg-muted text-muted-foreground rounded-full flex items-center gap-2 font-semibold"
                  onClick={() => { dirtyGuard.markClean(); onOpenChange(false); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Voltar
                </Button>
              </div>

              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 lg:h-28 lg:w-28 shrink-0 shadow-sm transition-transform group-hover:scale-105 border-0 bg-black/5">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-muted text-4xl font-bold">
                      {ejData?.name ? ejData.name.substring(0, 2).toUpperCase() : "NO"}
                    </AvatarFallback>
                  )}
                </Avatar>
                {isAposta && (
                  <div className="absolute -top-2 -right-2 bg-orange-500 text-white p-2 rounded-full shadow-md z-10" title="EJ é Aposta">
                    <Flame className="w-5 h-5" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div className="space-y-4 flex-1 min-w-0 max-w-2xl mt-2">
                <Input
                  defaultValue={ejData?.name || "Nova EJ"}
                  className="text-2xl sm:text-3xl lg:text-5xl font-extrabold h-12 sm:h-14 lg:h-16 w-full border-transparent bg-transparent hover:bg-muted/30 focus-visible:bg-card focus-visible:ring-primary/30 transition-colors px-2 -ml-2 shadow-none"
                  placeholder="Nome da EJ"
                />
                <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 sm:gap-6 w-full">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1 truncate">Guardião(ã) da EJ</span>
                    <Input placeholder="Guardião" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} className="h-10 text-sm font-medium bg-muted/30 border-transparent w-full" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1 truncate">Grupo</span>
                    <Input placeholder="Grupo" defaultValue={ejData?.group || ""} className="h-10 text-sm font-medium bg-muted/30 border-transparent w-full" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1 truncate">CM</span>
                    <Input placeholder="CM" defaultValue={ejData?.cm || ""} className="h-10 text-sm font-medium bg-muted/30 border-transparent w-full" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-4 w-full">
                <Button variant="ghost" className="min-h-11 text-muted-foreground hover:bg-muted/50" onClick={() => dirtyGuard.requestClose(onOpenChange)}>
                  Fechar sem Salvar
                </Button>
                <Button className="min-h-11 font-semibold text-white px-4 sm:px-8" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Perfil
                </Button>
              </div>
            </div>

          </div>

          {/* Body Content */}
          <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
            {/* Left Column - Tabs */}
            <div className="flex-1 min-w-0 lg:overflow-auto p-4 sm:p-6 lg:border-r border-border/40">
              <Tabs defaultValue="apostas" className="w-full h-full flex flex-col">
                <TabsList className="w-full justify-start rounded-none border-b border-border/40 bg-transparent h-12 shrink-0 p-0 gap-4 sm:gap-6 overflow-x-auto flex-nowrap space-x-0 sm:space-x-6">
                  <TabsTrigger 
                    value="apostas" 
                    className="shrink-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent px-2 h-full text-sm sm:text-base"
                  >
                    Apostas & Metas
                  </TabsTrigger>
                  <TabsTrigger 
                    value="dailys" 
                    className="shrink-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent px-2 h-full text-sm sm:text-base"
                  >
                    Saídas das Dailys
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reuniao" 
                    className="shrink-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent px-2 h-full text-sm sm:text-base"
                  >
                    Reunião / Acompanhamento
                  </TabsTrigger>
                  <TabsTrigger 
                    value="prescon" 
                    className="shrink-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent px-2 h-full text-sm sm:text-base"
                  >
                    PRESCON
                  </TabsTrigger>
                </TabsList>


                {/* Aba 1: Apostas & Metas */}
                <TabsContent value="apostas" className="flex-1 pt-6 outline-none space-y-6">
                  {events.length === 0 ? (
                    <div className="glass-card rounded-xl p-6 space-y-4">
                      <h3 className="font-semibold text-lg text-foreground">Apostas de Eventos</h3>
                      <div className="border border-dashed border-border p-8 rounded-lg text-center text-muted-foreground flex flex-col items-center justify-center gap-4 bg-muted/10">
                        <p>Nenhum evento cadastrado no painel.</p>
                      </div>
                    </div>
                  ) : (
                    events.map(event => (
                      <div key={event.id} className="bg-card rounded-xl border border-border/50 p-6 space-y-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-xl text-foreground uppercase">{event.name}</h3>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t space-y-3">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-xs font-semibold uppercase text-muted-foreground">Meta da EJ ({ejData?.name})</h4>
                              
                              <label className="flex items-center gap-2 cursor-pointer bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors border border-orange-200">
                                <Checkbox 
                                  checked={!!apostas[event.id]}
                                  onCheckedChange={(checked) => {
                                    setApostas(prev => ({...prev, [event.id]: !!checked}));
                                  }}
                                  className="border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                />
                                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                  <Flame className="w-3.5 h-3.5" />
                                  APOSTA
                                </span>
                              </label>
                            </div>
                            {event.ejGoals.map(goal => {
                              const isChecked = goal.checkedBy ? goal.checkedBy.includes(ejData?.name || 'unknown') : !!goal.checked;
                              return (
                                <div key={goal.id} className="bg-muted/20 p-3 rounded-lg hover:bg-muted/40 transition-colors">
                                  <div className="flex items-start gap-3">
                                    <Checkbox 
                                      checked={isChecked}
                                      onCheckedChange={() => eventStore.toggleGoal(event.id, goal.id, ejData?.name || 'unknown')}
                                      className="mt-1 border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:text-white"
                                    />
                                    <p className={`text-sm flex-1 ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>
                                      {goal.text}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {event.ejGoals.length === 0 && (
                            <p className="text-sm text-muted-foreground">Nenhuma meta específica definida.</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* Aba 2: Saídas das Dailys */}
                <TabsContent value="dailys" className="flex-1 pt-6 outline-none">
                  <div className="bg-card rounded-xl border border-border/50 p-6 space-y-6">
                    <h3 className="font-semibold text-lg text-foreground">Saídas</h3>
                    
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          placeholder="Adicionar nova tarefa... Digite @ para mencionar guardiões" 
                          value={newTaskText}
                          onChange={handleTaskChange}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        />
                        {mentionSearch !== null && (
                          <div className="absolute top-12 left-0 right-0 bg-card border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/30 border-b">
                              Mencionar Usuário
                            </div>
                            {mentionUsers.filter(g => g.toLowerCase().includes(mentionSearch)).map(g => (
                              <div 
                                key={g} 
                                className="px-4 py-3 hover:bg-primary/5 cursor-pointer text-sm font-medium transition-colors"
                                onClick={() => insertMention(g)}
                              >
                                <span className="text-primary mr-1">@</span>{g}
                              </div>
                            ))}
                            {mentionUsers.filter(g => g.toLowerCase().includes(mentionSearch)).length === 0 && (
                              <div className="px-4 py-3 text-sm text-muted-foreground">Nenhum usuário encontrado... (você pode continuar digitando)</div>
                            )}
                          </div>
                        )}
                      </div>
                      <Button onClick={handleAddTask}>Adicionar</Button>
                    </div>

                    <div className="space-y-3">
                      {sortedTasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors group">
                          <Checkbox 
                            checked={task.completed}
                            onCheckedChange={() => toggleTask(task.id)}
                          />
                          <div className="flex-1">
                            {editingTaskId === task.id ? (
                              <div className="flex items-center gap-2">
                                <Input 
                                  value={editingTaskText} 
                                  onChange={(e) => setEditingTaskText(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && saveEditedTask(task.id)}
                                  autoFocus
                                  className="h-8 text-sm"
                                />
                                <Button size="sm" onClick={() => saveEditedTask(task.id)}><Check className="w-4 h-4" /></Button>
                              </div>
                            ) : (
                              <>
                                <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {task.text}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Registrado em: {task.date}
                                  {task.completedAt && ` • Concluído em: ${task.completedAt}`}
                                </p>
                              </>
                            )}
                          </div>
                          {editingTaskId !== task.id && (
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => { setEditingTaskId(task.id); setEditingTaskText(task.text); }}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeTask(task.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                      {tasks.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma saída cadastrada.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Aba 4: Prescon */}
                <TabsContent value="prescon" className="flex-1 pt-6 outline-none flex flex-col h-full">
                  <div className="bg-card rounded-xl border border-border/50 p-6 flex-1 flex flex-col min-h-[400px]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-lg text-foreground">PRESCON</h3>
                    </div>
                    <p className="opacity-70 text-sm text-muted-foreground mb-6 -mt-2">Saídas e encaminhamentos da Prescon.</p>
                    
                    <div className="space-y-4 mb-6">
                      <div className="relative">
                        <Textarea 
                          placeholder="Comece a digitar uma nova saída ou encaminhamento..." 
                          className="w-full resize-y min-h-[100px] border-border/50 focus-visible:ring-primary/20 bg-muted/5 p-4 rounded-xl"
                          value={newPresconText}
                          onChange={(e) => setNewPresconText(e.target.value)}
                        />
                        <Button size="sm" onClick={handleAddPrescon} className="absolute bottom-3 right-3 text-white">
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar Saída
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                      {presconTasks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Nenhuma saída da Prescon salva.</p>
                        </div>
                      ) : (
                        presconTasks.map(task => (
                          <div key={task.id} className="bg-muted/10 border border-border/50 rounded-xl p-4 space-y-2 relative group">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-sm text-foreground">Anotação</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium bg-card px-2 py-1 rounded text-muted-foreground border">
                                  {task.date}
                                </span>
                                {editingPresconId !== task.id && (
                                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => { setEditingPresconId(task.id); setEditingPresconText(task.text); }}>
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removePrescon(task.id)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {editingPresconId === task.id ? (
                              <div className="space-y-2 mt-2">
                                <Textarea 
                                  value={editingPresconText} 
                                  onChange={(e) => setEditingPresconText(e.target.value)}
                                  className="w-full resize-y min-h-[100px] border-border/50 bg-card"
                                  autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" variant="outline" onClick={() => setEditingPresconId(null)}>Cancelar</Button>
                                  <Button size="sm" onClick={() => saveEditedPrescon(task.id)}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{task.text}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Aba 3: Reunião / Acompanhamento */}
                <TabsContent value="reuniao" className="flex-1 pt-6 outline-none flex flex-col h-full">
                  <div className="bg-card rounded-xl border border-border/50 p-6 flex-1 flex flex-col min-h-[400px]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-lg text-foreground">Anotações de Reunião</h3>
                    </div>
                    
                    <div className="space-y-4 mb-6">
                      <div className="relative">
                        <Textarea 
                          placeholder="Comece a digitar uma nova anotação..." 
                          className="w-full resize-y min-h-[100px] border-border/50 focus-visible:ring-primary/20 bg-muted/5 p-4 rounded-xl"
                          value={novaReuniao}
                          onChange={(e) => setNovaReuniao(e.target.value)}
                        />
                        <Button size="sm" onClick={handleSaveReuniao} className="absolute bottom-3 right-3 text-white">
                          <Plus className="w-4 h-4 mr-1" />
                          Adicionar Anotação
                        </Button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                      {reunioes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Nenhuma reunião salva no histórico.</p>
                        </div>
                      ) : (
                        reunioes.map(reuniao => (
                          <div key={reuniao.id} className="bg-muted/10 border border-border/50 rounded-xl p-4 space-y-2 relative group">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-sm text-foreground">Anotações</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium bg-card px-2 py-1 rounded text-muted-foreground border">
                                  {reuniao.date}
                                </span>
                                {editingReuniaoId !== reuniao.id && (
                                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => { setEditingReuniaoId(reuniao.id); setEditingReuniaoText(reuniao.text); }}>
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeReuniao(reuniao.id)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {editingReuniaoId === reuniao.id ? (
                              <div className="space-y-2 mt-2">
                                <Textarea 
                                  value={editingReuniaoText} 
                                  onChange={(e) => setEditingReuniaoText(e.target.value)}
                                  className="w-full resize-y min-h-[100px] border-border/50 bg-card"
                                  autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" variant="outline" onClick={() => setEditingReuniaoId(null)}>Cancelar</Button>
                                  <Button size="sm" onClick={() => saveEditedReuniao(reuniao.id)}>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{reuniao.text}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Sidebar */}
            <div className="w-full lg:w-80 shrink-0 lg:overflow-auto p-4 sm:p-6 space-y-6 border-t lg:border-t-0 border-border/40">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Desafio do Ciclo</label>
                <Textarea 
                  placeholder="Ex: Melhorar engajamento..." 
                  className="bg-card min-h-[100px] resize-y"
                  value={desafio}
                  onChange={(e) => setDesafio(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Dores da EJ</label>
                <Textarea 
                  placeholder="Ex: Falta de leads..." 
                  className="bg-card min-h-[100px] resize-y"
                  value={dores}
                  onChange={(e) => setDores(e.target.value)}
                />
              </div>

              <div className="space-y-2 bg-muted/20 p-4 rounded-xl border border-border/50">
                <label className="text-sm font-semibold text-foreground">Próxima Reunião</label>
                
                {proximaReuniao ? (
                  <div className="flex flex-col gap-1 mb-3 bg-primary/10 text-primary p-3 rounded-xl border border-primary/20">
                    <div className="flex items-center gap-2 font-semibold">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Reunião marcada para:</span>
                    </div>
                    <span className="text-xl font-bold ml-6">{proximaReuniao.split('-').reverse().join('/')}</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 mb-3 bg-muted/30 text-muted-foreground p-3 rounded-xl border">
                    <div className="flex items-center gap-2 font-semibold">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Próxima Reunião</span>
                    </div>
                    <span className="text-sm italic ml-6">Nenhuma data definida</span>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <div className="relative w-full">
                    <Input 
                      type="date" 
                      className="bg-card pl-10 h-10 w-full text-sm" 
                      value={proximaReuniao}
                      onChange={(e) => setProximaReuniao(e.target.value)}
                    />
                    <CalendarIcon className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>
                  <Button onClick={saveProximaReuniaoDate} className="h-10 w-full font-semibold">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => setFunnelModalOpen(true)}
                  className="w-full flex flex-col items-center justify-center p-6 bg-[#F3ECE0] hover:bg-[#E9DDC9] rounded-xl border border-[#D9CDB9] transition-all cursor-pointer shadow-sm group"
                >
                  <Briefcase className="w-6 h-6 text-[#8B7355] mb-2 group-hover:scale-110 transition-transform" />
                  <h4 className="font-semibold text-[#5A4A35]">Funil de Vendas</h4>
                  <p className="text-xs text-[#8B7355] mt-1">Gerenciar leads e faturamento</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <EjLeadFunnelModal 
        open={funnelModalOpen}
        onOpenChange={setFunnelModalOpen}
        ejId={ejData?.name || ''}
      />
    </>
  );
}
