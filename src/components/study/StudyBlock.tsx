import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Image, Keyboard, Linking, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ROUTES } from '../../constants/routes';
import { useResponsive } from '../../hooks/use-responsive';
import { useTheme } from '../../hooks/use-theme';
import { Block, makeBlock } from '../../hooks/use-studies';
import { BibleText } from '../BibleText';
import { StudyBlockToolbar } from './StudyBlockToolbar';

const noOutline = Platform.select({ web: { outline: 'none', outlineWidth: 0 } as any, default: {} });

export const pickImageAction = async (blockId: string, setBlocks: React.Dispatch<React.SetStateAction<Block[]>>) => {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
  if (result.canceled || !result.assets[0]) return;
  const uri = result.assets[0].uri;
  setBlocks(prev => {
    const idx = prev.findIndex(b => b.id === blockId);
    if (idx === -1) return prev;
    const imgBlock: Block = { id: blockId, type: 'image', uri, caption: '' };
    const newPara = makeBlock('paragraph');
    const next = [...prev];
    next[idx] = imgBlock;
    next.splice(idx + 1, 0, newPara);
    return next;
  });
};

type StudyBlockProps = {
  item: Block;
  focusedId: string | null;
  blocksLength: number;
  blockIdx: number;
  setFocusedId: (id: string | null) => void;
  setActiveBlockId: (id: string | null) => void;
  setSlashVisible: (v: boolean) => void;
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  blockRefs: React.MutableRefObject<Record<string, TextInput | null>>;
  setFullScreenImage: (uri: string) => void;
  addBlockAfter: (id: string) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (id: string, dir: 'up' | 'down') => void;
};

export function StudyBlock({
  item, focusedId, blocksLength, blockIdx,
  setFocusedId, setActiveBlockId, setSlashVisible,
  setBlocks, blockRefs, setFullScreenImage,
  addBlockAfter, deleteBlock, moveBlock
}: StudyBlockProps) {
  const router = useRouter();
  const { ms } = useResponsive();
  const { colors } = useTheme();
  const isFocused = focusedId === item.id;

  const updateBlockContent = (content: string) => {
    if (content === '/') {
      setActiveBlockId(item.id);
      setSlashVisible(true);
      Keyboard.dismiss();
    } else {
      setSlashVisible(false);
    }
    setBlocks(prev => prev.map(b => b.id === item.id ? { ...b, content } as Block : b));
  };

  const renderContent = () => {
    if (item.type === 'image') {
      return (
        <View style={styles.imageBlock}>
          {item.uri ? (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setFullScreenImage(item.uri)} onPressIn={() => { setFocusedId(item.id); setActiveBlockId(item.id); }}>
              <Image source={{ uri: item.uri }} style={styles.imagePreview} resizeMode="cover" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.imagePlaceholder} onPress={() => pickImageAction(item.id, setBlocks)}>
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
        <TouchableOpacity style={[styles.videoBlock, { backgroundColor: colors.surfaceVariant }]} activeOpacity={0.8} onPressIn={() => { setFocusedId(item.id); setActiveBlockId(item.id); }}>
          <View style={[styles.videoIcon, { backgroundColor: colors.surface }]}><Feather name="video" size={ms(20)} color={colors.primary} /></View>
          <BibleText style={[styles.videoTitle, { fontSize: ms(14), color: colors.text }]} numberOfLines={1}>{item.title || item.url}</BibleText>
          <TouchableOpacity onPress={() => Linking.openURL(item.url)} style={{ padding: 8 }}>
            <Feather name="external-link" size={ms(16)} color={colors.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }

    if (item.type === 'verse') {
      return (
        <TouchableOpacity style={[styles.verseBlock, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]} activeOpacity={0.8} onPressIn={() => { setFocusedId(item.id); setActiveBlockId(item.id); }}>
          <BibleText style={[styles.verseRef, { fontSize: ms(18), marginBottom: 16, color: colors.primary }]}>{item.verseRef}</BibleText>
          <BibleText style={[styles.verseText, { fontSize: ms(16), color: colors.text }]}>
            {item.content.split('\n').map((line, i, arr) => {
              const sp = line.indexOf(' ');
              const num = line.slice(0, sp); const text = line.slice(sp + 1);
              return (
                <BibleText key={i}>
                  <BibleText style={{ color: colors.primary, fontWeight: '700' }}>{num} </BibleText>
                  <BibleText style={{ fontStyle: 'italic', lineHeight: 20 }}>{text}</BibleText>
                  {i < arr.length - 1 ? '\n\n' : ''}
                </BibleText>
              );
            })}
          </BibleText>
        </TouchableOpacity>
      );
    }

    const fsMap: Record<string, number> = { header: ms(22), h1: ms(19), h2: ms(16), paragraph: ms(15) };
    const textStyle = [
      styles.blockInput,
      item.type === 'header' && [styles.headerText, { color: colors.primary }],
      item.type === 'h1' && [styles.h1Text, { color: colors.text }],
      item.type === 'h2' && [styles.h2Text, { color: colors.textMuted }],
      { fontSize: fsMap[item.type] ?? ms(15), color: colors.text },
      noOutline,
    ];
    const placeholder = item.type === 'header' ? 'Cabeçalho...' : item.type === 'h1' ? 'Título 1...' : item.type === 'h2' ? 'Título 2...' : "Escreva algo ou '/' para opções...";

    return (
      <TextInput
        ref={r => { blockRefs.current[item.id] = r; }}
        style={textStyle as any}
        value={(item as any).content}
        onChangeText={updateBlockContent}
        placeholder={placeholder}
        placeholderTextColor="#ccc"
        multiline
        scrollEnabled={false}
        blurOnSubmit={false}
        onFocus={() => { setFocusedId(item.id); setActiveBlockId(item.id); }}
        onSubmitEditing={() => addBlockAfter(item.id)}
        onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === 'Backspace' && !(item as any).content) deleteBlock(item.id); }}
        {...({ outlineStyle: 'none' } as any)}
        underlineColorAndroid="transparent"
      />
    );
  };

  return (
    <View style={[
      { zIndex: isFocused ? 20 : 1, paddingLeft: 12, paddingRight: isFocused ? 56 : 12, paddingVertical: 4, marginVertical: 2 },
      isFocused && { backgroundColor: colors.surfaceVariant, borderRadius: 12, borderWidth: 1, borderColor: colors.border }
    ]}>
      {renderContent()}

      {isFocused && (
        <StudyBlockToolbar
          isFirst={blockIdx === 0}
          isLast={blockIdx === blocksLength - 1}
          onAddAfter={() => addBlockAfter(item.id)}
          onMoveUp={() => moveBlock(item.id, 'up')}
          onMoveDown={() => moveBlock(item.id, 'down')}
          onDelete={() => deleteBlock(item.id)}
          onOpenCommands={() => { setActiveBlockId(item.id); setSlashVisible(true); Keyboard.dismiss(); }}
          onClose={() => { Keyboard.dismiss(); setFocusedId(null); setActiveBlockId(null); setSlashVisible(false); }}
          onGoToBible={item.type === 'verse' && item.bookName ? () => {
            const verMatch = item.verseRef?.match(/\(([^)]+)\)$/);
            const verParam = verMatch ? `&ver=${encodeURIComponent(verMatch[1].toLowerCase())}` : '';
            router.push(`${ROUTES.BIBLE}?book=${encodeURIComponent(item.bookName)}&ch=${item.chapter}&v=${item.verse}${verParam}` as any);
          } : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
