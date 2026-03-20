import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

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
  background: '#FEF7FF',
  surface: '#FFFFFF',
  surfaceVariant: '#E7E0EB',
  primary: '#820AD1',
  onPrimary: '#FFFFFF',
  primaryContainer: '#F0E5FF',
  onPrimaryContainer: '#2B0054',
  text: '#1D1B20',
  textMuted: '#49454F',
  border: '#CAC4D0',
};

export const darkColors: ThemeColors = {
  background: '#202124',
  surface: '#2D2E31',
  surfaceVariant: '#3C4043',
  primary: '#CFA7FF',
  onPrimary: '#46008B',
  primaryContainer: '#6500B9',
  onPrimaryContainer: '#F0E5FF',
  text: '#E8EAED',
  textMuted: '#9AA0A6',
  border: '#5F6368',
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
        const saved = await AsyncStorage.getItem('@bible_dark_mode');
        if (saved !== null) setIsDarkMode(saved === 'true');
      } catch (e) { }
      setLoaded(true);
    })();
  }, []);

  const toggleDarkMode = async (value?: boolean) => {
    const nextVal = value !== undefined ? value : !isDarkMode;
    setIsDarkMode(nextVal);
    try {
      await AsyncStorage.setItem('@bible_dark_mode', String(nextVal));
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
