import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, Send } from "lucide-react";
import { guardianStore } from "@/lib/guardianStore";

export const Route = createFileRoute("/p/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [type, setType] = useState<"daily" | "prescon">("daily");

  const guardiansList = Object.keys(guardianStore.getAll());

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["daily_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_reports")
        .select(`*, profiles(full_name, guardian_name, avatar_url)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const sendReport = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      
      const { data: report, error } = await supabase
        .from("daily_reports")
        .insert({ author_id: user.id, content, type })
        .select()
        .single();
        
      if (error) throw error;

      // Extract mentions (e.g. @João)
      const mentions = content.match(/@([\w\u00C0-\u00FF\s]+)/g);
      if (mentions) {
        for (const mention of mentions) {
          const name = mention.substring(1).trim();
          // Find if this name matches any guardian
          if (guardiansList.includes(name)) {
            // Find user id for this guardian
            const { data: profile } = await supabase.from('profiles').select('id').eq('guardian_name', name).maybeSingle();
            if (profile && profile.id) {
              await supabase.from('notifications').insert({
                user_id: profile.id,
                title: 'Você foi mencionado!',
                content: `Você foi mencionado em uma saída de ${type === 'daily' ? 'Daily' : 'Prescon'}.`,
                type: 'mention'
              });
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily_reports"] });
      setContent("");
      toast.success("Publicado com sucesso!");
    },
    onError: (err) => {
      toast.error("Erro ao publicar: " + err.message);
    }
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Diário e Saídas</h1>
        <p className="text-muted-foreground mt-1">Registre as saídas de Dailys e Prescon, e mencione outros guardiões usando @Nome</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <Button 
                variant={type === "daily" ? "default" : "outline"}
                onClick={() => setType("daily")}
              >
                Saída de Daily
              </Button>
              <Button 
                variant={type === "prescon" ? "default" : "outline"}
                onClick={() => setType("prescon")}
              >
                Saída de Prescon
              </Button>
            </div>
            
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva sua saída aqui... Use @NomeDoGuardião para mencionar alguém."
              className="min-h-[100px] resize-none"
            />
            
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  if (content.trim()) sendReport.mutate();
                }}
                disabled={sendReport.isPending || !content.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                Publicar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Últimas Saídas
        </h3>
        
        {isLoading ? (
          <div className="text-center p-8">Carregando...</div>
        ) : (
          reports.map((report: any) => (
            <Card key={report.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      {report.profiles?.avatar_url ? (
                        <img src={report.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        report.profiles?.full_name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">{report.profiles?.full_name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {report.profiles?.guardian_name && <span className="font-semibold text-primary">{report.profiles.guardian_name}</span>}
                        {' • '}
                        {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${report.type === 'daily' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {report.type === 'daily' ? 'Daily' : 'Prescon'}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap">{report.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
