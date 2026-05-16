import { Slot, useGlobalSearchParams, usePathname, useRootNavigationState, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ReaderSettingsProvider } from '../hooks/useReaderSettings';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { BibleModalProvider } from '../hooks/useBibleModals';
import { GlobalBibleModals } from '../components/modals/GlobalBibleModals';

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
  useRoutePersistence();

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = 'Bíblia Online';
    }
  }, []);

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
          <BibleModalProvider>
            <AppLayout />
          </BibleModalProvider>
        </ReaderSettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
