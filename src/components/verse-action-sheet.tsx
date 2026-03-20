import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Animated, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';

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
  highlights: Record<string, boolean>;
  onClose: () => void;
  onToggleHighlight: (verse: SelectedVerse) => void;
};

export function VerseActionSheet(props: VerseActionSheetProps) {
  const { visible, selectedVerses, highlights, onClose, onToggleHighlight } = props;
  const { ms } = useResponsive();
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
  const allHighlighted = count > 0 && selectedVerses.every(
    (v) => highlights[`${v.bookAbbrev}-${v.chapter}-${v.verse}`]
  );

  const buildText = () => {
    if (count === 0) return '';
    const sorted = [...selectedVerses].sort((a, b) => a.chapter !== b.chapter ? a.chapter - b.chapter : a.verse - b.verse);
    const header = count === 1
      ? `${sorted[0].bookName} ${sorted[0].chapter}:${sorted[0].verse}`
      : `${sorted[0].bookName} ${sorted[0].chapter}:${sorted[0].verse}–${sorted[sorted.length - 1].verse}`;
    const body = sorted.map((v) => `${v.verse} ${v.text}`).join('\n');
    return `${header}\n\n${body}`;
  };

  const onCopy = async () => {
    await Clipboard.setStringAsync(buildText());
  };

  const onShare = async () => {
    try { await Share.share({ message: buildText() }); } catch (e) { }
  };

  const onHighlight = () => {
    selectedVerses.forEach((v) => onToggleHighlight(v));
  };

  const iconSize = ms(26);
  const iconColor = '#008080';

  return (
    <Animated.View style={[styles.bar, { transform: [{ translateY }] }]}>
      <View style={styles.leftSection}>
        <Text style={[styles.countText, { fontSize: ms(13) }]}>
          {count} {count === 1 ? 'versículo' : 'versículos'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.iconBtn} onPress={onShare} disabled={count === 0}>
          <Feather name="share-2" size={iconSize} color={count === 0 ? '#ccc' : iconColor} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={onCopy} disabled={count === 0}>
          <Feather name="copy" size={iconSize} color={count === 0 ? '#ccc' : iconColor} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={onHighlight} disabled={count === 0}>
          <Feather
            name="bookmark"
            size={iconSize}
            color={count === 0 ? '#ccc' : allHighlighted ? '#e74c3c' : iconColor}
          />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.iconBtn} onPress={onClose}>
          <Feather name="x" size={iconSize} color="#888" />
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 28,
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
    gap: 4,
  },
  iconBtn: {
    padding: 10,
    borderRadius: 12,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
});
