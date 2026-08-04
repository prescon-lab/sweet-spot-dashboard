import { syncToCloud, deleteFromCloud } from "./cloudSync";
import { supabase } from "@/integrations/supabase/client";
import { ejListStore } from "./ejListStore";

export interface EventGoal {
  id: string;
  text: string;
  coreText: string;
  checked?: boolean; // legacy
  checkedBy?: string[];
}

export interface SquadEventGoal {
  id: string;
  squadId: string;
  title: string;
  type: 'checklist' | 'numeric' | 'automatic';
  completed?: boolean;
  targetValue?: number;
  currentValue?: number;
  automaticMetricType?: string;
}

export interface AppEvent {
  id: string;
  name: string;
  ejGoals: EventGoal[];
  squadGoals?: SquadEventGoal[];
  createdAt: string;
  status?: 'active' | 'completed';
  completedAt?: string;
  completionDates?: Record<string, string>;
  startDate?: string;
  endDate?: string;
  auditDate?: string;
}

const OLD_STORE_KEY = 'sweet_spot_events';
const PREFIX = 'sweet_spot_event_';

export const eventStore = {
  getEvents: (): AppEvent[] => {
    if (typeof window !== 'undefined') {
      try {
        const events: AppEvent[] = [];
        
        // Migrate old monolithic data if it exists
        const oldDataStr = localStorage.getItem(OLD_STORE_KEY);
        if (oldDataStr) {
          try {
            const oldEvents = JSON.parse(oldDataStr);
            if (Array.isArray(oldEvents)) {
              oldEvents.filter(Boolean).forEach((ev: AppEvent) => {
                const key = `${PREFIX}${ev.id}`;
                if (!localStorage.getItem(key)) {
                  localStorage.setItem(key, JSON.stringify(ev));
                  syncToCloud(key, ev);
                }
              });
            }
            localStorage.removeItem(OLD_STORE_KEY);
          } catch(e) {}
        }

        // Load all individual items
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(PREFIX)) {
            try {
              events.push(JSON.parse(localStorage.getItem(key) || '{}'));
            } catch(e) {}
          }
        }
        return events;
      } catch (e) {
        console.error("Failed to load events", e);
      }
    }
    return [];
  },

  addEvent: (event: AppEvent) => {
    if (typeof window !== 'undefined') {
      try {
        const key = `${PREFIX}${event.id}`;
        localStorage.setItem(key, JSON.stringify(event));
        syncToCloud(key, event);
        window.dispatchEvent(new Event('eventsUpdated'));
      } catch (e) {
        console.error("Failed to save event", e);
      }
    }
  },

  updateEvent: (updatedEvent: AppEvent) => {
    if (typeof window !== 'undefined') {
      try {
        const key = `${PREFIX}${updatedEvent.id}`;
        const existingDataStr = localStorage.getItem(key);
        if (existingDataStr) {
          const prevEvent: AppEvent = JSON.parse(existingDataStr);
          updatedEvent.ejGoals = updatedEvent.ejGoals.map(newGoal => {
            const oldGoal = prevEvent.ejGoals.find(g => g.id === newGoal.id || g.text === newGoal.text);
            if (oldGoal) {
              return { ...newGoal, checkedBy: oldGoal.checkedBy, checked: oldGoal.checked };
            }
            return newGoal;
          });
        }
        localStorage.setItem(key, JSON.stringify(updatedEvent));
        syncToCloud(key, updatedEvent);
        window.dispatchEvent(new Event('eventsUpdated'));
      } catch (e) {
        console.error("Failed to update event", e);
      }
    }
  },

  deleteEvent: (eventId: string) => {
    if (typeof window !== 'undefined') {
      try {
        const key = `${PREFIX}${eventId}`;
        localStorage.removeItem(key);
        deleteFromCloud(key);
        window.dispatchEvent(new Event('eventsUpdated'));
      } catch (e) {
        console.error("Failed to delete event", e);
      }
    }
  },

  toggleGoal: (eventId: string, goalId: string, ejId: string) => {
    if (typeof window !== 'undefined') {
      try {
        const key = `${PREFIX}${eventId}`;
        const eventData = localStorage.getItem(key);
        if (eventData) {
          const event: AppEvent = JSON.parse(eventData);
          const goal = event.ejGoals.find(g => g.id === goalId);
          if (goal) {
            if (!goal.checkedBy) {
              goal.checkedBy = [];
              if (goal.checked) goal.checkedBy.push(ejId);
            }
            if (goal.checkedBy.includes(ejId)) {
              goal.checkedBy = goal.checkedBy.filter(id => id !== ejId);
            } else {
              goal.checkedBy.push(ejId);
              
              const ejs = ejListStore.getEjs();
              const ej = ejs.find(e => e.name === ejId);
              if (ej && ej.guardian) {
                supabase.from('profiles').select('id').eq('guardian_name', ej.guardian).maybeSingle().then(({ data }) => {
                  if (data && data.id) {
                    supabase.from('notifications').insert({
                      user_id: data.id,
                      title: 'Meta Atualizada!',
                      content: `A EJ ${ej.name} bateu uma meta no evento ${event.name}!`,
                      type: 'goal_update'
                    }).then();
                  }
                });
              }
            }
            
            const allGoalsMet = event.ejGoals.every(g => g.checkedBy?.includes(ejId) || g.checked);
            
            if (!event.completionDates) {
              event.completionDates = {};
            }
            
            if (allGoalsMet) {
              if (!event.completionDates[ejId]) {
                event.completionDates[ejId] = new Date().toISOString();
              }
            } else {
              if (event.completionDates[ejId]) {
                delete event.completionDates[ejId];
              }
            }
            
            localStorage.setItem(key, JSON.stringify(event));
            syncToCloud(key, event);
            window.dispatchEvent(new Event('eventsUpdated'));
          }
        }
      } catch (e) {
        console.error("Failed to toggle goal", e);
      }
    }
  }
};
