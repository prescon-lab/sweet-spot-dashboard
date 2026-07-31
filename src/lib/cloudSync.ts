import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Mapeia chaves do localStorage que devem ser sincronizadas
const SYNC_KEYS = [
  "vertentes_ej_list",
  "sweet_spot_events",
  "sweet_spot_leads",
  "vertentes_guardian_customizations",
  "sweet_spot_mentions"
];

let isSyncing = false;
let subscription: any = null;

export async function initCloudSync() {
  if (isSyncing) return;
  isSyncing = true;

  // 1. Carregar do Supabase (prioridade inicial)
    const { data, error } = await supabase.from('app_data').select('*');
    if (error) {
      console.error("Erro Supabase (select):", error);
      return;
    }
    if (data) {
      let hasUpdates = false;
      data.forEach((row) => {
        if (SYNC_KEYS.includes(row.key)) {
          const localData = localStorage.getItem(row.key);
          const remoteDataStr = JSON.stringify(row.data);
          // Se for diferente, sobrepõe o local
          if (localData !== remoteDataStr) {
            localStorage.setItem(row.key, remoteDataStr);
            hasUpdates = true;
          }
        }
      });
      
      if (hasUpdates) {
        window.dispatchEvent(new Event("ejListUpdated"));
        window.dispatchEvent(new Event("eventsUpdated"));
        window.dispatchEvent(new Event("leadsUpdated"));
        window.dispatchEvent(new Event("guardianStoreUpdated"));
        window.dispatchEvent(new Event("mentionsUpdated"));
      }
    }
  } catch (e) {
    console.error("Erro na sincronização inicial", e);
  }

  // 2. Escutar mudanças remotas no Supabase (Realtime)
  subscription = supabase.channel('app_data_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_data' }, (payload) => {
      const row = payload.new as any;
      if (row && row.key && SYNC_KEYS.includes(row.key)) {
        const remoteDataStr = JSON.stringify(row.data);
        const localData = localStorage.getItem(row.key);
        
        if (localData !== remoteDataStr) {
          localStorage.setItem(row.key, remoteDataStr);
          
          // Dispara eventos específicos para atualizar a UI
          if (row.key === "vertentes_ej_list") window.dispatchEvent(new Event("ejListUpdated"));
          if (row.key === "sweet_spot_events") window.dispatchEvent(new Event("eventsUpdated"));
          if (row.key === "sweet_spot_leads") window.dispatchEvent(new Event("leadsUpdated"));
          if (row.key === "vertentes_guardian_customizations") window.dispatchEvent(new Event("guardianStoreUpdated"));
          if (row.key === "sweet_spot_mentions") window.dispatchEvent(new Event("mentionsUpdated"));
        }
      }
    })
    .subscribe();
}

// Intercepta qualquer salvamento local e empurra pro banco
export async function syncToCloud(key: string, data: any) {
  if (!SYNC_KEYS.includes(key)) return;
  
  try {
    const { error } = await supabase.from('app_data').upsert({ 
      key, 
      data, 
      updated_at: new Date().toISOString() 
    }, { onConflict: 'key' });
    
    if (error) {
      console.error(`Erro Supabase ao salvar ${key}:`, error);
      toast.error(`Falha ao sincronizar dados na nuvem: ${error.message}`);
    }
  } catch (e) {
    console.error("Erro ao sincronizar " + key, e);
  }
}
