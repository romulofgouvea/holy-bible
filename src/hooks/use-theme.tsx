import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../constants/storage';

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceVariant: string;
  primary: string;
  systemBar: string;
  accent: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  text: string;
  textMuted: string;
  border: string;
};

export type ColorThemeKey =
  | 'teal'
  | 'gray'
  | 'purple'
  | 'blue'
  | 'orange'
  | 'green';

export type ColorThemeMeta = {
  key: ColorThemeKey;
  label: string;
  swatch: string;
  swatchDark: string;
  light: ThemeColors;
  dark: ThemeColors;
};


const DARK_BASE = {
  background: '#252728',
  surface: '#333536',
  surfaceVariant: '#424446',
  text: '#F5F5F5',
  textMuted: '#A0A5AA',
  border: '#4A4C4E',
};


const LIGHT_BASE = {
  background: '#F0F2F5',
  surface: '#FFFFFF',
  surfaceVariant: '#E4E6E9',
  text: '#1C1E21',
  textMuted: '#606770',
  border: '#CCD0D5',
};

export const COLOR_THEMES: ColorThemeMeta[] = [
  {
    key: 'teal',
    label: 'Teal',
    swatch: '#008080',
    swatchDark: '#4DB6AC',
    light: {
      ...LIGHT_BASE,
      primary: '#008080',
      systemBar: '#004D40',
      accent: '#4DB6AC',
      onPrimary: '#FFFFFF',
      primaryContainer: '#B2DFDB',
      onPrimaryContainer: '#004D40',
    },
    dark: {
      ...DARK_BASE,
      primary: '#008080',
      systemBar: '#004D40',
      accent: '#4DB6AC',
      onPrimary: '#FFFFFF',
      primaryContainer: '#004D40',
      onPrimaryContainer: '#B2DFDB',
    },
  },
  {
    key: 'gray',
    label: 'Cinza',
    swatch: '#606770',
    swatchDark: '#A0A7B0',
    light: {
      ...LIGHT_BASE,
      primary: '#606770',
      systemBar: '#394047',
      accent: '#A0A7B0',
      onPrimary: '#FFFFFF',
      primaryContainer: '#E4E6E9',
      onPrimaryContainer: '#1C1E21',
    },
    dark: {
      ...DARK_BASE,
      primary: '#A0A7B0',
      systemBar: '#394047',
      accent: '#a4b0c1ff',
      onPrimary: '#FFFFFF',
      primaryContainer: '#1C1E21',
      onPrimaryContainer: '#E4E6E9',
    },
  },
  {
    key: 'purple',
    label: 'Roxo',
    swatch: '#820AD1',
    swatchDark: '#B768FF',
    light: {
      ...LIGHT_BASE,
      primary: '#820AD1',
      systemBar: '#4406A1',
      accent: '#B768FF',
      onPrimary: '#FFFFFF',
      primaryContainer: '#E6CFFF',
      onPrimaryContainer: '#280066',
    },
    dark: {
      ...DARK_BASE,
      primary: '#820AD1',
      systemBar: '#4406A1',
      accent: '#B768FF',
      onPrimary: '#FFFFFF',
      primaryContainer: '#280066',
      onPrimaryContainer: '#E6CFFF',
    },
  },
  {
    key: 'blue',
    label: 'Azul',
    swatch: '#1877F2',
    swatchDark: '#73A5F8',
    light: {
      ...LIGHT_BASE,
      primary: '#1877F2',
      systemBar: '#0A57C2',
      accent: '#73A5F8',
      onPrimary: '#FFFFFF',
      primaryContainer: '#D0E3FC',
      onPrimaryContainer: '#053170',
    },
    dark: {
      ...DARK_BASE,
      primary: '#1877F2',
      systemBar: '#0A57C2',
      accent: '#73A5F8',
      onPrimary: '#FFFFFF',
      primaryContainer: '#053170',
      onPrimaryContainer: '#D0E3FC',
    },
  },
  {
    key: 'orange',
    label: 'Laranja',
    swatch: '#f37321',
    swatchDark: '#FFA76B',
    light: {
      ...LIGHT_BASE,
      primary: '#f37321',
      systemBar: '#B84F0E',
      accent: '#FFA76B',
      onPrimary: '#FFFFFF',
      primaryContainer: '#FFE3D1',
      onPrimaryContainer: '#521D00',
    },
    dark: {
      ...DARK_BASE,
      primary: '#f37321',
      systemBar: '#B84F0E',
      accent: '#FFA76B',
      onPrimary: '#FFFFFF',
      primaryContainer: '#521D00',
      onPrimaryContainer: '#FFE3D1',
    },
  },
  {
    key: 'green',
    label: 'Verde',
    swatch: '#1DB954',
    swatchDark: '#5EEA8F',
    light: {
      ...LIGHT_BASE,
      primary: '#1DB954',
      systemBar: '#10853B',
      accent: '#5EEA8F',
      onPrimary: '#FFFFFF',
      primaryContainer: '#D1F4DB',
      onPrimaryContainer: '#0B5222',
    },
    dark: {
      ...DARK_BASE,
      primary: '#1DB954',
      systemBar: '#10853B',
      accent: '#5EEA8F',
      onPrimary: '#FFFFFF',
      primaryContainer: '#0B5222',
      onPrimaryContainer: '#D1F4DB',
    },
  },
];

export const lightColors = COLOR_THEMES[0].light;
export const darkColors = COLOR_THEMES[0].dark;

type ThemeContextType = {
  isDarkMode: boolean;
  toggleDarkMode: (value?: boolean) => void;
  colors: ThemeColors;
  colorTheme: ColorThemeKey;
  setColorTheme: (key: ColorThemeKey) => void;
  colorThemes: ColorThemeMeta[];
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
        if (savedTheme && COLOR_THEMES.some(t => t.key === savedTheme)) {
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

  const activePalette = COLOR_THEMES.find(t => t.key === colorTheme) ?? COLOR_THEMES[0];
  const colors = isDarkMode ? activePalette.dark : activePalette.light;

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      toggleDarkMode,
      colors,
      colorTheme,
      setColorTheme,
      colorThemes: COLOR_THEMES,
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
