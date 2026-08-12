import React from "react";
import { View } from "react-native";
import { useResponsive } from "../hooks/useResponsive";
import { useTheme } from "../hooks/useTheme";
import { BibleText } from "./BibleText";

export type BiblePlanStatusBadgeProps = {
  delayDays: number;
  aheadDays: number;
  isPaused: boolean;
  isCompleted: boolean;
  completedAtMs?: number;
  style?: object;
};

export const BiblePlanStatusBadge = React.memo(function BiblePlanStatusBadge({
  delayDays,
  aheadDays,
  isPaused,
  isCompleted,
  completedAtMs,
  style,
}: BiblePlanStatusBadgeProps) {
  const { ms, DESIGN } = useResponsive();
  const { colors } = useTheme();

  if (!isCompleted && !isPaused && delayDays === 0 && aheadDays === 0) {
    return null;
  }

  let label: string;
  let color: string;
  if (isCompleted) {
    const dateText = completedAtMs
      ? new Date(completedAtMs).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        })
      : "";
    label = dateText ? `Concluído em ${dateText}` : "Concluído";
    color = colors.success;
  } else if (isPaused) {
    label = "Pausado";
    color = colors.textMuted;
  } else if (delayDays > 0) {
    label = `Atrasado ${delayDays} ${delayDays === 1 ? "dia" : "dias"}`;
    color = colors.error;
  } else {
    label = `Adiantado ${aheadDays} ${aheadDays === 1 ? "dia" : "dias"}`;
    color = colors.success;
  }

  return (
    <View
      style={[
        {
          backgroundColor: color + "15",
          borderWidth: 1,
          borderColor: color + "30",
          paddingHorizontal: ms(DESIGN.spacing.sm),
          paddingVertical: ms(2),
          borderRadius: ms(DESIGN.borderRadius.sm),
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <BibleText
        style={{
          fontSize: ms(DESIGN.fontSize.xs),
          color,
          fontWeight: "700",
        }}
      >
        {label}
      </BibleText>
    </View>
  );
});
