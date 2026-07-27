export interface Task {
  id: number;
  text: string;
  completed: boolean;
  date: string;
  completedAt?: string;
}

export interface EjData {
  ejName: string;
  desafio?: string;
  dores?: string;
  proximaReuniao?: string;
  notasReuniao?: string;
  tarefas?: Task[];
  apostas?: Record<string, boolean>;
}

const STORE_KEY = 'sweet_spot_ej_data';

export const ejDataStore = {
  getAllData: (): Record<string, EjData> => {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(STORE_KEY);
        if (data) {
          return JSON.parse(data) || {};
        }
      } catch (e) {
        console.error("Failed to load ej data", e);
      }
    }
    return {};
  },
  
  getEjData: (ejName: string): EjData | null => {
    const allData = ejDataStore.getAllData();
    return allData[ejName] || null;
  },

  saveEjData: (ejName: string, data: Partial<EjData>) => {
    if (typeof window !== 'undefined') {
      try {
        const allData = ejDataStore.getAllData();
        const currentData = allData[ejName] || { ejName };
        const updatedData = { ...currentData, ...data };
        
        allData[ejName] = updatedData;
        localStorage.setItem(STORE_KEY, JSON.stringify(allData));
        window.dispatchEvent(new Event('ejDataUpdated'));
      } catch (e) {
        console.error("Failed to save ej data", e);
      }
    }
  }
};
