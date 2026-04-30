import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import { COLOR_THEMES, ThemeColors, sepiaColors } from '../constants/colors';
import { STORAGE_KEYS } from '../constants/storage';
import { useTheme } from './use-theme';

export type ReaderTheme = 'light' | 'dark' | 'sepia';
export type ReaderFont = 'poppins' | 'monospace';
export type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify';

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
        const [savedFontSize, savedAlign, savedTheme, savedFont] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.FONT_SIZE),
          AsyncStorage.getItem(STORAGE_KEYS.TEXT_ALIGN),
          AsyncStorage.getItem(STORAGE_KEYS.READER_THEME),
          AsyncStorage.getItem(STORAGE_KEYS.READER_FONT),
        ]);

        if (savedFontSize !== null) setFontSizeMultiplierState(Number(savedFontSize));
        if (savedAlign !== null) setTextAlignState(savedAlign as TextAlign);
        if (savedTheme !== null) setReaderThemeState(savedTheme as ReaderTheme);
        if (savedFont !== null) setReaderFontState(savedFont as ReaderFont);
      } catch (e) { }
      setLoaded(true);
    })();
  }, []);

  const setFontSizeMultiplier = useCallback(async (val: number) => {
    setFontSizeMultiplierState(val);
    try { await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, String(val)); } catch (e) { }
  }, []);

  const setTextAlign = useCallback(async (val: TextAlign) => {
    setTextAlignState(val);
    try { await AsyncStorage.setItem(STORAGE_KEYS.TEXT_ALIGN, val); } catch (e) { }
  }, []);

  const setReaderTheme = useCallback(async (val: ReaderTheme) => {
    setReaderThemeState(val);
    try { await AsyncStorage.setItem(STORAGE_KEYS.READER_THEME, val); } catch (e) { }
  }, []);

  const setReaderFont = useCallback(async (val: ReaderFont) => {
    setReaderFontState(val);
    try { await AsyncStorage.setItem(STORAGE_KEYS.READER_FONT, val); } catch (e) { }
  }, []);

  const value = useMemo(() => {
    const activePalette = COLOR_THEMES[colorTheme] || COLOR_THEMES.teal;
    const readerColors = readerTheme === 'sepia' 
      ? sepiaColors 
      : (readerTheme === 'dark' ? activePalette.dark : activePalette.light);
    
    const readerFontFamily = readerFont === 'monospace' 
      ? (Platform.OS === 'ios' ? 'Courier' : 'monospace') 
      : 'Poppins_400Regular';

    return {
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
    };
  }, [
    colorTheme, 
    fontSizeMultiplier, 
    textAlign, 
    readerTheme, 
    readerFont, 
    setFontSizeMultiplier, 
    setTextAlign, 
    setReaderTheme, 
    setReaderFont
  ]);

  if (!loaded) return null;

  return (
    <ReaderSettingsContext.Provider value={value}>
      {children}
    </ReaderSettingsContext.Provider>
  );
};

export const useReaderSettings = () => useContext(ReaderSettingsContext);
