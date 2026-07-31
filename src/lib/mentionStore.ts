import { supabase } from "@/integrations/supabase/client";
import { syncToCloud } from "./cloudSync";

export interface Mention {
  id: string;
  guardianName: string;
  ejName: string;
  contextText: string;
  source: "Reunião" | "Dailys";
  date: string;
  read: boolean;
}

const STORE_KEY = 'sweet_spot_mentions';

export const mentionStore = {
  getMentions: (): Mention[] => {
    if (typeof window !== 'undefined') {
      try {
        const data = localStorage.getItem(STORE_KEY);
        if (data) {
          return JSON.parse(data) || [];
        }
      } catch (e) {
        console.error("Failed to load mentions", e);
      }
    }
    return [];
  },

  addMention: (mention: Omit<Mention, 'id' | 'date' | 'read'>) => {
    if (typeof window !== 'undefined') {
      try {
        const mentions = mentionStore.getMentions();
        const newMention: Mention = {
          ...mention,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          read: false
        };
        mentions.push(newMention);
        localStorage.setItem(STORE_KEY, JSON.stringify(mentions));
        syncToCloud(STORE_KEY, mentions);
        window.dispatchEvent(new Event('mentionsUpdated'));

        // Disparar notificação pro usuário no Supabase
        supabase.from('profiles').select('id').eq('guardian_name', mention.guardianName).maybeSingle().then(({ data }) => {
          if (data && data.id) {
            supabase.from('notifications').insert({
              user_id: data.id,
              title: 'Você foi mencionado!',
              content: `Mencionado na EJ ${mention.ejName} (${mention.source}): "${mention.contextText}"`,
              type: 'mention'
            }).then();
          }
        });
      } catch (e) {
        console.error("Failed to add mention", e);
      }
    }
  },

  markAsRead: (id: string) => {
    if (typeof window !== 'undefined') {
      const mentions = mentionStore.getMentions();
      const idx = mentions.findIndex(m => m.id === id);
      if (idx !== -1) {
        mentions[idx].read = true;
        localStorage.setItem(STORE_KEY, JSON.stringify(mentions));
        syncToCloud(STORE_KEY, mentions);
        window.dispatchEvent(new Event('mentionsUpdated'));
      }
    }
  },

  extractAndSaveMentions: (text: string, ejName: string, source: "Reunião" | "Dailys") => {
    // Basic extraction: finding any word/phrase prefixed with @
    const regex = /@([A-Za-zÀ-ÖØ-öø-ÿ0-9_]+(?:\s[A-Za-zÀ-ÖØ-öø-ÿ0-9_]+)*)/g;
    let match;
    const mentionsFound = new Set<string>();

    while ((match = regex.exec(text)) !== null) {
      // The matched name
      const rawName = match[1].trim();
      if (!mentionsFound.has(rawName) && rawName.length > 0) {
        mentionsFound.add(rawName);
        
        // Find a context string (e.g. up to 40 chars before and after)
        const start = Math.max(0, match.index - 40);
        const end = Math.min(text.length, match.index + match[0].length + 40);
        let contextText = text.substring(start, end).replace(/\n/g, ' ').trim();
        if (start > 0) contextText = '...' + contextText;
        if (end < text.length) contextText = contextText + '...';

        mentionStore.addMention({
          guardianName: rawName,
          ejName,
          contextText,
          source
        });
      }
    }
  }
};
