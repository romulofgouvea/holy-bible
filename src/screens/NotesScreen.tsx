import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { BibleDrawerMenu } from "../components/BibleDrawerMenu";
import { BibleHeader } from "../components/BibleHeader";
import { BibleIcon } from "../components/BibleIcon";
import { BiblePageEmpty } from "../components/BiblePageEmpty";
import { BibleText } from "../components/BibleText";
import {
  BibleActionItem,
  BibleActionsSheet,
} from "../components/modals/BibleActionsSheet";
import { BibleConfirmModal } from "../components/modals/BibleConfirmModal";
import { BibleNoteModal } from "../components/modals/BibleNoteModal";
import { DonateModal } from "../components/modals/DonateModal";
import { ROUTES } from "../constants/routes";
import { getBibleData } from "../data/bible-version";
import { useBible } from "../hooks/useBible";
import { useNotes } from "../hooks/useNotes";
import { useResponsive } from "../hooks/useResponsive";
import { useTheme } from "../hooks/useTheme";
import { SelectedVerse, VerseNote } from "../models";
import { formatVerseRanges } from "../utils/verseRange";

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

  const [activeNote, setActiveNote] = useState<VerseNote | null>(null);
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [isConfirmDeleteVisible, setIsConfirmDeleteVisible] = useState(false);

  const versionBooks = useMemo(() => getBibleData(version), [version]);

  const validNotes = useMemo(() => {
    return notes.filter(n => n && n.selectedVerses && n.selectedVerses.length > 0);
  }, [notes]);

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
          marginTop: ms(DESIGN.spacing.sm),
        },
        moreButton: {
          padding: ms(DESIGN.spacing.xs),
          marginRight: ms(-DESIGN.spacing.xs),
          marginTop: ms(-DESIGN.spacing.xs),
        },
      }),
    [colors, ms, DESIGN],
  );

  const confirmDelete = (id: string) => {
    setActiveNote(notes.find((n) => n.id === id) || null);
    setIsConfirmDeleteVisible(true);
  };

  const handleEditNote = (item: VerseNote) => {
    const book = versionBooks.find(
      (b) => b.abbrev === item.selectedVerses[0].bookAbbrev,
    );
    const bookName = book?.name || item.selectedVerses[0].bookAbbrev;

    // Reconstruct SelectedVerse array with full text for the modal
    const verses: SelectedVerse[] = item.selectedVerses.map((v) => {
      const verseText = book?.chapters[v.chapter - 1]?.[v.verse - 1] || "";
      return {
        ...v,
        bookName,
        text: verseText,
        version: version,
      };
    });

    setSelectedNoteVerses(verses);
    setNoteModalVisible(true);
  };

  const handleOpenActions = (item: VerseNote) => {
    setActiveNote(item);
    setIsActionsVisible(true);
  };

  const actionItems: BibleActionItem[] = useMemo(() => {
    if (!activeNote) return [];
    return [
      {
        icon: "book-open",
        label: "Ler",
        color: colors.onSurface,
        iconColor: colors.primary,
        onPress: () => {
          if (activeNote?.selectedVerses.length) {
            const firstVerse = activeNote.selectedVerses[0];
            navigateTo({
              book: firstVerse.bookAbbrev,
              chapter: firstVerse.chapter,
              verse: firstVerse.verse,
            });
            router.navigate(ROUTES.BIBLE as any);
          }
        },
      },
      {
        icon: "edit-2",
        label: "Editar",
        color: colors.onSurface,
        iconColor: colors.primary,
        onPress: () => handleEditNote(activeNote),
      },
      {
        icon: "trash-2",
        label: "Excluir",
        color: colors.error,
        iconColor: colors.error,
        onPress: () => setIsConfirmDeleteVisible(true),
      },
    ];
  }, [activeNote, colors, navigateTo, router]);

  const renderItem = ({ item }: { item: VerseNote }) => {
    if (!item.selectedVerses || item.selectedVerses.length === 0) {
      return null;
    }
    const firstVerseInfo = item.selectedVerses[0];
    const book = versionBooks.find(
      (b) => b.abbrev === firstVerseInfo.bookAbbrev,
    );
    const bookName = book?.name || firstVerseInfo.bookAbbrev;
    const dateStr = new Date(item.updatedAt).toLocaleDateString("pt-BR");

    const { ranges } = formatVerseRanges(
      item.selectedVerses as SelectedVerse[],
    );

    const firstVerseText =
      book?.chapters[firstVerseInfo.chapter - 1]?.[firstVerseInfo.verse - 1] ||
      "";

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
                {bookName} {firstVerseInfo.chapter}:{ranges}
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
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => handleOpenActions(item)}
          >
            <BibleIcon
              name="more-vertical"
              color={colors.textMuted}
              size={ms(20)}
            />
          </TouchableOpacity>
        </View>

        {firstVerseText ? (
          <BibleText style={styles.verseText} numberOfLines={2}>
            {`"${firstVerseText}"`}
          </BibleText>
        ) : null}

        <BibleText style={styles.noteText}>{item.text}</BibleText>
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

      {validNotes.length === 0 ? (
        <BiblePageEmpty
          title="Anotações"
          description="Você ainda não possui nenhuma anotação. Para criar uma, selecione um ou mais versículos na tela de leitura."
          icon="file-text"
          actionLabel="Ir para a Bíblia"
          onAction={() => router.navigate(ROUTES.BIBLE as any)}
        />
      ) : (
        <FlashList
          data={validNotes}
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

      <BibleActionsSheet
        visible={isActionsVisible}
        onClose={() => setIsActionsVisible(false)}
        items={actionItems}
        title="Anotação"
      />

      <BibleConfirmModal
        visible={isConfirmDeleteVisible}
        title="Excluir anotação"
        message="Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita."
        isDanger={true}
        confirmText="Excluir"
        onCancel={() => setIsConfirmDeleteVisible(false)}
        onConfirm={() => {
          if (activeNote) {
            deleteNote(activeNote.id);
          }
          setIsConfirmDeleteVisible(false);
        }}
      />
    </View>
  );
}
