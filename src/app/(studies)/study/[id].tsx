import { BibleConfirmModal } from '@/components/BibleConfirmModal';
import { BibleSelectModal } from '@/components/BibleSelectModal';
import { BibleText } from '@/components/BibleText';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { availableVersions, Book, getBibleData } from '../../../data';
import { useResponsive } from '../../../hooks/use-responsive';
import { Block, makeBlock, Study, useStudies } from '../../../hooks/use-studies';

const noOutline = Platform.select({ web: { outline: 'none', outlineWidth: 0 } as any, default: {} });

const SLASH_COMMANDS = [
  { type: 'header', label: 'Cabeçalho', icon: 'minus' as const, desc: 'Seção de destaque' },
  { type: 'h1', label: 'Título 1', icon: 'type' as const, desc: 'Título principal' },
  { type: 'h2', label: 'Título 2', icon: 'type' as const, desc: 'Subtítulo' },
  { type: 'verse', label: 'Versículo', icon: 'book-open' as const, desc: 'Citar versículo(s)' },
  { type: 'image', label: 'Imagem', icon: 'image' as const, desc: 'Inserir imagem' },
  { type: 'video', label: 'Link de Vídeo', icon: 'video' as const, desc: 'Link do YouTube' },
];

export default function StudyEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getStudy, updateStudy, deleteStudy, loaded } = useStudies();
  const { ms } = useResponsive();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([makeBlock('paragraph')]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [slashVisible, setSlashVisible] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [pendingVideoBlockId, setPendingVideoBlockId] = useState<string | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [versePickerVisible, setVersePickerVisible] = useState(false);
  const [pendingBlockId, setPendingBlockId] = useState<string | null>(null);
  const [vpVersion] = useState(availableVersions[0]);
  const [vpBook, setVpBook] = useState<Book | null>(null);
  const [vpChapter, setVpChapter] = useState(1);
  const [vpStep, setVpStep] = useState<'book' | 'chapter' | 'verses'>('book');
  const [vpBookSearch, setVpBookSearch] = useState('');
  const [vpChapterSearch, setVpChapterSearch] = useState('');
  const [selectedVerseNums, setSelectedVerseNums] = useState<Set<number>>(new Set());

  const hydrated = useRef(false);
  const blockRefs = useRef<Record<string, TextInput | null>>({});
  const versionBooks = useMemo(() => getBibleData(vpVersion), [vpVersion]);
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filteredBooks = useMemo(() => {
    const q = normalize(vpBookSearch.trim());
    return q ? versionBooks.filter((b: Book) => normalize(b.abbrev).includes(q) || normalize(b.name).includes(q)) : versionBooks;
  }, [vpBookSearch, versionBooks]);

  const vpChapters = useMemo(() => vpBook ? Array.from({ length: vpBook.chapters.length }, (_, i) => i + 1) : [], [vpBook]);
  const filteredChapters = useMemo(() => {
    const q = vpChapterSearch.trim();
    return q ? vpChapters.filter(n => String(n).includes(q)) : vpChapters;
  }, [vpChapterSearch, vpChapters]);

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

  const updateBlock = useCallback((blockId: string, content: string) => {
    if (content === '/') {
      setActiveBlockId(blockId);
      setSlashVisible(true);
      Keyboard.dismiss();
    } else {
      setSlashVisible(false);
    }
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, content } as Block : b));
  }, []);

  const moveBlock = useCallback((blockId: string, dir: 'up' | 'down') => {
    Keyboard.dismiss();
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === blockId);
      if (dir === 'up' && idx === 0) return prev;
      if (dir === 'down' && idx === prev.length - 1) return prev;
      const next = [...prev];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    Keyboard.dismiss();
    setBlocks(prev => {
      if (prev.length <= 1) return [makeBlock('paragraph')];
      return prev.filter(b => b.id !== blockId);
    });
  }, []);

  const addBlockAfter = useCallback((blockId: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === blockId);
      const nb = makeBlock('paragraph');
      const next = [...prev];
      next.splice(idx + 1, 0, nb);
      setTimeout(() => blockRefs.current[nb.id]?.focus(), 80);
      return next;
    });
  }, []);

  const applySlashCommand = useCallback((type: Block['type']) => {
    setSlashVisible(false);
    Keyboard.dismiss();
    if (!activeBlockId) return;
    const clean = (content: string) => content.replace(/\/$/, '');

    if (type === 'verse') {
      setBlocks(prev => prev.map(b => b.id === activeBlockId ? { ...b, content: clean((b as any).content) } as Block : b));
      setPendingBlockId(activeBlockId);
      setVpStep('book'); setVpBook(null); setVpBookSearch(''); setSelectedVerseNums(new Set());
      setVersePickerVisible(true);
      return;
    }
    if (type === 'image') {
      setBlocks(prev => prev.map(b => b.id === activeBlockId ? { ...b, content: clean((b as any).content) } as Block : b));
      pickImage(activeBlockId);
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
    setTimeout(() => blockRefs.current[activeBlockId]?.focus(), 80);
  }, [activeBlockId]);

  const pickImage = useCallback(async (blockId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === blockId);
      const imgBlock: Block = { id: blockId, type: 'image', uri, caption: '' };
      const newPara = makeBlock('paragraph');
      const next = [...prev];
      next[idx] = imgBlock;
      next.splice(idx + 1, 0, newPara);
      return next;
    });
  }, []);

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

  const toggleVerseSelection = useCallback((num: number) => {
    setSelectedVerseNums(prev => { const next = new Set(prev); next.has(num) ? next.delete(num) : next.add(num); return next; });
  }, []);

  const confirmVerseSelection = useCallback(() => {
    if (!pendingBlockId || !vpBook || selectedVerseNums.size === 0) return;
    const sorted = [...selectedVerseNums].sort((a, b) => a - b);
    const ref = sorted.length === 1 ? `${vpBook.name} ${vpChapter}:${sorted[0]}` : `${vpBook.name} ${vpChapter}:${sorted[0]}–${sorted[sorted.length - 1]}`;
    const content = sorted.map(n => { const v = vpVerses.find(v => v.verse === n); return `${n} ${v?.text ?? ''}`; }).join('\n');
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === pendingBlockId);
      const vb: Block = { id: pendingBlockId, type: 'verse', content, verseRef: ref, bookName: vpBook.name, chapter: vpChapter, verse: sorted[0] };
      const nb = makeBlock('paragraph');
      const next = [...prev];
      if (idx === -1) return [...next, vb, nb];
      next[idx] = vb; next.splice(idx + 1, 0, nb);
      return next;
    });
    setVersePickerVisible(false); setPendingBlockId(null); setSelectedVerseNums(new Set());
  }, [pendingBlockId, vpBook, vpChapter, vpVerses, selectedVerseNums]);

  const exportJSON = useCallback(async () => {
    setMenuVisible(false);
    const study = getStudy(id);
    if (!study) return;
    const json = JSON.stringify(study, null, 2);
    if (Platform.OS === 'web') {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${study.title}.json`; a.click();
    } else {
      const path = `${(FileSystem as any).documentDirectory}${study.title.replace(/[^a-z0-9]/gi, '_')}.json`;
      await FileSystem.writeAsStringAsync(path, json);
      await Sharing.shareAsync(path, { mimeType: 'application/json' });
    }
  }, [id, getStudy]);

  const handleDeleteStudy = useCallback(() => {
    setMenuVisible(false);
    setDeleteConfirmVisible(true);
  }, []);

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

  const renderBlock = (item: Block) => {
    const isFocused = focusedId === item.id;

    if (item.type === 'image') {
      return (
        <View key={item.id} style={[styles.imageBlock, isFocused && styles.blockFocusedBorder]}>
          {item.uri ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setFullScreenImage(item.uri)} onPressIn={() => { setFocusedId(item.id); setActiveBlockId(item.id); }}>
              <Image source={{ uri: item.uri }} style={styles.imagePreview} resizeMode="cover" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.imagePlaceholder} onPress={() => pickImage(item.id)}>
              <Feather name="image" size={ms(32)} color="#ccc" />
              <BibleText style={{ color: '#ccc', marginTop: 8 }}>Toque para selecionar imagem</BibleText>
            </TouchableOpacity>
          )}
          <TextInput
            style={[styles.captionInput, noOutline]}
            value={item.caption}
            onChangeText={cap => setBlocks(prev => prev.map(b => b.id === item.id ? { ...b, caption: cap } as Block : b))}
            placeholder="Legenda (opcional)"
            placeholderTextColor="#ccc"
            onFocus={() => { setFocusedId(item.id); setActiveBlockId(item.id); }}
            {...({ outlineStyle: 'none' } as any)}
            underlineColorAndroid="transparent"
          />
        </View>
      );
    }

    if (item.type === 'video') {
      return (
        <TouchableOpacity key={item.id} style={[styles.videoBlock, isFocused && styles.blockFocusedBorder]} activeOpacity={0.8} onPressIn={() => { setFocusedId(item.id); setActiveBlockId(item.id); }}>
          <View style={styles.videoIcon}><Feather name="video" size={ms(20)} color="#008080" /></View>
          <BibleText style={[styles.videoTitle, { fontSize: ms(14) }]} numberOfLines={1}>{item.title || item.url}</BibleText>
          <TouchableOpacity onPress={() => Linking.openURL(item.url)} style={{ padding: 8 }}>
            <Feather name="external-link" size={ms(16)} color="#008080" />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    if (item.type === 'verse') {
      return (
        <TouchableOpacity key={item.id} style={[styles.verseBlock, isFocused && styles.blockFocusedBorder]} activeOpacity={0.8} onPressIn={() => { setFocusedId(item.id); setActiveBlockId(item.id); }}>
          <BibleText style={[styles.verseRef, { fontSize: ms(18), marginBottom: 16 }]}>{item.verseRef}</BibleText>
          <BibleText style={[styles.verseText, { fontSize: ms(16) }]}>
            {item.content.split('\n').map((line, i, arr) => {
              const sp = line.indexOf(' ');
              const num = line.slice(0, sp); const text = line.slice(sp + 1);
              return <BibleText key={i}><BibleText style={{ color: '#008080', fontWeight: '700' }}>{num} </BibleText><BibleText style={{ fontStyle: 'italic', lineHeight: 20 }}>{text}</BibleText>{i < arr.length - 1 ? '\n\n' : ''}</BibleText>;
            })}
          </BibleText>
        </TouchableOpacity>
      );
    }

    const fsMap: Record<string, number> = { header: ms(22), h1: ms(19), h2: ms(16), paragraph: ms(15) };
    const textStyle = [
      styles.blockInput,
      item.type === 'header' && styles.headerText,
      item.type === 'h1' && styles.h1Text,
      item.type === 'h2' && styles.h2Text,
      { fontSize: fsMap[item.type] ?? ms(15) },
      noOutline,
    ];
    const placeholder = item.type === 'header' ? 'Cabeçalho...' : item.type === 'h1' ? 'Título 1...' : item.type === 'h2' ? 'Título 2...' : "Escreva algo ou '/' para opções...";

    return (
      <TextInput
        key={item.id}
        ref={r => { blockRefs.current[item.id] = r; }}
        style={textStyle as any}
        value={(item as any).content}
        onChangeText={text => updateBlock(item.id, text)}
        placeholder={placeholder}
        placeholderTextColor="#ccc"
        multiline
        blurOnSubmit={false}
        onFocus={() => { setFocusedId(item.id); setActiveBlockId(item.id); }}
        onSubmitEditing={() => addBlockAfter(item.id)}
        onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === 'Backspace' && !(item as any).content) deleteBlock(item.id); }}
        {...({ outlineStyle: 'none' } as any)}
        underlineColorAndroid="transparent"
      />
    );
  };

  const focused = focusedId ? blocks.find(b => b.id === focusedId) : null;
  const focusedIdx = focusedId ? blocks.findIndex(b => b.id === focusedId) : -1;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/estudos' as any)}>
          <Feather name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <TextInput
          style={[styles.titleInput, { fontSize: ms(16) }, noOutline]}
          value={title}
          onChangeText={setTitle}
          placeholder="Nome do estudo"
          placeholderTextColor="rgba(255,255,255,0.5)"
          {...({ outlineStyle: 'none' } as any)}
          underlineColorAndroid="transparent"
        />
        <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuVisible(true)}>
          <Feather name="more-vertical" size={ms(22)} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={styles.editorContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {blocks.map(item => (
          <View key={item.id} style={{ zIndex: focusedId === item.id ? 20 : 1 }}>
            {renderBlock(item)}

            {focusedId === item.id && (
              <View style={styles.blockToolbarWrapper} pointerEvents="box-none" {...({ onMouseDown: (e: any) => e.preventDefault() } as any)}>
                <View style={styles.blockToolbar}>
                  <TouchableOpacity style={styles.toolBtn} onPress={() => focusedId && addBlockAfter(focusedId)}>
                    <Feather name="plus" size={ms(18)} color="#008080" />
                  </TouchableOpacity>
                  <View style={styles.toolDivider} />
                  <TouchableOpacity style={styles.toolBtn} onPress={() => focusedId && moveBlock(focusedId, 'up')} disabled={focusedIdx === 0}>
                    <Feather name="arrow-up" size={ms(18)} color={focusedIdx === 0 ? '#ddd' : '#008080'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.toolBtn} onPress={() => focusedId && moveBlock(focusedId, 'down')} disabled={focusedIdx === blocks.length - 1}>
                    <Feather name="arrow-down" size={ms(18)} color={focusedIdx === blocks.length - 1 ? '#ddd' : '#008080'} />
                  </TouchableOpacity>
                  <View style={styles.toolDivider} />
                  <TouchableOpacity style={styles.toolBtn} onPress={() => focusedId && deleteBlock(focusedId)}>
                    <Feather name="trash-2" size={ms(18)} color="#e74c3c" />
                  </TouchableOpacity>
                  <View style={styles.toolDivider} />
                  <TouchableOpacity style={styles.toolBtn} onPress={() => { Keyboard.dismiss(); setFocusedId(null); setActiveBlockId(null); setSlashVisible(false); }}>
                    <Feather name="x" size={ms(18)} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}
        <TouchableOpacity style={styles.addBlockBtn} onPress={() => { const last = blocks[blocks.length - 1]; addBlockAfter(last?.id ?? ''); }}>
          <Feather name="plus" size={ms(16)} color="#ccc" />
          <BibleText style={[{ color: '#ccc', fontSize: ms(13) }]}>Adicionar bloco</BibleText>
        </TouchableOpacity>
      </ScrollView>

      {slashVisible && (
        <View style={styles.slashMenu}>
          <BibleText style={[styles.slashTitle, { fontSize: ms(11) }]}>COMANDOS</BibleText>
          {SLASH_COMMANDS.map(cmd => (
            <TouchableOpacity key={cmd.type} style={styles.slashItem} onPress={() => applySlashCommand(cmd.type as Block['type'])}>
              <View style={styles.slashIcon}><Feather name={cmd.icon} size={ms(16)} color="#008080" /></View>
              <View><BibleText style={[styles.slashLabel, { fontSize: ms(14) }]}>{cmd.label}</BibleText><BibleText style={[styles.slashDesc, { fontSize: ms(11) }]}>{cmd.desc}</BibleText></View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.slashCloseBtn} onPress={() => setSlashVisible(false)}>
            <BibleText style={[styles.slashCloseText, { fontSize: ms(15) }]}>Fechar</BibleText>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuSheet}>
            <TouchableOpacity style={styles.menuItem} onPress={exportJSON}>
              <Feather name="download" size={ms(18)} color="#008080" />
              <BibleText style={[styles.menuItemText, { fontSize: ms(15) }]}>Exportar JSON</BibleText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={exportPDF}>
              <Feather name="file-text" size={ms(18)} color="#008080" />
              <BibleText style={[styles.menuItemText, { fontSize: ms(15) }]}>Exportar PDF</BibleText>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteStudy}>
              <Feather name="trash-2" size={ms(18)} color="#e74c3c" />
              <BibleText style={[styles.menuItemText, { fontSize: ms(15), color: '#e74c3c' }]}>Excluir estudo</BibleText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={videoModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1, justifyContent: 'flex-end' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setVideoModalVisible(false)} />
          <View style={styles.videoModal}>
            <View style={styles.modalHandle} />
            <BibleText style={[styles.videoModalTitle, { fontSize: ms(18) }]}>Link de Vídeo</BibleText>
            <TextInput style={[styles.videoInput, noOutline, { fontSize: ms(15) }]} value={videoUrl} onChangeText={setVideoUrl} placeholder="https://youtube.com/watch?v=..." placeholderTextColor="#bbb" autoCapitalize="none" keyboardType="url" {...({ outlineStyle: 'none' } as any)} underlineColorAndroid="transparent" />
            <TextInput style={[styles.videoInput, noOutline, { fontSize: ms(15) }]} value={videoTitle} onChangeText={setVideoTitle} placeholder="Título (opcional)" placeholderTextColor="#bbb" {...({ outlineStyle: 'none' } as any)} underlineColorAndroid="transparent" />
            <TouchableOpacity style={[styles.confirmBtn, !videoUrl.trim() && styles.confirmBtnDisabled]} onPress={confirmVideo} disabled={!videoUrl.trim()}>
              <BibleText style={[{ color: '#fff', fontWeight: '700', fontSize: ms(15) }]}>Inserir</BibleText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BibleSelectModal visible={versePickerVisible && vpStep === 'book'} onClose={() => setVersePickerVisible(false)} title="Selecione o livro" placeholder="Buscar livro..." value={vpBookSearch} onChangeText={setVpBookSearch} items={filteredBooks} itemKey={b => b.abbrev} renderItem={b => <BibleText style={styles.modalItem}>{b.abbrev}</BibleText>} onSelect={b => { setVpBook(b); setVpChapter(1); setVpStep('chapter'); }} />
      <BibleSelectModal visible={versePickerVisible && vpStep === 'chapter'} onClose={() => setVersePickerVisible(false)} title={`Capítulos — ${vpBook?.name}`} placeholder="" value={vpChapterSearch} onChangeText={setVpChapterSearch} items={filteredChapters} itemKey={n => String(n)} renderItem={n => <BibleText style={styles.modalItem}>{n}</BibleText>} onSelect={n => { setVpChapter(n); setVpStep('verses'); setSelectedVerseNums(new Set()); }} hideSearch />

      <Modal visible={versePickerVisible && vpStep === 'verses'} transparent animationType="slide">
        <View style={styles.versesBackdrop}>
          <View style={styles.versesSheet}>
            <View style={styles.versesHeader}>
              <TouchableOpacity onPress={() => setVpStep('chapter')}><Feather name="arrow-left" size={ms(20)} color="#008080" /></TouchableOpacity>
              <BibleText style={[styles.versesTitle, { fontSize: ms(16) }]}>{vpBook?.name} {vpChapter}</BibleText>
              <TouchableOpacity onPress={() => setVersePickerVisible(false)}><Feather name="x" size={ms(20)} color="#999" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {vpVerses.map(({ verse, text }) => {
                const selected = selectedVerseNums.has(verse);
                return (
                  <TouchableOpacity key={verse} style={[styles.verseRow, selected && styles.verseRowSelected]} onPress={() => toggleVerseSelection(verse)} activeOpacity={0.7}>
                    <BibleText style={[styles.verseNumLabel, { fontSize: ms(12) }, selected && styles.verseNumLabelSelected]}>{verse}</BibleText>
                    <BibleText style={[styles.verseRowText, { fontSize: ms(14) }]}>{text}</BibleText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={[styles.confirmBtn, selectedVerseNums.size === 0 && styles.confirmBtnDisabled]} onPress={confirmVerseSelection} disabled={selectedVerseNums.size === 0}>
              <Feather name="check" size={ms(16)} color={selectedVerseNums.size === 0 ? '#aaa' : '#fff'} />
              <BibleText style={[styles.confirmText, { fontSize: ms(14) }, selectedVerseNums.size === 0 && styles.confirmTextDisabled]}>
                {selectedVerseNums.size === 0 ? 'Selecione versículos' : `Inserir ${selectedVerseNums.size} ${selectedVerseNums.size === 1 ? 'versículo' : 'versículos'}`}
              </BibleText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BibleConfirmModal
        visible={deleteConfirmVisible}
        title="Excluir estudo"
        message="Tem certeza? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        onCancel={() => setDeleteConfirmVisible(false)}
        onConfirm={() => {
          setDeleteConfirmVisible(false);
          deleteStudy(id);
          router.replace('/studies' as any);
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#008080', paddingHorizontal: 8, paddingVertical: 8, gap: 8 },
  iconBtn: { padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)' },
  titleInput: { flex: 1, color: '#fff', fontWeight: '700' },
  editorContent: { padding: 16, paddingBottom: 160, flexGrow: 1 },
  blockInput: { color: '#1a1a1a', paddingVertical: 6, paddingHorizontal: 0, lineHeight: 24, minHeight: 32 },
  headerText: { fontWeight: '800', color: '#008080', paddingTop: 14, letterSpacing: 0.2 },
  h1Text: { fontWeight: '700', color: '#222', paddingTop: 10 },
  h2Text: { fontWeight: '600', color: '#444', paddingTop: 6 },
  blockFocusedBorder: { borderRadius: 8, borderWidth: 1, borderColor: '#e0f2f1' },
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
  blockToolbarWrapper: { position: 'absolute', top: '100%', left: 0, right: 0, alignItems: 'flex-end', zIndex: 100, marginTop: 4, paddingRight: 4 },
  blockToolbar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 8, paddingVertical: 4, gap: 2,
    elevation: 10, shadowColor: '#008080', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10,
    borderWidth: 1, borderColor: '#f0f4f4'
  },
  toolBtn: { padding: 10, borderRadius: 10 },
  toolDivider: { width: 1, height: 24, backgroundColor: '#eee', marginHorizontal: 4 },
  slashMenu: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 36, elevation: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 12, gap: 4 },
  slashTitle: { color: '#aaa', fontWeight: '700', marginBottom: 4, letterSpacing: 1 },
  slashItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12 },
  slashIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#e6f3f3', alignItems: 'center', justifyContent: 'center' },
  slashLabel: { fontWeight: '700', color: '#222' },
  slashDesc: { color: '#aaa' },
  slashCloseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f0f0f0', borderRadius: 14, paddingVertical: 13, marginTop: 12 },
  slashCloseText: { color: '#666', fontWeight: '700' },
  menuBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  menuSheet: { position: 'absolute', top: 56, right: 12, backgroundColor: '#fff', borderRadius: 16, padding: 8, width: 200, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12 },
  menuItemText: { fontWeight: '600', color: '#333' },
  menuDivider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 4, marginHorizontal: 8 },
  videoModal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 14 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  videoModalTitle: { fontWeight: '800', color: '#222' },
  videoInput: { backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#333' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#008080', borderRadius: 14, paddingVertical: 13, marginTop: 4 },
  confirmBtnDisabled: { backgroundColor: '#f0f0f0' },
  confirmText: { color: '#fff', fontWeight: '700' },
  confirmTextDisabled: { color: '#aaa' },
  modalItem: { color: '#fff', fontWeight: '700', fontSize: 14 },
  versesBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  versesSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, maxHeight: '85%', flex: 1 },
  versesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  versesTitle: { fontWeight: '700', color: '#222' },
  verseRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', gap: 10 },
  verseRowSelected: { backgroundColor: '#e0f2f1', borderLeftWidth: 3, borderLeftColor: '#008080', paddingLeft: 6 },
  verseNumLabel: { fontWeight: '700', color: '#008080', minWidth: 24, paddingTop: 2 },
  verseNumLabelSelected: { color: '#005f5f' },
  verseRowText: { flex: 1, color: '#333', lineHeight: 20 },
});
