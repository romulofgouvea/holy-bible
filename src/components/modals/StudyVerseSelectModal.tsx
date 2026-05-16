import React, { useEffect, useState, useMemo } from 'react';
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
  const { ms, width, DESIGN } = useResponsive();
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

  const styles = useMemo(() => StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center' },
    headerIconWrap: { marginRight: ms(DESIGN.spacing.sm) },
    title: { flex: 1, fontWeight: '700' },
    list: { 
      paddingBottom: ms(DESIGN.spacing.md), 
      paddingHorizontal: ms(DESIGN.spacing.lg), 
      paddingTop: ms(DESIGN.spacing.lg) 
    },
    gridContainer: { 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      gap: ms(DESIGN.spacing.sm), 
      justifyContent: 'flex-start', 
      width: '100%' 
    },
    footer: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  }), [ms, DESIGN]);

  const paddingHorizontal = ms(DESIGN.spacing.lg) * 4;
  const availableWidth = width - paddingHorizontal;
  const blockMinSize = ms(60); // Base size for the grid block
  const numCols = Math.max(1, Math.floor(availableWidth / blockMinSize));
  const gapSize = ms(DESIGN.spacing.sm);
  const itemWidth = ((availableWidth - (numCols - 1) * gapSize) / numCols) - 0.01;

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
          <BibleText style={[styles.title, { fontSize: ms(DESIGN.fontSize.xl), color: colors.primary, fontWeight: '800' }]}>{bookName} {chapter}</BibleText>
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
                size={ms(DESIGN.fontSize.xxl)}
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
