import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SYNC_KEYS = [
  "vertentes_guardian_customizations",
  "sweet_spot_daily_config",
  "vertentes_user_activities",
  "vertentes_gamification"
];

const DYNAMIC_PREFIXES = [
  "sweet_spot_ej_data_",
  "sweet_spot_event_",
  "sweet_spot_lead_",
  "sweet_spot_mention_",
  "vertentes_guardian_prescon_",
  "vertentes_link_",
  "sweet_spot_announcement_",
  "sweet_spot_activity_",
  "vertentes_ej_list_",
  "vertentes_gamification_",
  "sweet_spot_daily_config_"
];

const isSyncKey = (key: string) => {
  if (SYNC_KEYS.includes(key)) return true;
  return DYNAMIC_PREFIXES.some(prefix => key.startsWith(prefix));
};

let isSyncing = false;
let subscription: any = null;
let authListenerAttached = false;

let hydrated = false;
let resolveHydration: () => void = () => {};
let hydrationPromise = new Promise<void>((resolve) => {
  resolveHydration = resolve;
});

/** True once the shared cloud data has been pulled into localStorage at least once. */
export function isCloudHydrated() {
  return hydrated;
}

/** Resolves once the shared cloud data has been pulled into localStorage. */
export function waitForCloudHydration() {
  return hydrationPromise;
}

function markHydrated() {
  if (hydrated) return;
  hydrated = true;
  resolveHydration();
}


function dispatchAll() {
  [
    "ejListUpdated", "eventsUpdated", "leadsUpdated", "guardianStoreUpdated",
    "mentionsUpdated", "presconUpdated", "activitiesUpdated", "ejDataUpdated",
    "linksStoreUpdated", "dailyConfigUpdated", "userActivitiesUpdated",
    "announcementsUpdated", "gamificationUpdated", "guardiansUpdated",
  ].forEach((e) => window.dispatchEvent(new Event(e)));
}

export async function initCloudSync() {
  if (!authListenerAttached) {
    authListenerAttached = true;
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED") {
        isSyncing = false;
        if (subscription) {
          supabase.removeChannel(subscription);
          subscription = null;
        }
        initCloudSync();
      }
    });
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return;

  if (isSyncing) return;
  isSyncing = true;

  try {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('app_data')
        .select('*')
        .range(from, from + step - 1);

      if (error) {
        console.error("Erro Supabase (select):", error);
        isSyncing = false;
        return;
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < step) {
          hasMore = false;
        } else {
          from += step;
        }
      } else {
        hasMore = false;
      }
    }

    if (allData.length > 0) {
      let hasUpdates = false;
      allData.forEach((row) => {
        if (isSyncKey(row.key)) {
          const localData = localStorage.getItem(row.key);
          const remoteDataStr = JSON.stringify(row.data);
          if (localData !== remoteDataStr) {
            localStorage.setItem(row.key, remoteDataStr);
            hasUpdates = true;
          }
        }
      });

      markHydrated();

      if (hasUpdates) {
        dispatchAll();
      }
    }
  } catch (e) {
    console.error("Erro na sincronização inicial", e);
  }
  markHydrated();


  subscription = supabase.channel('app_data_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_data' }, (payload) => {
      if (payload.eventType === 'DELETE') {
        const oldRow = payload.old as any;
        if (oldRow && oldRow.key && isSyncKey(oldRow.key)) {
          localStorage.removeItem(oldRow.key);
          dispatchAll();
        }
      } else {
        const row = payload.new as any;
        if (row && row.key && isSyncKey(row.key)) {
          const remoteDataStr = JSON.stringify(row.data);
          const localData = localStorage.getItem(row.key);
          
          if (localData !== remoteDataStr) {
            localStorage.setItem(row.key, remoteDataStr);
            dispatchAll(); // Simplify dispatching by just updating all UI
          }
        }
      }
    })
    .subscribe();
}

export async function syncToCloud(key: string, data: any) {
  if (!isSyncKey(key)) return;
  
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

export async function deleteFromCloud(key: string) {
  if (!isSyncKey(key)) return;
  
  try {
    const { error } = await supabase.from('app_data').delete().eq('key', key);
    if (error) {
      console.error(`Erro Supabase ao deletar ${key}:`, error);
    }
  } catch (e) {
    console.error("Erro ao deletar " + key, e);
  }
}
