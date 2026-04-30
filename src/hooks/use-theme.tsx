import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../constants/storage';

import {
  COLOR_THEMES,
  ColorThemeKey,
  COMMON_COLORS,
  getSupportColors,
  ThemeColors
} from '../constants/colors';

export { ColorThemeKey, ThemeColors };

export type ColorThemeMeta = {
  key: ColorThemeKey;
  label: string;
  swatch: string;
  light: ThemeColors;
  dark: ThemeColors;
};

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: (value?: boolean) => void;
  colors: ThemeColors & ReturnType<typeof getSupportColors>;
  colorTheme: ColorThemeKey;
  setColorTheme: (key: ColorThemeKey) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colorTheme, setColorThemeState] = useState<ColorThemeKey>('teal');

  useEffect(() => {
    (async () => {
      try {
        const [savedDark, savedTheme] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.DARK_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.APP_COLOR_THEME),
        ]);
        if (savedDark !== null) setIsDarkMode(savedDark === 'true');
        if (savedTheme && Object.keys(COLOR_THEMES).includes(savedTheme)) {
          setColorThemeState(savedTheme as ColorThemeKey);
        }
      } catch (e) { }
    })();
  }, []);

  const toggleDarkMode = async (value?: boolean) => {
    const nextVal = value !== undefined ? value : !isDarkMode;
    setIsDarkMode(nextVal);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DARK_MODE, String(nextVal));
    } catch (e) { }
  };

  const setColorTheme = async (key: ColorThemeKey) => {
    setColorThemeState(key);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_COLOR_THEME, key);
    } catch (e) { }
  };

  const activePalette = COLOR_THEMES[colorTheme] || COLOR_THEMES.teal;
  const themeColors = isDarkMode ? activePalette.dark : activePalette.light;
  const colors = {
    ...themeColors,
    ...getSupportColors(themeColors, isDarkMode),
    ...COMMON_COLORS,
  };

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      toggleDarkMode,
      colors,
      colorTheme,
      setColorTheme
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
