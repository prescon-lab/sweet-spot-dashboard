import { supabase } from "@/integrations/supabase/client";
import { syncToCloud, deleteFromCloud } from "./cloudSync";

export interface Mention {
  id: string;
  guardianName: string;
  ejName: string;
  contextText: string;
  source: "Reunião" | "Dailys";
  date: string;
  read: boolean;
}

const OLD_STORE_KEY = 'sweet_spot_mentions';
const PREFIX = 'sweet_spot_mention_';

export const mentionStore = {
  getMentions: (): Mention[] => {
    if (typeof window !== 'undefined') {
      try {
        const mentions: Mention[] = [];
        
        const oldDataStr = localStorage.getItem(OLD_STORE_KEY);
        if (oldDataStr) {
          try {
            const oldMentions = JSON.parse(oldDataStr);
            if (Array.isArray(oldMentions)) {
              oldMentions.filter(Boolean).forEach((m: Mention) => {
                const key = `${PREFIX}${m.id}`;
                if (!localStorage.getItem(key)) {
                  localStorage.setItem(key, JSON.stringify(m));
                  syncToCloud(key, m);
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
              mentions.push(JSON.parse(localStorage.getItem(key) || '{}'));
            } catch(e) {}
          }
        }
        return mentions;
      } catch (e) {
        console.error("Failed to load mentions", e);
      }
    }
    return [];
  },

  addMention: (mention: Omit<Mention, 'id' | 'date' | 'read'>) => {
    if (typeof window !== 'undefined') {
      try {
        const newMention: Mention = {
          ...mention,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          read: false
        };
        const key = `${PREFIX}${newMention.id}`;
        localStorage.setItem(key, JSON.stringify(newMention));
        syncToCloud(key, newMention);
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
      try {
        const key = `${PREFIX}${id}`;
        const dataStr = localStorage.getItem(key);
        if (dataStr) {
          const mention: Mention = JSON.parse(dataStr);
          mention.read = true;
          localStorage.setItem(key, JSON.stringify(mention));
          syncToCloud(key, mention);
          window.dispatchEvent(new Event('mentionsUpdated'));
        }
      } catch(e) {
        console.error("Failed to mark as read", e);
      }
    }
  },

  extractAndSaveMentions: (text: string, ejName: string, source: "Reunião" | "Dailys") => {
    const regex = /@([A-Za-zÀ-ÖØ-öø-ÿ0-9_]+(?:\s[A-Za-zÀ-ÖØ-öø-ÿ0-9_]+)*)/g;
    let match;
    const mentionsFound = new Set<string>();

    while ((match = regex.exec(text)) !== null) {
      const rawName = match[1].trim();
      if (!mentionsFound.has(rawName) && rawName.length > 0) {
        mentionsFound.add(rawName);
        
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
