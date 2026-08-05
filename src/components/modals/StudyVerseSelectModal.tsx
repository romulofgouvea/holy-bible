import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useResponsive } from "../../hooks/useResponsive";
import { useTheme } from "../../hooks/useTheme";
import { impactLight } from "../../utils/haptics";
import { BibleCountPill } from "../BibleCountPill";
import { BibleIcon } from "../BibleIcon";
import { BibleText } from "../BibleText";
import { BiblePageModal } from "./BiblePageModal";

type StudyVerseSelectModalProps = {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  bookName: string;
  chapter: number;
  verses: { verse: number; text: string }[];
  onConfirm: (selectedVerses: number[]) => void;
};

export function StudyVerseSelectModal({
  visible,
  onClose,
  onBack,
  bookName,
  chapter,
  verses,
  onConfirm,
}: StudyVerseSelectModalProps) {
  const { ms, DESIGN } = useResponsive();
  const { colors } = useTheme();
  const [selectedNums, setSelectedNums] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (visible) setSelectedNums(new Set());
  }, [visible]);

  const toggleVerse = (num: number) => {
    impactLight();
    setSelectedNums((prev) => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });
  };

  const handleConfirm = () => {
    const sorted = [...selectedNums].sort((a, b) => a - b);
    onConfirm(sorted);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: { flexDirection: "row", alignItems: "center" },
        headerIconWrap: { marginRight: ms(DESIGN.spacing.sm) },
        title: { flex: 1, fontWeight: "700" },
        list: {
          paddingBottom: ms(DESIGN.layout.listPaddingBottom),
        },
        verseRow: {
          paddingVertical: ms(DESIGN.spacing.md),
          paddingHorizontal: ms(DESIGN.spacing.lg),
          borderLeftWidth: ms(4),
          borderLeftColor: "transparent",
        },
        verseText: {
          flexWrap: "wrap",
          textAlignVertical: "top",
        },
        footer: { flexDirection: "row", alignItems: "center", width: "100%" },
        confirmBtn: {
          flexDirection: "row",
          alignItems: "center",
          paddingLeft: ms(DESIGN.spacing.md),
          height: ms(40),
          borderRadius: ms(DESIGN.borderRadius.md),
          marginLeft: "auto",
        },
        confirmBtnIcon: {
          marginRight: ms(DESIGN.spacing.tiny || 4),
        },
        confirmBtnText: {
          fontWeight: "800",
        },
      }),
    [ms, DESIGN],
  );

  return (
    <BiblePageModal
      visible={visible}
      onClose={onClose}
      fullHeight
      header={
        <View style={styles.header}>
          <BibleIcon
            name="arrow-left"
            color={colors.primary}
            backgroundColor={colors.primary + "20"}
            onPress={onBack}
            style={styles.headerIconWrap}
          />
          <BibleText
            style={[
              styles.title,
              {
                fontSize: ms(DESIGN.fontSize.xl),
                color: colors.primary,
                fontWeight: "800",
              },
            ]}
          >
            {bookName} {chapter}
          </BibleText>
          <BibleIcon
            name="x"
            color={colors.error}
            backgroundColor={colors.error + "20"}
            onPress={onClose}
          />
        </View>
      }
      footer={
        <View style={styles.footer}>
          <BibleCountPill
            count={selectedNums.size}
            label="versículo"
            labelPlural="versículos"
          />
          {selectedNums.size > 0 && (
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <BibleText
                style={[
                  styles.confirmBtnText,
                  { color: colors.onPrimary, fontSize: ms(DESIGN.fontSize.md) },
                ]}
              >
                Adicionar
              </BibleText>
              <BibleIcon
                name="check"
                color={colors.onPrimary}
                size={ms(DESIGN.fontSize.md)}
                style={styles.confirmBtnIcon}
              />
            </TouchableOpacity>
          )}
        </View>
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        bounces={true}
        overScrollMode="always"
      >
        <View style={{ flex: 1 }}>
          {verses.map((v) => {
            const isSelected = selectedNums.has(v.verse);
            return (
              <TouchableOpacity
                key={v.verse}
                onPress={() => toggleVerse(v.verse)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.verseRow,
                    isSelected && {
                      backgroundColor: colors.primary + "15",
                      borderLeftColor: colors.primary,
                    },
                  ]}
                >
                  <BibleText
                    variant="reading"
                    style={[
                      styles.verseText,
                      {
                        fontSize: ms(DESIGN.fontSize.xxl),
                        lineHeight: ms(28),
                        color: colors.onBackground,
                      },
                    ]}
                  >
                    <BibleText
                      style={{
                        color: colors.primary,
                        fontWeight: "700",
                        fontSize: ms(DESIGN.fontSize.lg),
                      }}
                    >
                      {v.verse}
                    </BibleText>
                    {"\u00A0\u00A0"}
                    {v.text}
                  </BibleText>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </BiblePageModal>
  );
}
