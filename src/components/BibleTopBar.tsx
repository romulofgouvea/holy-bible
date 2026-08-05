import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ROUTES, ROUTE_LABELS } from "../constants/routes";
import { useReaderSettings } from "../hooks/useReaderSettings";
import { useResponsive } from "../hooks/useResponsive";
import { useTheme } from "../hooks/useTheme";
import { BibleHeader } from "./BibleHeader";
import { BibleIcon } from "./BibleIcon";
import { BibleText } from "./BibleText";
import { BibleActionsDrawer } from "./modals/BibleActionsDrawer";

export type BibleTopBarProps = {
  bookName: string;
  currentChapter: number;
  onOpenBook: () => void;
  onOpenChapter: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onOpenMenu: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenHistory: () => void;
  onOpenAudio: () => void;
  isSplitScreen?: boolean;
  onToggleCompare?: () => void;
};

export const BibleTopBar = React.memo((props: BibleTopBarProps) => {
  const {
    bookName,
    currentChapter,
    onOpenBook,
    onOpenChapter,
    onPrevChapter,
    onNextChapter,
    onOpenMenu,
    onOpenSettings,
    onOpenSearch,
    onOpenHistory,
    onOpenAudio,
    isSplitScreen,
    onToggleCompare,
  } = props;
  const { ms, DESIGN } = useResponsive();
  const { colors } = useTheme();
  const { readerColors, readerTheme } = useReaderSettings();
  const [dotsMenuVisible, setDotsMenuVisible] = useState(false);

  const isSepia = readerTheme === "sepia";
  const headerBg = isSepia ? readerColors.primary : colors.primary;
  const headerContent = isSepia ? readerColors.onPrimary : colors.onPrimary;
  const btnBg = colors.onPrimary + "4D";
  const btnText = colors.onPrimary;

  return (
    <>
      <BibleHeader
        backgroundColor={headerBg}
        contentColor={headerContent}
        menuBtnBackgroundColor="transparent"
        onMenuPress={onOpenMenu}
        leftContent={
          <View style={styles.leftButtons}>
            <TouchableOpacity
              style={[
                styles.topBarButton,
                {
                  backgroundColor: btnBg,
                  height: ms(DESIGN.height.sm),
                  paddingHorizontal: ms(DESIGN.spacing.md),
                  marginHorizontal: ms(DESIGN.spacing.tiny),
                  borderRadius: ms(DESIGN.borderRadius.sm),
                  flexShrink: 1,
                  minWidth: 0,
                },
              ]}
              onPress={onOpenBook}
            >
              <BibleText
                style={[
                  styles.topBarButtonText,
                  { fontSize: ms(DESIGN.fontSize.md), color: btnText },
                ]}
                numberOfLines={1}
              >
                {bookName}
              </BibleText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.topBarButton,
                {
                  backgroundColor: btnBg,
                  height: ms(DESIGN.height.sm),
                  paddingHorizontal: ms(DESIGN.spacing.md),
                  marginHorizontal: ms(DESIGN.spacing.tiny),
                  borderRadius: ms(DESIGN.borderRadius.sm),
                  flexShrink: 0,
                },
              ]}
              onPress={onOpenChapter}
            >
              <BibleText
                style={[
                  styles.topBarButtonText,
                  { fontSize: ms(DESIGN.fontSize.md), color: btnText },
                ]}
              >
                {currentChapter}
              </BibleText>
            </TouchableOpacity>
          </View>
        }
        rightContent={
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* <TouchableOpacity
                            style={[styles.menuButton, { backgroundColor: 'transparent', width: ms(DESIGN.height.sm), height: ms(DESIGN.height.sm), borderRadius: ms(DESIGN.borderRadius.sm), alignItems: 'center', justifyContent: 'center' }]}
                            onPress={onOpenAudio}
                        >
                            <BibleIcon name="headphones" size={ms(DESIGN.fontSize.xl)} color={headerContent} />
                        </TouchableOpacity> */}
            <TouchableOpacity
              style={[
                styles.menuButton,
                {
                  backgroundColor: "transparent",
                  width: ms(DESIGN.height.sm),
                  height: ms(DESIGN.height.sm),
                  borderRadius: ms(DESIGN.borderRadius.sm),
                  marginLeft: ms(DESIGN.spacing.xs),
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
              onPress={() => setDotsMenuVisible(true)}
            >
              <BibleIcon
                name="more-vertical"
                size={ms(DESIGN.fontSize.xl)}
                color={headerContent}
              />
            </TouchableOpacity>
          </View>
        }
      />

      <BibleActionsDrawer
        visible={dotsMenuVisible}
        onClose={() => setDotsMenuVisible(false)}
        title="Ações"
        items={[
          {
            icon: "search",
            label: ROUTE_LABELS[ROUTES.SEARCH],
            onPress: onOpenSearch,
          },
          {
            icon: "clock",
            label: ROUTE_LABELS.HISTORY,
            onPress: onOpenHistory,
          },
          {
            icon: "type",
            label: ROUTE_LABELS.APPEARANCE,
            onPress: onOpenSettings,
          },
          {
            icon: isSplitScreen ? "x-circle" : "columns",
            label: isSplitScreen ? "Fechar Comparação" : "Comparar Versão",
            onPress: () => onToggleCompare?.(),
          },
        ]}
      />
    </>
  );
});

const styles = StyleSheet.create({
  leftButtons: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  topBarButton: {
    justifyContent: "center",
  },
  topBarButtonText: {
    fontWeight: "700",
  },
  menuButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
