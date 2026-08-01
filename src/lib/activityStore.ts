import { syncToCloud } from "./cloudSync";

export interface Activity {
  id: string;
  ejName: string;
  description: string;
  type: 'update' | 'goal' | 'meeting' | 'lead';
  timestamp: string;
}

const STORE_KEY = 'sweet_spot_activities';

export const activityStore = {
  getActivities: (): Activity[] => {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(STORE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        }
      } catch (e) {
        console.error("Failed to load activities", e);
      }
    }
    return [];
  },
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    if (typeof window !== 'undefined') {
      try {
        const activities = activityStore.getActivities();
        const newActivity: Activity = {
          ...activity,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
        };
        // Keep only the last 50 activities to avoid huge local storage size
        const updated = [newActivity, ...activities].slice(0, 50);
        localStorage.setItem(STORE_KEY, JSON.stringify(updated));
        syncToCloud(STORE_KEY, updated);
        window.dispatchEvent(new Event('ejActivitiesUpdated'));
        window.dispatchEvent(new Event('activitiesUpdated'));
      } catch (e) {
        console.error("Failed to save activity", e);
      }
    }
  },
  deleteActivity: (id: string) => {
    if (typeof window !== 'undefined') {
      try {
        const activities = activityStore.getActivities();
        const updated = activities.filter(a => a.id !== id);
        localStorage.setItem(STORE_KEY, JSON.stringify(updated));
        syncToCloud(STORE_KEY, updated);
        window.dispatchEvent(new Event('ejActivitiesUpdated'));
        window.dispatchEvent(new Event('activitiesUpdated'));
      } catch (e) {
        console.error("Failed to delete activity", e);
      }
    }
  }
};
