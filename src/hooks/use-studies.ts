import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type Study = {
  id: string;
  title: string;
  createdAt: string;
  timestamp?: number;
  content: string;
};

const STORAGE_KEY = 'holy-bible-studies';

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function migrateBlocksToHtml(blocks: any[]) {
  if (!blocks || !Array.isArray(blocks)) return '<p><br></p>';
  return blocks.map(b => {
    if (b.type === 'header') return `<h2>${b.content || ''}</h2>`;
    if (b.type === 'h1') return `<h3>${b.content || ''}</h3>`;
    if (b.type === 'h2') return `<h4>${b.content || ''}</h4>`;
    if (b.type === 'paragraph') return `<p>${b.content || '<br>'}</p>`;
    if (b.type === 'image') return `<img src="${b.uri || ''}" style="max-width:100%; border-radius:8px;"/>`;
    if (b.type === 'video') return `<a href="${b.url || ''}">🎬 ${b.title || ''}</a>`;
    if (b.type === 'verse') {
      const lines = (b.content || '').split('\n').map((line: string) => {
        const sp = line.indexOf(' ');
        if (sp === -1) return line;
        return `<div class="verse-line"><span class="verse-num">${line.slice(0, sp)}</span> <span class="verse-text">${line.slice(sp + 1)}</span></div>`;
      }).join('');
      return `<blockquote class="bible-verse"><b>${b.verseRef || ''}</b>${lines}</blockquote><p><br></p>`;
    }
    return '';
  }).join('') || '<p><br></p>';
}

export function useStudies() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const parsed = JSON.parse(raw);
        const migrated = parsed.map((s: any) => {
          if (s.blocks && (!s.content || s.content.trim() === '')) {
            s.content = migrateBlocksToHtml(s.blocks);
            delete s.blocks;
            return s as Study;
          }
          if (!s.content) s.content = '<p><br></p>';
          delete s.blocks;
          return s as Study;
        });
        setStudies(migrated);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const persist = useCallback((updated: Study[]) => {
    setStudies(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
  }, []);

  const createStudy = useCallback((title: string, description?: string) => {
    const study: Study = {
      id: makeId(),
      title,
      createdAt: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      timestamp: Date.now(),
      content: description ? `<p>${description}</p>` : '<p><br></p>',
    };
    persist([study, ...studies]);
    return study.id;
  }, [studies, persist]);

  const importBulk = useCallback((importedStudies: any[]) => {
    const existingIds = new Set(studies.map(s => s.id));
    const newStudies: Study[] = importedStudies.filter(s => s.id && s.title && (s.content !== undefined || s.blocks) && !existingIds.has(s.id)).map(s => {
      if (s.blocks && (!s.content || s.content.trim() === '')) {
        s.content = migrateBlocksToHtml(s.blocks);
      }
      if (!s.content) s.content = '<p><br></p>';
      delete s.blocks;
      return {
        id: s.id,
        title: s.title,
        createdAt: s.createdAt || new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
        timestamp: s.timestamp || Date.now(),
        content: s.content,
      };
    });
    
    if (newStudies.length > 0) {
      const combined = [...newStudies, ...studies];
      combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      persist(combined);
    }
    return newStudies.length;
  }, [studies, persist]);

  const updateStudy = useCallback((id: string, content: string, title?: string) => {
    persist(studies.map((s) =>
      s.id === id ? { ...s, content, ...(title !== undefined ? { title } : {}) } : s
    ));
  }, [studies, persist]);

  const deleteStudy = useCallback((id: string) => {
    persist(studies.filter((s) => s.id !== id));
  }, [studies, persist]);

  const getStudy = useCallback((id: string) => {
    return studies.find((s) => s.id === id);
  }, [studies]);

  return { studies, loaded, createStudy, importBulk, updateStudy, deleteStudy, getStudy };
}
