import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Animated, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VERSE_HIGHLIGHTS as HIGHLIGHT_COLORS } from '../constants/colors';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleButton } from './BibleButton';

import { BibleAddToStudyModal } from './BibleAddToStudyModal';

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


export function BibleVerseActionSheet(props: VerseActionSheetProps) {
  const { visible, selectedVerses, highlights, onClose, onBulkHighlight } = props;
  const { ms } = useResponsive();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = React.useRef(new Animated.Value(100)).current;
  const [studyModalVisible, setStudyModalVisible] = React.useState(false);

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
    return `${header}\n${body}`;
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

  let activeColorId: string | null = null;
  if (count > 0) {
    let firstColor = highlights[`${selectedVerses[0].bookAbbrev}-${selectedVerses[0].chapter}-${selectedVerses[0].verse}`];
    let allSame = true;
    for (let i = 1; i < count; i++) {
      if (highlights[`${selectedVerses[i].bookAbbrev}-${selectedVerses[i].chapter}-${selectedVerses[i].verse}`] !== firstColor) {
        allSame = false;
        break;
      }
    }
    if (allSame) activeColorId = firstColor || null;
  }

  const iconSize = ms(22);
  const iconColor = colors.onBackground;

  return (
    <>
      <Animated.View style={[styles.bar, { transform: [{ translateY }], backgroundColor: colors.background, shadowColor: colors.shadow, borderWidth: 1, borderColor: colors.border }]} id="bible-verse-action-sheet">
        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconBtn} onPress={onShare} disabled={count === 0}>
            <Feather name="share-2" size={iconSize} color={count === 0 ? colors.textMuted : iconColor} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={onCopy} disabled={count === 0}>
            <Feather name="copy" size={iconSize} color={count === 0 ? colors.textMuted : iconColor} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => setStudyModalVisible(true)} disabled={count === 0}>
            <Feather name="book-open" size={iconSize} color={count === 0 ? colors.textMuted : iconColor} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {HIGHLIGHT_COLORS.map(c => {
            const isSelectedColor = activeColorId === c.id;
            return (
              <TouchableOpacity key={c.id} style={{ padding: 3 }} onPress={() => onHighlight(c.id)}>
                <View style={{
                  width: ms(24),
                  height: ms(24),
                  borderRadius: ms(12),
                  backgroundColor: c.hex,
                  borderWidth: isSelectedColor ? 3 : 1,
                  borderColor: isSelectedColor ? colors.primaryVariant : colors.onPrimary,
                  transform: [{ scale: isSelectedColor ? 1.2 : 1 }]
                }} />
              </TouchableOpacity>
            );
          })}

          {hasAnyHighlight && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => onHighlight(null)}>
              <Feather name="slash" size={ms(20)} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.removeActions}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <BibleButton
            label="Limpar"
            variant="ghost"
            size="sm"
            onPress={onClose}
            style={styles.clearBtn}
            textStyle={{ color: colors.onBackground, fontSize: ms(13) }}
          />
        </View>
      </Animated.View>

      <BibleAddToStudyModal 
        visible={studyModalVisible}
        onClose={() => {
            setStudyModalVisible(false);
            onClose();
        }}
        selectedVerses={selectedVerses}
        onShowToast={props.onShowToast}
      />
    </>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 20,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  leftSection: {
    flex: 1,
  },
  countText: {
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 2,
  },
  removeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 10,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 4,
  },
  clearBtn: {
    marginLeft: 2,
    paddingHorizontal: 4,
  },
});
