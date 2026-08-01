import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useDirtyGuard } from "@/hooks/useDirtyGuard";
import { Briefcase, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { leadStore, Lead, LeadStatus } from "@/lib/leadStore";

interface EjLeadFunnelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ejId: string;
}

export function EjLeadFunnelModal({ open, onOpenChange, ejId }: EjLeadFunnelModalProps) {
  const dirtyGuard = useDirtyGuard(open);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<LeadStatus>("morno");
  const [closingDate, setClosingDate] = useState("");
  const [obs, setObs] = useState("");

  useEffect(() => {
    if (open && ejId) {
      setLeads(leadStore.getLeadsByEj(ejId));
    }
    const handleUpdate = () => {
      if (ejId) setLeads(leadStore.getLeadsByEj(ejId));
    };
    window.addEventListener('leadsUpdated', handleUpdate);
    return () => window.removeEventListener('leadsUpdated', handleUpdate);
  }, [open, ejId]);

  const handleSave = () => {
    if (!name.trim()) return;
    const numValue = parseFloat(value.replace(/[^0-9,-]+/g,"").replace(",", "."));
    
    leadStore.addLead({
      id: Date.now().toString(),
      ejId,
      name,
      expectedValue: isNaN(numValue) ? 0 : numValue,
      status,
      closingDate,
      observations: obs,
      createdAt: new Date().toISOString()
    });
    
    setIsAdding(false);
    setName("");
    setValue("");
    setStatus("morno");
    setClosingDate("");
    setObs("");
    dirtyGuard.markClean();
  };

  const handleDelete = (id: string) => {
    leadStore.deleteLead(id);
  };

  const handleMarkAsClosed = (lead: Lead) => {
    leadStore.updateLead({ ...lead, status: 'fechado' });
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'quente': return 'bg-red-500 text-white';
      case 'morno': return 'bg-orange-500 text-white';
      case 'frio': return 'bg-blue-500 text-white';
      case 'fechado': return 'bg-green-600 text-white';
      default: return 'bg-gray-200';
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <Dialog open={open} onOpenChange={dirtyGuard.guardOpenChange(onOpenChange)}>
      <DialogContent {...dirtyGuard.containerProps} className="modal-shell max-w-4xl glass-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 text-xl">
            <div className="flex items-center gap-2">
              <Briefcase className="text-primary w-5 h-5" />
              Funil de Vendas e Leads ({ejId})
            </div>
            {!isAdding && (
              <Button size="sm" onClick={() => setIsAdding(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Adicionar Lead
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 max-h-[70vh] overflow-auto">
          {isAdding && (
            <div className="bg-muted/30 p-6 rounded-xl border border-border/50 space-y-4 mb-6">
              <h3 className="font-semibold text-lg">Novo Lead</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome do Lead</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Empresa X" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Provável (R$)</label>
                  <Input value={value} onChange={e => setValue(e.target.value)} placeholder="Ex: 10000,00" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Situação</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={status} 
                    onChange={e => setStatus(e.target.value as LeadStatus)}
                  >
                    <option value="quente">Quente</option>
                    <option value="morno">Morno</option>
                    <option value="frio">Frio</option>
                    <option value="fechado">Fechado (Contrato Assinado)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Previsão de Fechamento</label>
                  <Input type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <Textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Detalhes da negociação..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => {
                  setIsAdding(false);
                  dirtyGuard.markClean();
                }}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar Lead</Button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {leads.length === 0 && !isAdding ? (
              <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg">
                Nenhum lead cadastrado.
              </div>
            ) : (
              leads.map(lead => (
                <div key={lead.id} className="bg-card p-4 rounded-lg border shadow-sm flex items-center justify-between gap-4">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="font-semibold">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.observations || 'Sem observações'}</p>
                    </div>
                    <div>
                      <p className="font-bold text-primary">{formatCurrency(lead.expectedValue)}</p>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="text-muted-foreground">Vence: </span>
                        {lead.closingDate ? new Date(lead.closingDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {lead.status !== 'fechado' && (
                      <Button variant="ghost" size="icon" onClick={() => handleMarkAsClosed(lead)} className="text-green-600 hover:text-green-700 hover:bg-green-50" title="Marcar como Fechado">
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50" title="Excluir Lead">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
