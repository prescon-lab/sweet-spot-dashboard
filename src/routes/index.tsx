import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Bell, Building2, Users as UsersIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { gamificationStore } from "@/lib/gamificationStore";
import { useAuth } from "@/lib/auth";
import { ejListStore } from "@/lib/ejListStore";
import { mentionStore, Mention } from "@/lib/mentionStore";
import { squadStore, Squad } from "@/lib/squadStore";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meu Perfil - Início" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<{ id: string; full_name: string; guardian_name: string; avatar_url: string } | null>(null);
  
  // Gamification
  const [ranking, setRanking] = useState<{ profileId: string; totalScore: number; name?: string; avatar_url?: string }[]>([]);
  const [activeGameName, setActiveGameName] = useState("");
  const [myScore, setMyScore] = useState(0);

  // User Data
  const [myEjs, setMyEjs] = useState<any[]>([]);
  const [myMentions, setMyMentions] = useState<Mention[]>([]);
  const [mySquad, setMySquad] = useState<Squad | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      // Fetch Profile
      const { data: profileData } = await supabase.from("profiles").select("id, full_name, guardian_name, avatar_url, email").eq("id", user.id).single();
      if (!profileData) return;
      
      const p = {
        id: profileData.id,
        full_name: profileData.full_name || profileData.email || "Usuário",
        guardian_name: profileData.guardian_name || "",
        avatar_url: profileData.avatar_url || ""
      };
      setProfile(p);

      // Fetch EJs
      if (p.guardian_name) {
        const ejs = ejListStore.getEjs().filter(ej => ej.guardian === p.guardian_name);
        setMyEjs(ejs);
        
        // Fetch Squads
        try {
          const squads = await squadStore.getSquads();
          const squad = squads.find(sq => sq.squad_members?.some((m: any) => m.guardian_name === p.guardian_name) || sq.leader === p.guardian_name);
          setMySquad(squad || null);
        } catch (e) {
          console.error(e);
        }

        // Fetch Mentions
        const mentions = mentionStore.getMentions().filter(m => !m.read && m.guardianName === p.guardian_name);
        setMyMentions(mentions);
      }

      // Fetch Gamification
      const state = gamificationStore.getState();
      const activeGame = state.games?.find(g => g.active);
      if (activeGame) {
        setActiveGameName(activeGame.name);
        setMyScore(gamificationStore.calculateTotalScore(user.id, activeGame.id));
        
        const rank = gamificationStore.getRanking(activeGame.id);
        if (rank.length > 0) {
          const profileIds = rank.map(r => r.profileId);
          const { data } = await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", profileIds);
          
          if (data) {
            const enrichedRank = rank.map(r => {
              const u = data.find(d => d.id === r.profileId);
              return {
                ...r,
                name: u?.full_name || u?.email || "Usuário",
                avatar_url: u?.avatar_url
              };
            });
            setRanking(enrichedRank);
          } else {
            setRanking(rank);
          }
        }
      } else {
        setRanking([]);
        setActiveGameName("");
        setMyScore(0);
      }
    };
    
    loadData();
    window.addEventListener("gamificationUpdated", loadData);
    return () => window.removeEventListener("gamificationUpdated", loadData);
  }, [user]);

  if (!user || !profile) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <div className="text-center space-y-4 animate-scale-in">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bem-vindo(a)</h1>
          <p className="text-muted-foreground">Carregando o seu perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-scale-in">
      
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-card p-6 md:p-8 rounded-3xl border shadow-sm">
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border-4 border-background shadow-lg">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-bold text-primary">{profile.full_name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        
        <div className="text-center md:text-left flex-1 space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{profile.full_name}</h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            {profile.guardian_name ? (
              <Badge variant="secondary" className="px-3 py-1 text-sm bg-blue-500/10 text-blue-600 border-none">
                Guardião(ã): {profile.guardian_name}
              </Badge>
            ) : (
              <Badge variant="outline" className="px-3 py-1 text-sm">Membro da Rede</Badge>
            )}
            
            {mySquad && (
              <Badge variant="secondary" className="px-3 py-1 text-sm border-none" style={{ backgroundColor: mySquad.color ? `${mySquad.color}20` : 'rgba(0,0,0,0.1)', color: mySquad.color || 'inherit' }}>
                Squad: {mySquad.name}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="text-center md:text-right bg-primary/5 p-4 rounded-2xl border border-primary/20 min-w-[200px]">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Meus Pontos</p>
          <div className="flex items-center justify-center md:justify-end gap-2 text-primary">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span className="text-4xl font-black">{myScore}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{activeGameName || "Nenhum jogo ativo"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          {/* Notificações / Menções */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notificações e Menções
              {myMentions.length > 0 && (
                <Badge className="bg-red-500 hover:bg-red-600 text-white border-none ml-2">{myMentions.length}</Badge>
              )}
            </h2>
            
            {myMentions.length === 0 ? (
              <Card className="bg-muted/30 border-dashed">
                <CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center">
                  <CheckCircle2 className="w-8 h-8 mb-3 opacity-30" />
                  <p>Tudo limpo! Nenhuma menção pendente no momento.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myMentions.map(mention => (
                  <Card key={mention.id} className="border-l-4 border-l-primary cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                    mentionStore.markAsRead(mention.id);
                    setMyMentions(prev => prev.filter(m => m.id !== mention.id));
                    navigate({ to: "/p/dashboard" });
                  }}>
                    <CardContent className="p-4 flex gap-4">
                      <div className="bg-primary/10 p-2 rounded-full shrink-0 h-fit">
                        <AlertCircle className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold mb-1">Mencionado em <span className="text-primary">{mention.ejName}</span></p>
                        <p className="text-xs text-muted-foreground mb-2">{new Date(mention.date).toLocaleString('pt-BR')} via {mention.source}</p>
                        <p className="text-sm bg-muted p-2 rounded-md italic">"{mention.contextText}"</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Minhas EJs */}
          {profile.guardian_name && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Minhas EJs
              </h2>
              
              {myEjs.length === 0 ? (
                <Card className="bg-muted/30 border-dashed">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <p>Você não é guardião(ã) de nenhuma EJ atualmente.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myEjs.map(ej => (
                    <Card key={ej.id} className="cursor-pointer hover:border-primary/50 transition-colors group" onClick={() => navigate({ to: "/p/ejs" })}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold shrink-0">
                          {ej.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold group-hover:text-primary transition-colors">{ej.name}</p>
                          <p className="text-xs text-muted-foreground">{ej.cluster || "Sem cluster"}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          
          {/* Gamification Ranking Widget */}
          {activeGameName && ranking.length > 0 && (
            <Card className="glass-card border-primary/20">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Ranking Geral
                </CardTitle>
                <CardDescription className="text-xs">Top 10 da temporada {activeGameName}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {ranking.slice(0, 10).map((r, idx) => {
                    const isMe = r.profileId === profile.id;
                    return (
                      <div key={r.profileId} className={`p-3 flex items-center gap-3 ${isMe ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/30'}`}>
                        <div className="w-6 text-center font-bold text-muted-foreground flex items-center justify-center">
                          {idx === 0 ? <Medal className="w-4 h-4 text-yellow-500" /> : 
                           idx === 1 ? <Medal className="w-4 h-4 text-gray-400" /> : 
                           idx === 2 ? <Medal className="w-4 h-4 text-amber-700" /> : 
                           <span className="text-xs">{idx + 1}º</span>}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 overflow-hidden border">
                          {r.avatar_url ? (
                            <img src={r.avatar_url} alt={r.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-xs text-primary">{r.name?.charAt(0).toUpperCase() || "?"}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isMe ? 'font-bold' : 'font-medium'}`}>{r.name}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm ${isMe ? 'font-bold text-primary' : 'font-semibold'}`}>{r.totalScore}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
