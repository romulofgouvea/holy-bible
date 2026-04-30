import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';

export function BibleSkeleton() {
  const { colors } = useTheme();
  const { ms } = useResponsive();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const skeletonColor = colors.surfaceHighlight;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary, minHeight: ms(56) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.menuBtn, { backgroundColor: colors.surfaceHighlight, width: ms(40), height: ms(40), borderRadius: ms(10) }]} />
          <Animated.View style={[styles.titleSkeleton, { backgroundColor: colors.surfaceHighlight, width: ms(100), height: ms(20), opacity: pulseAnim }]} />
        </View>
        <View style={{ flexDirection: 'row', gap: ms(12) }}>
          <View style={[styles.iconSkeleton, { backgroundColor: colors.surfaceHighlight, width: ms(24), height: ms(24) }]} />
          <View style={[styles.iconSkeleton, { backgroundColor: colors.surfaceHighlight, width: ms(24), height: ms(24) }]} />
        </View>
      </View>

      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Animated.View style={[styles.pillSkeleton, { backgroundColor: skeletonColor, width: ms(80), opacity: pulseAnim }]} />
        <Animated.View style={[styles.pillSkeleton, { backgroundColor: skeletonColor, width: ms(120), opacity: pulseAnim }]} />
      </View>

      <View style={styles.content}>
        {[...Array(8)].map((_, i) => (
          <View key={i} style={styles.verseRow}>
            <Animated.View style={[styles.verseNumber, { backgroundColor: skeletonColor, opacity: pulseAnim }]} />
            <View style={{ flex: 1, gap: 8 }}>
              <Animated.View style={[styles.verseLine, { backgroundColor: skeletonColor, width: '95%', opacity: pulseAnim }]} />
              <Animated.View style={[styles.verseLine, { backgroundColor: skeletonColor, width: i % 2 === 0 ? '80%' : '100%', opacity: pulseAnim }]} />
              {i % 3 === 0 && <Animated.View style={[styles.verseLine, { backgroundColor: skeletonColor, width: '60%', opacity: pulseAnim }]} />}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuBtn: { marginRight: 8 },
  titleSkeleton: { borderRadius: 4 },
  iconSkeleton: { borderRadius: 12 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 16,
  },
  pillSkeleton: {
    height: 32,
    borderRadius: 16,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 24,
  },
  verseRow: {
    flexDirection: 'row',
    gap: 16,
  },
  verseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginTop: 2,
  },
  verseLine: {
    height: 14,
    borderRadius: 4,
  },
});
