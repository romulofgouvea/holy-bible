export type ThemeColors = {
  primary: string;
  primaryVariant: string;

  secondary: string;
  secondaryVariant: string;

  background: string;
  surface: string;
  error: string;

  onPrimary: string;
  onSecondary: string;
  onBackground: string;
  onSurface: string;
  onError: string;
};

export const COMMON_COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const VERSE_HIGHLIGHTS = [
  { id: 'yellow', hex: '#FFEB3B', label: 'Amarelo' },
  { id: 'red', hex: '#FF8A80', label: 'Vermelho' },
  { id: 'green', hex: '#A5D6A7', label: 'Verde' },
  { id: 'blue', hex: '#90CAF9', label: 'Azul' },
  { id: 'orange', hex: '#FFCC80', label: 'Laranja' },
  { id: 'pink', hex: '#F48FB1', label: 'Rosa' },
  { id: 'purple', hex: '#CE93D8', label: 'Roxo' },
];

export const getSupportColors = (colors: ThemeColors, isDarkMode: boolean) => ({
  border: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.7)',
  textMuted: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
  surfaceHighlight: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
});

const DARK_BASE = {
  background: '#222222',
  surface: '#333333',
  error: '#FF5252',
  onBackground: '#E9ECEF',
  onSurface: '#E9ECEF',
  onError: '#FFFFFF',
};

const LIGHT_BASE = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  error: '#B00020',
  onBackground: '#1C1E21',
  onSurface: '#1C1E21',
  onError: '#FFFFFF',
};

export type ColorThemeKey = 'teal' | 'gray' | 'purple' | 'blue' | 'orange' | 'green';

export const sepiaColors: ThemeColors = {
  primary: '#5C4033',
  primaryVariant: '#4A3B32',
  secondary: '#7A6354',
  secondaryVariant: '#D8CCB2',
  background: '#FBF0D9',
  surface: '#F2E7D2',
  error: '#8B0000',
  onPrimary: '#FBF0D9',
  onSecondary: '#FBF0D9',
  onBackground: '#3F2B1B',
  onSurface: '#3F2B1B',
  onError: '#FFFFFF',
};

export const COLOR_THEMES: Record<ColorThemeKey, { label: string; swatch: string; light: ThemeColors; dark: ThemeColors }> = {
  teal: {
    label: 'Teal',
    swatch: '#008080',
    light: {
      ...LIGHT_BASE,
      primary: '#008080',
      primaryVariant: '#004D40',
      secondary: '#4DB6AC',
      secondaryVariant: '#B2DFDB',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
    },
    dark: {
      ...DARK_BASE,
      primary: '#008080',
      primaryVariant: '#004D40',
      secondary: '#4DB6AC',
      secondaryVariant: '#002D2D',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
    },
  },
  gray: {
    label: 'Cinza',
    swatch: '#606770',
    light: {
      ...LIGHT_BASE,
      primary: '#606770',
      primaryVariant: '#394047',
      secondary: '#A0A7B0',
      secondaryVariant: '#E4E6E9',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
    },
    dark: {
      ...DARK_BASE,
      primary: '#606770',
      primaryVariant: '#394047',
      secondary: '#ADB5BD',
      secondaryVariant: '#212529',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
    },
  },
  purple: {
    label: 'Roxo',
    swatch: '#820AD1',
    light: {
      ...LIGHT_BASE,
      primary: '#820AD1',
      primaryVariant: '#4406A1',
      secondary: '#B768FF',
      secondaryVariant: '#E6CFFF',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
    },
    dark: {
      ...DARK_BASE,
      primary: '#820AD1',
      primaryVariant: '#4406A1',
      secondary: '#B768FF',
      secondaryVariant: '#1D0033',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
    },
  },
  blue: {
    label: 'Azul',
    swatch: '#1877F2',
    light: {
      ...LIGHT_BASE,
      primary: '#1877F2',
      primaryVariant: '#0A57C2',
      secondary: '#73A5F8',
      secondaryVariant: '#D0E3FC',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
    },
    dark: {
      ...DARK_BASE,
      primary: '#1877F2',
      primaryVariant: '#0A57C2',
      secondary: '#73A5F8',
      secondaryVariant: '#051E3D',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
    },
  },
  orange: {
    label: 'Laranja',
    swatch: '#f37321',
    light: {
      ...LIGHT_BASE,
      primary: '#f37321',
      primaryVariant: '#B84F0E',
      secondary: '#FFA76B',
      secondaryVariant: '#FFE3D1',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
    },
    dark: {
      ...DARK_BASE,
      primary: '#f37321',
      primaryVariant: '#B84F0E',
      secondary: '#FFA76B',
      secondaryVariant: '#3D1B00',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
    },
  },
  green: {
    label: 'Verde',
    swatch: '#1DB954',
    light: {
      ...LIGHT_BASE,
      primary: '#1DB954',
      primaryVariant: '#10853B',
      secondary: '#5EEA8F',
      secondaryVariant: '#D1F4DB',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
    },
    dark: {
      ...DARK_BASE,
      primary: '#1DB954',
      primaryVariant: '#10853B',
      secondary: '#5EEA8F',
      secondaryVariant: '#0A2D16',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
    },
  },
};