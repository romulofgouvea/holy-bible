import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from "react-native";
import { SelectedVerse } from "../../models";
import { useNotes } from "../../hooks/useNotes";
import { useTheme } from "../../hooks/useTheme";
import { useResponsive } from "../../hooks/useResponsive";
import { BiblePageModal } from "./BiblePageModal";
import { BibleText } from "../BibleText";
import { BibleIcon } from "../BibleIcon";

type BibleNoteModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedVerses: SelectedVerse[];
  onShowToast?: (msg: string, type?: "success" | "info" | "warning") => void;
};

export function BibleNoteModal({
  visible,
  onClose,
  selectedVerses,
  onShowToast,
}: BibleNoteModalProps) {
  const { notesMap, saveNote } = useNotes();
  const { colors } = useTheme();
  const { ms, DESIGN } = useResponsive();
  const [text, setText] = useState("");

  const verse = selectedVerses[0];
  const count = selectedVerses.length;

  useEffect(() => {
    if (visible && verse) {
      const key = `${verse.bookAbbrev}-${verse.chapter}-${verse.verse}`;
      setText(notesMap[key]?.text || "");
    }
  }, [visible, verse, notesMap]);

  if (!verse) return null;

  const handleSave = () => {
    Keyboard.dismiss();
    const verseEnd = count > 1 ? selectedVerses[count - 1].verse : undefined;
    saveNote(verse.bookAbbrev, verse.chapter, verse.verse, text, verseEnd);
    onShowToast?.(
      text.trim() ? "Anotação salva" : "Anotação removida",
      "success",
    );
    onClose();
  };

  const headerLabel =
    count > 1
      ? `${verse.bookName} ${verse.chapter}:${verse.verse}-${selectedVerses[count - 1].verse}`
      : `${verse.bookName} ${verse.chapter}:${verse.verse}`;

  return (
    <BiblePageModal
      visible={visible}
      onClose={onClose}
      fullHeight={true}
      header={
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: ms(DESIGN.spacing.sm),
            }}
          >
            <BibleIcon
              name="edit-2"
              color={colors.primary}
              backgroundColor={colors.primary + "15"}
            />
            <BibleText
              style={{
                fontWeight: "700",
                color: colors.onSurface,
                fontSize: ms(DESIGN.fontSize.lg),
              }}
            >
              Anotações: {headerLabel}
            </BibleText>
          </View>
          <BibleIcon
            name="x"
            color={colors.error}
            backgroundColor={colors.error + "20"}
            onPress={onClose}
          />
        </View>
      }
      footer={
        <TouchableOpacity
          onPress={handleSave}
          activeOpacity={0.7}
          style={{
            backgroundColor: colors.primary,
            padding: ms(DESIGN.spacing.md),
            borderRadius: ms(DESIGN.borderRadius.md),
            alignItems: "center",
          }}
        >
          <BibleText style={{ color: colors.onPrimary, fontWeight: "700" }}>
            Salvar Anotação
          </BibleText>
        </TouchableOpacity>
      }
    >
      <View style={{ flex: 1, padding: ms(DESIGN.spacing.lg) }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surfaceHighlight,
            borderRadius: ms(DESIGN.borderRadius.lg),
            borderWidth: 1,
            borderColor: colors.border,
            padding: ms(DESIGN.spacing.lg),
          }}
        >
          <TextInput
            style={{
              flex: 1,
              color: colors.onBackground,
              fontSize: ms(DESIGN.fontSize.md),
              textAlignVertical: "top",
              outlineStyle: "none" as any,
            }}
            placeholder="Escreva sua anotação aqui..."
            placeholderTextColor={colors.textMuted}
            multiline
            value={text}
            onChangeText={setText}
            autoFocus
            onFocus={() => {
              // Hack to force selection update
              setText(text);
            }}
            selection={
              text.length > 0
                ? { start: text.length, end: text.length }
                : undefined
            }
          />
        </View>
      </View>
    </BiblePageModal>
  );
}
