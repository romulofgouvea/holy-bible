import { useState, useCallback, useMemo } from 'react';
import { availableVersions, getBibleData } from '../data';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';

export function useVersions() {
  const [currentVersion, setCurrentVersionState] = useState(availableVersions[0] || 'NAA');

  const setVersion = useCallback(async (v: string) => {
    setCurrentVersionState(v);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BIBLE_VERSION_GLOBAL, v);
    } catch (e) {}
  }, []);

  const versionOptions = useMemo(() => {
    return availableVersions.map(v => ({
      sigla: v,
      nome: v === 'NVI' ? 'Nova Versão Internacional' : v === 'ARA' ? 'Almeida Revista e Atualizada' : 'Nova Almeida Atualizada'
    }));
  }, []);

  const versionBooks = useMemo(() => {
    return getBibleData(currentVersion);
  }, [currentVersion]);

  return {
    currentVersion,
    setVersion,
    versionOptions,
    versionBooks,
  };
}
