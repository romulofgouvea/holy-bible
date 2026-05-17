import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState , useMemo } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { exportToPDF } from '../utils/export';
import { handleSmartBack } from '../utils/navigation';

import { BibleConfirmModal } from '@/components/modals/BibleConfirmModal';
import { BibleActionsDrawer } from '@/components/modals/BibleActionsDrawer';
import { BibleIcon } from '@/components/BibleIcon';
import { BibleHeader } from '../components/BibleHeader';
import { BibleSkeleton } from '../components/BibleSkeleton';
import { BibleText } from '../components/BibleText';
import { ReaderSettingsModal } from '../components/modals/ReaderSettingsModal';
import { RichTextEditor, RichTextEditorRef } from '../components/study/RichTextEditor';
import { useResponsive } from '../hooks/useResponsive';
import { useStudies } from '../hooks/useStudies';
import { useTheme } from '../hooks/useTheme';
import { useBibleModals } from '../hooks/useBibleModals';

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

  useEffect(() => {
    if (study && !hydrated.current) {
      setTitle(study.title);
      setHtmlContent(study.content);
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

  const { openModal } = useBibleModals();

  const openVersePicker = () => {
    openModal({
      initialStep: 'book',
      onConfirm: (selection) => onInsertVerseHtml(selection)
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
            underlineColorAndroid="transparent"
          />
        }
        rightContent={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: ms(DESIGN.spacing.xs) }}>
            {!isReadonly && (
              <TouchableOpacity
                style={{ 
                  width: ms(DESIGN.button.height.sm), 
                  height: ms(DESIGN.button.height.sm), 
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
                width: ms(DESIGN.button.height.sm), 
                height: ms(DESIGN.button.height.sm), 
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
          initialHtml={htmlContent}
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
