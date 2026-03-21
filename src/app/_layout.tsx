import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ReaderSettingsProvider } from '../hooks/use-reader-settings';
import { ThemeProvider, useTheme } from '../hooks/use-theme';

function AppLayout() {
  const { colors } = useTheme();
  return (
    <>
      <StatusBar style="auto" />
      <SafeAreaView edges={['top']} style={{ flex: 0, backgroundColor: colors.primary, zIndex: 10 }} />
      <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: '#000000' }}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <Slot />
        </View>
      </SafeAreaView>
    </>
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
