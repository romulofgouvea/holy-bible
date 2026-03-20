import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { BibleText } from './BibleText';

type BibleListCardProps = {
  title: string;
  pillText?: string | number;
  onPress: () => void;
};

export function BibleListCard({ title, pillText, onPress }: BibleListCardProps) {
  const { ms } = useResponsive();
  return (
    <TouchableOpacity activeOpacity={0.7} style={styles.card} onPress={onPress}>
      <BibleText style={[styles.cardTitle, { fontSize: ms(14) }]}>{title}</BibleText>
      {pillText !== undefined && (
        <View style={styles.pill}>
          <BibleText style={[styles.pillText, { fontSize: ms(14) }]}>{pillText}</BibleText>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#0080806e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardTitle: {
    flex: 1,
    fontWeight: '700',
    color: '#333',
    marginRight: 12,
  },
  pill: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0080806e',
  },
  pillText: {
    fontWeight: '800',
    color: '#0080806e',
  },
});
