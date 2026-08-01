import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, Medal, Building2, Camera, ZoomIn, ZoomOut } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { gamificationStore, GameRule } from "@/lib/gamificationStore";
import { useAuth } from "@/lib/auth";
import { ejListStore } from "@/lib/ejListStore";
import { squadStore, Squad } from "@/lib/squadStore";
import { Badge } from "@/components/ui/badge";
import Cropper from "react-easy-crop";
import { activityStore, Activity } from "@/lib/activityStore";
import { EjDetailModal } from "@/components/ejs/EjDetailModal";
import { Activity as ActivityIcon, Bell, Flame, Clock, CalendarDays } from "lucide-react";
import { isDailyDay } from "@/lib/dailyStore";
import { eventStore } from "@/lib/eventStore";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meu Perfil - Início" },
    ],
  }),
  component: Index,
});

interface ProfileData {
  id: string;
  full_name: string;
  guardian_name: string;
  avatar_url: string;
  email?: string;
}

interface RankEntry {
  profileId: string;
  totalScore: number;
  name?: string;
  avatar_url?: string;
}

function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [savingCrop, setSavingCrop] = useState(false);

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Gamification
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [activeGameId, setActiveGameId] = useState("");
  const [activeGameName, setActiveGameName] = useState("");
  const [myScore, setMyScore] = useState(0);
  const [myRankPosition, setMyRankPosition] = useState<number | null>(null);

  // Modals
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);

  // User Data
  const [myEjs, setMyEjs] = useState<any[]>([]);
  const [mySquad, setMySquad] = useState<Squad | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEjForDetail, setSelectedEjForDetail] = useState<{name: string} | null>(null);

  // Daily Notice
  const [showDailyPopup, setShowDailyPopup] = useState(false);
  const [auditCountdownDays, setAuditCountdownDays] = useState<number | null>(null);
  const [hasDailyToday, setHasDailyToday] = useState(false);

  const loadData = async () => {
    if (!user) return;

    // Fetch Profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, guardian_name, avatar_url, email")
      .eq("id", user.id)
      .single();
    if (!profileData) return;

    const p: ProfileData = {
      id: profileData.id,
      full_name: profileData.full_name || profileData.email || "Usuário",
      guardian_name: profileData.guardian_name || "",
      avatar_url: profileData.avatar_url || "",
      email: profileData.email || undefined,
    };
    setProfile(p);

    // Fetch EJs if guardian or prescon
    const isPrescon = profileData.email === "prescon@nucleovertentes" || profileData.email === "prescon@nucleovertentes.com" || profileData.email === "prescon.nucleovertentes@gmail.com";
    setIsAdmin(isPrescon);

    if (p.guardian_name || isPrescon) {
      const ejs = ejListStore.getEjs().filter((ej) => isPrescon || ej.guardian === p.guardian_name);
      setMyEjs(ejs);
      
      if (isPrescon) {
        setActivities(activityStore.getActivities());
      }

      try {
        const squads = await squadStore.getSquads();
        const squad = squads.find(
          (sq) =>
            sq.squad_members?.some((m: any) => m.guardian_name === p.guardian_name) ||
            sq.leader === p.guardian_name
        );
        setMySquad(squad || null);
      } catch (e) {
        console.error(e);
      }
    }

    // Fetch Gamification
    const state = gamificationStore.getState();
    const activeGame = state.games?.find((g) => g.active);
    if (activeGame) {
      setActiveGameName(activeGame.name);
      setActiveGameId(activeGame.id);
      const score = gamificationStore.calculateTotalScore(user.id, activeGame.id);
      setMyScore(score);

      const rank = gamificationStore.getRanking(activeGame.id);
      if (rank.length > 0) {
        const profileIds = rank.map((r) => r.profileId);
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .in("id", profileIds);

        if (data) {
          const enrichedRank: RankEntry[] = rank.map((r) => {
            const u = data.find((d) => d.id === r.profileId);
            return {
              ...r,
              name: u?.full_name || u?.email || "Usuário",
              avatar_url: u?.avatar_url ?? undefined,
            };
          });
          setRanking(enrichedRank);

          const myPos = enrichedRank.findIndex((r) => r.profileId === user.id);
          setMyRankPosition(myPos >= 0 ? myPos + 1 : null);
        } else {
          setRanking(rank);
          const myPos = rank.findIndex((r) => r.profileId === user.id);
          setMyRankPosition(myPos >= 0 ? myPos + 1 : null);
        }
      } else {
        setRanking([]);
        setMyRankPosition(null);
      }
    } else {
      setRanking([]);
      setActiveGameName("");
      setActiveGameId("");
      setMyScore(0);
      setMyRankPosition(null);
    }

    // Check Daily
    const isDaily = isDailyDay(new Date());
    setHasDailyToday(isDaily);

    // Calculate Audit Countdown
    const events = eventStore.getEvents();
    const activeEvent = events.find(e => e.status !== "completed");
    if (activeEvent?.auditDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const auditDate = new Date(activeEvent.auditDate + "T23:59:59");
      const diffTime = auditDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setAuditCountdownDays(diffDays >= 0 ? diffDays : null);
    } else {
      setAuditCountdownDays(null);
    }

    // Popup logic
    if (isDaily) {
      const todayStr = new Date().toLocaleDateString("pt-BR");
      const lastSeen = localStorage.getItem("lastDailyPopupDate");
      if (lastSeen !== todayStr) {
        setShowDailyPopup(true);
        localStorage.setItem("lastDailyPopupDate", todayStr);
      }
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener("gamificationUpdated", loadData);
    window.addEventListener("dailyConfigUpdated", loadData);
    const handleActivitiesUpdated = () => {
      if (isAdmin) setActivities(activityStore.getActivities());
    };
    window.addEventListener("activitiesUpdated", handleActivitiesUpdated);

    return () => {
      window.removeEventListener("gamificationUpdated", loadData);
      window.removeEventListener("dailyConfigUpdated", loadData);
      window.removeEventListener("activitiesUpdated", handleActivitiesUpdated);
    };
  }, [user, isAdmin]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempImageUrl(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  const handleSaveCrop = async () => {
    if (!tempImageUrl || !croppedAreaPixels || !user) return;
    setSavingCrop(true);
    try {
      const img = new Image();
      img.src = tempImageUrl;
      await new Promise((res) => (img.onload = res));
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
        0, 0, 256, 256
      );
      const compressed = canvas.toDataURL("image/jpeg", 0.85);
      const { error } = await supabase.from("profiles").update({ avatar_url: compressed }).eq("id", user.id);
      if (error) {
        toast.error("Erro ao salvar a foto.");
      } else {
        toast.success("Foto de perfil atualizada!");
        setProfile((prev) => prev ? { ...prev, avatar_url: compressed } : prev);
        setCropModalOpen(false);
        setTempImageUrl(null);
      }
    } finally {
      setSavingCrop(false);
    }
  };

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

  // Score details for modal
  const state = gamificationStore.getState();
  const activeGame = state.games?.find((g) => g.id === activeGameId);
  const myScoreRecords = activeGameId ? gamificationStore.getScoresForProfileAndGame(user.id, activeGameId) : [];

  const RankingList = ({ items }: { items: RankEntry[] }) => (
    <div className="divide-y divide-border/50">
      {items.map((r, idx) => {
        const isMe = r.profileId === profile.id;
        return (
          <div
            key={r.profileId}
            className={`p-3 flex items-center gap-3 ${isMe ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-muted/30"}`}
          >
            <div className="w-7 text-center font-bold text-muted-foreground flex items-center justify-center shrink-0">
              {idx === 0 ? <Medal className="w-5 h-5 text-yellow-500" /> :
               idx === 1 ? <Medal className="w-5 h-5 text-gray-400" /> :
               idx === 2 ? <Medal className="w-5 h-5 text-amber-700" /> :
               <span className="text-sm">{idx + 1}º</span>}
            </div>
            <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center shrink-0 overflow-hidden border">
              {r.avatar_url ? (
                <img src={r.avatar_url} alt={r.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-xs text-primary">{r.name?.charAt(0).toUpperCase() || "?"}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${isMe ? "font-bold" : "font-medium"}`}>{r.name}</p>
            </div>
            <div className="text-right">
              <span className={`text-sm font-bold ${isMe ? "text-primary" : "text-foreground"}`}>{r.totalScore} pts</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="page-shell space-y-8 animate-scale-in">
      {/* Hidden file input for avatar */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

      {/* Header Profile */}
      <div className="flex flex-col items-center gap-6 bg-card p-6 md:p-8 rounded-3xl border shadow-sm">
        {/* Avatar with edit */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-4 border-background shadow-lg">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-primary">{profile.full_name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs gap-1"
          >
            <Camera className="w-5 h-5" />
            <span>Editar</span>
          </button>
        </div>

        {/* Name + Badges — centered */}
        <div className="flex-1 space-y-2 text-center w-full">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{profile.full_name}</h1>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {profile.guardian_name && (
              <Badge variant="secondary" className="px-3 py-1 text-sm bg-blue-500/10 text-blue-600 border-none">
                Guardião(ã): {profile.guardian_name}
              </Badge>
            )}
            {mySquad && (
              <Badge
                variant="secondary"
                className="px-3 py-1 text-sm border-none"
                style={{
                  backgroundColor: mySquad.color ? `${mySquad.color}20` : "rgba(0,0,0,0.1)",
                  color: mySquad.color || "inherit",
                }}
              >
                Squad: {mySquad.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Recados e Informações Importantes */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Recados Importantes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hasDailyToday && (
                <Card className="bg-orange-500/10 border-orange-500/20">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                      <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-bold text-orange-700 dark:text-orange-400">Hoje tem Daily!</p>
                      <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
                        Momento de aceleração. Mantenha as EJs engajadas.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {auditCountdownDays !== null && (
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-bold text-red-700 dark:text-red-400">Fim das Auditorias</p>
                      <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
                        {auditCountdownDays === 0 ? "O prazo termina HOJE!" : `Faltam ${auditCountdownDays} dias para o encerramento.`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {!hasDailyToday && auditCountdownDays === null && (
                <Card className="bg-muted/30 border-dashed sm:col-span-2">
                  <CardContent className="p-6 text-center text-muted-foreground text-sm">
                    Nenhum recado importante no momento.
                  </CardContent>
                </Card>
              )}
            </div>
          </section>

          {/* Minhas EJs / Notificações Gerais */}
          {(profile.guardian_name || isAdmin) && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {isAdmin ? <Bell className="w-5 h-5 text-primary" /> : <Building2 className="w-5 h-5 text-primary" />}
                {isAdmin ? "Notificações Recentes" : "Minhas EJs"}
              </h2>
              {isAdmin ? (
                activities.length === 0 ? (
                  <Card className="bg-muted/30 border-dashed">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <p>Nenhuma notificação recente registrada.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2">
                    {activities.map((activity) => (
                      <div 
                        key={activity.id} 
                        className="bg-card hover:bg-muted/50 p-4 rounded-xl border border-border/50 cursor-pointer transition-colors shadow-sm flex flex-col gap-2"
                        onClick={() => { setSelectedEjForDetail({ name: activity.ejName }); setDetailModalOpen(true); }}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-sm text-primary flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5" />
                            {activity.ejName}
                          </span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {new Date(activity.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90">{activity.description}</p>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                myEjs.length === 0 ? (
                  <Card className="bg-muted/30 border-dashed">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <p>Você não é guardião(ã) de nenhuma EJ atualmente.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {myEjs.map((ej) => (
                      <Card
                        key={ej.id}
                        className="cursor-pointer hover:border-primary/50 transition-colors group"
                        onClick={() => navigate({ to: "/p/ejs" })}
                      >
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
                )
              )}
            </section>
          )}
        </div>

        {/* Sidebar — Points + Ranking */}
        <div className="space-y-4">
          {/* Points Card */}
          {activeGameName && (
            <button
              onClick={() => setShowScoreModal(true)}
              className="w-full text-center bg-primary/5 hover:bg-primary/10 transition-colors p-5 rounded-2xl border border-primary/20 cursor-pointer group"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Meus Pontos</p>
              <div className="flex items-center justify-center gap-2 text-primary">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="text-4xl font-black">{myScore}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{activeGameName}</p>
              {myRankPosition && (
                <p className="text-xs text-primary font-semibold mt-1">
                  🏅 #{myRankPosition} no ranking
                </p>
              )}
              <p className="text-xs text-muted-foreground group-hover:text-primary mt-2 transition-colors">Clique para ver detalhes →</p>
            </button>
          )}

          {/* Ranking Card */}
          {activeGameName && ranking.length > 0 && (
            <Card
              className="glass-card border-primary/20 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setShowRankingModal(true)}
            >
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Ranking Geral
                </CardTitle>
                <CardDescription className="text-xs">
                  Top 5 da temporada {activeGameName} · Clique para ver tudo
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <RankingList items={ranking.slice(0, 5)} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal: Score Breakdown */}
      <Dialog open={showScoreModal} onOpenChange={setShowScoreModal}>
        <DialogContent className="modal-shell max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Detalhamento de Pontos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Temporada: <strong>{activeGameName}</strong></p>
            {myScoreRecords.length === 0 ? (
              <p className="text-center text-muted-foreground p-6">Nenhuma pontuação registrada ainda.</p>
            ) : (
              <div className="space-y-2">
                {myScoreRecords.map((rec) => {
                  const rule = activeGame?.rules.find((r: GameRule) => r.id === rec.ruleId);
                  if (!rule) return null;
                  const subtotal = rule.points * rec.quantity;
                  return (
                    <div key={rec.id} className="flex items-center justify-between bg-muted/30 p-3 rounded-xl">
                      <div>
                        <p className="font-semibold text-sm">{rule.description}</p>
                        <p className="text-xs text-muted-foreground">{rec.quantity}x × {rule.points} pts cada</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-primary/20 font-bold">
                        {subtotal} pts
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-bold">Total</span>
              <span className="text-2xl font-black text-primary">{myScore} pts</span>
            </div>
            {myRankPosition && (
              <p className="text-center text-sm font-semibold text-primary">
                🏅 Você está em <span className="font-black text-lg">#{myRankPosition}</span> no ranking!
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Full Ranking */}
      <Dialog open={showRankingModal} onOpenChange={setShowRankingModal}>
        <DialogContent className="modal-shell max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Ranking Geral — {activeGameName}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto -mx-1 px-1">
            <RankingList items={ranking} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Crop Avatar */}
      <Dialog open={cropModalOpen} onOpenChange={(open) => { if (!open) { setCropModalOpen(false); setTempImageUrl(null); } }}>
        <DialogContent className="modal-shell max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              Ajustar Foto de Perfil
            </DialogTitle>
          </DialogHeader>

          {/* Cropper Area */}
          <div className="relative w-full h-72 bg-muted rounded-2xl overflow-hidden">
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

          {/* Zoom control */}
          <div className="flex items-center gap-3 mt-2">
            <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
          <p className="text-xs text-center text-muted-foreground -mt-1">Arraste para reposicionar · Use o controle para dar zoom</p>

          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => { setCropModalOpen(false); setTempImageUrl(null); }}>
              Cancelar
            </Button>
            <Button className="flex-1" disabled={savingCrop} onClick={handleSaveCrop}>
              {savingCrop ? "Salvando..." : "Salvar Foto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Modal for Admin */}
      <EjDetailModal 
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        ejData={selectedEjForDetail}
      />

      {/* Daily Popup */}
      <AlertDialog open={showDailyPopup} onOpenChange={setShowDailyPopup}>
        <AlertDialogContent className="max-w-md rounded-3xl border-orange-500/20 bg-card">
          <AlertDialogHeader>
            <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mb-4">
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
            <AlertDialogTitle className="text-center text-2xl font-bold text-foreground">
              HOJE TEM DAILY! ⚡
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base mt-2">
              É dia de aceleração com as EJs! Atualize os progressos e mantenha a energia em alta.
              {auditCountdownDays !== null && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="font-bold text-red-700 dark:text-red-400 flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5" />
                    Prazo de Auditoria
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    {auditCountdownDays === 0 ? "O prazo termina HOJE!" : `Faltam apenas ${auditCountdownDays} dias para o encerramento.`}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-6">
            <AlertDialogAction onClick={() => setShowDailyPopup(false)} className="w-full sm:w-auto font-bold px-8">
              Vamos lá!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
