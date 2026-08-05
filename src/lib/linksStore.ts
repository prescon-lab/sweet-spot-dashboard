import { syncToCloud, deleteFromCloud, isCloudHydrated } from "./cloudSync";

export interface UsefulLink {
  id: string;
  title: string;
  url: string;
  category: string;
}

const OLD_STORE_KEY = 'vertentes_links';
const PREFIX = 'vertentes_link_';

class LinksStore {
  private getLinks(): UsefulLink[] {
    if (typeof window !== 'undefined') {
      try {
        const links: UsefulLink[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(PREFIX)) {
            try {
              links.push(JSON.parse(localStorage.getItem(key) || '{}'));
            } catch(e) {}
          }
        }
        
        if (links.length === 0 && isCloudHydrated() && !localStorage.getItem('vertentes_links_initialized')) {
           const defaults = [
             { id: '1', title: 'Drive EJs', url: '#', category: 'Documentos' },
             { id: '2', title: 'Planilha de Metas', url: '#', category: 'Documentos' }
           ];
           defaults.forEach(d => this.add(d));
           localStorage.setItem('vertentes_links_initialized', 'true');
           return defaults;
        }
        
        return links;
      } catch (e) {
        console.error("Error parsing useful links", e);
      }
    }
    return [];
  }

  public getAll(): UsefulLink[] {
    return this.getLinks();
  }

  public getGroupedByCategory(): Record<string, UsefulLink[]> {
    const links = this.getLinks();
    return links.reduce((acc, link) => {
      const cat = link.category || 'Geral';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(link);
      return acc;
    }, {} as Record<string, UsefulLink[]>);
  }

  public add(link: Omit<UsefulLink, 'id'> | UsefulLink) {
    if (typeof window !== 'undefined') {
      const newLink = { ...link, id: (link as UsefulLink).id || Date.now().toString() };
      const key = `${PREFIX}${newLink.id}`;
      localStorage.setItem(key, JSON.stringify(newLink));
      syncToCloud(key, newLink);
      window.dispatchEvent(new Event('linksStoreUpdated'));
    }
  }

  public update(id: string, updatedFields: Partial<UsefulLink>) {
    if (typeof window !== 'undefined') {
      const key = `${PREFIX}${id}`;
      const existing = localStorage.getItem(key);
      if (existing) {
        try {
          const link = JSON.parse(existing);
          const updated = { ...link, ...updatedFields };
          localStorage.setItem(key, JSON.stringify(updated));
          syncToCloud(key, updated);
          window.dispatchEvent(new Event('linksStoreUpdated'));
        } catch(e) {}
      }
    }
  }

  public remove(id: string) {
    if (typeof window !== 'undefined') {
      const key = `${PREFIX}${id}`;
      localStorage.removeItem(key);
      deleteFromCloud(key);
      window.dispatchEvent(new Event('linksStoreUpdated'));
    }
  }
}

export const linksStore = new LinksStore();
