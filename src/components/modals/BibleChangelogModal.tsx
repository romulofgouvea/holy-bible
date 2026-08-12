import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { CHANGELOG_DATA } from "../../data/changelog";
import { useResponsive } from "../../hooks/useResponsive";
import { useTheme } from "../../hooks/useTheme";
import { BibleDivider } from "../BibleDivider";
import { BibleIcon } from "../BibleIcon";
import { BibleText } from "../BibleText";
import { BiblePageModal } from "./BiblePageModal";

type BibleChangelogModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function BibleChangelogModal({
  visible,
  onClose,
}: BibleChangelogModalProps) {
  const { ms, DESIGN } = useResponsive();
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: "row",
          alignItems: "center",
        },
        headerIconWrap: {
          marginRight: ms(DESIGN.spacing.sm),
        },
        headerTitle: {
          flex: 1,
          fontWeight: "700",
        },
        closeBtn: {
          marginLeft: ms(DESIGN.spacing.sm),
        },
        container: {
          maxHeight: ms(DESIGN.maxWidth.md),
        },
        content: {
          padding: ms(DESIGN.spacing.lg),
          gap: ms(DESIGN.spacing.lg),
        },
        versionBlock: {
          borderRadius: ms(DESIGN.borderRadius.md),
          borderWidth: 1,
          padding: ms(DESIGN.spacing.md),
          gap: ms(DESIGN.spacing.sm),
        },
        versionHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        badge: {
          paddingHorizontal: ms(DESIGN.spacing.sm),
          paddingVertical: ms(DESIGN.spacing.tiny),
          borderRadius: ms(DESIGN.borderRadius.sm),
        },
        badgeText: {
          fontWeight: "800",
        },
        dateText: {
          fontWeight: "500",
        },
        highlightList: {
          gap: ms(DESIGN.spacing.xs),
        },
        highlightRow: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: ms(DESIGN.spacing.sm),
        },
        bulletDot: {
          width: ms(DESIGN.spacing.xs),
          height: ms(DESIGN.spacing.xs),
          borderRadius: ms(DESIGN.borderRadius.full),
          marginTop: ms(DESIGN.spacing.xs),
        },
        highlightText: {
          flex: 1,
          lineHeight: ms(DESIGN.fontSize.xl),
        },
      }),
    [ms, colors, DESIGN],
  );

  if (!visible) return null;

  return (
    <BiblePageModal
      visible={visible}
      onClose={onClose}
      header={
        <View style={styles.header}>
          <BibleIcon
            name="file-text"
            color={colors.primary}
            backgroundColor={colors.primary + "20"}
            style={styles.headerIconWrap}
          />
          <BibleText
            style={[
              styles.headerTitle,
              { fontSize: ms(DESIGN.fontSize.lg), color: colors.onSurface },
            ]}
          >
            Notas de Atualização
          </BibleText>
          <BibleIcon
            name="x"
            color={colors.error}
            backgroundColor={colors.error + "20"}
            onPress={onClose}
            style={styles.closeBtn}
          />
        </View>
      }
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {CHANGELOG_DATA.map((item, index) => (
          <View
            key={item.version}
            style={[
              styles.versionBlock,
              {
                backgroundColor:
                  index === 0 ? colors.surfaceHighlight : colors.surface,
                borderColor:
                  index === 0 ? colors.primary + "40" : colors.border,
              },
            ]}
          >
            <View style={styles.versionHeader}>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor:
                      index === 0 ? colors.primary : colors.surfaceHighlight,
                  },
                ]}
              >
                <BibleText
                  style={[
                    styles.badgeText,
                    {
                      fontSize: ms(DESIGN.fontSize.sm),
                      color: index === 0 ? colors.onPrimary : colors.textMuted,
                    },
                  ]}
                >
                  v{item.version}
                </BibleText>
              </View>
            </View>

            <BibleDivider style={{ marginVertical: ms(DESIGN.spacing.tiny) }} />

            <View style={styles.highlightList}>
              {item.highlights.map((highlight) => (
                <View key={highlight} style={styles.highlightRow}>
                  <View
                    style={[
                      styles.bulletDot,
                      {
                        backgroundColor:
                          index === 0 ? colors.primary : colors.textMuted,
                      },
                    ]}
                  />
                  <BibleText
                    style={[
                      styles.highlightText,
                      {
                        fontSize: ms(DESIGN.fontSize.md),
                        color: colors.onSurface,
                      },
                    ]}
                  >
                    {highlight}
                  </BibleText>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </BiblePageModal>
  );
}
