import * as Clipboard from 'expo-clipboard';
import React, { useMemo } from 'react';
import { Animated, Platform, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VERSE_HIGHLIGHTS as HIGHLIGHT_COLORS } from '../../constants/colors';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../hooks/useTheme';
import { BibleIcon } from '../BibleIcon';
import { BibleAddToStudyModal } from './BibleAddToStudyModal';

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
  highlights: Record<string, any>;
  onClose: () => void;
  onBulkHighlight: (verses: SelectedVerse[], color: string | null) => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning') => void;
};

export function BibleVerseActionSheet(props: VerseActionSheetProps) {
  const { visible, selectedVerses, highlights, onClose, onBulkHighlight } = props;
  const { ms, DESIGN } = useResponsive();
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    bar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: ms(DESIGN.spacing.lg),
      paddingTop: ms(DESIGN.spacing.md),
      borderTopLeftRadius: ms(DESIGN.borderRadius.xl),
      borderTopRightRadius: ms(DESIGN.borderRadius.xl),
      borderWidth: 1,
      elevation: 20,
      shadowOffset: { width: 0, height: ms(-DESIGN.spacing.xs) },
      shadowOpacity: 0.15,
      shadowRadius: ms(DESIGN.spacing.md),
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: ms(DESIGN.spacing.sm),
    },
    topRowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: ms(DESIGN.spacing.lg),
    },
    bottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    iconBtn: {
      width: ms(DESIGN.icon.xl),
      height: ms(DESIGN.icon.xl),
      borderRadius: ms(DESIGN.borderRadius.md),
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorBox: {
      width: ms(DESIGN.icon.lg),
      height: ms(DESIGN.icon.lg),
      borderRadius: ms(DESIGN.borderRadius.sm),
      alignItems: 'center',
      justifyContent: 'center',
    },
  }), [ms, colors, DESIGN]);

  const insets = useSafeAreaInsets();
  const hiddenY = ms(DESIGN.layout.settingsIconOffset * 3);
  const translateY = React.useRef(new Animated.Value(hiddenY)).current;
  const [studyModalVisible, setStudyModalVisible] = React.useState(false);

  React.useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : hiddenY,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  }, [visible, hiddenY]);

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
    if (Platform.OS !== 'android') {
      props.onShowToast?.('Copiado para a área de transferência', 'success');
    }
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
    const getVal = (key: string) => {
      const h = highlights[key];
      return h ? (typeof h === 'string' ? h : h.color) : undefined;
    };
    let firstColor = getVal(`${selectedVerses[0].bookAbbrev}-${selectedVerses[0].chapter}-${selectedVerses[0].verse}`);
    let allSame = true;
    for (let i = 1; i < count; i++) {
      if (getVal(`${selectedVerses[i].bookAbbrev}-${selectedVerses[i].chapter}-${selectedVerses[i].verse}`) !== firstColor) {
        allSame = false;
        break;
      }
    }
    if (allSame) activeColorId = firstColor || null;
  }

  return (
    <>
      <Animated.View style={[styles.bar, {
        transform: [{ translateY }],
        backgroundColor: colors.background,
        paddingBottom: ms(DESIGN.spacing.lg),
        borderColor: colors.border
      }]} id="bible-verse-action-sheet">

        {/* Row 1: Actions */}
        <View style={styles.topRowContainer}>
          <View style={styles.topRow}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: count === 0 ? colors.surfaceHighlight : colors.primary + '25' }]}
              onPress={onShare}
              disabled={count === 0}
            >
              <BibleIcon name="share-2" size={ms(DESIGN.spacing.lg)} color={count === 0 ? colors.textMuted : colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: count === 0 ? colors.surfaceHighlight : colors.primary + '25' }]}
              onPress={onCopy}
              disabled={count === 0}
            >
              <BibleIcon name="copy" size={ms(DESIGN.spacing.lg)} color={count === 0 ? colors.textMuted : colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: count === 0 ? colors.surfaceHighlight : colors.primary + '25' }]}
              onPress={() => setStudyModalVisible(true)}
              disabled={count === 0}
            >
              <BibleIcon name="book-open" size={ms(DESIGN.spacing.lg)} color={count === 0 ? colors.textMuted : colors.primary} />
            </TouchableOpacity>

          </View>

          <BibleIcon
            name="x"
            color={colors.error}
            backgroundColor={colors.error + '20'}
            onPress={onClose}
            containerSize={DESIGN.icon.xl}
            size={ms(DESIGN.spacing.lg)}
            borderRadius={DESIGN.borderRadius.md}
          />
        </View>

        {/* Row 2: Colors */}
        <View style={styles.bottomRow}>
          <TouchableOpacity style={{ paddingRight: ms(DESIGN.spacing.xs) }} onPress={() => onHighlight(null)}>
            <View style={[styles.colorBox, { backgroundColor: colors.surfaceHighlight }]}>
              <BibleIcon name="slash" color={colors.error} />
            </View>
          </TouchableOpacity>

          {HIGHLIGHT_COLORS.map(c => {
            const isSelectedColor = activeColorId === c.id;
            return (
              <TouchableOpacity key={c.id} style={{ paddingHorizontal: ms(DESIGN.spacing.xs) }} onPress={() => onHighlight(c.id)}>
                <View style={[styles.colorBox, { backgroundColor: c.hex }]}>
                  {isSelectedColor && (
                    <BibleIcon name="check" size={ms(DESIGN.spacing.lg)} color="#FFFFFF" />
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
