import React, { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useResponsive } from "../hooks/useResponsive";
import { useTheme } from "../hooks/useTheme";
import { BibleText } from "./BibleText";

type BibleListCardProps = {
  title: string;
  pillText?: string | number;
  isSelected?: boolean;
  onPress: () => void;
  testID?: string;
};

export function BibleListCard({
  title,
  pillText,
  isSelected,
  onPress,
  testID,
}: BibleListCardProps) {
  const { ms, DESIGN } = useResponsive();
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderWidth: 1,
          borderRadius: ms(DESIGN.borderRadius.md),
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        cardTitle: {
          flex: 1,
          fontWeight: "700",
          marginRight: ms(12),
        },
        pill: {
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: ms(DESIGN.borderRadius.sm),
          borderWidth: 1,
        },
        pillText: {
          fontWeight: "800",
        },
      }),
    [ms, colors, DESIGN],
  );

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? colors.primary + "10" : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <BibleText
        style={[
          styles.cardTitle,
          {
            fontSize: ms(DESIGN.spacing.lg),
            color: isSelected ? colors.primary : colors.onSurface,
          },
        ]}
      >
        {title}
      </BibleText>
      {pillText !== undefined && (
        <View
          style={[
            styles.pill,
            {
              backgroundColor: isSelected
                ? colors.primary
                : colors.surfaceHighlight,
              borderColor: isSelected ? colors.primary : colors.border,
              borderWidth: 1,
            },
          ]}
        >
          <BibleText
            style={[
              styles.pillText,
              {
                fontSize: ms(13),
                color: isSelected ? colors.onPrimary : colors.primary,
              },
            ]}
          >
            {pillText}
          </BibleText>
        </View>
      )}
    </TouchableOpacity>
  );
}
