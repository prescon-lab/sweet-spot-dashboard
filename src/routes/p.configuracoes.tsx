import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { linksStore, UsefulLink } from "@/lib/linksStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash, Edit, Save, X, ShieldCheck, Users, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useAccessRole } from "@/lib/access";
import { toast } from "sonner";
import { dailyStore, DailyConfig } from "@/lib/dailyStore";

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

  useEffect(() => {
    loadLinks();
    
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
    
    window.addEventListener('linksStoreUpdated', handleUpdate);
    window.addEventListener('dailyConfigUpdated', loadDaily);
    return () => {
      window.removeEventListener('linksStoreUpdated', handleUpdate);
      window.removeEventListener('dailyConfigUpdated', loadDaily);
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
    if (confirm("Tem certeza que deseja remover este link?")) {
      linksStore.remove(id);
      toast.success("Link removido.");
    }
  };

  const handleStartEdit = (link: UsefulLink) => {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
    setEditCategory(link.category);
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
    if (confirm("Tem certeza que deseja remover as Dailys?")) {
      dailyStore.removeConfig();
      toast.success("Dailys removidas.");
    }
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
    </div>
  );
}
