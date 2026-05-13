import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const HISTORY_KEY = '@bible_history';

export type HistoryItem = {
  version: string;
  bookName: string;
  bookAbbrev: string;
  chapter: number;
  verse: number;
  timestamp: number;
};

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }, []);

  const addHistoryEntry = useCallback(async (entry: Omit<HistoryItem, 'timestamp'>) => {
    try {
      const stored = await AsyncStorage.getItem(HISTORY_KEY);
      let currentHistory: HistoryItem[] = stored ? JSON.parse(stored) : [];


      currentHistory = currentHistory.filter(
        item => !(
          item.version === entry.version &&
          item.bookAbbrev === entry.bookAbbrev &&
          item.chapter === entry.chapter &&
          item.verse === entry.verse
        )
      );

      const newEntry: HistoryItem = { ...entry, timestamp: Date.now() };
      const newHistory = [newEntry, ...currentHistory].slice(0, 50);

      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (e) {
      console.error('Failed to save history', e);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    await AsyncStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return { history, addHistoryEntry, clearHistory, loadHistory };
}
