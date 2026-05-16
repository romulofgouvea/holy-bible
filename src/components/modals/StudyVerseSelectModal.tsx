import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../hooks/useTheme';
import { BibleCountPill } from '../BibleCountPill';
import { BibleGridBlock } from '../BibleGridBlock';
import { BibleIcon } from '../BibleIcon';
import { BiblePageModal } from './BiblePageModal';
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
  const { ms, width } = useResponsive();
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

  const paddingHorizontal = ms(16) * 4;
  const availableWidth = width - paddingHorizontal;
  const numCols = Math.max(1, Math.floor(availableWidth / ms(60)));
  const itemWidth = ((availableWidth - (numCols - 1) * 8) / numCols) - 0.01;

  return (
    <BiblePageModal
      visible={visible}
      onClose={onClose}
      fullHeight
      header={
        <View style={styles.header}>
          <BibleIcon
            name="list"
            color={colors.primary}
            backgroundColor={colors.primary + '20'}
            onPress={onBack}
            style={styles.headerIconWrap}
          />
          <BibleText style={[styles.title, { fontSize: ms(18), color: colors.primary, fontWeight: '800' }]}>{bookName} {chapter}</BibleText>
          <BibleIcon
            name="x"
            color={colors.error}
            backgroundColor={colors.error + '20'}
            onPress={onClose}
          />
        </View>
      }
      footer={
        <View style={styles.footer}>
          <BibleCountPill
            count={selectedNums.size}
            label="versículo"
            labelPlural="versículos"
          />
          {selectedNums.size > 0 && (
            <View style={{ marginLeft: 'auto' }}>
              <BibleIcon
                name="check"
                color={colors.onPrimary}
                backgroundColor={colors.primary}
                onPress={handleConfirm}
                size={ms(20)}
              />
            </View>
          )}
        </View>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.list} bounces={true} overScrollMode="always">
        <View style={styles.gridContainer}>
          {verses.map(({ verse }) => {
            const isSelected = selectedNums.has(verse);
            return (
              <BibleGridBlock
                key={verse}
                title={verse}
                exactWidth={itemWidth}
                isSelected={isSelected}
                onPress={() => toggleVerse(verse)}
              />
            );
          })}
        </View>
      </ScrollView>
    </BiblePageModal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center' },
  headerIconWrap: { marginRight: 8 },
  title: { flex: 1, fontWeight: '700' },
  list: { paddingBottom: 12, paddingHorizontal: 16, paddingTop: 16 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start', width: '100%' },
  footer: { flexDirection: 'row', alignItems: 'center', width: '100%' },
});

