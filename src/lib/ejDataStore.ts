import { syncToCloud } from "./cloudSync";

export interface Task {
  id: number;
  text: string;
  completed: boolean;
  date: string;
  completedAt?: string;
}

export interface ReuniaoNota {
  id: number;
  date: string;
  text: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type?: string;
}

export interface EjData {
  ejName: string;
  desafio?: string;
  dores?: string;
  proximaReuniao?: string;
  responsavelReuniao?: string;
  notasReuniao?: string; // Legacy
  reunioes?: ReuniaoNota[];
  tarefas?: Task[];
  presconTasks?: Task[];
  apostas?: Record<string, boolean>;
  avatarUrl?: string;
  calendarioEventos?: CalendarEvent[];
}

const OLD_STORE_KEY = 'sweet_spot_ej_data';

export const ejDataStore = {
  getAllData: (): Record<string, EjData> => {
    if (typeof window !== 'undefined') {
      try {
        const allData: Record<string, EjData> = {};
        
        // 1. Migrate old monolithic data to individual keys if it exists
        const oldDataStr = localStorage.getItem(OLD_STORE_KEY);
        if (oldDataStr) {
          try {
            const oldData = JSON.parse(oldDataStr);
            Object.keys(oldData).forEach(ejName => {
              const key = `sweet_spot_ej_data_${ejName}`;
              if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(oldData[ejName]));
                syncToCloud(key, oldData[ejName]);
              }
            });
            localStorage.removeItem(OLD_STORE_KEY);
          } catch(e) {}
        }

        // 2. Load all individual EJ keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sweet_spot_ej_data_')) {
            const ejName = key.replace('sweet_spot_ej_data_', '');
            try {
              allData[ejName] = JSON.parse(localStorage.getItem(key) || '{}');
            } catch(e) {}
          }
        }
        return allData;
      } catch (e) {
        console.error("Failed to load ej data", e);
      }
    }
    return {};
  },
  
  getEjData: (ejName: string): EjData | null => {
    if (typeof window === 'undefined') return null;
    
    // Ensure migration runs if needed before reading
    ejDataStore.getAllData();
    
    const key = `sweet_spot_ej_data_${ejName}`;
    const data = localStorage.getItem(key);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {}
    }
    return null;
  },

  saveEjData: (ejName: string, data: Partial<EjData>) => {
    if (typeof window !== 'undefined') {
      try {
        const currentData = ejDataStore.getEjData(ejName) || { ejName };
        const updatedData = { ...currentData, ...data };
        
        const key = `sweet_spot_ej_data_${ejName}`;
        localStorage.setItem(key, JSON.stringify(updatedData));
        syncToCloud(key, updatedData);
        window.dispatchEvent(new Event('ejDataUpdated'));
      } catch (e) {
        console.error("Failed to save ej data", e);
      }
    }
  }
};
