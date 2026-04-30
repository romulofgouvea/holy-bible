import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleGridBlock } from './BibleGridBlock';
import { BibleText } from './BibleText';

type BibleNumberModalProps = {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  items: number[];
  title: string;
  iconName: keyof typeof Feather.glyphMap;
  onSelect: (item: number) => void;
};

export function BibleNumberModal({ visible, onClose, onBack, items, title, iconName, onSelect }: BibleNumberModalProps) {
  const { ms, height, width } = useResponsive();
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={[styles.headerIconWrap, { backgroundColor: colors.primary }]}>
            <Feather name="arrow-left" size={ms(18)} color={colors.onPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.headerIconWrap, { backgroundColor: colors.primary + '15' }]}>
            <Feather name={iconName} size={ms(18)} color={colors.primary} />
          </View>
        )}
        <BibleText style={[styles.title, { fontSize: ms(18), color: colors.onSurface, fontWeight: '700' }]}>{title}</BibleText>
        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceHighlight }]}>
          <Feather name="x" size={ms(18)} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} bounces={true} overScrollMode="always">
        <View style={styles.gridContainer}>
          {items.map((item) => {
            const availableWidth = width - 32;
            const numCols = Math.max(4, Math.floor(availableWidth / ms(72)));
            const itemWidth = ((availableWidth - (numCols - 1) * 8) / numCols) - 0.01;
            return (
              <BibleGridBlock
                key={item}
                title={item}
                exactWidth={itemWidth}
                onPress={() => {
                  onSelect(item);
                }}
              />
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.footer}>
        <View style={[styles.countPill, { backgroundColor: colors.surfaceHighlight, borderColor: colors.primary + '30' }]}>
          <BibleText style={[styles.countNumber, { color: colors.primary, fontWeight: '700' }]}>{items.length}</BibleText>
          <BibleText style={[styles.countText, { color: colors.primary, fontWeight: '600' }]}> {`${title.toLowerCase()}`}</BibleText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 8,
    elevation: 24,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4, marginTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  headerIconWrap: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  title: { flex: 1, fontWeight: '700' },
  closeBtn: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginLeft: 12 },
  list: { padding: 8, paddingBottom: 12, gap: 8 },
  divider: { height: 1, marginVertical: 8 },
  footer: { paddingTop: 4 },
  countPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  countNumber: { fontWeight: '800', fontSize: 13 },
  countText: { fontWeight: '600', fontSize: 13 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
});
