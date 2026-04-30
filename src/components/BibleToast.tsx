import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/use-theme';
import { ToastState } from '../hooks/use-toast';
import { BibleText } from './BibleText';

type BibleToastProps = {
  toast: ToastState;
  opacity: Animated.Value;
};

export function BibleToast({ toast, opacity }: BibleToastProps) {
  const { colors } = useTheme();
  if (!toast.visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: colors.primary, shadowColor: colors.shadow }]}>
      <BibleText style={[styles.text, { color: colors.onPrimary }]}>{toast.message}</BibleText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'stretch',
    marginHorizontal: 16,
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 1000,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
});
