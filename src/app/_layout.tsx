import { Slot, useGlobalSearchParams, usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { ReaderSettingsProvider } from '../hooks/useReaderSettings';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { BibleModalProvider } from '../hooks/useBibleModals';
import { BibleProvider, useBible } from '../hooks/useBible';
import { GlobalBibleModals } from '../components/modals/GlobalBibleModals';

SplashScreen.preventAutoHideAsync().catch(() => {});

function useRoutePersistence() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const navigationState = useRootNavigationState();
  const router = useRouter();
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    setIsRestored(true);
  }, []);

  return isRestored;
}

function AppLayout() {
  const { colors } = useTheme();
  const { isReady } = useBible();
  const isRestored = useRoutePersistence();

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = 'Bíblia Online';
    }
  }, []);

  useEffect(() => {
    if (isReady && isRestored) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady, isRestored]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Slot />
      </View>
      <GlobalBibleModals />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ReaderSettingsProvider>
          <BibleProvider>
            <BibleModalProvider>
              <AppLayout />
            </BibleModalProvider>
          </BibleProvider>
        </ReaderSettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
