import { syncToCloud, deleteFromCloud } from "./cloudSync";

export interface AnnouncementQuestion {
  text: string;
  type: "boolean" | "options" | "text";
  options?: string[]; // for "options" type
}

export interface AnnouncementResponse {
  userEmail: string;
  answer: string;
  timestamp: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  icon: string; // Lucide icon name, e.g. "Bell", "PartyPopper", "AlertTriangle"
  question?: AnnouncementQuestion;
  responses?: AnnouncementResponse[];
}

const OLD_STORE_KEY = 'sweet_spot_announcements';
const PREFIX = 'sweet_spot_announcement_';

export const announcementStore = {
  getAll: (): Announcement[] => {
    if (typeof window !== 'undefined') {
      try {
        const announcements: Announcement[] = [];
        
        const oldDataStr = localStorage.getItem(OLD_STORE_KEY);
        if (oldDataStr) {
          try {
            const oldAnns = JSON.parse(oldDataStr);
            if (Array.isArray(oldAnns)) {
              oldAnns.filter(Boolean).forEach((ann: Announcement) => {
                const key = `${PREFIX}${ann.id}`;
                if (!localStorage.getItem(key)) {
                  localStorage.setItem(key, JSON.stringify(ann));
                  syncToCloud(key, ann);
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
              announcements.push(JSON.parse(localStorage.getItem(key) || '{}'));
            } catch(e) {}
          }
        }
        return announcements;
      } catch (e) {
        console.error("Failed to load announcements", e);
      }
    }
    return [];
  },

  add: (announcement: Announcement) => {
    if (typeof window !== 'undefined') {
      const key = `${PREFIX}${announcement.id}`;
      localStorage.setItem(key, JSON.stringify(announcement));
      syncToCloud(key, announcement);
      window.dispatchEvent(new Event('announcementsUpdated'));
    }
  },

  update: (id: string, partial: Partial<Announcement>) => {
    if (typeof window !== 'undefined') {
      const key = `${PREFIX}${id}`;
      const existing = localStorage.getItem(key);
      if (existing) {
        try {
          const ann = JSON.parse(existing);
          const updated = { ...ann, ...partial };
          localStorage.setItem(key, JSON.stringify(updated));
          syncToCloud(key, updated);
          window.dispatchEvent(new Event('announcementsUpdated'));
        } catch(e) {}
      }
    }
  },

  remove: (id: string) => {
    if (typeof window !== 'undefined') {
      const key = `${PREFIX}${id}`;
      localStorage.removeItem(key);
      deleteFromCloud(key);
      window.dispatchEvent(new Event('announcementsUpdated'));
    }
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
  },

  addResponse: (announcementId: string, response: AnnouncementResponse) => {
    if (typeof window !== 'undefined') {
      const key = `${PREFIX}${announcementId}`;
      const existing = localStorage.getItem(key);
      if (existing) {
        try {
          const ann: Announcement = JSON.parse(existing);
          if (!ann.responses) ann.responses = [];
          const existingIdx = ann.responses.findIndex(r => r.userEmail === response.userEmail);
          if (existingIdx !== -1) {
            ann.responses[existingIdx] = response;
          } else {
            ann.responses.push(response);
          }
          localStorage.setItem(key, JSON.stringify(ann));
          syncToCloud(key, ann);
          window.dispatchEvent(new Event('announcementsUpdated'));
        } catch(e) {}
      }
    }
  }
};
