import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { STORAGE_KEYS } from '../constants/storage';
import { BACKUP_RESTORED_EVENT } from '../utils/backup';
import { HistoryItem } from '../models';
export type { HistoryItem };

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.BIBLE_HISTORY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
    }
  }, []);

  const addHistoryEntry = useCallback(async (entry: Omit<HistoryItem, 'timestamp'>) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.BIBLE_HISTORY);
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

      await AsyncStorage.setItem(STORAGE_KEYS.BIBLE_HISTORY, JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (e) {
    }
  }, []);

  const clearHistory = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.BIBLE_HISTORY);
    setHistory([]);
  }, []);

  useEffect(() => {
    loadHistory();
    const sub = DeviceEventEmitter.addListener(BACKUP_RESTORED_EVENT, loadHistory);
    return () => sub.remove();
  }, [loadHistory]);

  return { history, addHistoryEntry, clearHistory, loadHistory };
}
