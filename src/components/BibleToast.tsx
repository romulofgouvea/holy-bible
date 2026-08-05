import React, { useMemo } from "react";
import { Animated, StyleSheet } from "react-native";
import { useTheme } from "../hooks/useTheme";
import { useResponsive } from "../hooks/useResponsive";
import { ToastState } from "../hooks/useToast";
import { BibleText } from "./BibleText";

type BibleToastProps = {
  toast: ToastState;
  opacity: Animated.Value;
};

export function BibleToast({ toast, opacity }: BibleToastProps) {
  const { colors } = useTheme();
  const { ms, DESIGN } = useResponsive();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: "absolute",
          bottom: ms(90),
          alignSelf: "stretch",
          marginHorizontal: 16,
          left: ms(16),
          right: ms(16),
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderRadius: ms(DESIGN.borderRadius.sm),
          minHeight: ms(48),
          flexDirection: "row",
          alignItems: "center",
          elevation: 6,
          shadowOffset: { width: 0, height: ms(4) },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          zIndex: 1000,
        },
        text: {
          fontSize: ms(14),
          lineHeight: ms(20),
          fontWeight: "400",
        },
      }),
    [ms, colors, DESIGN],
  );

  if (!toast.visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          backgroundColor: colors.primary,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <BibleText style={[styles.text, { color: colors.onPrimary }]}>
        {toast.message}
      </BibleText>
    </Animated.View>
  );
}
