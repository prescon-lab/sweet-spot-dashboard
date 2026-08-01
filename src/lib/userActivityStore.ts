import { syncToCloud } from "./cloudSync";

export interface UserActivity {
  lastLoginAt?: string;
  lastUpdateAt?: string;
}

export type UserActivityMap = Record<string, UserActivity>;

const STORE_KEY = 'vertentes_user_activities';

export const userActivityStore = {
  getActivities: (): UserActivityMap => {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(STORE_KEY);
        if (data) {
          return JSON.parse(data);
        }
      } catch (e) {
        console.error("Failed to load user activities", e);
      }
    }
    return {};
  },
  
  registerLogin: (userId: string) => {
    if (typeof window === 'undefined' || !userId) return;
    try {
      const activities = userActivityStore.getActivities();
      
      const userAct = activities[userId] || {};
      const now = new Date().toISOString();
      
      // Update only if login date is older than 1 hour to avoid excessive syncs
      const lastLogin = userAct.lastLoginAt ? new Date(userAct.lastLoginAt).getTime() : 0;
      if (Date.now() - lastLogin > 1000 * 60 * 60) {
        activities[userId] = { ...userAct, lastLoginAt: now };
        localStorage.setItem(STORE_KEY, JSON.stringify(activities));
        syncToCloud(STORE_KEY, activities);
        window.dispatchEvent(new Event('userActivitiesUpdated'));
      }
    } catch (e) {
      console.error("Failed to register login", e);
    }
  },
  
  registerUpdate: (userId: string) => {
    if (typeof window === 'undefined' || !userId) return;
    try {
      const activities = userActivityStore.getActivities();
      
      const userAct = activities[userId] || {};
      const now = new Date().toISOString();
      
      // Update only if update date is older than 10 minutes to avoid excessive syncs
      const lastUpdate = userAct.lastUpdateAt ? new Date(userAct.lastUpdateAt).getTime() : 0;
      if (Date.now() - lastUpdate > 1000 * 60 * 10) {
        activities[userId] = { ...userAct, lastUpdateAt: now };
        localStorage.setItem(STORE_KEY, JSON.stringify(activities));
        syncToCloud(STORE_KEY, activities);
        window.dispatchEvent(new Event('userActivitiesUpdated'));
      }
    } catch (e) {
      console.error("Failed to register update", e);
    }
  }
};
