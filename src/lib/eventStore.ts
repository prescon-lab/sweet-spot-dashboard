export interface EventGoal {
  id: string;
  text: string;
  coreText: string;
  checked: boolean;
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
        if (data) return JSON.parse(data);
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
  // To toggle goals globally across all EJs
  toggleGoal: (eventId: string, goalId: string) => {
    if (typeof window !== 'undefined') {
      try {
        const current = eventStore.getEvents();
        const event = current.find(e => e.id === eventId);
        if (event) {
          const goal = event.ejGoals.find(g => g.id === goalId);
          if (goal) {
            goal.checked = !goal.checked;
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
