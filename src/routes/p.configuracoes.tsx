import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { linksStore, UsefulLink } from "@/lib/linksStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash, Edit, Save, X, ShieldCheck, Users, Zap, MessageSquare, PartyPopper, AlertTriangle, Bell, Info, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useAccessRole } from "@/lib/access";
import { toast } from "sonner";
import { dailyStore, DailyConfig } from "@/lib/dailyStore";
import { announcementStore, Announcement } from "@/lib/announcementStore";
import { eventStore } from "@/lib/eventStore";
import { ejListStore } from "@/lib/ejListStore";
import { squadStore } from "@/lib/squadStore";
import { activityStore } from "@/lib/activityStore";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function isValidDate(value?: string) {
  if (!value) return false;
  const d = new Date(value + "T12:00:00");
  return !Number.isNaN(d.getTime());
}

export const Route = createFileRoute("/p/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Links e Acessos" },
      { name: "description", content: "Gerencie os links úteis do menu lateral e o link exclusivo de acesso para guardiões." },
      { property: "og:title", content: "Configurações — Links e Acessos" },
      { property: "og:description", content: "Gerencie os links úteis do menu lateral e o link exclusivo de acesso para guardiões." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const role = useAccessRole();
  
  const [links, setLinks] = useState<UsefulLink[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const [dailyConfig, setDailyConfig] = useState<DailyConfig>({
    startDate: "",
    endDate: "",
    daysOfWeek: [1, 2, 3, 4, 5]
  });
  const [savedDailyConfig, setSavedDailyConfig] = useState<DailyConfig | null>(null);
  const [isEditingDaily, setIsEditingDaily] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  // Announcements State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");
  const [newAnnStart, setNewAnnStart] = useState("");
  const [newAnnEnd, setNewAnnEnd] = useState("");
  const [newAnnIcon, setNewAnnIcon] = useState("Bell");
  
  const [newAnnHasQuestion, setNewAnnHasQuestion] = useState(false);
  const [newAnnQuestionText, setNewAnnQuestionText] = useState("");
  const [newAnnQuestionType, setNewAnnQuestionType] = useState<"boolean" | "options" | "text">("boolean");
  const [newAnnQuestionOptions, setNewAnnQuestionOptions] = useState("");
  const [showResponsesModal, setShowResponsesModal] = useState<string | null>(null);

  // Deletion Confirmation State
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState<{type: 'daily' | 'announcement' | 'link', id?: string} | null>(null);

  useEffect(() => {
    loadLinks();
    setAnnouncements(announcementStore.getAll());
    
    const loadDaily = () => {
      const dConfig = dailyStore.getConfig();
      setSavedDailyConfig(dConfig);
      if (dConfig) {
        setDailyConfig({
          startDate: dConfig.startDate ?? "",
          endDate: dConfig.endDate ?? "",
          daysOfWeek: Array.isArray(dConfig.daysOfWeek) ? dConfig.daysOfWeek : [1, 2, 3, 4, 5],
        });
      } else {
        setDailyConfig({
          startDate: "",
          endDate: "",
          daysOfWeek: [1, 2, 3, 4, 5],
        });
      }
    };
    
    loadDaily();
    
    const handleUpdate = () => {
      loadLinks();
    };
    const handleAnnouncementsUpdate = () => {
      setAnnouncements(announcementStore.getAll());
    };
    
    window.addEventListener('linksStoreUpdated', handleUpdate);
    window.addEventListener('dailyConfigUpdated', loadDaily);
    window.addEventListener('announcementsUpdated', handleAnnouncementsUpdate);
    return () => {
      window.removeEventListener('linksStoreUpdated', handleUpdate);
      window.removeEventListener('dailyConfigUpdated', loadDaily);
      window.removeEventListener('announcementsUpdated', handleAnnouncementsUpdate);
    };
  }, []);

  const loadLinks = () => {
    setLinks(linksStore.getAll());
  };

  const handleAddLink = () => {
    if (!newTitle.trim() || !newUrl.trim() || !newCategory.trim()) {
      toast.error("Preencha todos os campos para adicionar um link.");
      return;
    }

    linksStore.add({
      title: newTitle,
      url: newUrl,
      category: newCategory
    });

    setNewTitle("");
    setNewUrl("");
    setNewCategory("");
    toast.success("Link adicionado com sucesso!");
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmInfo({ type: 'link', id });
  };

  const handleStartEdit = (link: UsefulLink) => {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
    setEditCategory(link.category);
  };

  const handleCleanTestData = async () => {
    if (!confirm("Tem certeza que deseja apagar TODOS os dados (Avisos, Eventos, EJs, Atividades) que contenham a palavra 'teste' no nome? Essa ação não pode ser desfeita.")) {
      return;
    }
    
    setIsCleaning(true);
    try {
      // Clean Announcements
      const anns = announcementStore.getAll();
      anns.forEach(a => {
        if (a.title.toLowerCase().includes('teste') || a.content.toLowerCase().includes('teste')) {
          announcementStore.remove(a.id);
        }
      });

      // Clean Events
      const evts = eventStore.getEvents();
      evts.forEach(e => {
        if (e.name.toLowerCase().includes('teste')) {
          eventStore.deleteEvent(e.id);
        }
      });

      // Clean Activities
      const acts = activityStore.getActivities();
      acts.forEach(a => {
        if (a.ejName.toLowerCase().includes('teste') || a.description.toLowerCase().includes('teste')) {
          activityStore.deleteActivity(a.id);
        }
      });

      // Clean EJs
      const ejs = ejListStore.getEjs();
      ejs.forEach(e => {
        if (e.name.toLowerCase().includes('teste')) {
          ejListStore.deleteEj(e.id);
        }
      });

      toast.success("Limpeza de dados de teste concluída!");
    } catch (e) {
      console.error(e);
      toast.error("Ocorreu um erro ao limpar os dados.");
    } finally {
      setIsCleaning(false);
    }
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim() || !editUrl.trim() || !editCategory.trim()) {
      toast.error("Nenhum campo pode ficar vazio.");
      return;
    }

    linksStore.update(id, {
      title: editTitle,
      url: editUrl,
      category: editCategory
    });

    setEditingId(null);
    toast.success("Link atualizado!");
  };

  const handleSaveDailyConfig = () => {
    if (!dailyConfig.startDate || !dailyConfig.endDate) {
      toast.error("Por favor preencha as datas inicial e final.");
      return;
    }
    dailyStore.saveConfig(dailyConfig);
    setIsEditingDaily(false);
    toast.success("Configurações de Dailys salvas com sucesso!");
  };

  const handleRemoveDaily = () => {
    setDeleteConfirmInfo({ type: 'daily' });
  };

  const toggleDayOfWeek = (day: number) => {
    setDailyConfig(prev => {
      const current = prev.daysOfWeek ?? [];
      const days = current.includes(day)
        ? current.filter(d => d !== day)
        : [...current, day].sort();
      return { ...prev, daysOfWeek: days };
    });
  };

  const handleAddAnnouncement = () => {
    if (!newAnnTitle.trim() || !newAnnContent.trim() || !newAnnStart || !newAnnEnd) {
      toast.error("Preencha todos os campos obrigatórios do aviso.");
      return;
    }
    
    let questionObj = undefined;
    if (newAnnHasQuestion && newAnnQuestionText.trim()) {
      questionObj = {
        text: newAnnQuestionText,
        type: newAnnQuestionType,
        options: newAnnQuestionType === 'options' ? newAnnQuestionOptions.split(',').map(s => s.trim()).filter(s => s) : undefined
      };
    }

    announcementStore.add({
      id: Date.now().toString(),
      title: newAnnTitle,
      content: newAnnContent,
      startDate: newAnnStart,
      endDate: newAnnEnd,
      icon: newAnnIcon,
      question: questionObj as any,
      responses: []
    });
    setNewAnnTitle("");
    setNewAnnContent("");
    setNewAnnStart("");
    setNewAnnEnd("");
    setNewAnnIcon("Bell");
    setNewAnnHasQuestion(false);
    setNewAnnQuestionText("");
    setNewAnnQuestionType("boolean");
    setNewAnnQuestionOptions("");
    toast.success("Aviso adicionado!");
  };

  const handleDeleteAnnouncement = (id: string) => {
    setDeleteConfirmInfo({ type: 'announcement', id });
  };

  const executeDeletion = () => {
    if (!deleteConfirmInfo) return;
    const { type, id } = deleteConfirmInfo;
    if (type === 'link' && id) {
      linksStore.remove(id);
      toast.success("Link removido.");
    } else if (type === 'daily') {
      dailyStore.removeConfig();
      toast.success("Dailys removidas.");
    } else if (type === 'announcement' && id) {
      announcementStore.remove(id);
      toast.success("Aviso removido.");
    }
    setDeleteConfirmInfo(null);
  };

  if (role === "guardian") {
    return (
      <div className="page-shell-narrow animate-fade-in">
        <div className="glass-card rounded-3xl p-10 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Área do administrador</h1>
          <p className="text-muted-foreground">
            As configurações do sistema estão disponíveis apenas no link de administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell animate-fade-in space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie os links úteis que aparecem no menu lateral.
        </p>
      </div>

      <div className="glass-card p-6 rounded-3xl mb-8 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Acesso das pessoas</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          O acesso agora é feito com login pelo Google. Quem entra pela primeira vez fica como Guardião
          (Início, Painel de EJs, Painel de Guardiões e Painel Geral só leitura). Administradores editam tudo.
        </p>
        <Button asChild className="gap-2 font-semibold min-h-[44px]">
          <Link to="/p/admin">
            <Users className="w-4 h-4" />
            Gerenciar administradores
          </Link>
        </Button>
      </div>

      <div className="glass-card p-6 rounded-3xl mb-8 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Configuração de Dailys</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Defina o período em que as Dailys estarão ativas e em quais dias da semana elas ocorrem. Isso exibirá o ícone ⚡ no calendário e avisará os usuários na página inicial.
        </p>
        
        {savedDailyConfig && isValidDate(savedDailyConfig.startDate) && isValidDate(savedDailyConfig.endDate) && !isEditingDaily ? (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center mt-4">
            <div>
              <h3 className="font-bold text-primary flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Daily Ativa
              </h3>
              <p className="text-sm text-foreground mt-1 font-medium">
                De {format(new Date(savedDailyConfig.startDate + "T12:00:00"), "dd 'de' MMM", { locale: ptBR })} até {format(new Date(savedDailyConfig.endDate + "T12:00:00"), "dd 'de' MMM", { locale: ptBR })}
              </p>
              <div className="flex gap-1 mt-2">
                {savedDailyConfig.daysOfWeek.map(d => {
                   const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
                   return <Badge key={d} variant="secondary" className="text-[10px]">{labels[d]}</Badge>;
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setIsEditingDaily(true)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-200" onClick={handleRemoveDaily}>
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Inicial</label>
                <Input 
                  type="date"
                  value={dailyConfig.startDate}
                  onChange={(e) => setDailyConfig(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Final</label>
                <Input 
                  type="date"
                  value={dailyConfig.endDate}
                  onChange={(e) => setDailyConfig(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <label className="text-sm font-medium">Dias da Semana</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 1, label: "Seg" },
                  { id: 2, label: "Ter" },
                  { id: 3, label: "Qua" },
                  { id: 4, label: "Qui" },
                  { id: 5, label: "Sex" },
                  { id: 6, label: "Sáb" },
                  { id: 0, label: "Dom" }
                ].map(day => (
                  <Button
                    key={day.id}
                    variant={(dailyConfig.daysOfWeek ?? []).includes(day.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDayOfWeek(day.id)}
                    className="w-12 h-10 font-bold"
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleSaveDailyConfig} className="min-h-[44px] gap-2">
                <Save className="w-4 h-4" />
                Salvar
              </Button>
              {savedDailyConfig && (
                <Button variant="ghost" onClick={() => setIsEditingDaily(false)} className="min-h-[44px]">
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-6 rounded-3xl mb-8 space-y-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Mensagens Globais (Pop-ups)</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Crie mensagens personalizadas para aparecerem na página inicial assim que as pessoas abrirem a plataforma. Você pode escolher um ícone e o período de exibição.
        </p>
        
        <div className="grid grid-cols-1 gap-4 p-4 bg-muted/20 border border-border/50 rounded-2xl">
          <Input 
            placeholder="Título da Mensagem" 
            value={newAnnTitle} 
            onChange={e => setNewAnnTitle(e.target.value)} 
          />
          <Textarea 
            placeholder="Conteúdo principal da mensagem..." 
            value={newAnnContent} 
            onChange={e => setNewAnnContent(e.target.value)}
            className="min-h-[80px]"
          />
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Ícone do Pop-up</label>
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Bell", icon: <Bell className="w-4 h-4" /> },
                { name: "AlertTriangle", icon: <AlertTriangle className="w-4 h-4" /> },
                { name: "Info", icon: <Info className="w-4 h-4" /> },
                { name: "PartyPopper", icon: <PartyPopper className="w-4 h-4" /> },
                { name: "Calendar", icon: <Calendar className="w-4 h-4" /> },
              ].map(ic => (
                <Button 
                  key={ic.name}
                  variant={newAnnIcon === ic.name ? "default" : "outline"}
                  onClick={() => setNewAnnIcon(ic.name)}
                  size="icon"
                  className="w-10 h-10"
                >
                  {ic.icon}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <Input 
                type="date"
                value={newAnnStart}
                onChange={(e) => setNewAnnStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <Input 
                type="date"
                value={newAnnEnd}
                onChange={(e) => setNewAnnEnd(e.target.value)}
              />
            </div>
          </div>
          
          <div className="mt-4 border-t border-border/50 pt-4">
            <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer select-none">
              <input type="checkbox" className="rounded border-primary/20 accent-primary w-4 h-4" checked={newAnnHasQuestion} onChange={e => setNewAnnHasQuestion(e.target.checked)} />
              Incluir uma pergunta ao usuário? (Opcional)
            </label>
            
            {newAnnHasQuestion && (
              <div className="mt-3 space-y-3 p-4 bg-background/50 rounded-xl border border-border/50">
                <Input placeholder="Qual é a pergunta?" value={newAnnQuestionText} onChange={e => setNewAnnQuestionText(e.target.value)} />
                <div className="flex gap-2 text-sm">
                  <Button variant={newAnnQuestionType === 'boolean' ? 'default' : 'outline'} onClick={() => setNewAnnQuestionType('boolean')} className="flex-1">Sim / Não</Button>
                  <Button variant={newAnnQuestionType === 'options' ? 'default' : 'outline'} onClick={() => setNewAnnQuestionType('options')} className="flex-1">Opções Múltiplas</Button>
                  <Button variant={newAnnQuestionType === 'text' ? 'default' : 'outline'} onClick={() => setNewAnnQuestionType('text')} className="flex-1">Texto Livre</Button>
                </div>
                {newAnnQuestionType === 'options' && (
                  <Input placeholder="Opções separadas por vírgula (ex: Maçã, Banana, Uva)" value={newAnnQuestionOptions} onChange={e => setNewAnnQuestionOptions(e.target.value)} />
                )}
              </div>
            )}
          </div>
          
          <Button onClick={handleAddAnnouncement} className="mt-4 w-full sm:w-auto self-start gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Aviso
          </Button>
        </div>

        {announcements.length > 0 && (
          <div className="space-y-3 mt-6">
            <h3 className="font-semibold text-lg">Avisos Configurados</h3>
            <div className="grid gap-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="flex justify-between items-center p-4 bg-background border border-border/50 rounded-xl shadow-sm">
                  <div>
                    <h4 className="font-bold flex items-center gap-2">
                      {ann.icon === "AlertTriangle" && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                      {ann.icon === "PartyPopper" && <PartyPopper className="w-4 h-4 text-green-500" />}
                      {ann.icon === "Info" && <Info className="w-4 h-4 text-blue-500" />}
                      {ann.icon === "Calendar" && <Calendar className="w-4 h-4 text-primary" />}
                      {ann.icon === "Bell" && <Bell className="w-4 h-4 text-orange-500" />}
                      {ann.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{ann.content}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px]">
                        De {format(new Date(ann.startDate + "T12:00:00"), "dd/MM/yy")} até {format(new Date(ann.endDate + "T12:00:00"), "dd/MM/yy")}
                      </Badge>
                      {ann.question && (
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                          Tem Pergunta ({ann.responses?.length || 0} resps)
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {ann.question && (
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowResponsesModal(ann.id)}>
                        Respostas
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => setDeleteConfirmInfo({ type: 'announcement', id: ann.id })}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-6 rounded-3xl mb-8 space-y-6">
        <h2 className="text-xl font-semibold">Adicionar Novo Link</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subtema (Categoria)</label>
            <Input 
              placeholder="Ex: Documentos" 
              value={newCategory} 
              onChange={e => setNewCategory(e.target.value)}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome do Link</label>
            <Input 
              placeholder="Ex: Planilha de Metas" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)}
              className="bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">URL</label>
            <Input 
              placeholder="https://..." 
              value={newUrl} 
              onChange={e => setNewUrl(e.target.value)}
              className="bg-background/50"
            />
          </div>
          <Button onClick={handleAddLink} className="w-full gap-2 font-semibold">
            <Plus className="w-4 h-4" />
            Adicionar Link
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Links Cadastrados</h2>
        
        {links.length === 0 ? (
          <p className="text-muted-foreground italic text-sm">Nenhum link cadastrado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {links.map(link => (
              <div key={link.id} className="glass-card p-4 rounded-2xl flex items-center justify-between gap-4">
                {editingId === link.id ? (
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder="Categoria" className="h-8 text-sm" />
                    <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Nome" className="h-8 text-sm" />
                    <Input value={editUrl} onChange={e => setEditUrl(e.target.value)} placeholder="URL" className="h-8 text-sm" />
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {link.category}
                      </span>
                    </div>
                    <p className="font-semibold truncate">{link.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {editingId === link.id ? (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(link.id)} className="text-green-500 hover:text-green-600 hover:bg-green-500/10">
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="text-muted-foreground">
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => handleStartEdit(link)} className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(link.id)} className="text-destructive hover:bg-destructive/10">
                        <Trash className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Responses Modal */}
      <Dialog open={!!showResponsesModal} onOpenChange={(open) => !open && setShowResponsesModal(null)}>
        <DialogContent className="glass-modal sm:max-w-md rounded-3xl border-primary/20 bg-background/95 backdrop-blur-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Respostas da Enquete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {showResponsesModal && announcements.find(a => a.id === showResponsesModal)?.responses?.length ? (
              <div className="space-y-4">
                {(() => {
                  const ann = announcements.find(a => a.id === showResponsesModal)!;
                  if (ann.question?.type === 'text') {
                    return ann.responses!.map((r, i) => (
                      <div key={i} className="p-3 bg-muted/30 rounded-xl text-left">
                        <p className="text-xs font-bold text-primary mb-1">{r.userEmail}</p>
                        <p className="text-sm">{r.answer}</p>
                      </div>
                    ));
                  } else {
                    const stats = ann.responses!.reduce((acc, r) => {
                      acc[r.answer] = (acc[r.answer] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);
                    return Object.entries(stats).map(([ans, count]) => (
                      <div key={ans} className="flex justify-between items-center p-3 bg-muted/30 rounded-xl text-left">
                        <span className="font-medium">{ans}</span>
                        <Badge variant="secondary" className="font-bold">{count} voto(s)</Badge>
                      </div>
                    ));
                  }
                })()}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Nenhuma resposta registrada ainda.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmInfo} onOpenChange={(open) => !open && setDeleteConfirmInfo(null)}>
        <AlertDialogContent className="glass-modal rounded-3xl border-primary/20 bg-background/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmInfo?.type === 'daily' && "Tem certeza que deseja remover as configurações de Daily? Essa ação não poderá ser desfeita."}
              {deleteConfirmInfo?.type === 'announcement' && "Tem certeza que deseja remover este aviso? Ele não aparecerá mais para os usuários."}
              {deleteConfirmInfo?.type === 'link' && "Tem certeza que deseja remover este link útil?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeletion} className="bg-red-500 text-white hover:bg-red-600 border-red-500 font-bold rounded-full px-6">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ZONA DE PERIGO / LIMPEZA */}
      <section className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 md:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Zona de Limpeza (Testes)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Para publicar a plataforma limpa, use o botão abaixo para excluir tudo que você criou com a palavra "Teste" no nome. 
            Isso vai procurar por Avisos, Eventos, EJs e Atividades e excluí-los automaticamente.
          </p>
        </div>
        
        <Button 
          variant="destructive" 
          onClick={handleCleanTestData} 
          disabled={isCleaning}
          className="w-full sm:w-auto font-bold rounded-xl"
        >
          {isCleaning ? "Limpando..." : "Limpar Dados de Teste"}
        </Button>
      </section>
    </div>
  );
}
