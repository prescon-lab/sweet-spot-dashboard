import { ejsList as initialEjsList } from "./data";
import { guardianStore } from "./guardianStore";

export interface EjItem {
  id: number;
  name: string;
  guardian: string;
  isBet: boolean;
}

const STORE_KEY = "vertentes_ej_list";

export const ejListStore = {
  getEjs(): EjItem[] {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to load ej list from localStorage", e);
      }
    }
    return initialEjsList;
  },

  updateEjGuardian(ejName: string, newGuardian: string) {
    if (!newGuardian.trim()) return;
    
    const ejs = this.getEjs();
    const updatedEjs = ejs.map((ej) =>
      ej.name === ejName ? { ...ej, guardian: newGuardian.trim() } : ej
    );

    if (typeof window !== "undefined") {
      localStorage.setItem(STORE_KEY, JSON.stringify(updatedEjs));
      window.dispatchEvent(new Event("ejListUpdated"));

      // Certificar-se de que o novo guardião possui um perfil configurado
      const existingGuardians = guardianStore.getAll();
      if (!existingGuardians[newGuardian.trim()]) {
        // Se não existe, cria com os valores padrão
        guardianStore.set(newGuardian.trim(), {
          color: "#0A1942",
          avatarUrl: "",
          bannerUrl: "",
          bannerOpacity: 0.2,
          quote: "FRASE DO DIA",
        });
      }
    }
  },

  getUniqueGuardians(): string[] {
    const ejs = this.getEjs();
    const guardians = Array.from(new Set(ejs.map((ej) => ej.guardian)));
    return guardians.sort();
  },
};
