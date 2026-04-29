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

export type ColorThemeKey =
  | 'teal'
  | 'blue'
  | 'yellow'
  | 'purple'
  | 'red'
  | 'gray';

export type ColorThemeMeta = {
  key: ColorThemeKey;
  label: string;
  swatch: string;
  swatchDark: string;
  light: ThemeColors;
  dark: ThemeColors;
};

export const COLOR_THEMES: ColorThemeMeta[] = [

  {
    key: 'teal',
    label: 'Verde',
    swatch: '#008080',
    swatchDark: '#4DB6AC',
    light: {
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
    },
    dark: {
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
    },
  },

  {
    key: 'blue',
    label: 'Azul',
    swatch: '#1877F2',
    swatchDark: '#4A9FF5',
    light: {
      background: '#F0F2F5',
      surface: '#FFFFFF',
      surfaceVariant: '#E7F0FD',
      primary: '#1877F2',
      onPrimary: '#FFFFFF',
      primaryContainer: '#D9EAFF',
      onPrimaryContainer: '#0A3D91',
      text: '#1C1E21',
      textMuted: '#65676B',
      border: '#C8D3E0',
    },
    dark: {
      background: '#18191A',
      surface: '#242526',
      surfaceVariant: '#1D2F4A',
      primary: '#4A9FF5',
      onPrimary: '#002E6E',
      primaryContainer: '#0A3D91',
      onPrimaryContainer: '#D9EAFF',
      text: '#E4E6EB',
      textMuted: '#B0B3B8',
      border: '#2A3A4E',
    },
  },

  {
    key: 'yellow',
    label: 'Amarelo',
    swatch: '#F5A623',
    swatchDark: '#FFD23F',
    light: {
      background: '#FFFBF0',
      surface: '#FFFFFF',
      surfaceVariant: '#FFF3C4',
      primary: '#C97B00',
      onPrimary: '#FFFFFF',
      primaryContainer: '#FFEEBB',
      onPrimaryContainer: '#6B4200',
      text: '#1C1E21',
      textMuted: '#7A6840',
      border: '#E8D8A0',
    },
    dark: {
      background: '#1A1700',
      surface: '#242100',
      surfaceVariant: '#2E2A00',
      primary: '#FFD23F',
      onPrimary: '#3D2E00',
      primaryContainer: '#5C4600',
      onPrimaryContainer: '#FFE78F',
      text: '#F5EFDA',
      textMuted: '#B8AB80',
      border: '#3A3300',
    },
  },

  {
    key: 'purple',
    label: 'Roxo',
    swatch: '#8A05BE',
    swatchDark: '#C77DFF',
    light: {
      background: '#F5F0FB',
      surface: '#FFFFFF',
      surfaceVariant: '#EEE1FA',
      primary: '#8A05BE',
      onPrimary: '#FFFFFF',
      primaryContainer: '#E8CEFF',
      onPrimaryContainer: '#450065',
      text: '#1C1E21',
      textMuted: '#6B5A7B',
      border: '#D4BCEC',
    },
    dark: {
      background: '#180A20',
      surface: '#22112E',
      surfaceVariant: '#311840',
      primary: '#C77DFF',
      onPrimary: '#3C0065',
      primaryContainer: '#5A009A',
      onPrimaryContainer: '#ECDCFF',
      text: '#EDE0F5',
      textMuted: '#B8A0C8',
      border: '#3E2050',
    },
  },

  {
    key: 'red',
    label: 'Vermelho',
    swatch: '#E31937',
    swatchDark: '#FF6B7A',
    light: {
      background: '#FBF0F1',
      surface: '#FFFFFF',
      surfaceVariant: '#FAE0E3',
      primary: '#C8102E',
      onPrimary: '#FFFFFF',
      primaryContainer: '#FFD9DC',
      onPrimaryContainer: '#6D0015',
      text: '#1C1E21',
      textMuted: '#7A5A5C',
      border: '#E8C0C3',
    },
    dark: {
      background: '#200A0C',
      surface: '#2A1014',
      surfaceVariant: '#3A1518',
      primary: '#FF6B7A',
      onPrimary: '#5C0010',
      primaryContainer: '#8B001A',
      onPrimaryContainer: '#FFDADC',
      text: '#F5E0E2',
      textMuted: '#C8A0A3',
      border: '#4A1A1E',
    },
  },

  {
    key: 'gray',
    label: 'Cinza',
    swatch: '#607080',
    swatchDark: '#9EAFC0',
    light: {
      background: '#EDEEF0',
      surface: '#FFFFFF',
      surfaceVariant: '#E0E3E8',
      primary: '#455A6A',
      onPrimary: '#FFFFFF',
      primaryContainer: '#D0DBE5',
      onPrimaryContainer: '#1C2D3A',
      text: '#1C1E21',
      textMuted: '#60686F',
      border: '#C5CBD2',
    },
    dark: {
      background: '#141618',
      surface: '#1E2124',
      surfaceVariant: '#2C3036',
      primary: '#9EAFC0',
      onPrimary: '#1A2A36',
      primaryContainer: '#2A3A48',
      onPrimaryContainer: '#C8D8E8',
      text: '#E0E4EA',
      textMuted: '#8A9199',
      border: '#363C42',
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
