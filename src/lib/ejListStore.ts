import { ejsList as initialEjsList } from "./data";
import { guardianStore } from "./guardianStore";
import { syncToCloud } from "./cloudSync";

export interface EjItem {
  id: number;
  name: string;
  guardian: string;
  isBet: boolean;
}

const OLD_STORE_KEY = "vertentes_ej_list";
const PREFIX = "vertentes_ej_list_";

export const ejListStore = {
  getEjs(): EjItem[] {
    if (typeof window !== "undefined") {
      try {
        const ejs: EjItem[] = [];
        let needsDefaults = true;
        
        const oldDataStr = localStorage.getItem(OLD_STORE_KEY);
        if (oldDataStr) {
          try {
            const oldEjs = JSON.parse(oldDataStr);
            if (Array.isArray(oldEjs)) {
              oldEjs.filter(Boolean).forEach((ej: EjItem) => {
                const key = `${PREFIX}${ej.name}`;
                if (!localStorage.getItem(key)) {
                  localStorage.setItem(key, JSON.stringify(ej));
                  syncToCloud(key, ej);
                }
              });
            }
            localStorage.removeItem(OLD_STORE_KEY);
          } catch(e) {}
        }

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(PREFIX)) {
            try {
              ejs.push(JSON.parse(localStorage.getItem(key) || '{}'));
              needsDefaults = false;
            } catch(e) {}
          }
        }
        
        if (needsDefaults && isCloudHydrated() && !localStorage.getItem('vertentes_ejs_initialized')) {
           initialEjsList.forEach(ej => {
             const key = `${PREFIX}${ej.name}`;
             localStorage.setItem(key, JSON.stringify(ej));
             syncToCloud(key, ej);
           });
           localStorage.setItem('vertentes_ejs_initialized', 'true');
           return initialEjsList.sort((a, b) => a.name.localeCompare(b.name));
        }

        
        return ejs.length > 0 ? ejs.sort((a, b) => a.name.localeCompare(b.name)) : initialEjsList.sort((a, b) => a.name.localeCompare(b.name));
      } catch (e) {
        console.error("Failed to load ej list from localStorage", e);
      }
    }
    return initialEjsList.sort((a, b) => a.name.localeCompare(b.name));
  },

  updateEjGuardian(ejName: string, newGuardian: string) {
    if (!newGuardian.trim()) return;
    
    if (typeof window !== "undefined") {
      const ejs = this.getEjs();
      const ej = ejs.find(e => e.name === ejName);
      
      if (ej) {
        const updatedEj = { ...ej, guardian: newGuardian.trim() };
        const key = `${PREFIX}${ejName}`;
        localStorage.setItem(key, JSON.stringify(updatedEj));
        syncToCloud(key, updatedEj);
        window.dispatchEvent(new Event("ejListUpdated"));
        
        const existingGuardians = guardianStore.getAll();
        if (!existingGuardians[newGuardian.trim()]) {
          guardianStore.set(newGuardian.trim(), {
            color: "#0A1942",
            avatarUrl: "",
            bannerUrl: "",
            bannerOpacity: 0.2,
            quote: "FRASE DO DIA",
          });
        }
      }
    }
  },

  getUniqueGuardians(): string[] {
    const ejs = this.getEjs();
    const guardians = Array.from(new Set(ejs.map((ej) => ej.guardian)));
    return guardians.sort();
  },
};
