import { Feather } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../../hooks/use-responsive';
import { useTheme } from '../../hooks/use-theme';
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
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.titleArea}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Feather name="chevron-left" size={ms(20)} color={colors.primary} />
            </TouchableOpacity>
          )}
          <BibleText style={[styles.title, { fontSize: ms(18), color: colors.onBackground }]}>
            {title}
          </BibleText>
        </View>
        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.error + '15' }]}>
          <Feather name="x" size={ms(18)} color={colors.error} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => String(item)}
        numColumns={5}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '800',
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 12,
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
