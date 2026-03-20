import { BibleText } from '@/components/BibleText';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BibleBookModal } from '../../../components/BibleBookModal';
import { BibleNumberModal } from '../../../components/BibleNumberModal';
import { BibleVersionModal } from '../../../components/BibleVersionModal';
import { ReaderSettingsModal } from '../../../components/ReaderSettingsModal';
import { pickImageAction, StudyBlock } from '../../../components/study/StudyBlock';
import { useBlockActions } from '../../../components/study/StudyBlockToolbar';
import { StudySlashMenu } from '../../../components/study/StudySlashMenu';
import { StudyTopMenu } from '../../../components/study/StudyTopMenu';
import { StudyVerseSelectModal } from '../../../components/study/StudyVerseSelectModal';
import { ROUTES } from '../../../constants/routes';
import { availableVersions, Book, getBibleData } from '../../../data';
import { useResponsive } from '../../../hooks/use-responsive';
import { useTheme } from '../../../hooks/use-theme';
import { useReaderSettings } from '../../../hooks/use-reader-settings';
import { Block, makeBlock, Study, useStudies } from '../../../hooks/use-studies';

const noOutline = Platform.select({ web: { outline: 'none', outlineWidth: 0 } as any, default: {} });

export default function StudyEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getStudy, updateStudy, deleteStudy, loaded } = useStudies();
  const { ms, height } = useResponsive();
  const { colors } = useTheme();
  const { readerColors } = useReaderSettings();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([makeBlock('paragraph')]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [slashVisible, setSlashVisible] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [pendingVideoBlockId, setPendingVideoBlockId] = useState<string | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [versePickerVisible, setVersePickerVisible] = useState(false);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);
  const [vpVersion, setVpVersion] = useState(availableVersions[0]);
  const [vpBook, setVpBook] = useState<Book | null>(null);
  const [vpChapter, setVpChapter] = useState(1);
  const [vpStep, setVpStep] = useState<'book' | 'chapter' | 'verses'>('book');

  const hydrated = useRef(false);
  const blockRefs = useRef<Record<string, TextInput | null>>({});
  const versionBooks = useMemo(() => getBibleData(vpVersion), [vpVersion]);

  useEffect(() => {
    if (vpBook) {
      const refreshedBook = versionBooks.find((b: Book) => b.name === vpBook.name);
      if (refreshedBook && refreshedBook !== vpBook) {
        setVpBook(refreshedBook);
      }
    }
  }, [vpVersion, versionBooks]);

  const vpChapters = useMemo(() => vpBook ? Array.from({ length: vpBook.chapters.length }, (_, i) => i + 1) : [], [vpBook]);

  const vpVerses = useMemo(() => {
    if (!vpBook) return [];
    return (vpBook.chapters[vpChapter - 1] || []).map((text, i) => ({ verse: i + 1, text }));
  }, [vpBook, vpChapter]);

  useEffect(() => {
    if (!loaded || hydrated.current) return;
    const study = getStudy(id);
    if (study) {
      setTitle(study.title);
      setBlocks(study.blocks.length ? study.blocks : [makeBlock('paragraph')]);
    }
    hydrated.current = true;
  }, [loaded]);

  useEffect(() => {
    if (!hydrated.current) return;
    const study = getStudy(id);
    if (study) updateStudy(id, blocks, title);
  }, [blocks, title]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const kDidShow = Keyboard.addListener('keyboardDidShow', e => setKeyboardHeight(e.endCoordinates.height));
    const kDidHide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { kDidShow.remove(); kDidHide.remove(); };
  }, []);



  const { moveBlock, deleteBlock, addBlockAfter } = useBlockActions(setBlocks, blockRefs as any);

  const applySlashCommand = useCallback((type: Block['type']) => {
    setSlashVisible(false);
    Keyboard.dismiss();
    if (!activeBlockId) return;
    const clean = (content: string) => content.replace(/\/$/, '');

    if (type === 'verse') {
      setBlocks(prev => prev.map(b => b.id === activeBlockId ? { ...b, content: clean((b as any).content) } as Block : b));
      setPendingBlockId(activeBlockId);
      setVpStep('book'); setVpBook(null);
      setVersePickerVisible(true);
      return;
    }
    if (type === 'image') {
      setBlocks(prev => prev.map(b => b.id === activeBlockId ? { ...b, content: clean((b as any).content) } as Block : b));
      pickImageAction(activeBlockId, setBlocks);
      return;
    }
    if (type === 'video') {
      setBlocks(prev => prev.map(b => b.id === activeBlockId ? { ...b, content: clean((b as any).content) } as Block : b));
      setPendingVideoBlockId(activeBlockId);
      setVideoUrl(''); setVideoTitle('');
      setVideoModalVisible(true);
      return;
    }
    setBlocks(prev => prev.map(b =>
      b.id === activeBlockId ? { id: b.id, type, content: clean((b as any).content) } as Block : b
    ));
    setTimeout(() => blockRefs.current[activeBlockId]?.focus(), 150);
  }, [activeBlockId]);



  const confirmVideo = useCallback(() => {
    if (!pendingVideoBlockId || !videoUrl.trim()) return;
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === pendingVideoBlockId);
      const vidBlock: Block = { id: pendingVideoBlockId, type: 'video', url: videoUrl.trim(), title: videoTitle.trim() || videoUrl.trim() };
      const newPara = makeBlock('paragraph');
      const next = [...prev];
      next[idx] = vidBlock;
      next.splice(idx + 1, 0, newPara);
      return next;
    });
    setVideoModalVisible(false);
    setPendingVideoBlockId(null);
  }, [pendingVideoBlockId, videoUrl, videoTitle]);



  const buildHTML = useCallback((study: Study) => {
    const blockHTML = study.blocks.map(b => {
      if (b.type === 'header') return `<h2 class="header">${(b as any).content}</h2>`;
      if (b.type === 'h1') return `<h3 class="h1">${(b as any).content}</h3>`;
      if (b.type === 'h2') return `<h4 class="h2">${(b as any).content}</h4>`;
      if (b.type === 'paragraph') return `<p class="para">${(b as any).content}</p>`;
      if (b.type === 'image') return `<img src="${(b as any).uri}"/>`;
      if (b.type === 'video') return `<a class="video-link" href="${(b as any).url}"><span>🎬</span> ${(b as any).title}</a>`;
      if (b.type === 'verse') {
        const lines = (b as any).content.split('\n').filter((l: string) => l.trim()).map((line: string) => {
          const sp = line.indexOf(' ');
          const num = line.slice(0, sp); const text = line.slice(sp + 1);
          return `<div class="verse-line"><span class="verse-num">${num}</span> <span class="verse-text">${text}</span></div>`;
        }).join('');
        return `<blockquote class="verse"><b>${(b as any).verseRef}</b>${lines}</blockquote>`;
      }
      return '';
    }).join('');

    const css = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap');
      @media print {
        @page { margin: 0; size: auto; }
        body { padding: 20mm; }
      }
      body { font-family: 'Inter', -apple-system, sans-serif; color: #222; max-width: 800px; margin: 0 auto; line-height: 1.6; padding: 24px; }
      h1.main-title { color: #008080; font-size: 32px; font-weight: 800; margin-bottom: 8px; border-bottom: 2px solid #e0f2f1; padding-bottom: 12px; }
      .meta { color: #888; font-size: 13px; margin-bottom: 32px; font-weight: 600; }
      h2.header { color: #008080; font-size: 24px; font-weight: 800; margin-top: 36px; letter-spacing: -0.5px; }
      h3.h1     { color: #222; font-size: 20px; font-weight: 700; margin-top: 28px; }
      h4.h2     { color: #444; font-size: 16px; font-weight: 600; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
      p.para    { font-size: 15px; margin: 14px 0; color: #333; }
      blockquote.verse { border-left: 4px solid #008080; padding: 16px 24px; background: #f4faf9; border-radius: 8px; margin: 24px 0; page-break-inside: avoid; }
      blockquote.verse b { color: #008080; display: block; margin-bottom: 12px; font-size: 16px; letter-spacing: 0.5px; text-transform: uppercase; }
      .verse-line { margin-bottom: 10px; line-height: 1.7; display: flex; gap: 8px; }
      .verse-num { font-weight: 800; color: #008080; font-size: 12px; margin-top: 2px; }
      .verse-text { font-style: italic; color: #333; flex: 1; }
      img { max-width: 100%; border-radius: 12px; margin: 24px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); page-break-inside: avoid; }
      .video-link { display: inline-block; background: #fff; color: #008080; padding: 14px 20px; border-radius: 10px; text-decoration: none; font-weight: 700; margin: 16px 0; border: 2px solid #e0f2f1; page-break-inside: avoid; }
    `;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${study.title}</title><style>${css}</style></head><body>
      <h1 class="main-title">${study.title}</h1>
      <div class="meta">Criado em ${study.createdAt} • Exportado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</div>
      ${blockHTML}
    </body></html>`;
  }, []);

  const exportPDF = useCallback(async () => {
    setMenuVisible(false);
    const study = getStudy(id);
    if (!study) return;
    try {
      const html = buildHTML(study);

      if (Platform.OS === 'web') {
        const htmlWithScript = html.replace('</body>', '<script>setTimeout(()=>window.print(),500);</script></body>');
        const blob = new Blob([htmlWithScript], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 });
        const safeTitle = study.title.replace(/[^a-z0-9]/gi, '_');
        const newUri = `${(FileSystem as any).documentDirectory}${safeTitle}.pdf`;
        await FileSystem.copyAsync({ from: uri, to: newUri });
        await Sharing.shareAsync(newUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }
    } catch (e) { Alert.alert('Erro', 'Não foi possível gerar o PDF'); }
  }, [id, getStudy, buildHTML]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: readerColors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.topBar, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.canGoBack() ? router.back() : router.replace(ROUTES.STUDIES as any)}>
          <Feather name="arrow-left" size={ms(22)} color={colors.onPrimary} />
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setSettingsModalVisible(true)}>
            <BibleText style={{ fontWeight: '800', fontSize: ms(16), color: colors.onPrimary }}>Aa</BibleText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { marginLeft: 4 }]} onPress={() => setMenuVisible(true)}>
            <Feather name="more-vertical" size={ms(22)} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: readerColors.background }} contentContainerStyle={styles.editorContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {blocks.map((item, index) => (
          <StudyBlock
            key={item.id}
            item={item}
            focusedId={focusedId}
            blocksLength={blocks.length}
            blockIdx={index}
            setFocusedId={setFocusedId}
            setActiveBlockId={setActiveBlockId}
            setSlashVisible={setSlashVisible}
            setBlocks={setBlocks}
            blockRefs={blockRefs}
            setFullScreenImage={setFullScreenImage}
            addBlockAfter={addBlockAfter}
            deleteBlock={deleteBlock}
            moveBlock={moveBlock}
          />
        ))}
        <TouchableOpacity style={styles.addBlockBtn} onPress={() => { const last = blocks[blocks.length - 1]; addBlockAfter(last?.id ?? ''); }}>
          <Feather name="plus" size={ms(16)} color={colors.textMuted} />
          <BibleText style={[{ color: colors.textMuted, fontSize: ms(13) }]}>Adicionar bloco</BibleText>
        </TouchableOpacity>
      </ScrollView>

      <StudySlashMenu
        visible={slashVisible}
        onClose={() => setSlashVisible(false)}
        onSelectCommand={applySlashCommand}
      />

      <StudyTopMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onExportPDF={exportPDF}
      />

      <ReaderSettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />

      <Modal visible={videoModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setVideoModalVisible(false)} />
          <View style={styles.videoModal}>
            <View style={styles.modalHandle} />
            <BibleText style={[styles.videoModalTitle, { fontSize: ms(18) }]}>Link de Vídeo</BibleText>
            <TextInput autoFocus style={[styles.videoInput, noOutline, { fontSize: ms(15) }]} value={videoUrl} onChangeText={setVideoUrl} placeholder="https://youtube.com/watch?v=..." placeholderTextColor="#bbb" autoCapitalize="none" keyboardType="url" {...({ outlineStyle: 'none' } as any)} underlineColorAndroid="transparent" />
            <TextInput style={[styles.videoInput, noOutline, { fontSize: ms(15) }]} value={videoTitle} onChangeText={setVideoTitle} placeholder="Título (opcional)" placeholderTextColor="#bbb" {...({ outlineStyle: 'none' } as any)} underlineColorAndroid="transparent" />
            <TouchableOpacity style={[styles.confirmBtn, !videoUrl.trim() && styles.confirmBtnDisabled]} onPress={confirmVideo} disabled={!videoUrl.trim()}>
              <BibleText style={[{ color: '#fff', fontWeight: '700', fontSize: ms(15) }]}>Inserir</BibleText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
        onSelect={n => { setVpChapter(n); setVpStep('verses'); }}
      />

      <StudyVerseSelectModal
        visible={versePickerVisible && vpStep === 'verses'}
        onClose={() => setVersePickerVisible(false)}
        onBack={() => setVpStep('chapter')}
        bookName={vpBook?.name || ''}
        chapter={vpChapter}
        verses={vpVerses}
        onConfirm={(sortedNums) => {
          if (!pendingBlockId || !vpBook || sortedNums.length === 0) return;

          const groups: string[] = [];
          let start = sortedNums[0];
          let end = sortedNums[0];
          for (let i = 1; i < sortedNums.length; i++) {
            if (sortedNums[i] === end + 1) {
              end = sortedNums[i];
            } else {
              groups.push(start === end ? `${start}` : `${start}-${end}`);
              start = sortedNums[i];
              end = sortedNums[i];
            }
          }
          groups.push(start === end ? `${start}` : `${start}-${end}`);
          const formattedRanges = groups.join(', ');

          const bookDisplayName = vpBook.name || vpBook.abbrev;
          const ref = `${bookDisplayName} ${vpChapter}: ${formattedRanges} (${vpVersion.toUpperCase()})`;
          const content = sortedNums.map(n => { const v = vpVerses.find(v => v.verse === n); return `${n} ${v?.text ?? ''}`; }).join('\n');

          setBlocks(prev => {
            const idx = prev.findIndex(b => b.id === pendingBlockId);
            const vb: Block = { id: pendingBlockId, type: 'verse', content, verseRef: ref, bookName: vpBook.abbrev, chapter: vpChapter, verse: sortedNums[0] };
            const nb = makeBlock('paragraph');
            const next = [...prev];
            if (idx === -1) return [...next, vb, nb];
            next[idx] = vb; next.splice(idx + 1, 0, nb);
            return next;
          });
          setVersePickerVisible(false);
          setPendingBlockId(null);
        }}
      />

      <Modal visible={!!fullScreenImage} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 40, right: 20, zIndex: 2, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }} onPress={() => setFullScreenImage(null)}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
          {fullScreenImage && <Image source={{ uri: fullScreenImage }} style={{ flex: 1 }} resizeMode="contain" />}
        </View>
      </Modal>

      <BibleVersionModal
        visible={versionModalVisible}
        onClose={() => { setVersionModalVisible(false); setVersePickerVisible(true); }}
        onSelect={(v) => {
          setVpVersion(v.sigla);
          setVersionModalVisible(false);
          setVersePickerVisible(true);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#008080', paddingHorizontal: 8, paddingVertical: 8, gap: 8 },
  iconBtn: { padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)' },
  titleInput: { flex: 1, color: '#fff', fontWeight: '700' },
  editorContent: { padding: 8, paddingBottom: 160, flexGrow: 1 },
  blockInput: { color: '#1a1a1a', paddingVertical: 6, paddingHorizontal: 0, lineHeight: 24, minHeight: 40 },
  headerText: { fontWeight: '800', color: '#008080', paddingTop: 14, letterSpacing: 0.2 },
  h1Text: { fontWeight: '700', color: '#222', paddingTop: 10 },
  h2Text: { fontWeight: '600', color: '#444', paddingTop: 6 },
  imageBlock: { marginVertical: 6, borderRadius: 12, overflow: 'hidden' },
  imagePreview: { width: '100%', height: 200, borderRadius: 12 },
  imagePlaceholder: { height: 200, backgroundColor: '#f5f5f5', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  captionInput: { paddingHorizontal: 8, paddingVertical: 6, color: '#777', fontSize: 13, textAlign: 'center' },
  videoBlock: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f9f9', borderRadius: 12, padding: 14, marginVertical: 6, gap: 12 },
  videoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#c8e6e6', alignItems: 'center', justifyContent: 'center' },
  videoTitle: { flex: 1, color: '#333', fontWeight: '600' },
  verseBlock: { backgroundColor: '#f0f9f9', borderLeftWidth: 4, borderLeftColor: '#008080', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, marginVertical: 6 },
  verseRef: { fontWeight: '700', color: '#008080', marginBottom: 4 },
  verseText: { color: '#333', lineHeight: 22 },
  addBlockBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 16, marginTop: 8 },
  menuBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  videoModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 14 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  videoModalTitle: { fontWeight: '800', color: '#222' },
  videoInput: { backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#333' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#008080', borderRadius: 14, paddingVertical: 13, marginTop: 4 },
  confirmBtnDisabled: { backgroundColor: '#f0f0f0' },
  confirmText: { color: '#fff', fontWeight: '700' },
  confirmTextDisabled: { color: '#aaa' },
  modalItem: { color: '#fff', fontWeight: '700', fontSize: 14 }
});
