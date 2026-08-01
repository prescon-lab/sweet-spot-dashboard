import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listProfilesWithEmail } from "@/lib/adminUsers.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Trash2, Trophy, Users, Search, Activity, Medal, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { gamificationStore, Game, GameRule } from "@/lib/gamificationStore";
import { userActivityStore, UserActivityMap } from "@/lib/userActivityStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/p/gestao-gente")({
  head: () => ({
    meta: [{ title: "Gestão de Gente e Gamificação" }],
  }),
  component: GestaoGentePage,
});

type Person = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  guardian_name: string | null;
};

function GestaoGentePage() {
  const { isAdmin, loading: authLoading } = useAuth();
  
  const [people, setPeople] = useState<Person[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  
  const [games, setGames] = useState<Game[]>([]);
  const [activeGameId, setActiveGameId] = useState<string>("");
  
  const [newGameName, setNewGameName] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");
  const [newRulePoints, setNewRulePoints] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [tempScores, setTempScores] = useState<Record<string, number>>({});
  
  const [userActivities, setUserActivities] = useState<UserActivityMap>({});

  useEffect(() => {
    if (selectedPerson && activeGameId) {
      const scores = gamificationStore.getScoresForProfileAndGame(selectedPerson.id, activeGameId);
      const initial: Record<string, number> = {};
      scores.forEach(s => initial[s.ruleId] = s.quantity);
      setTempScores(initial);
    }
  }, [selectedPerson, activeGameId]);

  const loadStore = useCallback(() => {
    const state = gamificationStore.getState();
    setGames(state.games || []);
    if (state.games && state.games.length > 0 && !activeGameId) {
      const active = state.games.find(g => g.active) || state.games[0];
      setActiveGameId(active.id);
    }
  }, [activeGameId]);

  const loadActivities = useCallback(() => {
    setUserActivities(userActivityStore.getActivities());
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    
    loadStore();
    loadActivities();
    window.addEventListener("gamificationUpdated", loadStore);
    window.addEventListener("userActivitiesUpdated", loadActivities);
    
    const fetchProfiles = async () => {
      setLoadingProfiles(true);
      const data = await listProfilesWithEmail().catch(() => []);
      setPeople([...data].sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")) as Person[]);
      setLoadingProfiles(false);
    };
    
    fetchProfiles();
    
    return () => {
      window.removeEventListener("gamificationUpdated", loadStore);
      window.removeEventListener("userActivitiesUpdated", loadActivities);
    };
  }, [isAdmin, loadStore, loadActivities]);

  if (authLoading) return <div className="p-8 text-center">Carregando...</div>;
  
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <Trophy className="w-16 h-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Acesso Restrito</h1>
        <p className="text-muted-foreground">Você não tem permissão de Administrador para acessar o painel de Gestão de Gente.</p>
      </div>
    );
  }

  const activeGame = games.find(g => g.id === activeGameId);

  // --- Handlers ---
  const handleCreateGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return toast.error("Digite o nome do jogo");
    const game = gamificationStore.addGame(newGameName);
    setNewGameName("");
    setActiveGameId(game.id);
    toast.success("Jogo criado!");
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGameId) return toast.error("Selecione um jogo primeiro");
    if (!newRuleDesc.trim() || !newRulePoints) return toast.error("Preencha a regra e os pontos");
    
    gamificationStore.addRule(activeGameId, newRuleDesc, parseInt(newRulePoints, 10));
    setNewRuleDesc("");
    setNewRulePoints("");
    toast.success("Regra adicionada!");
  };

  const handleDeleteRule = (ruleId: string) => {
    if (!activeGameId) return;
    if (window.confirm("Deseja mesmo remover esta regra? Isso pode afetar o ranking existente.")) {
      gamificationStore.deleteRule(activeGameId, ruleId);
      toast.success("Regra removida");
    }
  };

  const filteredPeople = people.filter(p => 
    (p.full_name || p.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-shell space-y-8 animate-scale-in">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-2xl">
          <Trophy className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Gente</h1>
          <p className="text-muted-foreground">Controle de Gamificação e pontuação da equipe</p>
        </div>
      </div>

      <Tabs defaultValue="pontuacoes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="pontuacoes">Pontuações & Lista</TabsTrigger>
          <TabsTrigger value="configuracao">Configuração do Jogo</TabsTrigger>
          <TabsTrigger value="acessos">Rastreio de Acessos</TabsTrigger>
        </TabsList>

        {/* TAB PONTUAÇÕES E LISTA DE PESSOAS */}
        <TabsContent value="pontuacoes" className="space-y-6 mt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 flex-1 w-full">
              <span className="text-sm font-semibold whitespace-nowrap">Jogo Atual:</span>
              <select 
                className="flex h-10 w-full max-w-[300px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={activeGameId}
                onChange={(e) => setActiveGameId(e.target.value)}
              >
                <option value="">Selecione um jogo...</option>
                {games.map(g => (
                  <option key={g.id} value={g.id}>{g.name} {!g.active ? "(Histórico)" : ""}</option>
                ))}
              </select>
            </div>
            
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar pessoa..." 
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {!activeGame ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum jogo selecionado ou criado.</p>
                <p className="text-sm mt-2">Vá na aba "Configuração do Jogo" para criar um.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card overflow-hidden">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Membros Registrados
                </CardTitle>
                <CardDescription>Clique em um membro para lançar as pontuações no jogo <strong>{activeGame.name}</strong></CardDescription>
              </CardHeader>
              <div className="divide-y divide-border/50">
                {loadingProfiles ? (
                  <div className="p-8 text-center text-muted-foreground">Carregando lista...</div>
                ) : filteredPeople.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">Nenhuma pessoa encontrada.</div>
                ) : (
                  filteredPeople.map(person => {
                    const totalScore = gamificationStore.calculateTotalScore(person.id, activeGame.id);
                    return (
                      <div 
                        key={person.id} 
                        className="p-4 flex items-center justify-between hover:bg-muted/30 cursor-pointer transition-colors group"
                        onClick={() => setSelectedPerson(person)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                            {person.avatar_url ? (
                              <img src={person.avatar_url} alt={person.full_name || ""} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-primary">{person.full_name?.charAt(0).toUpperCase() || "?"}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{person.full_name || person.email}</p>
                            {person.guardian_name && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Guardião(ã)</Badge> 
                                {person.guardian_name}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Pontuação</p>
                            <Badge variant={totalScore > 0 ? "default" : "outline"} className={totalScore > 0 ? "bg-primary text-white" : ""}>
                              {totalScore} pts
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            Lançar
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* TAB CONFIGURAÇÃO DE JOGOS E REGRAS */}
        <TabsContent value="configuracao" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Criar / Gerenciar Jogos */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Medal className="w-4 h-4 text-primary" />
                    Criar Novo Jogo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateGame} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome do Jogo (Temporada)</label>
                      <Input 
                        placeholder="Ex: Gamificação Q3 2026" 
                        value={newGameName}
                        onChange={e => setNewGameName(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full">Criar Jogo</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Jogos Existentes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {games.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">Nenhum jogo criado.</p>
                  )}
                  {games.map(game => (
                    <div 
                      key={game.id} 
                      className={`p-3 rounded-lg border ${activeGameId === game.id ? 'border-primary bg-primary/5' : 'bg-card'} cursor-pointer hover:border-primary/50 flex flex-col gap-2`}
                      onClick={() => setActiveGameId(game.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">{game.name}</p>
                          <p className="text-xs text-muted-foreground">{game.rules.length} regras</p>
                        </div>
                        {game.active ? (
                           <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600 hover:bg-green-500/20">Ativo</Badge>
                        ) : (
                           <Badge variant="outline" className="text-[10px] bg-muted">Histórico</Badge>
                        )}
                      </div>
                      <div className="flex justify-end gap-2 border-t pt-2 mt-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-7 text-xs ${game.active ? 'text-orange-500 hover:text-orange-600' : ''}`}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            gamificationStore.toggleGameActive(game.id);
                            toast.success(game.active ? "Jogo enviado para o histórico!" : "Jogo reativado!");
                          }}
                        >
                          {game.active ? "Encerrar" : "Reativar"}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (window.confirm("Atenção: Isso excluirá o jogo e TODAS as pontuações associadas a ele permanentemente. Deseja continuar?")) {
                              gamificationStore.deleteGame(game.id);
                              if (activeGameId === game.id) setActiveGameId("");
                              toast.success("Jogo excluído permanentemente!");
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Regras do Jogo Selecionado */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="border-b bg-muted/20 pb-4">
                  <CardTitle className="text-lg">Regras do Jogo: {activeGame?.name || "Nenhum selecionado"}</CardTitle>
                  <CardDescription>Defina as ações que geram pontos e o valor de cada uma.</CardDescription>
                </CardHeader>
                
                {activeGame ? (
                  <CardContent className="p-0">
                    <div className="p-4 border-b bg-card">
                      <form onSubmit={handleAddRule} className="flex gap-3 items-end">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs font-semibold uppercase text-muted-foreground">Descrição da Regra (Ação)</label>
                          <Input 
                            placeholder="Ex: Realizou a daily no prazo" 
                            value={newRuleDesc}
                            onChange={e => setNewRuleDesc(e.target.value)}
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <label className="text-xs font-semibold uppercase text-muted-foreground">Pontos</label>
                          <Input 
                            type="number" 
                            placeholder="Ex: 50" 
                            value={newRulePoints}
                            onChange={e => setNewRulePoints(e.target.value)}
                          />
                        </div>
                        <Button type="submit"><PlusCircle className="w-4 h-4 mr-2" /> Adicionar</Button>
                      </form>
                    </div>

                    <div className="p-4">
                      {activeGame.rules.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground border border-dashed rounded-xl">
                          <Activity className="w-8 h-8 mx-auto mb-3 opacity-20" />
                          <p>Nenhuma regra cadastrada neste jogo.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activeGame.rules.map(rule => (
                            <div key={rule.id} className="flex justify-between items-center p-3 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex-1">
                                <p className="font-medium text-foreground">{rule.description}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge className="text-sm px-3 py-1 bg-green-500/10 text-green-600 border-green-500/20">+{rule.points} pts</Badge>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)} className="text-destructive hover:bg-destructive/10">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                ) : (
                  <CardContent className="p-12 text-center text-muted-foreground">
                    Selecione ou crie um jogo para configurar as regras.
                  </CardContent>
                )}
              </Card>
            </div>
            
          </div>
        </TabsContent>

        <TabsContent value="acessos" className="space-y-6 mt-6">
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Rastreio de Acessos
                </CardTitle>
                <CardDescription>Acompanhe o último acesso e a última interação de cada membro.</CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar pessoa..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <div className="divide-y divide-border/50">
              {loadingProfiles ? (
                <div className="p-8 text-center text-muted-foreground">Carregando lista...</div>
              ) : filteredPeople.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Nenhuma pessoa encontrada.</div>
              ) : (
                filteredPeople.map(person => {
                  const act = userActivities[person.id];
                  const lastLogin = act?.lastLoginAt ? new Date(act.lastLoginAt) : null;
                  const lastUpdate = act?.lastUpdateAt ? new Date(act.lastUpdateAt) : null;
                  
                  const isInactiveLogin = lastLogin ? (Date.now() - lastLogin.getTime()) > 5 * 24 * 60 * 60 * 1000 : true;
                  const isInactiveUpdate = lastUpdate ? (Date.now() - lastUpdate.getTime()) > 5 * 24 * 60 * 60 * 1000 : true;

                  return (
                    <div key={person.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {person.avatar_url ? (
                            <img src={person.avatar_url} alt={person.full_name || ""} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-primary">{person.full_name?.charAt(0).toUpperCase() || "?"}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{person.full_name || person.email}</p>
                          {person.guardian_name && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Guardião(ã)</Badge> 
                              {person.guardian_name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 sm:gap-6 sm:justify-end text-left sm:text-right mt-2 sm:mt-0">
                        <div>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Último Acesso</p>
                          {lastLogin ? (
                            <div>
                              <p className={`font-semibold ${isInactiveLogin ? 'text-red-500' : 'text-green-600'}`}>
                                {formatDistanceToNow(lastLogin, { addSuffix: true, locale: ptBR })}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{lastLogin.toLocaleString('pt-BR')}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Sem registro</p>
                          )}
                        </div>
                        
                        <div className="pl-4 border-l border-border/50">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Última Atualização</p>
                          {lastUpdate ? (
                            <div>
                              <p className={`font-semibold ${isInactiveUpdate ? 'text-orange-500' : 'text-blue-600'}`}>
                                {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ptBR })}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{lastUpdate.toLocaleString('pt-BR')}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">Sem registro</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL DE LANÇAMENTO DE PONTOS */}
      <Dialog open={!!selectedPerson} onOpenChange={(open) => !open && setSelectedPerson(null)}>
        <DialogContent className="modal-shell max-w-2xl bg-[#FAF8F5] border-border/50 shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {selectedPerson?.avatar_url ? (
                  <img src={selectedPerson.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex flex-col">
                <span>{selectedPerson?.full_name || selectedPerson?.email}</span>
                <span className="text-xs font-normal text-muted-foreground">Lançamento de Pontos - {activeGame?.name}</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {(!activeGame || activeGame.rules.length === 0) ? (
              <p className="text-center text-muted-foreground p-8">Este jogo não possui regras cadastradas.</p>
            ) : !activeGame.active ? (
              <p className="text-center text-muted-foreground p-8 bg-muted/30 rounded-xl border">
                Este jogo foi encerrado e está no histórico.<br/>Não é possível alterar as pontuações.
              </p>
            ) : (
              <div className="space-y-4">
                {activeGame.rules.map(rule => {
                  const quantity = tempScores[rule.id] || 0;
                  
                  return (
                    <div key={rule.id} className="bg-card p-4 rounded-xl border shadow-sm flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-bold text-sm">{rule.description}</p>
                        <p className="text-xs text-primary font-medium">Vale {rule.points} pts cada</p>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-muted/30 p-1.5 rounded-lg border">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-md"
                          disabled={quantity <= 0}
                          onClick={() => {
                            setTempScores(prev => ({...prev, [rule.id]: Math.max(0, quantity - 1)}));
                          }}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        
                        <Input 
                          type="number"
                          min="0"
                          className="w-16 h-8 text-center font-bold text-lg tabular-nums p-1 bg-background"
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setTempScores(prev => ({...prev, [rule.id]: isNaN(val) ? 0 : Math.max(0, val)}));
                          }}
                        />
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-green-600 hover:bg-green-600/10 hover:text-green-600 rounded-md"
                          onClick={() => {
                            setTempScores(prev => ({...prev, [rule.id]: quantity + 1}));
                          }}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="w-20 text-right shrink-0">
                        <p className="text-xs text-muted-foreground font-semibold uppercase mb-0.5">Subtotal</p>
                        <Badge className="bg-primary/10 text-primary border-primary/20">{quantity * rule.points} pts</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Total Footer */}
            <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center bg-primary/5 p-4 rounded-xl">
              <div>
                <span className="font-bold text-foreground block">Pontuação Estimada:</span>
                <span className="text-2xl font-black text-primary">
                  {activeGame ? activeGame.rules.reduce((acc, rule) => acc + (tempScores[rule.id] || 0) * rule.points, 0) : 0} pts
                </span>
              </div>
              
              {activeGame && activeGame.active && (
                <Button onClick={() => {
                  if (selectedPerson && activeGame) {
                    Object.entries(tempScores).forEach(([ruleId, quantity]) => {
                      gamificationStore.setScore(selectedPerson.id, activeGame.id, ruleId, quantity);
                    });
                    toast.success("Pontuações salvas!");
                    setSelectedPerson(null);
                  }
                }}>
                  Salvar Pontuação
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple fallback icon for modal if avatar fails or isn't there
function UserIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
