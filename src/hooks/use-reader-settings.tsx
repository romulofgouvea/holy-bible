import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { COLOR_THEMES, ThemeColors } from '../constants/colors';
import { STORAGE_KEYS } from '../constants/storage';
import { useTheme } from './use-theme';

export type ReaderTheme = 'light' | 'dark' | 'sepia';
export type ReaderFont = 'poppins' | 'monospace';
export type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify';

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

export type ReaderSettingsContextType = {
  fontSizeMultiplier: number;
  setFontSizeMultiplier: (val: number) => void;
  textAlign: TextAlign;
  setTextAlign: (val: TextAlign) => void;
  readerTheme: ReaderTheme;
  setReaderTheme: (val: ReaderTheme) => void;
  readerFont: ReaderFont;
  setReaderFont: (val: ReaderFont) => void;
  readerFontFamily: string;
  readerColors: ThemeColors;
};

const ReaderSettingsContext = createContext<ReaderSettingsContextType>({} as ReaderSettingsContextType);

export const ReaderSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const { colorTheme } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplierState] = useState(1);
  const [textAlign, setTextAlignState] = useState<TextAlign>('left');
  const [readerTheme, setReaderThemeState] = useState<ReaderTheme>('light');
  const [readerFont, setReaderFontState] = useState<ReaderFont>('poppins');

  useEffect(() => {
    (async () => {
      try {
        const savedFontSize = await AsyncStorage.getItem(STORAGE_KEYS.FONT_SIZE);
        const savedAlign = await AsyncStorage.getItem(STORAGE_KEYS.TEXT_ALIGN);
        const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.READER_THEME);
        const savedFont = await AsyncStorage.getItem(STORAGE_KEYS.READER_FONT);

        if (savedFontSize !== null) setFontSizeMultiplierState(Number(savedFontSize));
        if (savedAlign !== null) setTextAlignState(savedAlign as TextAlign);
        if (savedTheme !== null) setReaderThemeState(savedTheme as ReaderTheme);
        if (savedFont !== null) setReaderFontState(savedFont as ReaderFont);
      } catch (e) { }
      setLoaded(true);
    })();
  }, []);

  const setFontSizeMultiplier = async (val: number) => {
    setFontSizeMultiplierState(val);
    try { await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, String(val)); } catch (e) { }
  };

  const setTextAlign = async (val: TextAlign) => {
    setTextAlignState(val);
    try { await AsyncStorage.setItem(STORAGE_KEYS.TEXT_ALIGN, val); } catch (e) { }
  };

  const setReaderTheme = async (val: ReaderTheme) => {
    setReaderThemeState(val);
    try { await AsyncStorage.setItem(STORAGE_KEYS.READER_THEME, val); } catch (e) { }
  };

  const setReaderFont = async (val: ReaderFont) => {
    setReaderFontState(val);
    try { await AsyncStorage.setItem(STORAGE_KEYS.READER_FONT, val); } catch (e) { }
  };

  const activePalette = COLOR_THEMES[colorTheme] || COLOR_THEMES.teal;
  const readerColors = readerTheme === 'sepia' ? sepiaColors : (readerTheme === 'dark' ? activePalette.dark : activePalette.light);
  const readerFontFamily = readerFont === 'monospace' ? (Platform.OS === 'ios' ? 'Courier' : 'monospace') : 'Poppins_400Regular';

  if (!loaded) return null;

  return (
    <ReaderSettingsContext.Provider
      value={{
        fontSizeMultiplier,
        setFontSizeMultiplier,
        textAlign,
        setTextAlign,
        readerTheme,
        setReaderTheme,
        readerFont,
        setReaderFont,
        readerFontFamily,
        readerColors,
      }}
    >
      {children}
    </ReaderSettingsContext.Provider>
  );
};

export const useReaderSettings = () => useContext(ReaderSettingsContext);
