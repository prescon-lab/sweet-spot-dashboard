import { syncToCloud } from "./cloudSync";

export interface PresconItem {
  id: number;
  text: string;
  completed: boolean;
  date: string;
  completedAt?: string;
}

const OLD_STORE_KEY = "vertentes_guardian_prescon";
const PREFIX = "vertentes_guardian_prescon_";

type PresconMap = Record<string, PresconItem[]>;

function migrateIfNeeded() {
  if (typeof window === "undefined") return;
  try {
    const oldDataStr = localStorage.getItem(OLD_STORE_KEY);
    if (oldDataStr) {
      const oldMap = JSON.parse(oldDataStr) as PresconMap;
      Object.keys(oldMap).forEach(guardianName => {
        const key = `${PREFIX}${guardianName}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, JSON.stringify(oldMap[guardianName]));
          syncToCloud(key, oldMap[guardianName]);
        }
      });
      localStorage.removeItem(OLD_STORE_KEY);
    }
  } catch (e) {}
}

export const presconStore = {
  getItems(guardianName: string): PresconItem[] {
    if (typeof window === "undefined") return [];
    migrateIfNeeded();
    
    try {
      const key = `${PREFIX}${guardianName}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to parse prescon store", e);
      return [];
    }
  },

  setItems(guardianName: string, items: PresconItem[]) {
    if (typeof window === "undefined") return;
    try {
      const key = `${PREFIX}${guardianName}`;
      localStorage.setItem(key, JSON.stringify(items));
      syncToCloud(key, items);
      window.dispatchEvent(new Event("presconUpdated"));
    } catch (e) {
      console.error("Failed to save prescon store", e);
    }
  },
};
