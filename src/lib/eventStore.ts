export interface EventGoal {
  id: string;
  text: string;
  coreText: string;
  checked?: boolean; // legacy
  checkedBy?: string[];
}

export interface AppEvent {
  id: string;
  name: string;
  ejGoals: EventGoal[];
  createdAt: string;
}

const STORE_KEY = 'sweet_spot_events';

export const eventStore = {
  getEvents: (): AppEvent[] => {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(STORE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch (e) {
        console.error("Failed to load events", e);
      }
    }
    return [];
  },
  addEvent: (event: AppEvent) => {
    if (typeof window !== 'undefined') {
      try {
        const current = eventStore.getEvents();
        current.push(event);
        localStorage.setItem(STORE_KEY, JSON.stringify(current));
        window.dispatchEvent(new Event('eventsUpdated'));
      } catch (e) {
        console.error("Failed to save event", e);
      }
    }
  },
  updateEvent: (updatedEvent: AppEvent) => {
    if (typeof window !== 'undefined') {
      try {
        const current = eventStore.getEvents();
        const index = current.findIndex(e => e.id === updatedEvent.id);
        if (index !== -1) {
          // Preserve checked states from the previous version if goals match by ID or text
          const prevEvent = current[index];
          updatedEvent.ejGoals = updatedEvent.ejGoals.map(newGoal => {
            const oldGoal = prevEvent.ejGoals.find(g => g.id === newGoal.id || g.text === newGoal.text);
            if (oldGoal) {
              return { ...newGoal, checkedBy: oldGoal.checkedBy, checked: oldGoal.checked };
            }
            return newGoal;
          });
          current[index] = updatedEvent;
          localStorage.setItem(STORE_KEY, JSON.stringify(current));
          window.dispatchEvent(new Event('eventsUpdated'));
        }
      } catch (e) {
        console.error("Failed to update event", e);
      }
    }
  },
  // To toggle goals for specific EJs
  toggleGoal: (eventId: string, goalId: string, ejId: string) => {
    if (typeof window !== 'undefined') {
      try {
        const current = eventStore.getEvents();
        const event = current.find(e => e.id === eventId);
        if (event) {
          const goal = event.ejGoals.find(g => g.id === goalId);
          if (goal) {
            if (!goal.checkedBy) {
              goal.checkedBy = [];
              // migrate legacy
              if (goal.checked) goal.checkedBy.push(ejId);
            }
            if (goal.checkedBy.includes(ejId)) {
              goal.checkedBy = goal.checkedBy.filter(id => id !== ejId);
            } else {
              goal.checkedBy.push(ejId);
            }
            localStorage.setItem(STORE_KEY, JSON.stringify(current));
            window.dispatchEvent(new Event('eventsUpdated'));
          }
        }
      } catch (e) {
        console.error("Failed to toggle goal", e);
      }
    }
  }
};
