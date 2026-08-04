import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SYNC_KEYS = [
  "vertentes_ej_list",
  "sweet_spot_events",
  "sweet_spot_leads",
  "vertentes_guardian_customizations",
  "sweet_spot_mentions",
  "vertentes_guardian_prescon",
  "sweet_spot_activities",
  "sweet_spot_ej_data",
  "vertentes_links",
  "sweet_spot_daily_config",
  "vertentes_user_activities",
  "sweet_spot_announcements",
  "vertentes_gamification"
];

const isSyncKey = (key: string) => SYNC_KEYS.includes(key) || key.startsWith("sweet_spot_ej_data_");

let isSyncing = false;
let subscription: any = null;
let authListenerAttached = false;

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
        void initCloudSync();
      }
    });
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return;

  if (isSyncing) return;
  isSyncing = true;

  try {
    const { data, error } = await supabase.from('app_data').select('*');
    if (error) {
      console.error("Erro Supabase (select):", error);
      isSyncing = false;
      return;
    }

    if (data) {
      let hasUpdates = false;
      data.forEach((row) => {
        if (isSyncKey(row.key)) {
          const localData = localStorage.getItem(row.key);
          const remoteDataStr = JSON.stringify(row.data);
          if (localData !== remoteDataStr) {
            localStorage.setItem(row.key, remoteDataStr);
            hasUpdates = true;
          }
        }
      });
      
      if (hasUpdates) {
        dispatchAll();
      }
    }
  } catch (e) {
    console.error("Erro na sincronização inicial", e);
  }

  subscription = supabase.channel('app_data_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_data' }, (payload) => {
      const row = payload.new as any;
      if (row && row.key && isSyncKey(row.key)) {
        const remoteDataStr = JSON.stringify(row.data);
        const localData = localStorage.getItem(row.key);
        
        if (localData !== remoteDataStr) {
          localStorage.setItem(row.key, remoteDataStr);
          
          if (row.key === "vertentes_ej_list") window.dispatchEvent(new Event("ejListUpdated"));
          if (row.key === "sweet_spot_events") window.dispatchEvent(new Event("eventsUpdated"));
          if (row.key === "sweet_spot_leads") window.dispatchEvent(new Event("leadsUpdated"));
          if (row.key === "vertentes_guardian_customizations") window.dispatchEvent(new Event("guardianStoreUpdated"));
          if (row.key === "sweet_spot_mentions") window.dispatchEvent(new Event("mentionsUpdated"));
          if (row.key === "vertentes_guardian_prescon") window.dispatchEvent(new Event("presconUpdated"));
          if (row.key === "sweet_spot_activities") window.dispatchEvent(new Event("activitiesUpdated"));
          if (row.key.startsWith("sweet_spot_ej_data")) window.dispatchEvent(new Event("ejDataUpdated"));
          if (row.key === "vertentes_links") window.dispatchEvent(new Event("linksStoreUpdated"));
          if (row.key === "sweet_spot_daily_config") window.dispatchEvent(new Event("dailyConfigUpdated"));
          if (row.key === "vertentes_user_activities") window.dispatchEvent(new Event("userActivitiesUpdated"));
          if (row.key === "sweet_spot_announcements") window.dispatchEvent(new Event("announcementsUpdated"));
          if (row.key === "vertentes_gamification") window.dispatchEvent(new Event("gamificationUpdated"));
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
