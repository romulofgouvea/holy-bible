import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../../hooks/use-responsive';
import { useTheme } from '../../hooks/use-theme';
import { BibleText } from '../BibleText';

type StudyVerseSelectModalProps = {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  bookName: string;
  chapter: number;
  verses: { verse: number; text: string }[];
  onConfirm: (selectedVerses: number[]) => void;
};

export function StudyVerseSelectModal({ visible, onClose, onBack, bookName, chapter, verses, onConfirm }: StudyVerseSelectModalProps) {
  const { ms, height } = useResponsive();
  const { colors } = useTheme();
  const [selectedNums, setSelectedNums] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (visible) setSelectedNums(new Set());
  }, [visible]);

  const toggleVerse = (num: number) => {
    setSelectedNums(prev => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });
  };

  const handleConfirm = () => {
    const sorted = [...selectedNums].sort((a, b) => a - b);
    onConfirm(sorted);
  };

  if (!visible) return null;

  return (
    <View style={styles.container} testID="study-verse-modal">
      <View style={styles.header} testID="study-verse-header">
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={[styles.iconBtn, styles.headerIconWrap, { backgroundColor: colors.primary + '25' }]}>
            <Feather name="arrow-left" size={ms(16)} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.iconBtn, styles.headerIconWrap, { backgroundColor: colors.primary + '25' }]}>
            <Feather name="list" size={ms(16)} color={colors.primary} />
          </View>
        )}
        <BibleText style={[styles.title, { fontSize: ms(18), color: colors.primary, fontWeight: '800' }]}>{bookName} {chapter}</BibleText>
        <TouchableOpacity onPress={onClose} style={[styles.iconBtn, styles.closeBtn, { backgroundColor: colors.surfaceHighlight }]}>
          <Feather name="x" size={ms(16)} color={colors.error} />
        </TouchableOpacity>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} bounces={true} overScrollMode="always" testID="study-verse-list">
        {verses.map(({ verse, text }) => {
          const selected = selectedNums.has(verse);
          const primaryLow = colors.primary + '25';
          return (
            <TouchableOpacity key={verse} style={[styles.verseRow, { borderBottomColor: colors.border }, selected && { backgroundColor: primaryLow, borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: ms(6) }]} onPress={() => toggleVerse(verse)} activeOpacity={0.7}>
              <BibleText style={[styles.verseNumLabel, { fontSize: ms(12), color: colors.primary }]}>{verse}</BibleText>
              <BibleText style={[styles.verseRowText, { fontSize: ms(14), color: colors.onSurface }]}>{text}</BibleText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {selectedNums.size > 0 && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }]} onPress={handleConfirm}>
            <Feather name="check" size={ms(16)} color={colors.onPrimary} />
            <BibleText style={[styles.confirmText, { fontSize: ms(14), color: colors.onPrimary }]}>
              {`Inserir ${selectedNums.size} ${selectedNums.size === 1 ? 'versículo' : 'versículos'}`}
            </BibleText>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  iconBtn: { width: 32, height: 32, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  headerIconWrap: { marginRight: 8 },
  closeBtn: { marginLeft: 8 },
  title: { flex: 1, fontWeight: '700' },
  verseRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, gap: 10 },
  verseRowSelected: { borderLeftWidth: 3, paddingLeft: 6 },
  verseNumLabel: { fontWeight: '700', minWidth: 24, paddingTop: 2 },
  verseNumLabelSelected: {},
  verseRowText: { flex: 1, lineHeight: 20 },
  divider: { height: 1, marginVertical: 8 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 13, marginTop: 4 },
  confirmBtnDisabled: {},
  confirmText: { fontWeight: '700' },
  confirmTextDisabled: {}
});
