import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../../hooks/use-responsive';
import { BibleText } from '../BibleText';

type StudyVerseSelectModalProps = {
  visible: boolean;
  onClose: () => void;
  bookName: string;
  chapter: number;
  verses: { verse: number; text: string }[];
  onConfirm: (selectedVerses: number[]) => void;
};

export function StudyVerseSelectModal({ visible, onClose, bookName, chapter, verses, onConfirm }: StudyVerseSelectModalProps) {
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
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { maxHeight: height * 0.85 }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <Feather name="arrow-left" size={ms(20)} color="#008080" />
            </TouchableOpacity>
            <BibleText style={[styles.title, { fontSize: ms(16) }]}>{bookName} {chapter}</BibleText>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <Feather name="x" size={ms(20)} color="#999" />
            </TouchableOpacity>
          </View>
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
          <TouchableOpacity style={[styles.confirmBtn, selectedNums.size === 0 && styles.confirmBtnDisabled]} onPress={handleConfirm} disabled={selectedNums.size === 0}>
            <Feather name="check" size={ms(16)} color={selectedNums.size === 0 ? '#aaa' : '#fff'} />
            <BibleText style={[styles.confirmText, { fontSize: ms(14) }, selectedNums.size === 0 && styles.confirmTextDisabled]}>
              {selectedNums.size === 0 ? 'Selecione versículos' : `Inserir ${selectedNums.size} ${selectedNums.size === 1 ? 'versículo' : 'versículos'}`}
            </BibleText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  iconBtn: { padding: 4 },
  title: { fontWeight: '700', color: '#222' },
  verseRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', gap: 10 },
  verseRowSelected: { backgroundColor: '#e0f2f1', borderLeftWidth: 3, borderLeftColor: '#008080', paddingLeft: 6 },
  verseNumLabel: { fontWeight: '700', color: '#008080', minWidth: 24, paddingTop: 2 },
  verseNumLabelSelected: { color: '#005f5f' },
  verseRowText: { flex: 1, color: '#333', lineHeight: 20 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#008080', borderRadius: 14, paddingVertical: 13, marginTop: 12 },
  confirmBtnDisabled: { backgroundColor: '#f0f0f0' },
  confirmText: { color: '#fff', fontWeight: '700' },
  confirmTextDisabled: { color: '#aaa' }
});
