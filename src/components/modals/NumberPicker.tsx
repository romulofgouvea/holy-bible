import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../../hooks/use-responsive';
import { useTheme } from '../../hooks/use-theme';
import { BibleIcon } from '../BibleIcon';
import { BibleText } from '../BibleText';

interface NumberPickerProps {
  title: string;
  items: number[];
  onSelect: (num: number) => void;
  onClose: () => void;
  onBack?: () => void;
  activeNumber?: number;
}

export function NumberPicker({ title, items, onSelect, onClose, onBack, activeNumber }: NumberPickerProps) {
  const { colors } = useTheme();
  const { ms } = useResponsive();

  return (
    <View style={styles.container} testID="number-picker-modal">
      <View style={[styles.header, { borderBottomColor: colors.border }]} testID="number-picker-header">
        <View style={styles.titleArea}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={[styles.iconBtn, { backgroundColor: colors.primary + '25', marginRight: 8 }]} testID="number-picker-back-btn">
              <BibleIcon name="arrow-left" size={ms(16)} color={colors.primary} />
            </TouchableOpacity>
          )}
          <BibleText style={[styles.title, { fontSize: ms(15), color: colors.onBackground }]} testID="number-picker-title">
            {title}
          </BibleText>
        </View>
        <BibleIcon
          name="x"
          color={colors.error}
          backgroundColor={colors.error + '20'}
          onPress={onClose}
          testID="number-picker-close-btn"
        />
      </View>

      <FlashList
        data={items}
        keyExtractor={item => String(item)}
        numColumns={5}
        // @ts-ignore
        estimatedItemSize={50}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isActive = item === activeNumber;
          return (
            <TouchableOpacity
              style={[
                styles.item,
                { backgroundColor: isActive ? colors.primary : colors.surfaceHighlight, borderColor: colors.border },
                isActive && { borderColor: colors.primary }
              ]}
              onPress={() => onSelect(item)}
            >
              <BibleText style={[
                styles.itemText,
                { fontSize: ms(15), color: isActive ? colors.onPrimary : colors.onBackground },
                isActive && { fontWeight: '800' }
              ]}>
                {item}
              </BibleText>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: '60%',
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '800',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 32,
  },
  item: {
    flex: 1,
    aspectRatio: 1,
    margin: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontWeight: '600',
  },
});
