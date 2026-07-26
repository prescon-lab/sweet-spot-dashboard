export interface GuardianCustomization {
  color: string;
  avatarUrl: string; // Figurinha
  bannerUrl: string; // Imagem do fundo
}

const STORE_KEY = "vertentes_guardian_customizations";

export const guardianStore = {
  get(guardianName: string): GuardianCustomization {
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
    
    // Default values
    return {
      color: "#0A1942",
      avatarUrl: "",
      bannerUrl: "",
    };
  },

  set(guardianName: string, config: GuardianCustomization) {
    try {
      const data = localStorage.getItem(STORE_KEY);
      const parsed = data ? JSON.parse(data) : {};
      parsed[guardianName] = config;
      localStorage.setItem(STORE_KEY, JSON.stringify(parsed));
      
      // Dispatch an event so other components can react
      window.dispatchEvent(new Event('guardianStoreUpdated'));
    } catch (e) {
      console.error("Failed to save to guardian store", e);
    }
  },

  getAll() {
    try {
      const data = localStorage.getItem(STORE_KEY);
      if (data) {
        return JSON.parse(data) as Record<string, GuardianCustomization>;
      }
    } catch (e) {
      console.error("Failed to get all from guardian store", e);
    }
    return {};
  }
};
