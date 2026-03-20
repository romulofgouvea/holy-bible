import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type Block =
  | { id: string; type: 'paragraph' | 'h1' | 'h2' | 'header'; content: string }
  | { id: string; type: 'verse'; content: string; verseRef: string; bookName: string; chapter: number; verse: number }
  | { id: string; type: 'image'; uri: string; caption: string }
  | { id: string; type: 'video'; url: string; title: string };

export type Study = {
  id: string;
  title: string;
  createdAt: string;
  blocks: Block[];
};

const STORAGE_KEY = 'holy-bible-studies';

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function makeBlock(type: Block['type'] = 'paragraph'): Block {
  if (type === 'verse')  return { id: makeId(), type: 'verse',  content: '', verseRef: '', bookName: '', chapter: 0, verse: 0 };
  if (type === 'image')  return { id: makeId(), type: 'image',  uri: '', caption: '' };
  if (type === 'video')  return { id: makeId(), type: 'video',  url: '', title: '' };
  return { id: makeId(), type: type as 'paragraph' | 'h1' | 'h2' | 'header', content: '' };
}

export function useStudies() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setStudies(JSON.parse(raw));
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
      createdAt: new Date().toLocaleDateString('pt-BR'),
      blocks: [
        { id: makeId(), type: 'paragraph', content: description || '' }
      ],
    };
    persist([study, ...studies]);
    return study.id;
  }, [studies, persist]);

  const importStudy = useCallback((imported: Partial<Study>) => {
    const study: Study = {
      id: imported.id || makeId(),
      title: imported.title || 'Estudo Importado',
      createdAt: imported.createdAt || new Date().toLocaleDateString('pt-BR'),
      blocks: imported.blocks && imported.blocks.length ? imported.blocks : [makeBlock('paragraph')],
    };
    persist([study, ...studies]);
    return study.id;
  }, [studies, persist]);

  const importBulk = useCallback((importedStudies: Study[]) => {
    const existingIds = new Set(studies.map(s => s.id));
    const newStudies = importedStudies.filter(s => s.id && s.title && s.blocks && !existingIds.has(s.id));
    if (newStudies.length > 0) {
      persist([...newStudies, ...studies]);
    }
    return newStudies.length;
  }, [studies, persist]);

  const updateStudy = useCallback((id: string, blocks: Block[], title?: string) => {
    persist(studies.map((s) =>
      s.id === id ? { ...s, blocks, ...(title !== undefined ? { title } : {}) } : s
    ));
  }, [studies, persist]);

  const deleteStudy = useCallback((id: string) => {
    persist(studies.filter((s) => s.id !== id));
  }, [studies, persist]);

  const getStudy = useCallback((id: string) => {
    return studies.find((s) => s.id === id);
  }, [studies]);

  return { studies, loaded, createStudy, importStudy, importBulk, updateStudy, deleteStudy, getStudy };
}
