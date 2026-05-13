import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Animated, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VERSE_HIGHLIGHTS as HIGHLIGHT_COLORS } from '../constants/colors';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleAddToStudyModal } from './BibleAddToStudyModal';
import { BibleIcon } from './BibleIcon';

export type SelectedVerse = {
  chapter: number;
  verse: number;
  text: string;
  bookName: string;
  bookAbbrev: string;
  version: string;
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
  const translateY = React.useRef(new Animated.Value(200)).current;
  const [studyModalVisible, setStudyModalVisible] = React.useState(false);

  React.useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 200,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [visible]);

  if (!visible && selectedVerses.length === 0) return null;

  const count = selectedVerses.length;

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

  const iconColor = colors.onBackground;

  return (
    <>
      <Animated.View style={[styles.bar, {
        transform: [{ translateY }],
        backgroundColor: colors.background,
        paddingBottom: Math.max(16, insets.bottom + 8),
        borderColor: colors.border
      }]} id="bible-verse-action-sheet">

        <BibleIcon
          name="x"
          color={colors.error}
          backgroundColor={colors.error + '20'}
          onPress={onClose}
        />

        {/* Row 1: Actions */}
        <View style={styles.topRow}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: count === 0 ? colors.surfaceHighlight : colors.primary + '25' }]}
            onPress={onShare}
            disabled={count === 0}
          >
            <BibleIcon name="share-2" size={ms(16)} color={count === 0 ? colors.textMuted : colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: count === 0 ? colors.surfaceHighlight : colors.primary + '25' }]}
            onPress={onCopy}
            disabled={count === 0}
          >
            <BibleIcon name="copy" size={ms(16)} color={count === 0 ? colors.textMuted : colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: count === 0 ? colors.surfaceHighlight : colors.primary + '25' }]}
            onPress={() => setStudyModalVisible(true)}
            disabled={count === 0}
          >
            <BibleIcon name="book-open" size={ms(16)} color={count === 0 ? colors.textMuted : colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Row 2: Colors */}
        <View style={styles.bottomRow}>
          <TouchableOpacity style={{ paddingRight: 6 }} onPress={() => onHighlight(null)}>
            <View style={[styles.colorBox, { backgroundColor: colors.surfaceHighlight }]}>
              <BibleIcon name="slash" color={colors.error} />
            </View>
          </TouchableOpacity>

          {HIGHLIGHT_COLORS.map(c => {
            const isSelectedColor = activeColorId === c.id;
            return (
              <TouchableOpacity key={c.id} style={{ paddingHorizontal: 3 }} onPress={() => onHighlight(c.id)}>
                <View style={[styles.colorBox, { backgroundColor: c.hex }]}>
                  {isSelectedColor && (
                    <BibleIcon name="check" size={ms(16)} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    elevation: 20,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
