import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { exportToPDF } from '../../../utils/export';
import {
  Alert,
  DeviceEventEmitter,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { handleSmartBack } from '../../../utils/navigation';

import { BibleActionsSheet } from '@/components/BibleActionsSheet';
import { BibleIcon } from '@/components/BibleIcon';
import { COLOR_THEMES } from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BibleBookModal } from '../../../components/modals/BibleBookModal';
import { BibleBottomSheet } from '../../../components/BibleBottomSheet';
import { BibleHeader } from '../../../components/BibleHeader';
import { BibleSkeleton } from '../../../components/BibleSkeleton';
import { BibleNumberModal } from '../../../components/modals/BibleNumberModal';
import { BibleVersionModal } from '../../../components/modals/BibleVersionModal';
import { ReaderSettingsModal } from '../../../components/modals/ReaderSettingsModal';
import { StudyVerseSelectModal } from '../../../components/modals/StudyVerseSelectModal';
import { RichTextEditor, RichTextEditorRef } from '../../../components/study/RichTextEditor';
import { STORAGE_KEYS } from '../../../constants/storage';
import { availableVersions, Book, getBibleData } from '../../../data';
import { useReaderSettings } from '../../../hooks/use-reader-settings';
import { useResponsive } from '../../../hooks/use-responsive';
import { useStudies } from '../../../hooks/use-studies';
import { useTheme } from '../../../hooks/use-theme';

const noOutline = Platform.select({ web: { outline: 'none', outlineWidth: 0 } as any, default: {} });

export default function StudyEditorScreen() {
  const { id, readonly } = useLocalSearchParams<{ id: string; readonly?: string }>();
  const isReadonly = readonly === 'true';
  const pathname = usePathname();
  const { getStudy, updateStudy, loaded } = useStudies();
  const { ms } = useResponsive();
  const { colors: themeColors, isDarkMode, colorTheme } = useTheme();
  const { readerColors, readerTheme } = useReaderSettings();

  const colors = useMemo(() => {
    if (readerTheme === 'sepia') {
      const active = Object.entries(COLOR_THEMES).map(([key, value]) => ({ key, ...value }))
        .find(t => t.key === colorTheme) ?? COLOR_THEMES.teal;
      return active.light;
    }
    return themeColors;
  }, [readerTheme, themeColors, colorTheme]);
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [initialHtml, setInitialHtml] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  const [versePickerVisible, setVersePickerVisible] = useState(false);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [vpVersion, setVpVersion] = useState(availableVersions[0]);
  const [vpBook, setVpBook] = useState<Book | null>(null);

  const [showToolbar, setShowToolbar] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.BIBLE_VERSION_GLOBAL).then(val => {
      if (val) setVpVersion(val);
      else {
        AsyncStorage.getItem(STORAGE_KEYS.LAST_READ).then(pos => {
          if (pos) {
            const parsed = JSON.parse(pos);
            if (parsed.version) setVpVersion(parsed.version);
          }
        }).catch(() => { });
      }
    }).catch(() => { });

    const subscription = DeviceEventEmitter.addListener('BibleVersionChanged', (newVersion) => {
      setVpVersion(newVersion);
    });
    return () => subscription.remove();
  }, []);
  const [vpChapter, setVpChapter] = useState(1);
  const [vpStep, setVpStep] = useState<'book' | 'chapter' | 'verses'>('book');

  const hydrated = useRef(false);
  const editorRef = useRef<RichTextEditorRef>(null);
  const saveTimeout = useRef<any>(null);

  const versionBooks = useMemo(() => getBibleData(vpVersion), [vpVersion]);
  const vpChapters = useMemo(() => vpBook ? Array.from({ length: vpBook.chapters.length }, (_, i) => i + 1) : [], [vpBook]);
  const vpVerses = useMemo(() => {
    if (!vpBook) return [];
    return (vpBook.chapters[vpChapter - 1] || []).map((text, i) => ({ verse: i + 1, text }));
  }, [vpBook, vpChapter]);

  useEffect(() => {
    if (vpBook) {
      const refreshedBook = versionBooks.find((b: Book) => b.name === vpBook.name);
      if (refreshedBook && refreshedBook !== vpBook) setVpBook(refreshedBook);
    }
  }, [vpVersion, versionBooks]);

  useEffect(() => {
    if (!loaded || hydrated.current) return;
    const study = getStudy(id);
    if (study) {
      setTitle(study.title);
      setHtmlContent(study.content || '');
      setInitialHtml(study.content || '');
    }
    hydrated.current = true;
  }, [loaded, id, getStudy]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      updateStudy(id, htmlContent, title);
    }, 1000);
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [htmlContent, title, id, updateStudy]);

  if (!loaded) {
    return <BibleSkeleton />;
  }

  const openVersePicker = () => {
    setVpStep('book');
    setVpBook(null);
    setVersePickerVisible(true);
  };

  const onInsertVerseHtml = (sortedNums: number[]) => {
    if (!vpBook || sortedNums.length === 0) return;
    const groups: string[] = [];
    let start = sortedNums[0];
    let end = sortedNums[0];
    for (let i = 1; i < sortedNums.length; i++) {
      if (sortedNums[i] === end + 1) end = sortedNums[i];
      else {
        groups.push(start === end ? `${start}` : `${start}-${end}`);
        start = sortedNums[i]; end = sortedNums[i];
      }
    }
    groups.push(start === end ? `${start}` : `${start}-${end}`);
    const formattedRanges = groups.join(', ');

    const bookDisplayName = vpBook.name || vpBook.abbrev;
    const ref = `${bookDisplayName} ${vpChapter}: ${formattedRanges} (${vpVersion.toUpperCase()})`;
    const lines = sortedNums.map(n => {
      const v = vpVerses.find(v => v.verse === n);
      return `<div class="verse-line"><span class="verse-num">${n}</span> <span class="verse-text">${v?.text ?? ''}</span></div>`;
    }).join('');

    const html = `<blockquote class="bible-verse" contenteditable="false"><div class="remove-verse-btn" contenteditable="false">×</div><div class="verse-title">${ref}</div>${lines}</blockquote><p><br></p>`;
    editorRef.current?.insertVerseHtml(html);
    setVersePickerVisible(false);
  };

  const exportPDF = async () => {
    setMenuVisible(false);
    const study = getStudy(id);
    if (!study) return;
    await exportToPDF(`Estudo: ${study.title}`, htmlContent);
  };

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
              { flex: 1, fontSize: ms(16), color: colors.onPrimary }, 
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: ms(4) }}>
            {!isReadonly && (
              <TouchableOpacity
                style={{ width: ms(38), height: ms(38), borderRadius: ms(10), alignItems: 'center', justifyContent: 'center' }}
                onPress={() => {
                  if (showToolbar) Keyboard.dismiss();
                  setShowToolbar(!showToolbar);
                }}
              >
                <BibleIcon name={showToolbar ? "edit-2" : "eye"} color={colors.onPrimary} size={ms(18)} />
              </TouchableOpacity>
            )}
            {!isReadonly && (
              <TouchableOpacity
                style={{ width: ms(38), height: ms(38), borderRadius: ms(10), alignItems: 'center', justifyContent: 'center' }}
                onPress={() => setMenuVisible(true)}
              >
                <BibleIcon name="more-vertical" color={colors.onPrimary} size={ms(18)} />
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {hydrated.current ? (
          <RichTextEditor
            ref={editorRef}
            initialHtml={initialHtml}
            onChange={setHtmlContent}
            onOpenVersePicker={openVersePicker}
            showToolbar={showToolbar}
            readonly={isReadonly}
          />
        ) : null}
      </KeyboardAvoidingView>

      <BibleActionsSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title="Ações"
        items={[
          { icon: 'file-text', label: 'Exportar em PDF', onPress: exportPDF }
        ]}
      />

      <ReaderSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />

      <BibleBottomSheet visible={versePickerVisible || versionModalVisible} onClose={() => { setVersePickerVisible(false); setVersionModalVisible(false); }}>
        <BibleBookModal
          visible={versePickerVisible && vpStep === 'book'}
          onClose={() => setVersePickerVisible(false)}
          books={versionBooks}
          versionSigla={vpVersion.toUpperCase()}
          onVersionPress={() => {
            setVersePickerVisible(false);
            setVersionModalVisible(true);
          }}
          onSelect={(bookName) => {
            const b = versionBooks.find((book: Book) => book.name === bookName || book.abbrev === bookName);
            if (b) { setVpBook(b); setVpChapter(1); setVpStep('chapter'); }
          }}
        />

        <BibleNumberModal
          visible={versePickerVisible && vpStep === 'chapter'}
          onClose={() => setVersePickerVisible(false)}
          onBack={() => setVpStep('book')}
          title={vpBook?.name ? vpBook.name : 'Capítulos'}
          footerText="capítulos"
          iconName="list"
          items={vpChapters}
          onSelect={(n: number) => { setVpChapter(n); setVpStep('verses'); }}
        />

        <StudyVerseSelectModal
          visible={versePickerVisible && vpStep === 'verses'}
          onClose={() => setVersePickerVisible(false)}
          onBack={() => setVpStep('chapter')}
          bookName={vpBook?.name || ''}
          chapter={vpChapter}
          verses={vpVerses}
          onConfirm={onInsertVerseHtml}
        />

        <BibleVersionModal
          visible={versionModalVisible}
          onClose={() => { setVersionModalVisible(false); setVersePickerVisible(!!vpStep); }}
          onSelect={(v) => {
            setVpVersion(v.sigla);
            AsyncStorage.setItem(STORAGE_KEYS.BIBLE_VERSION_GLOBAL, v.sigla).catch(() => { });
            DeviceEventEmitter.emit('BibleVersionChanged', v.sigla);
            setVersionModalVisible(false);
            setVersePickerVisible(true);
          }}
        />
      </BibleBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  titleInput: { flex: 1, fontWeight: '700' },
});
