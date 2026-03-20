import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { BibleText } from './BibleText';
import { ToastState } from '../hooks/use-toast';

type BibleToastProps = {
  toast: ToastState;
  opacity: Animated.Value;
};

export function BibleToast({ toast, opacity }: BibleToastProps) {
  if (!toast.visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <BibleText style={styles.text}>{toast.message}</BibleText>
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
    backgroundColor: '#313033',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 1000,
  },
  text: {
    color: '#F4EFF4',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
});
