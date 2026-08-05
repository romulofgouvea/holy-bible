import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { DeviceEventEmitter, Platform } from "react-native";
import {
  COLOR_THEMES,
  ThemeColors,
  sepiaColors,
  ColorThemeKey,
} from "../constants/colors";
import { STORAGE_KEYS } from "../constants/storage";
import { BACKUP_RESTORED_EVENT } from "../utils/backup";
import { useTheme } from "./useTheme";

import { ReaderTheme, ReaderFont, TextAlign } from "../models";

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

const ReaderSettingsContext = createContext<ReaderSettingsContextType>(
  {} as ReaderSettingsContextType,
);

export const ReaderSettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { colorTheme } = useTheme();
  const [isLoaded, setIsLoaded] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplierState] = useState(1);
  const [textAlign, setTextAlignState] = useState<TextAlign>("left");
  const [readerTheme, setReaderThemeState] = useState<ReaderTheme>("light");
  const [readerFont, setReaderFontState] = useState<ReaderFont>("poppins");

  const loadReaderSettings = useCallback(async () => {
    try {
      const [savedFontSize, savedAlign, savedTheme, savedFont] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.FONT_SIZE),
          AsyncStorage.getItem(STORAGE_KEYS.TEXT_ALIGN),
          AsyncStorage.getItem(STORAGE_KEYS.READER_THEME),
          AsyncStorage.getItem(STORAGE_KEYS.READER_FONT),
        ]);

      if (savedFontSize !== null)
        setFontSizeMultiplierState(Number(savedFontSize));
      if (savedAlign !== null) setTextAlignState(savedAlign as TextAlign);
      if (savedTheme !== null) setReaderThemeState(savedTheme as ReaderTheme);
      if (savedFont !== null) setReaderFontState(savedFont as ReaderFont);
    } catch (e) {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadReaderSettings();
    const sub = DeviceEventEmitter.addListener(
      BACKUP_RESTORED_EVENT,
      loadReaderSettings,
    );
    return () => sub.remove();
  }, [loadReaderSettings]);

  const setFontSizeMultiplier = useCallback(async (val: number) => {
    setFontSizeMultiplierState(val);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, String(val));
    } catch (e) {}
  }, []);

  const setTextAlign = useCallback(async (val: TextAlign) => {
    setTextAlignState(val);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TEXT_ALIGN, val);
    } catch (e) {}
  }, []);

  const setReaderTheme = useCallback(async (val: ReaderTheme) => {
    setReaderThemeState(val);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.READER_THEME, val);
    } catch (e) {}
  }, []);

  const setReaderFont = useCallback(async (val: ReaderFont) => {
    setReaderFontState(val);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.READER_FONT, val);
    } catch (e) {}
  }, []);

  const value = useMemo(() => {
    const activePalette =
      COLOR_THEMES[colorTheme as ColorThemeKey] || COLOR_THEMES.teal;
    const readerColors =
      readerTheme === "sepia"
        ? sepiaColors
        : readerTheme === "dark"
          ? activePalette.dark
          : activePalette.light;

    const readerFontFamily =
      readerFont === "monospace"
        ? Platform.OS === "ios"
          ? "Courier"
          : "monospace"
        : "Poppins_400Regular";

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
    setReaderFont,
  ]);

  if (!isLoaded) return null;

  return (
    <ReaderSettingsContext.Provider value={value}>
      {children}
    </ReaderSettingsContext.Provider>
  );
};

export const useReaderSettings = () => useContext(ReaderSettingsContext);
