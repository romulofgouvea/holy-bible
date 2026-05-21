import { useLocalSearchParams, usePathname } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { exportToPDF } from '../utils/export';
import { handleSmartBack } from '../utils/navigation';

import { BibleIcon } from '@/components/BibleIcon';
import { BibleActionsDrawer } from '@/components/modals/BibleActionsDrawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BibleHeader } from '../components/BibleHeader';
import { BibleSkeleton } from '../components/BibleSkeleton';
import { ReaderSettingsModal } from '../components/modals/ReaderSettingsModal';
import { RichTextEditor, RichTextEditorRef } from '../components/study/RichTextEditor';
import { LIMITS } from '../constants/limits';
import { STORAGE_KEYS } from '../constants/storage';
import { getBibleData } from '../data/bible-version';
import { useBibleModals } from '../hooks/useBibleModals';
import { useResponsive } from '../hooks/useResponsive';
import { useStudies } from '../hooks/useStudies';
import { useTheme } from '../hooks/useTheme';

const noOutline = Platform.select({ web: { outline: 'none', outlineWidth: 0 } as any, default: {} });

export default function StudyEditorScreen() {
  const { id, readonly } = useLocalSearchParams<{ id: string; readonly?: string }>();
  const isReadonly = readonly === 'true';
  const pathname = usePathname();
  const { ms, DESIGN } = useResponsive();
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    titleInput: { flex: 1, fontWeight: '700' },
  }), [ms, colors, DESIGN]);

  const { getStudy, updateStudy } = useStudies();

  const study = getStudy(id);
  const [title, setTitle] = useState(study?.title || '');
  const [htmlContent, setHtmlContent] = useState(study?.content || '');
  const [showToolbar, setShowToolbar] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  const editorRef = useRef<RichTextEditorRef>(null);
  const saveTimeout = useRef<any>(null);
  const hydrated = useRef(false);
  const initialContentRef = useRef<string>('');

  useEffect(() => {
    if (study && !hydrated.current) {
      setTitle(study.title);
      setHtmlContent(study.content);
      initialContentRef.current = study.content;
      hydrated.current = true;
    }
  }, [study]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      updateStudy(id, htmlContent, title);
    }, 1000);
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [htmlContent, title, id, updateStudy]);

  const [studyPosition, setStudyPosition] = useState<{ version: string; book: string; chapter: number }>({
    version: 'NAA',
    book: 'Gn',
    chapter: 1
  });

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_STUDY);
        if (stored) {
          setStudyPosition(JSON.parse(stored));
        }
      } catch (e) { }
    })();
  }, []);

  const { openModal } = useBibleModals();

  const openVersePicker = async () => {
    Keyboard.dismiss();
    editorRef.current?.blur();
    let currentPos = studyPosition;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_STUDY);
      if (stored) {
        currentPos = JSON.parse(stored);
        setStudyPosition(currentPos);
      }
    } catch (e) { }

    const books = getBibleData(currentPos.version);
    const foundBook = books.find(b => b.abbrev.toLowerCase() === currentPos.book.toLowerCase() || b.name.toLowerCase() === currentPos.book.toLowerCase()) || books[0];

    openModal({
      initialStep: 'book',
      target: 'study',
      initialVersion: currentPos.version,
      initialBook: foundBook,
      initialChapter: currentPos.chapter,
      onConfirm: async (selection) => {
        const nextPos = {
          version: selection.version || currentPos.version,
          book: selection.book?.abbrev || currentPos.book,
          chapter: selection.chapter || currentPos.chapter
        };
        setStudyPosition(nextPos);
        try {
          await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_STUDY, JSON.stringify(nextPos));
        } catch (e) { }

        onInsertVerseHtml(selection);
      }
    });
  };

  const onInsertVerseHtml = (selection: any) => {
    const { verses, book, chapter, version, verseObjects } = selection;
    if (!book || !verses || verses.length === 0) return;

    const groups: string[] = [];
    let start = verses[0];
    let end = verses[0];
    for (let i = 1; i < verses.length; i++) {
      if (verses[i] === end + 1) end = verses[i];
      else {
        groups.push(start === end ? `${start}` : `${start}-${end}`);
        start = verses[i]; end = verses[i];
      }
    }
    groups.push(start === end ? `${start}` : `${start}-${end}`);
    const formattedRanges = groups.join(', ');

    const bookDisplayName = book.name || book.abbrev;
    const ref = `${bookDisplayName} ${chapter}: ${formattedRanges} (${version.toUpperCase()})`;

    const lines = verseObjects.map((v: any) => {
      return `<div class="verse-line"><span class="verse-num">${v.verse}</span> <span class="verse-text">${v.text}</span></div>`;
    }).join('');

    const html = `<blockquote class="bible-verse" contenteditable="false"><div class="remove-verse-btn" contenteditable="false">×</div><div class="verse-title">${ref}</div>${lines}</blockquote><p><br></p>`;
    editorRef.current?.insertVerseHtml(html);
  };

  const exportPDF = async () => {
    setMenuVisible(false);
    const study = getStudy(id);
    if (!study) return;
    await exportToPDF(`Estudo: ${study.title}`, htmlContent);
  };

  if (!hydrated.current) {
    return <BibleSkeleton />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BibleHeader
        showMenu={false}
        showBack={true}
        onBack={() => handleSmartBack(pathname)}
        backgroundColor={colors.primary}
        contentColor={colors.onPrimary}
        leftContent={
          <TextInput
            style={[
              styles.titleInput,
              { flex: 1, fontSize: ms(DESIGN.fontSize.lg), color: colors.onPrimary },
              noOutline
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Nome do estudo"
            placeholderTextColor={colors.onPrimary + '80'}
            editable={!isReadonly}
            maxLength={LIMITS.STUDY_TITLE_MAX_LENGTH}
            underlineColorAndroid="transparent"
          />
        }
        rightContent={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: ms(DESIGN.spacing.xs) }}>
            {!isReadonly && (
              <TouchableOpacity
                style={{
                  width: ms(DESIGN.height.sm),
                  height: ms(DESIGN.height.sm),
                  borderRadius: ms(DESIGN.borderRadius.md),
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onPress={() => {
                  if (showToolbar) Keyboard.dismiss();
                  setShowToolbar(!showToolbar);
                }}
              >
                <BibleIcon name={showToolbar ? "eye" : "edit-2"} size={ms(DESIGN.fontSize.xxl)} color={colors.onPrimary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{
                width: ms(DESIGN.height.sm),
                height: ms(DESIGN.height.sm),
                borderRadius: ms(DESIGN.borderRadius.md),
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onPress={() => setMenuVisible(true)}
            >
              <BibleIcon name="more-vertical" size={ms(DESIGN.fontSize.xxl)} color={colors.onPrimary} />
            </TouchableOpacity>
          </View>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <RichTextEditor
          ref={editorRef}
          initialHtml={initialContentRef.current}
          onChange={setHtmlContent}
          onOpenVersePicker={openVersePicker}
          showToolbar={showToolbar}
          readonly={isReadonly}
        />
      </KeyboardAvoidingView>

      <BibleActionsDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title="Ações"
        items={[
          { icon: 'file-text', label: 'Exportar em PDF', onPress: exportPDF }
        ]}
      />

      <ReaderSettingsModal
        visible={isSettingsModalVisible}
        onClose={() => setIsSettingsModalVisible(false)}
      />
    </View>
  );
}
