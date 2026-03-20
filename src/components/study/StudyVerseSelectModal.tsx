import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../../hooks/use-responsive';
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
        <View style={[styles.sheet, { maxHeight: height * 0.85 }]} id="study-verse-sheet">
          <View style={styles.header}>
            {onBack ? (
              <TouchableOpacity onPress={onBack} style={[styles.headerIconWrap, { backgroundColor: '#f5f5f5' }]}>
                <Feather name="arrow-left" size={ms(18)} color="#333" />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerIconWrap}>
                <Feather name="list" size={ms(18)} color="#008080" />
              </View>
            )}
            <BibleText style={[styles.title, { fontSize: ms(18) }]}>{bookName} {chapter}</BibleText>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={ms(18)} color="#e74c3c" />
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {verses.map(({ verse, text }) => {
              const selected = selectedNums.has(verse);
              return (
                <TouchableOpacity key={verse} style={[styles.verseRow, selected && styles.verseRowSelected]} onPress={() => toggleVerse(verse)} activeOpacity={0.7}>
                  <BibleText style={[styles.verseNumLabel, { fontSize: ms(12) }, selected && styles.verseNumLabelSelected]}>{verse}</BibleText>
                  <BibleText style={[styles.verseRowText, { fontSize: ms(14) }]}>{text}</BibleText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.divider} />
          <TouchableOpacity style={[styles.confirmBtn, selectedNums.size === 0 && styles.confirmBtnDisabled]} onPress={handleConfirm} disabled={selectedNums.size === 0}>
            <Feather name="check" size={ms(16)} color={selectedNums.size === 0 ? '#aaa' : '#fff'} />
            <BibleText style={[styles.confirmText, { fontSize: ms(14) }, selectedNums.size === 0 && styles.confirmTextDisabled]}>
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
