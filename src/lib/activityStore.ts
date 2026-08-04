import { syncToCloud, deleteFromCloud } from "./cloudSync";

export interface Activity {
  id: string;
  ejName: string;
  description: string;
  type: 'update' | 'goal' | 'meeting' | 'lead';
  timestamp: string;
}

const OLD_STORE_KEY = 'sweet_spot_activities';
const PREFIX = 'sweet_spot_activity_';
const MAX_ACTIVITIES = 100; // Increased limit slightly to ensure data retention

export const activityStore = {
  getActivities: (): Activity[] => {
    if (typeof window !== 'undefined') {
      try {
        let activities: Activity[] = [];
        
        const oldDataStr = localStorage.getItem(OLD_STORE_KEY);
        if (oldDataStr) {
          try {
            const oldActivities = JSON.parse(oldDataStr);
            if (Array.isArray(oldActivities)) {
              oldActivities.filter(Boolean).forEach((act: Activity) => {
                const key = `${PREFIX}${act.id}`;
                if (!localStorage.getItem(key)) {
                  localStorage.setItem(key, JSON.stringify(act));
                  syncToCloud(key, act);
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
              activities.push(JSON.parse(localStorage.getItem(key) || '{}'));
            } catch(e) {}
          }
        }
        
        // Sort descending by timestamp
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Enforce limit
        if (activities.length > MAX_ACTIVITIES) {
          const excess = activities.slice(MAX_ACTIVITIES);
          excess.forEach(act => {
            const key = `${PREFIX}${act.id}`;
            localStorage.removeItem(key);
            deleteFromCloud(key);
          });
          activities = activities.slice(0, MAX_ACTIVITIES);
        }
        
        return activities;
      } catch (e) {
        console.error("Failed to load activities", e);
      }
    }
    return [];
  },

  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    if (typeof window !== 'undefined') {
      try {
        const newActivity: Activity = {
          ...activity,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toISOString(),
        };
        const key = `${PREFIX}${newActivity.id}`;
        localStorage.setItem(key, JSON.stringify(newActivity));
        syncToCloud(key, newActivity);
        
        // Triggers limit enforcement on next read
        activityStore.getActivities();
        
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
        const key = `${PREFIX}${id}`;
        localStorage.removeItem(key);
        deleteFromCloud(key);
        window.dispatchEvent(new Event('ejActivitiesUpdated'));
        window.dispatchEvent(new Event('activitiesUpdated'));
      } catch (e) {
        console.error("Failed to delete activity", e);
      }
    }
  }
};
