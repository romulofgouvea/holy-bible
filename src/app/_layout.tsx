import { Slot } from 'expo-router';
import React from 'react';
import { ThemeProvider } from '../hooks/use-theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Slot />
    </ThemeProvider>
  );
}
