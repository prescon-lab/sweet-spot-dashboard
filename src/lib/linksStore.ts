import { syncToCloud } from "./cloudSync";

export interface UsefulLink {
  id: string;
  title: string;
  url: string;
  category: string;
}

class LinksStore {
  // Chave compartilhada na nuvem (app_data) — precisa estar em SYNC_KEYS
  private readonly STORAGE_KEY = 'vertentes_links';

  private getLinks(): UsefulLink[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error("Error parsing useful links", e);
      }
    }
    // Default links
    return [
      { id: '1', title: 'Drive EJs', url: '#', category: 'Documentos' },
      { id: '2', title: 'Planilha de Metas', url: '#', category: 'Documentos' },
    ];
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

  public add(link: Omit<UsefulLink, 'id'>) {
    const links = this.getLinks();
    const newLink = { ...link, id: Date.now().toString() };
    links.push(newLink);
    this.save(links);
  }

  public update(id: string, updatedFields: Partial<UsefulLink>) {
    const links = this.getLinks();
    const index = links.findIndex(l => l.id === id);
    if (index !== -1) {
      links[index] = { ...links[index], ...updatedFields };
      this.save(links);
    }
  }

  public remove(id: string) {
    const links = this.getLinks();
    const filtered = links.filter(l => l.id !== id);
    this.save(filtered);
  }

  private save(links: UsefulLink[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(links));
    syncToCloud(this.STORAGE_KEY, links);
    window.dispatchEvent(new Event('linksStoreUpdated'));
  }
}

export const linksStore = new LinksStore();
