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

const lightColors: ThemeColors = {
  background: '#F4F7F7',
  surface: '#FFFFFF',
  surfaceVariant: '#E4E9E9',
  primary: '#008080',
  onPrimary: '#FFFFFF',
  primaryContainer: '#CCECEC',
  onPrimaryContainer: '#002727',
  text: '#191C1C',
  textMuted: '#5A6464',
  border: '#C4CACA',
};

const darkColors: ThemeColors = {
  background: '#111414',
  surface: '#1C2020',
  surfaceVariant: '#2F3636',
  primary: '#5CE5E5',
  onPrimary: '#003737',
  primaryContainer: '#004F4F',
  onPrimaryContainer: '#9CF2F2',
  text: '#E0E3E3',
  textMuted: '#A0A8A8',
  border: '#6F7979',
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
