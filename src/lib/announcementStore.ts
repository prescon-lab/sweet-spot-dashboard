import { syncToCloud } from "./cloudSync";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  icon: string; // Lucide icon name, e.g. "Bell", "PartyPopper", "AlertTriangle"
}

const STORE_KEY = 'sweet_spot_announcements';

export const announcementStore = {
  getAll: (): Announcement[] => {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(STORE_KEY);
        if (data) {
          return JSON.parse(data);
        }
      } catch (e) {
        console.error("Failed to load announcements", e);
      }
    }
    return [];
  },
  
  saveAll: (announcements: Announcement[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(announcements));
        syncToCloud(STORE_KEY, announcements);
        window.dispatchEvent(new Event('announcementsUpdated'));
      } catch (e) {
        console.error("Failed to save announcements", e);
      }
    }
  },

  add: (announcement: Announcement) => {
    const all = announcementStore.getAll();
    all.push(announcement);
    announcementStore.saveAll(all);
  },

  update: (id: string, partial: Partial<Announcement>) => {
    const all = announcementStore.getAll();
    const idx = all.findIndex((a) => a.id === id);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...partial };
      announcementStore.saveAll(all);
    }
  },

  remove: (id: string) => {
    const all = announcementStore.getAll();
    const filtered = all.filter((a) => a.id !== id);
    announcementStore.saveAll(filtered);
  },

  getActiveAnnouncements: (): Announcement[] => {
    const all = announcementStore.getAll();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return all.filter((a) => {
      const start = new Date(a.startDate + "T00:00:00");
      const end = new Date(a.endDate + "T23:59:59");
      return today >= start && today <= end;
    });
  }
};
