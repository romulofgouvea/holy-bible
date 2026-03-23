import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../constants/storage';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceVariant: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  text: string;
  textMuted: string;
  border: string;
};

export const lightColors: ThemeColors = {
  background: '#F0F2F5',
  surface: '#FFFFFF',
  surfaceVariant: '#E4E6EB',
  primary: '#008080',
  onPrimary: '#FFFFFF',
  primaryContainer: '#E0F2F1',
  onPrimaryContainer: '#004D40',
  text: '#1C1E21',
  textMuted: '#65676B',
  border: '#CED0D4',
};

export const darkColors: ThemeColors = {
  background: '#18191A',
  surface: '#242526',
  surfaceVariant: '#3A3B3C',
  primary: '#4DB6AC',
  onPrimary: '#00332E',
  primaryContainer: '#004D40',
  onPrimaryContainer: '#B2DFDB',
  text: '#E4E6EB',
  textMuted: '#B0B3B8',
  border: '#3E4042',
};

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: (value?: boolean) => void;
  colors: ThemeColors;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE);
        if (saved !== null) setIsDarkMode(saved === 'true');
      } catch (e) { }
      setLoaded(true);
    })();
  }, []);

  const toggleDarkMode = async (value?: boolean) => {
    const nextVal = value !== undefined ? value : !isDarkMode;
    setIsDarkMode(nextVal);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, String(nextVal));
    } catch (e) { }
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      toggleDarkMode,
      colors: isDarkMode ? darkColors : lightColors
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
