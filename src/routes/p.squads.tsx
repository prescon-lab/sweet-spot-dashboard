import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { squadStore } from "@/lib/squadStore";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ejListStore } from "@/lib/ejListStore";
import { SquadDetailModal } from "@/components/squads/SquadDetailModal";
import { Squad } from "@/lib/squadStore";

export const Route = createFileRoute("/p/squads")({
  component: SquadsPage,
});

function SquadsPage() {
  const queryClient = useQueryClient();
  const [newSquadName, setNewSquadName] = useState("");
  const [newSquadLeader, setNewSquadLeader] = useState("");
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const guardians = ejListStore.getUniqueGuardians();

  const { data: squads = [], isLoading } = useQuery({
    queryKey: ["squads"],
    queryFn: squadStore.getSquads,
  });

  const createSquadMutation = useMutation({
    mutationFn: async () => {
      return squadStore.addSquad(newSquadName, newSquadLeader);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["squads"] });
      setNewSquadName("");
      setNewSquadLeader("");
      toast.success("Squad criado com sucesso!");
    },
    onError: (err) => {
      toast.error("Erro ao criar squad: " + err.message);
    }
  });

  const deleteSquadMutation = useMutation({
    mutationFn: (id: string) => squadStore.deleteSquad(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["squads"] });
      toast.success("Squad removido com sucesso!");
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ squadId, guardianName }: { squadId: string, guardianName: string }) => 
      squadStore.addMember(squadId, guardianName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["squads"] });
      toast.success("Membro adicionado!");
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ squadId, guardianName }: { squadId: string, guardianName: string }) => 
      squadStore.removeMember(squadId, guardianName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["squads"] });
      toast.success("Membro removido!");
    }
  });

  const handleCreateSquad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSquadName || !newSquadLeader) {
      toast.error("Preencha o nome e o líder do squad");
      return;
    }
    createSquadMutation.mutate();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Squads</h1>
          <p className="text-muted-foreground mt-1">Crie e gerencie as equipes de guardiões</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo Squad</CardTitle>
          <CardDescription>Crie um novo squad atribuindo um nome e um líder.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSquad} className="flex gap-4 items-end">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Nome do Squad</label>
              <Input 
                value={newSquadName}
                onChange={(e) => setNewSquadName(e.target.value)}
                placeholder="Ex: Squad Alfa"
              />
            </div>
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Líder do Squad</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newSquadLeader}
                onChange={(e) => setNewSquadLeader(e.target.value)}
              >
                <option value="">Selecione um líder</option>
                {guardians.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={createSquadMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Squad
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center p-8">Carregando squads...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {squads.map(squad => (
            <Card 
              key={squad.id} 
              className="flex flex-col hover:border-primary/50 transition-colors cursor-pointer"
              onClick={(e) => {
                // Ignore clicks on buttons/selects inside the card
                const target = e.target as HTMLElement;
                if (target.tagName === 'BUTTON' || target.tagName === 'SELECT' || target.closest('button') || target.closest('select')) {
                  return;
                }
                setSelectedSquad(squad);
                setDetailModalOpen(true);
              }}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      {squad.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Líder: <strong className="text-foreground">{squad.leader}</strong>
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (window.confirm("Deseja mesmo remover este squad?")) {
                        deleteSquadMutation.mutate(squad.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Membros ({squad.squad_members?.length || 0})</h4>
                  <ul className="space-y-2">
                    {squad.squad_members?.map(member => (
                      <li key={member.guardian_name} className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded-md">
                        {member.guardian_name}
                        <button 
                          onClick={() => removeMemberMutation.mutate({ squadId: squad.id, guardianName: member.guardian_name })}
                          className="text-destructive text-xs hover:underline"
                        >
                          Remover
                        </button>
                      </li>
                    ))}
                    {(!squad.squad_members || squad.squad_members.length === 0) && (
                      <li className="text-sm text-muted-foreground italic">Nenhum membro adicionado</li>
                    )}
                  </ul>
                </div>
                
                <div className="mt-auto pt-4 flex gap-2">
                  <select 
                    id={`add-member-${squad.id}`}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background"
                  >
                    <option value="">Adicionar membro...</option>
                    {guardians
                      .filter(g => !squad.squad_members?.find(m => m.guardian_name === g) && g !== squad.leader)
                      .map(g => (
                        <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      const select = document.getElementById(`add-member-${squad.id}`) as HTMLSelectElement;
                      if (select.value) {
                        addMemberMutation.mutate({ squadId: squad.id, guardianName: select.value });
                        select.value = "";
                      }
                    }}
                  >
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {squads.length === 0 && (
            <div className="col-span-full text-center p-12 bg-muted/20 rounded-xl border border-dashed">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-muted-foreground">Nenhum squad cadastrado</h3>
              <p className="text-sm text-muted-foreground mt-1">Crie um squad acima para começar.</p>
            </div>
          )}
        </div>
      )}

      <SquadDetailModal 
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        squad={selectedSquad}
      />
    </div>
  );
}
