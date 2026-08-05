import React, { useEffect, useRef, useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useResponsive } from "../hooks/useResponsive";
import { useTheme } from "../hooks/useTheme";

export type BibleSkeletonProps = {
  onlyContent?: boolean;
};

export function BibleSkeleton({ onlyContent = false }: BibleSkeletonProps) {
  const { colors } = useTheme();
  const { ms, DESIGN } = useResponsive();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        menuBtn: { marginRight: ms(8) },
        titleSkeleton: { borderRadius: ms(DESIGN.borderRadius.xs) },
        iconSkeleton: { borderRadius: ms(DESIGN.borderRadius.md) },
        topBar: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 12,
          borderBottomWidth: 1,
          gap: ms(DESIGN.spacing.lg),
        },
        pillSkeleton: {
          height: ms(32),
          borderRadius: ms(DESIGN.borderRadius.lg),
        },
        content: {
          flex: 1,
          padding: ms(20),
          gap: ms(DESIGN.spacing.xl),
        },
        verseRow: {
          flexDirection: "row",
          gap: ms(DESIGN.spacing.lg),
        },
        verseNumber: {
          width: ms(24),
          height: ms(24),
          borderRadius: ms(DESIGN.borderRadius.md),
          marginTop: ms(2),
        },
        verseLine: {
          height: ms(14),
          borderRadius: ms(DESIGN.borderRadius.xs),
        },
      }),
    [ms, colors, DESIGN],
  );

  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const skeletonColor = colors.surfaceHighlight;

  return (
    <View
      style={[
        styles.container,
        !onlyContent && { backgroundColor: colors.background },
      ]}
    >
      {!onlyContent && (
        <>
          <View
            style={[
              styles.header,
              { backgroundColor: colors.primary, minHeight: ms(56) },
            ]}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={[
                  styles.menuBtn,
                  {
                    backgroundColor: colors.surfaceHighlight,
                    width: ms(40),
                    height: ms(40),
                    borderRadius: ms(DESIGN.fontSize.xs),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.titleSkeleton,
                  {
                    backgroundColor: colors.surfaceHighlight,
                    width: ms(100),
                    height: ms(DESIGN.fontSize.xxl),
                    opacity: pulseAnim,
                  },
                ]}
              />
            </View>
            <View style={{ flexDirection: "row", gap: ms(DESIGN.spacing.md) }}>
              <View
                style={[
                  styles.iconSkeleton,
                  {
                    backgroundColor: colors.surfaceHighlight,
                    width: ms(DESIGN.spacing.xl),
                    height: ms(DESIGN.spacing.xl),
                  },
                ]}
              />
              <View
                style={[
                  styles.iconSkeleton,
                  {
                    backgroundColor: colors.surfaceHighlight,
                    width: ms(DESIGN.spacing.xl),
                    height: ms(DESIGN.spacing.xl),
                  },
                ]}
              />
            </View>
          </View>

          <View
            style={[
              styles.topBar,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <Animated.View
              style={[
                styles.pillSkeleton,
                {
                  backgroundColor: skeletonColor,
                  width: ms(80),
                  opacity: pulseAnim,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.pillSkeleton,
                {
                  backgroundColor: skeletonColor,
                  width: ms(120),
                  opacity: pulseAnim,
                },
              ]}
            />
          </View>
        </>
      )}

      <View style={styles.content}>
        {[...Array(8)].map((_, i) => (
          <View key={i} style={styles.verseRow}>
            <Animated.View
              style={[
                styles.verseNumber,
                { backgroundColor: skeletonColor, opacity: pulseAnim },
              ]}
            />
            <View style={{ flex: 1, gap: ms(DESIGN.spacing.sm) }}>
              <Animated.View
                style={[
                  styles.verseLine,
                  {
                    backgroundColor: skeletonColor,
                    width: "95%",
                    opacity: pulseAnim,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.verseLine,
                  {
                    backgroundColor: skeletonColor,
                    width: i % 2 === 0 ? "80%" : "100%",
                    opacity: pulseAnim,
                  },
                ]}
              />
              {i % 3 === 0 && (
                <Animated.View
                  style={[
                    styles.verseLine,
                    {
                      backgroundColor: skeletonColor,
                      width: "60%",
                      opacity: pulseAnim,
                    },
                  ]}
                />
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
