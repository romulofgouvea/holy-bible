import { Feather, FontAwesome } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Animated, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';

export type SelectedVerse = {
  chapter: number;
  verse: number;
  text: string;
  bookName: string;
  bookAbbrev: string;
};

type VerseActionSheetProps = {
  visible: boolean;
  selectedVerses: SelectedVerse[];
  highlights: Record<string, string>;
  onClose: () => void;
  onBulkHighlight: (verses: SelectedVerse[], color: string | null) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning') => void;
};

const HIGHLIGHT_COLORS = [
  { id: 'yellow', hex: '#fde047' },
  { id: 'blue', hex: '#93c5fd' },
  { id: 'green', hex: '#86efac' },
  { id: 'pink', hex: '#f9a8d4' },
];

export function BibleVerseActionSheet(props: VerseActionSheetProps) {
  const { visible, selectedVerses, highlights, onClose, onBulkHighlight } = props;
  const { ms } = useResponsive();
  const { colors } = useTheme();
  const translateY = React.useRef(new Animated.Value(100)).current;

  React.useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 100,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [visible]);

  if (!visible && selectedVerses.length === 0) return null;

  const count = selectedVerses.length;
  const hasAnyHighlight = count > 0 && selectedVerses.some(
    (v) => !!highlights[`${v.bookAbbrev}-${v.chapter}-${v.verse}`]
  );

  const buildText = () => {
    if (count === 0) return '';
    const sorted = [...selectedVerses].sort((a, b) => a.chapter !== b.chapter ? a.chapter - b.chapter : a.verse - b.verse);

    const sameChapter = sorted.every((v) => v.chapter === sorted[0].chapter);

    let formattedRanges = '';
    if (sameChapter) {
      const groups: string[] = [];
      let start = sorted[0].verse;
      let end = sorted[0].verse;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].verse === end + 1) {
          end = sorted[i].verse;
        } else {
          groups.push(start === end ? `${start}` : `${start}-${end}`);
          start = sorted[i].verse;
          end = sorted[i].verse;
        }
      }
      groups.push(start === end ? `${start}` : `${start}-${end}`);
      formattedRanges = groups.join(', ');
    } else {
      formattedRanges = count === 1
        ? `${sorted[0].verse}`
        : `${sorted[0].chapter}:${sorted[0].verse}–${sorted[sorted.length - 1].chapter}:${sorted[sorted.length - 1].verse}`;
    }

    const header = sameChapter
      ? `${sorted[0].bookName} ${sorted[0].chapter}:${formattedRanges}`
      : `${sorted[0].bookName} ${formattedRanges}`;

    const body = sorted.map((v) => `${v.verse} ${v.text}`).join('\n');
    return `${header}\n\n${body}`;
  };

  const onCopy = async () => {
    await Clipboard.setStringAsync(buildText());
    props.onShowToast?.('Copiado para a área de transferência', 'success');
    onClose();
  };

  const onShare = async () => {
    try { await Share.share({ message: buildText() }); } catch (e) { }
  };

  const onHighlight = (color: string | null) => {
    onBulkHighlight(selectedVerses, color);
    const isPlural = selectedVerses.length > 1;
    const action = color ? 'marcado' : 'desmarcado';
    props.onShowToast?.(`Versículo${isPlural ? 's' : ''} ${action}${isPlural ? 's' : ''}`, 'success');
    onClose();
  };

  const iconSize = ms(22);
  const iconColor = colors.primary;

  return (
    <Animated.View style={[styles.bar, { transform: [{ translateY }], backgroundColor: colors.surface }]} id="bible-verse-action-sheet">
      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} onPress={onShare} disabled={count === 0}>
          <Feather name="share-2" size={iconSize} color={count === 0 ? colors.textMuted : iconColor} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={onCopy} disabled={count === 0}>
          <Feather name="copy" size={iconSize} color={count === 0 ? colors.textMuted : iconColor} />
        </TouchableOpacity>

        <View style={styles.divider} />

        {HIGHLIGHT_COLORS.map(c => (
          <TouchableOpacity key={c.id} style={{ padding: 6 }} onPress={() => onHighlight(c.id)}>
            <View style={{ width: ms(24), height: ms(24), borderRadius: ms(12), backgroundColor: c.hex, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' }} />
          </TouchableOpacity>
        ))}

        {hasAnyHighlight && (
          <TouchableOpacity style={styles.iconBtn} onPress={() => onHighlight(null)}>
            <Feather name="slash" size={ms(20)} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.removeActions}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
          <Feather name="x" size={iconSize} color="red" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  leftSection: {
    flex: 1,
  },
  countText: {
    fontWeight: '700',
    color: '#555',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
  },
  removeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 10,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
});
