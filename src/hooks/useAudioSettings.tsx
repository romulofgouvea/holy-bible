import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DeviceEventEmitter } from "react-native";
import { DEFAULT_VOICE_ID } from "../constants/audioVoices";
import { STORAGE_KEYS } from "../constants/storage";
import { BACKUP_RESTORED_EVENT } from "../utils/backup";

export type AudioSettingsContextType = {
  selectedVoice: string;
  setSelectedVoice: (val: string) => void;
};

const AudioSettingsContext = createContext<AudioSettingsContextType>(
  {} as AudioSettingsContextType,
);

export const AudioSettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedVoice, setSelectedVoiceState] =
    useState<string>(DEFAULT_VOICE_ID);

  const loadAudioSettings = useCallback(async () => {
    try {
      const savedVoice = await AsyncStorage.getItem(STORAGE_KEYS.AUDIO_VOICE);
      if (savedVoice !== null) setSelectedVoiceState(savedVoice);
    } catch (e) {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    loadAudioSettings();
    const sub = DeviceEventEmitter.addListener(
      BACKUP_RESTORED_EVENT,
      loadAudioSettings,
    );
    return () => sub.remove();
  }, [loadAudioSettings]);

  const setSelectedVoice = useCallback(async (val: string) => {
    setSelectedVoiceState(val);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUDIO_VOICE, val);
    } catch (e) {}
  }, []);

  const value = useMemo(
    () => ({
      selectedVoice,
      setSelectedVoice,
    }),
    [selectedVoice, setSelectedVoice],
  );

  if (!isLoaded) return null;

  return (
    <AudioSettingsContext.Provider value={value}>
      {children}
    </AudioSettingsContext.Provider>
  );
};

export const useAudioSettings = () => useContext(AudioSettingsContext);
