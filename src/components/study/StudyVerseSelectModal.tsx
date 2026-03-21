import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop} id="study-verse-backdrop">
        <View style={[styles.sheet, { height: '85%', backgroundColor: colors.surface }]} id="study-verse-sheet">
          <View style={styles.modalHandle} />
          <View style={styles.header}>
            {onBack ? (
              <TouchableOpacity onPress={onBack} style={[styles.headerIconWrap, { backgroundColor: colors.surfaceVariant }]}>
                <Feather name="arrow-left" size={ms(18)} color={colors.text} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.headerIconWrap, { backgroundColor: colors.primaryContainer }]}>
                <Feather name="list" size={ms(18)} color={colors.primary} />
              </View>
            )}
            <BibleText style={[styles.title, { fontSize: ms(18), color: colors.primary }]}>{bookName} {chapter}</BibleText>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}>
              <Feather name="x" size={ms(18)} color="#e74c3c" />
            </TouchableOpacity>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} bounces={true} overScrollMode="always">
            {verses.map(({ verse, text }) => {
              const selected = selectedNums.has(verse);
              return (
                <TouchableOpacity key={verse} style={[styles.verseRow, { borderBottomColor: colors.surfaceVariant }, selected && { backgroundColor: colors.primaryContainer, borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: 6 }]} onPress={() => toggleVerse(verse)} activeOpacity={0.7}>
                  <BibleText style={[styles.verseNumLabel, { fontSize: ms(12), color: colors.primary }, selected && { color: colors.onPrimaryContainer }]}>{verse}</BibleText>
                  <BibleText style={[styles.verseRowText, { fontSize: ms(14), color: colors.text }]}>{text}</BibleText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }, selectedNums.size === 0 && { backgroundColor: colors.surfaceVariant }]} onPress={handleConfirm} disabled={selectedNums.size === 0}>
            <Feather name="check" size={ms(16)} color={selectedNums.size === 0 ? colors.textMuted : colors.onPrimary} />
            <BibleText style={[styles.confirmText, { fontSize: ms(14), color: colors.onPrimary }, selectedNums.size === 0 && { color: colors.textMuted }]}>
              {selectedNums.size === 0 ? 'Versículos' : `Inserir ${selectedNums.size} ${selectedNums.size === 1 ? 'versículo' : 'versículos'}`}
            </BibleText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 8, flex: 1 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, alignSelf: 'center', marginBottom: 4, marginTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  headerIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#e6f3f3', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  closeBtn: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fdeded', borderRadius: 8, marginLeft: 12 },
  title: { flex: 1, fontWeight: '700', color: '#008080' },
  verseRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', gap: 10 },
  verseRowSelected: { backgroundColor: '#e0f2f1', borderLeftWidth: 3, borderLeftColor: '#008080', paddingLeft: 6 },
  verseNumLabel: { fontWeight: '700', color: '#008080', minWidth: 24, paddingTop: 2 },
  verseNumLabelSelected: { color: '#005f5f' },
  verseRowText: { flex: 1, color: '#333', lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#008080', borderRadius: 14, paddingVertical: 13, marginTop: 4 },
  confirmBtnDisabled: { backgroundColor: '#f0f0f0' },
  confirmText: { color: '#fff', fontWeight: '700' },
  confirmTextDisabled: { color: '#aaa' }
});
