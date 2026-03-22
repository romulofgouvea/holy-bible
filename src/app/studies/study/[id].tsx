import { BibleText } from '@/components/BibleText';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { BibleBookModal } from '../../../components/BibleBookModal';
import { BibleHeader } from '../../../components/BibleHeader';
import { BibleNumberModal } from '../../../components/BibleNumberModal';
import { BibleVersionModal } from '../../../components/BibleVersionModal';
import { ReaderSettingsModal } from '../../../components/ReaderSettingsModal';
import { RichTextEditor, RichTextEditorRef } from '../../../components/study/RichTextEditor';
import { StudyTopMenu } from '../../../components/study/StudyTopMenu';
import { StudyVerseSelectModal } from '../../../components/study/StudyVerseSelectModal';
import { ROUTES } from '../../../constants/routes';
import { availableVersions, Book, getBibleData } from '../../../data';
import { useReaderSettings } from '../../../hooks/use-reader-settings';
import { useResponsive } from '../../../hooks/use-responsive';
import { Study, useStudies } from '../../../hooks/use-studies';
import { useTheme } from '../../../hooks/use-theme';

const noOutline = Platform.select({ web: { outline: 'none', outlineWidth: 0 } as any, default: {} });

export default function StudyEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getStudy, updateStudy, loaded } = useStudies();
  const { ms } = useResponsive();
  const { colors } = useTheme();
  const { readerColors } = useReaderSettings();
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
  }, [htmlContent, title]);

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

    const html = `<br><blockquote class="bible-verse"><div class="verse-title">${ref}</div>${lines}</blockquote><p><br></p>`;
    editorRef.current?.insertVerseHtml(html);
    setVersePickerVisible(false);
  };

  const exportPDF = useCallback(async () => {
    setMenuVisible(false);
    const study = getStudy(id);
    if (!study) return;
    try {
      const css = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap');
        @media print { @page { margin: 0; size: auto; } body { padding: 20mm; } }
        body { font-family: 'Inter', -apple-system, sans-serif; color: #222; max-width: 800px; margin: 0 auto; line-height: 1.6; padding: 24px; }
        h1.main-title { color: #008080; font-size: 32px; font-weight: 800; margin-bottom: 8px; border-bottom: 2px solid #e0f2f1; padding-bottom: 12px; }
        .meta { color: #888; font-size: 13px; margin-bottom: 32px; font-weight: 600; }
        .bible-verse { border-left: 4px solid #008080; padding: 16px 24px; background: #f4faf9; border-radius: 8px; margin: 24px 0; page-break-inside: avoid; }
        .bible-verse b, .bible-verse .verse-title { color: #008080; display: block; margin-bottom: 12px; font-size: 16px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }
        .verse-line { margin-bottom: 10px; line-height: 1.7; display: flex; gap: 8px; }
        .verse-num { font-weight: 800; color: #008080; font-size: 12px; margin-top: 2px; }
        .verse-text { font-style: italic; color: #333; flex: 1; }
        img { max-width: 100%; border-radius: 12px; margin: 24px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); page-break-inside: avoid; }
      `;

      const htmlDocument = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${study.title}</title><style>${css}</style></head><body>
        <h1 class="main-title">${study.title}</h1>
        <div class="meta">Criado em ${study.createdAt} • Exportado em ${new Date().toLocaleDateString('pt-BR')}</div>
        ${htmlContent}
      </body></html>`;

      if (Platform.OS === 'web') {
        const htmlWithScript = htmlDocument.replace('</body>', '<script>setTimeout(()=>window.print(),500);</script></body>');
        const blob = new Blob([htmlWithScript], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.target = '_blank';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } else {
        const { uri } = await Print.printToFileAsync({ html: htmlDocument, width: 612, height: 792 });
        const safeTitle = study.title.replace(/[^a-z0-9]/gi, '_') || 'estudo';
        const newUri = `${(FileSystem as any).documentDirectory}${safeTitle}.pdf`;
        try { await FileSystem.deleteAsync(newUri, { idempotent: true }); } catch (e) { }
        await FileSystem.copyAsync({ from: uri, to: newUri });
        await Sharing.shareAsync(newUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }
    } catch (e: any) { Alert.alert('Erro na geração de PDF', String(e?.message || e)); }
  }, [id, getStudy, htmlContent]);

  return (
    <View style={{ flex: 1, backgroundColor: readerColors.background }}>
      <BibleHeader
        showMenu={false}
        leftContent={
          <>
            <TouchableOpacity style={{ width: ms(40), height: ms(40), borderRadius: ms(10), alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', marginRight: ms(8) }} onPress={() => router.canGoBack() ? router.back() : router.replace(ROUTES.STUDIES as any)}>
              <Feather name="arrow-left" size={ms(20)} color={colors.onPrimary} />
            </TouchableOpacity>
            <TextInput
              style={[styles.titleInput, { fontSize: ms(16), color: colors.onPrimary }, noOutline]}
              value={title}
              onChangeText={setTitle}
              placeholder="Nome do estudo"
              placeholderTextColor={colors.textMuted}
              {...({ outlineStyle: 'none' } as any)}
              underlineColorAndroid="transparent"
            />
          </>
        }
        rightContent={
          <TouchableOpacity style={{ width: ms(40), height: ms(40), borderRadius: ms(10), alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' }} onPress={() => setMenuVisible(true)}>
            <Feather name="more-vertical" size={ms(20)} color={colors.onPrimary} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {hydrated.current ? (
          <RichTextEditor
            ref={editorRef}
            initialHtml={initialHtml}
            onChange={setHtmlContent}
            onOpenVersePicker={openVersePicker}
          />
        ) : null}
      </KeyboardAvoidingView>

      <StudyTopMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onExportPDF={exportPDF}
      />

      <ReaderSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />

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
        title={vpBook?.name ? `Capítulos - ${vpBook.name}` : 'Capítulos'}
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
        onClose={() => { setVersionModalVisible(false); setVersePickerVisible(true); }}
        onSelect={(v) => {
          setVpVersion(v.sigla);
          setVersionModalVisible(false);
          setVersePickerVisible(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  titleInput: { flex: 1, color: '#fff', fontWeight: '700' },
});
