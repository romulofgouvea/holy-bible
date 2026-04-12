import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slot, useGlobalSearchParams, usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { STORAGE_KEYS } from '../constants/storage';
import { ReaderSettingsProvider } from '../hooks/use-reader-settings';
import { ThemeProvider, useTheme } from '../hooks/use-theme';

function useRoutePersistence() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const navigationState = useRootNavigationState();
  const router = useRouter();
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    if (!navigationState?.key || isRestored) return;

    const restoreRoute = async () => {
      try {
        const savedPath = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ROUTE);
        const savedParams = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ROUTE_PARAMS);
        if (savedPath && savedPath !== '/') {
          const query = savedParams ? JSON.parse(savedParams) : {};

          // Only redirect if we are not already on that path
          if (pathname !== savedPath) {
            router.replace({ pathname: savedPath as any, params: query });
          }
        }
      } catch (e) {
      } finally {
        setIsRestored(true);
      }
    };

    restoreRoute();
  }, [navigationState?.key, isRestored]);

  useEffect(() => {
    if (isRestored && pathname && pathname !== '/') {
      AsyncStorage.setItem(STORAGE_KEYS.LAST_ROUTE, pathname).catch(() => { });
      try {
        AsyncStorage.setItem(STORAGE_KEYS.LAST_ROUTE_PARAMS, JSON.stringify(params || {})).catch(() => { });
      } catch (err) { }
    }
  }, [pathname, params, isRestored]);

  return isRestored;
}

function AppLayout() {
  const { colors } = useTheme();
  useRoutePersistence();

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = 'Bíblia Online';
    }
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar style="light" backgroundColor="black" />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ReaderSettingsProvider>
          <AppLayout />
        </ReaderSettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
