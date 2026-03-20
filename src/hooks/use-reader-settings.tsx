import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { darkColors, lightColors, ThemeColors } from './use-theme';

export type ReaderTheme = 'light' | 'dark' | 'sepia';
export type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify';

export const sepiaColors: ThemeColors = {
  background: '#EAE0C8',
  surface: '#E1D6BD',
  surfaceVariant: '#D8CCB2',
  primary: '#5C4033',
  onPrimary: '#EAE0C8',
  primaryContainer: '#D8CCB2',
  onPrimaryContainer: '#3E2A1F',
  text: '#4A3B32',
  textMuted: '#7A6354',
  border: '#CDBE9F',
};

export type ReaderSettingsContextType = {
  fontSizeMultiplier: number;
  setFontSizeMultiplier: (val: number) => void;
  textAlign: TextAlign;
  setTextAlign: (val: TextAlign) => void;
  readerTheme: ReaderTheme;
  setReaderTheme: (val: ReaderTheme) => void;
  readerColors: ThemeColors;
};

const ReaderSettingsContext = createContext<ReaderSettingsContextType>({} as ReaderSettingsContextType);

export const ReaderSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [loaded, setLoaded] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplierState] = useState(1);
  const [textAlign, setTextAlignState] = useState<TextAlign>('left');
  const [readerTheme, setReaderThemeState] = useState<ReaderTheme>('light');

  useEffect(() => {
    (async () => {
      try {
        const savedFontSize = await AsyncStorage.getItem('@bible_font_size');
        const savedAlign = await AsyncStorage.getItem('@bible_text_align');
        const savedTheme = await AsyncStorage.getItem('@bible_reader_theme');

        if (savedFontSize !== null) setFontSizeMultiplierState(Number(savedFontSize));
        if (savedAlign !== null) setTextAlignState(savedAlign as TextAlign);
        if (savedTheme !== null) setReaderThemeState(savedTheme as ReaderTheme);
      } catch (e) { }
      setLoaded(true);
    })();
  }, []);

  const setFontSizeMultiplier = async (val: number) => {
    setFontSizeMultiplierState(val);
    try { await AsyncStorage.setItem('@bible_font_size', String(val)); } catch (e) { }
  };

  const setTextAlign = async (val: TextAlign) => {
    setTextAlignState(val);
    try { await AsyncStorage.setItem('@bible_text_align', val); } catch (e) { }
  };

  const setReaderTheme = async (val: ReaderTheme) => {
    setReaderThemeState(val);
    try { await AsyncStorage.setItem('@bible_reader_theme', val); } catch (e) { }
  };

  const readerColors = readerTheme === 'sepia' ? sepiaColors : (readerTheme === 'dark' ? darkColors : lightColors);

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
        readerColors,
      }}
    >
      {children}
    </ReaderSettingsContext.Provider>
  );
};

export const useReaderSettings = () => useContext(ReaderSettingsContext);
