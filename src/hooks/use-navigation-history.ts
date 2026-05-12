import { useEffect, useRef } from 'react';
import { HistoryItem } from './use-history';

type NavPosition = {
  isReady: boolean;
  version: string;
  bookName: string;
  bookAbbrev: string;
  chapter: number;
  verse: number;
};

type AddHistoryEntry = (entry: Omit<HistoryItem, 'timestamp'>) => Promise<void>;

/**
 * Observa a posição de leitura (capítulo e versículo visíveis) e grava no histórico com debounce.
 * O debounce garante que só salvemos quando a posição estabilizar (usuário parou de rolar).
 */
export function useNavigationHistory(
  position: NavPosition,
  addHistoryEntry: AddHistoryEntry
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyRef = useRef<string>('');

  useEffect(() => {
    const { isReady, version, bookName, bookAbbrev, chapter, verse } = position;

    if (!isReady || !bookName || !bookAbbrev || !chapter) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const key = `${version}|${bookAbbrev}|${chapter}|${verse}`;
      if (key === lastKeyRef.current) return;
      lastKeyRef.current = key;

      addHistoryEntry({ version, bookName, bookAbbrev, chapter, verse });
    }, 1000); // Debounce de 1s para ser mais responsivo

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.isReady, position.version, position.bookAbbrev, position.chapter, position.verse]);
}
