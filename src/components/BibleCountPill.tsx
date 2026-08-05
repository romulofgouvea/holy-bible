import { useResponsive } from "@/hooks/useResponsive";
import { useTheme } from "@/hooks/useTheme";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { BibleText } from "./BibleText";

interface BibleCountPillProps {
  count: number;
  label: string;
  labelPlural?: string;
  style?: any;
}

export function BibleCountPill({
  count,
  label,
  labelPlural,
  style,
}: BibleCountPillProps) {
  const { colors } = useTheme();
  const { ms, DESIGN } = useResponsive();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        countPill: {
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          paddingHorizontal: ms(DESIGN.spacing.md),
          paddingVertical: ms(DESIGN.spacing.sm),
          borderRadius: ms(DESIGN.borderRadius.lg),
          backgroundColor: colors.surfaceHighlight,
          borderColor: colors.primary + "30",
          borderWidth: 1,
        },
        countNumber: {
          fontWeight: "800",
          fontSize: ms(DESIGN.fontSize.sm),
          color: colors.primary,
        },
        countText: {
          fontWeight: "600",
          fontSize: ms(DESIGN.fontSize.sm),
          color: colors.primary,
        },
      }),
    [ms, colors, DESIGN],
  );

  const finalLabel = count === 1 ? label : labelPlural || `${label}s`;

  return (
    <View style={[styles.countPill, style]}>
      <BibleText style={styles.countNumber}>{count}</BibleText>
      <BibleText style={styles.countText}> {finalLabel}</BibleText>
    </View>
  );
}
