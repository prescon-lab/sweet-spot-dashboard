export interface PresconItem {
  id: number;
  text: string;
  completed: boolean;
  date: string;
  completedAt?: string;
}

const STORE_KEY = "vertentes_guardian_prescon";

type PresconMap = Record<string, PresconItem[]>;

function readAll(): PresconMap {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(STORE_KEY);
    return data ? (JSON.parse(data) as PresconMap) || {} : {};
  } catch (e) {
    console.error("Failed to parse prescon store", e);
    return {};
  }
}

function writeAll(map: PresconMap) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event("presconUpdated"));
  } catch (e) {
    console.error("Failed to save prescon store", e);
  }
}

export const presconStore = {
  getItems(guardianName: string): PresconItem[] {
    return readAll()[guardianName] || [];
  },

  setItems(guardianName: string, items: PresconItem[]) {
    const all = readAll();
    all[guardianName] = items;
    writeAll(all);
  },
};
