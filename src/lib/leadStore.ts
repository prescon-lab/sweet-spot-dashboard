export type LeadStatus = 'quente' | 'morno' | 'frio';

export interface Lead {
  id: string;
  ejId: string; // The name or ID of the EJ
  name: string;
  expectedValue: number;
  status: LeadStatus;
  closingDate: string; // ISO date string or YYYY-MM-DD
  observations: string;
  createdAt: string;
}

const STORE_KEY = 'sweet_spot_leads';

export const leadStore = {
  getLeads: (): Lead[] => {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(STORE_KEY);
        if (data) return JSON.parse(data);
      } catch (e) {
        console.error("Failed to load leads", e);
      }
    }
    return [];
  },
  
  getLeadsByEj: (ejId: string): Lead[] => {
    return leadStore.getLeads().filter(lead => lead.ejId === ejId);
  },

  addLead: (lead: Lead) => {
    if (typeof window !== 'undefined') {
      try {
        const current = leadStore.getLeads();
        current.push(lead);
        localStorage.setItem(STORE_KEY, JSON.stringify(current));
        window.dispatchEvent(new Event('leadsUpdated'));
      } catch (e) {
        console.error("Failed to save lead", e);
      }
    }
  },

  updateLead: (updatedLead: Lead) => {
    if (typeof window !== 'undefined') {
      try {
        const current = leadStore.getLeads();
        const index = current.findIndex(e => e.id === updatedLead.id);
        if (index !== -1) {
          current[index] = updatedLead;
          localStorage.setItem(STORE_KEY, JSON.stringify(current));
          window.dispatchEvent(new Event('leadsUpdated'));
        }
      } catch (e) {
        console.error("Failed to update lead", e);
      }
    }
  },

  deleteLead: (id: string) => {
    if (typeof window !== 'undefined') {
      try {
        const current = leadStore.getLeads();
        const updated = current.filter(e => e.id !== id);
        localStorage.setItem(STORE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event('leadsUpdated'));
      } catch (e) {
        console.error("Failed to delete lead", e);
      }
    }
  }
};
