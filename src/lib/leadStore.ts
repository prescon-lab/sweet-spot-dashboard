import { syncToCloud, deleteFromCloud } from "./cloudSync";

export type LeadStatus = 'quente' | 'morno' | 'frio' | 'fechado';

export interface Lead {
  id: string;
  ejId: string;
  name: string;
  expectedValue: number;
  status: LeadStatus;
  closingDate: string;
  observations: string;
  createdAt: string;
}

const OLD_STORE_KEY = 'sweet_spot_leads';
const PREFIX = 'sweet_spot_lead_';

export const leadStore = {
  getLeads: (): Lead[] => {
    if (typeof window !== 'undefined') {
      try {
        const leads: Lead[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(PREFIX)) {
            try {
              leads.push(JSON.parse(localStorage.getItem(key) || '{}'));
            } catch(e) {}
          }
        }
        return leads;
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
        const key = `${PREFIX}${lead.id}`;
        localStorage.setItem(key, JSON.stringify(lead));
        syncToCloud(key, lead);
        window.dispatchEvent(new Event('leadsUpdated'));
      } catch (e) {
        console.error("Failed to save lead", e);
      }
    }
  },

  updateLead: (updatedLead: Lead) => {
    if (typeof window !== 'undefined') {
      try {
        const key = `${PREFIX}${updatedLead.id}`;
        localStorage.setItem(key, JSON.stringify(updatedLead));
        syncToCloud(key, updatedLead);
        window.dispatchEvent(new Event('leadsUpdated'));
      } catch (e) {
        console.error("Failed to update lead", e);
      }
    }
  },

  deleteLead: (id: string) => {
    if (typeof window !== 'undefined') {
      try {
        const key = `${PREFIX}${id}`;
        localStorage.removeItem(key);
        deleteFromCloud(key);
        window.dispatchEvent(new Event('leadsUpdated'));
      } catch (e) {
        console.error("Failed to delete lead", e);
      }
    }
  }
};
