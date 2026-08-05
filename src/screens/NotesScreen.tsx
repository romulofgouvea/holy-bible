import React, { useMemo, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { BibleHeader } from "../components/BibleHeader";
import { BiblePageEmpty } from "../components/BiblePageEmpty";
import { BibleText } from "../components/BibleText";
import { BibleIcon } from "../components/BibleIcon";
import { BibleDrawerMenu } from "../components/BibleDrawerMenu";
import { DonateModal } from "../components/modals/DonateModal";
import { BibleNoteModal } from "../components/modals/BibleNoteModal";
import { useBible } from "../hooks/useBible";
import { useNotes } from "../hooks/useNotes";
import { useTheme } from "../hooks/useTheme";
import { useResponsive } from "../hooks/useResponsive";
import { ROUTES } from "../constants/routes";
import { getBibleData } from "../data/bible-version";
import { VerseNote, SelectedVerse } from "../models";

export default function NotesScreen() {
  const router = useRouter();
  const { version, navigateTo } = useBible();
  const { notes, deleteNote } = useNotes();
  const { colors } = useTheme();
  const { ms, DESIGN } = useResponsive();

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isDonateVisible, setIsDonateVisible] = useState(false);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [selectedNoteVerses, setSelectedNoteVerses] = useState<SelectedVerse[]>(
    [],
  );

  const versionBooks = useMemo(() => getBibleData(version), [version]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        listContent: { padding: ms(DESIGN.spacing.lg) },
        card: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: ms(DESIGN.borderRadius.md),
          padding: ms(DESIGN.spacing.md),
          marginBottom: ms(DESIGN.spacing.md),
        },
        cardHeader: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: ms(DESIGN.spacing.sm),
        },
        refBadge: {
          backgroundColor: colors.primary + "15",
          paddingHorizontal: ms(DESIGN.spacing.sm),
          paddingVertical: ms(DESIGN.spacing.tiny),
          borderRadius: ms(DESIGN.borderRadius.xs),
        },
        refText: {
          color: colors.primary,
          fontWeight: "800",
          fontSize: ms(DESIGN.fontSize.sm),
        },
        verseText: {
          color: colors.textMuted,
          fontSize: ms(DESIGN.fontSize.sm),
          fontStyle: "italic",
          marginBottom: ms(DESIGN.spacing.xs),
        },
        noteText: {
          color: colors.onSurface,
          fontSize: ms(DESIGN.fontSize.md),
          lineHeight: ms(DESIGN.fontSize.xl),
        },
        actionsRow: {
          flexDirection: "row",
          gap: ms(DESIGN.spacing.sm),
          marginTop: ms(DESIGN.spacing.md),
        },
        actionButton: {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: ms(DESIGN.spacing.xs),
          paddingVertical: ms(DESIGN.spacing.sm),
          borderRadius: ms(DESIGN.borderRadius.sm),
        },
      }),
    [colors, ms, DESIGN],
  );

  const confirmDelete = (id: string) => {
    Alert.alert(
      "Excluir anotação",
      "Tem certeza que deseja excluir esta anotação?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => deleteNote(id),
        },
      ],
    );
  };

  const handleEditNote = (item: VerseNote) => {
    const book = versionBooks.find((b) => b.abbrev === item.abbrev);
    const bookName = book?.name || item.abbrev;
    const verses: SelectedVerse[] = [];

    // Reconstruct SelectedVerse array for the modal
    const end = item.verseEnd || item.verse;
    for (let v = item.verse; v <= end; v++) {
      const verseText = book?.chapters[item.chapter - 1]?.[v - 1] || "";
      verses.push({
        bookAbbrev: item.abbrev,
        bookName: bookName,
        chapter: item.chapter,
        verse: v,
        text: verseText,
        version: version,
      });
    }

    setSelectedNoteVerses(verses);
    setNoteModalVisible(true);
  };

  const renderItem = ({ item }: { item: VerseNote }) => {
    const book = versionBooks.find((b) => b.abbrev === item.abbrev);
    const bookName = book?.name || item.abbrev;
    const verseText = book?.chapters[item.chapter - 1]?.[item.verse - 1] || "";
    const dateStr = new Date(item.updatedAt).toLocaleDateString("pt-BR");

    const rangeText =
      item.verseEnd && item.verseEnd > item.verse
        ? `${item.verse}-${item.verseEnd}`
        : `${item.verse}`;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: ms(DESIGN.spacing.sm),
            }}
          >
            <View style={styles.refBadge}>
              <BibleText style={styles.refText}>
                {bookName} {item.chapter}:{rangeText}
              </BibleText>
            </View>
            <BibleText
              style={{
                color: colors.textMuted,
                fontSize: ms(DESIGN.fontSize.xs),
              }}
            >
              {dateStr}
            </BibleText>
          </View>
        </View>

        {verseText ? (
          <BibleText style={styles.verseText} numberOfLines={2}>
            {`"${verseText}"`}
          </BibleText>
        ) : null}

        <BibleText style={styles.noteText}>{item.text}</BibleText>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.surfaceHighlight },
            ]}
            onPress={() => {
              navigateTo({
                book: item.abbrev,
                chapter: item.chapter,
                verse: item.verse,
              });
              router.navigate(ROUTES.BIBLE as any);
            }}
          >
            <BibleIcon
              name="book-open"
              color={colors.textMuted}
              size={ms(14)}
            />
            <BibleText
              style={{
                color: colors.textMuted,
                fontSize: ms(DESIGN.fontSize.sm),
                fontWeight: "600",
              }}
            >
              Ler
            </BibleText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.primary + "15" },
            ]}
            onPress={() => handleEditNote(item)}
          >
            <BibleIcon name="edit-2" color={colors.primary} size={ms(14)} />
            <BibleText
              style={{
                color: colors.primary,
                fontSize: ms(DESIGN.fontSize.sm),
                fontWeight: "600",
              }}
            >
              Editar
            </BibleText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.error + "15" },
            ]}
            onPress={() => confirmDelete(item.id)}
          >
            <BibleIcon name="trash-2" color={colors.error} size={ms(14)} />
            <BibleText
              style={{
                color: colors.error,
                fontSize: ms(DESIGN.fontSize.sm),
                fontWeight: "600",
              }}
            >
              Excluir
            </BibleText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <BibleHeader
        title="Anotações"
        showMenu={true}
        onMenuPress={() => setIsDrawerVisible(true)}
      />

      {notes.length === 0 ? (
        <BiblePageEmpty
          title="Anotações"
          description="Você ainda não possui nenhuma anotação."
          icon="file-text"
        />
      ) : (
        <FlashList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          // @ts-ignore
          estimatedItemSize={ms(180)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BibleDrawerMenu
        visible={isDrawerVisible}
        activeItem="notes"
        onClose={() => setIsDrawerVisible(false)}
        onSelectItem={() => {}}
        onOpenDonate={() => {
          setIsDrawerVisible(false);
          setTimeout(() => setIsDonateVisible(true), 250);
        }}
      />

      <DonateModal
        visible={isDonateVisible}
        onClose={() => setIsDonateVisible(false)}
      />

      <BibleNoteModal
        visible={noteModalVisible}
        onClose={() => setNoteModalVisible(false)}
        selectedVerses={selectedNoteVerses}
      />
    </View>
  );
}
