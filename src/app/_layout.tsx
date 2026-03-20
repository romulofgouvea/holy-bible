import { Slot } from 'expo-router';
import React from 'react';
import { ThemeProvider } from '../hooks/use-theme';
import { ReaderSettingsProvider } from '../hooks/use-reader-settings';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ReaderSettingsProvider>
        <Slot />
      </ReaderSettingsProvider>
    </ThemeProvider>
  );
}
