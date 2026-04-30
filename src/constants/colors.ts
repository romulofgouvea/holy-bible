/**
 * Color system for Holy Bible app.
 * Standardized to 12 main theme tokens.
 */

export type ThemeColors = {
  // Primary colors
  primary: string;
  primaryVariant: string;

  // Secondary colors (Accents)
  secondary: string;
  secondaryVariant: string;

  // Interface colors
  background: string;
  surface: string;
  error: string;

  // Contrast colors (On-colors)
  onPrimary: string;
  onSecondary: string;
  onBackground: string;
  onSurface: string;
  onError: string;
};

/**
 * Common colors that don't change per theme
 */
export const COMMON_COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

/**
 * Bible Verse Highlight Colors (Move out of theme to separate context)
 */
export const VERSE_HIGHLIGHTS = [
  { id: 'yellow', hex: '#fde047', label: 'Amarelo' },
  { id: 'blue', hex: '#93c5fd', label: 'Azul' },
  { id: 'green', hex: '#86efac', label: 'Verde' },
  { id: 'pink', hex: '#f9a8d4', label: 'Rosa' },
];

/**
 * UI Support Colors (Derived or fixed)
 * These can be used alongside the 12 theme colors
 */
export const getSupportColors = (colors: ThemeColors, isDarkMode: boolean) => ({
  border: isDarkMode ? colors.primary + '30' : colors.primary + '20',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  textMuted: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
  surfaceHighlight: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)',
});

const DARK_BASE = {
  background: '#2d2d2d',
  surface: '#3d3d3d',
  error: '#FF5252',
  onBackground: '#FFFFFF',
  onSurface: '#FFFFFF',
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
  background: '#EAE0C8',
  surface: '#E1D6BD',
  error: '#8B0000',
  onPrimary: '#EAE0C8',
  onSecondary: '#EAE0C8',
  onBackground: '#4A3B32',
  onSurface: '#4A3B32',
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
      secondaryVariant: '#004D40',
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
      primary: '#A0A7B0',
      primaryVariant: '#394047',
      secondary: '#606770',
      secondaryVariant: '#1C1E21',
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
      primary: '#B768FF',
      primaryVariant: '#820AD1',
      secondary: '#820AD1',
      secondaryVariant: '#280066',
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
      primary: '#73A5F8',
      primaryVariant: '#1877F2',
      secondary: '#1877F2',
      secondaryVariant: '#053170',
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
      primary: '#FFA76B',
      primaryVariant: '#f37321',
      secondary: '#f37321',
      secondaryVariant: '#521D00',
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
      primary: '#5EEA8F',
      primaryVariant: '#1DB954',
      secondary: '#1DB954',
      secondaryVariant: '#0B5222',
      onPrimary: '#FFFFFF',
      onSecondary: '#FFFFFF',
    },
  },
};
