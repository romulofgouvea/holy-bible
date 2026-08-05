import { FlashList } from "@shopify/flash-list";
import React, { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ROUTE_LABELS } from "../../constants/routes";
import { HistoryItem, useHistory } from "../../hooks/useHistory";
import { useResponsive } from "../../hooks/useResponsive";
import { useTheme } from "../../hooks/useTheme";
import { BibleCountPill } from "../BibleCountPill";
import { BibleIcon } from "../BibleIcon";
import { BiblePageEmpty } from "../BiblePageEmpty";
import { BibleText } from "../BibleText";
import { BiblePageModal } from "./BiblePageModal";

type BibleHistoryModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
};

export function BibleHistoryModal({
  visible,
  onClose,
  onSelect,
}: BibleHistoryModalProps) {
  const { history, loadHistory } = useHistory();
  const { ms, DESIGN } = useResponsive();
  const { colors } = useTheme();

  const listRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [visible, loadHistory]);

  React.useEffect(() => {
    if (visible && history.length > 0) {
      const timer = setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [visible, history.length]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          paddingHorizontal: ms(DESIGN.spacing.lg),
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
        },
        title: {
          flex: 1,
          fontWeight: "700",
        },
        list: {
          flex: 1,
          width: "100%",
        },
        card: {
          borderRadius: ms(DESIGN.borderRadius.md),
          borderWidth: 1,
          padding: ms(DESIGN.spacing.md),
        },
        cardBody: {
          flexDirection: "row",
          alignItems: "center",
        },
        refText: {
          fontWeight: "700",
        },
        versionSubText: {
          fontWeight: "500",
        },
        versionBadge: {
          paddingHorizontal: ms(DESIGN.spacing.sm),
          paddingVertical: ms(DESIGN.spacing.sm),
          borderRadius: ms(DESIGN.borderRadius.sm),
          marginLeft: ms(DESIGN.spacing.md),
        },
        versionBadgeText: {
          fontWeight: "800",
          textTransform: "uppercase",
        },
      }),
    [ms, colors, DESIGN],
  );

  return (
    <BiblePageModal
      visible={visible}
      onClose={onClose}
      fullHeight={true}
      header={
        <View style={styles.header} testID="bible-history-header">
          <BibleIcon
            name="clock"
            color={colors.primary}
            backgroundColor={`${colors.primary}20`}
            style={{ marginRight: ms(DESIGN.spacing.sm) }}
          />
          <BibleText
            style={[
              styles.title,
              {
                fontSize: ms(DESIGN.fontSize.lg),
                color: colors.primary,
                fontWeight: "800",
              },
            ]}
            testID="bible-history-title"
          >
            {ROUTE_LABELS.HISTORY}
          </BibleText>
          <BibleIcon
            name="x"
            color={colors.error}
            backgroundColor={colors.error + "20"}
            onPress={onClose}
            testID="bible-history-close-btn"
          />
        </View>
      }
      footer={
        history.length ? (
          <BibleCountPill
            count={history.length}
            label="item"
            labelPlural="itens"
          />
        ) : null
      }
    >
      <View style={styles.container} testID="bible-history-modal">
        {history.length > 0 ? (
          <>
            <View style={styles.list}>
              <FlashList
                ref={listRef}
                data={history}
                keyExtractor={(item) => `${item.timestamp}`}
                // @ts-ignore
                estimatedItemSize={ms(DESIGN.layout.settingsIconOffset)}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingVertical: ms(DESIGN.spacing.lg),
                }}
                ItemSeparatorComponent={() => (
                  <View style={{ height: ms(DESIGN.spacing.sm) }} />
                )}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.card,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    <View style={styles.cardBody}>
                      <View style={{ flex: 1 }}>
                        <BibleText
                          style={[
                            styles.refText,
                            {
                              color: colors.onSurface,
                              fontSize: ms(DESIGN.fontSize.lg),
                            },
                          ]}
                        >
                          {item.bookName} {item.chapter}:{item.verse}
                        </BibleText>
                        <BibleText
                          style={[
                            styles.versionSubText,
                            {
                              color: colors.textMuted,
                              fontSize: ms(DESIGN.fontSize.md),
                              marginTop: ms(DESIGN.spacing.tiny),
                            },
                          ]}
                        >
                          {new Date(item.timestamp).toLocaleDateString()}
                        </BibleText>
                      </View>
                      <View
                        style={[
                          styles.versionBadge,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <BibleText
                          style={[
                            styles.versionBadgeText,
                            {
                              color: colors.onPrimary,
                              fontSize: ms(DESIGN.fontSize.xs),
                            },
                          ]}
                        >
                          {item.version}
                        </BibleText>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          </>
        ) : (
          <BiblePageEmpty
            title="Nenhum histórico encontrado"
            description="Navegue pelos livros e capítulos para registrar"
            icon="clock"
          />
        )}
      </View>
    </BiblePageModal>
  );
}
