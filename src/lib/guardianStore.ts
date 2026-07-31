import { syncToCloud } from "./cloudSync";

export interface GuardianCustomization {
  color: string;
  avatarUrl: string; // Figurinha
  bannerUrl: string; // Imagem do fundo
  bannerOpacity: number; // Opacidade do fundo
  quote: string; // Frase do dia
}

const STORE_KEY = "vertentes_guardian_customizations";

export const guardianStore = {
  get(guardianName: string): GuardianCustomization {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(STORE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed[guardianName]) {
            return parsed[guardianName];
          }
        }
      } catch (e) {
        console.error("Failed to parse guardian store", e);
      }
    }
    
    // Default values
    return {
      color: "#0A1942",
      avatarUrl: "",
      bannerUrl: "",
      bannerOpacity: 0.2, // Default opacity
      quote: "FRASE DO DIA",
    };
  },

  set(guardianName: string, config: GuardianCustomization) {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(STORE_KEY);
        const parsed = data ? JSON.parse(data) : {};
        parsed[guardianName] = config;
        localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
        syncToCloud(STORE_KEY, parsed);
        
        // Dispatch an event so other components can react
        window.dispatchEvent(new Event('guardianStoreUpdated'));
        window.dispatchEvent(new Event('guardiansUpdated'));
      } catch (e) {
        console.error("Failed to save to guardian store", e);
      }
    }
  },

  getAll() {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(STORE_KEY);
        if (data) {
          return JSON.parse(data) as Record<string, GuardianCustomization>;
        }
      } catch (e) {
        console.error("Failed to get all from guardian store", e);
      }
    }
    return {};
  }
};
