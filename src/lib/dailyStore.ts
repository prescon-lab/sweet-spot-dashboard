import { syncToCloud } from "./cloudSync";

export interface DailyConfig {
  startDate: string;
  endDate: string;
  daysOfWeek: number[]; // 0 = Domingo, 1 = Segunda, ... 6 = Sábado
}

const STORE_KEY = 'sweet_spot_daily_config';

export const dailyStore = {
  getConfig: (): DailyConfig | null => {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(STORE_KEY);
        if (data) {
          return JSON.parse(data);
        }
      } catch (e) {
        console.error("Failed to load daily config", e);
      }
    }
    return null;
  },
  saveConfig: (config: DailyConfig) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(config));
        syncToCloud(STORE_KEY, config);
        window.dispatchEvent(new Event('dailyConfigUpdated'));
      } catch (e) {
        console.error("Failed to save daily config", e);
      }
    }
  },
  removeConfig: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORE_KEY);
      syncToCloud(STORE_KEY, {}); // Use {} instead of null to avoid violating Postgres not-null constraint on jsonb
      window.dispatchEvent(new Event('dailyConfigUpdated'));
    }
  }
};

export function isDailyDay(date: Date): boolean {
  const config = dailyStore.getConfig();
  if (!config || !config.startDate || !config.endDate || !config.daysOfWeek) return false;
  
  // Reset time for safe comparison
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const start = new Date(config.startDate + "T00:00:00");
  const end = new Date(config.endDate + "T23:59:59");
  
  if (checkDate >= start && checkDate <= end) {
    return config.daysOfWeek.includes(checkDate.getDay());
  }
  return false;
}
