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
  currentItem?: number;
  footerText?: string;
};

export function BibleNumberModal({ visible, onClose, onBack, items, title, iconName, onSelect, currentItem, footerText }: BibleNumberModalProps) {
  const { ms, height, width } = useResponsive();
  const { colors } = useTheme();
  const scrollViewRef = React.useRef<any>(null);
  const hasScrolledRef = React.useRef(false);

  React.useEffect(() => {
    if (visible) {
      hasScrolledRef.current = false;
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} testID="bible-number-modal">
      <View style={styles.header} testID="bible-number-header">
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={[styles.iconBtn, styles.headerIconWrap, { backgroundColor: colors.primary + '25' }]}>
            <Feather name="arrow-left" size={ms(16)} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={[styles.iconBtn, styles.headerIconWrap, { backgroundColor: colors.primary + '25' }]}>
            <Feather name={iconName} size={ms(16)} color={colors.primary} />
          </View>
        )}
        <BibleText style={[styles.title, { fontSize: ms(18), color: colors.primary, fontWeight: '800' }]}>{title}</BibleText>
        <TouchableOpacity onPress={onClose} style={[styles.iconBtn, styles.closeBtn, { backgroundColor: colors.surfaceHighlight }]}>
          <Feather name="x" size={ms(16)} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="always"
      >
        <View style={styles.gridContainer}>
          {items.map((item) => {
            const availableWidth = width - 32;
            const numCols = 5;
            const itemWidth = ((availableWidth - (numCols - 1) * 8) / numCols) - 0.01;
            const isSelected = item === currentItem;
            return (
              <View
                key={item}
                onLayout={isSelected ? (e) => {
                  if (!hasScrolledRef.current && visible) {
                    hasScrolledRef.current = true;
                    const y = Math.max(0, e.nativeEvent.layout.y - 16);
                    scrollViewRef.current?.scrollTo({ y, animated: false });
                  }
                } : undefined}
              >
                <BibleGridBlock
                  title={item}
                  exactWidth={itemWidth}
                  isSelected={isSelected}
                  onPress={() => onSelect(item)}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.footer}>
        <View style={[styles.countPill, { backgroundColor: colors.surfaceHighlight, borderColor: colors.primary + '30' }]}>
          <BibleText style={[styles.countNumber, { color: colors.primary, fontWeight: '700' }]}>{items.length}</BibleText>
          <BibleText style={[styles.countText, { color: colors.primary, fontWeight: '600' }]}> {footerText ? footerText : title.toLowerCase()}</BibleText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  iconBtn: { width: 32, height: 32, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  headerIconWrap: { marginRight: 8 },
  title: { flex: 1, fontWeight: '700' },
  closeBtn: { marginLeft: 8 },
  list: { paddingBottom: 12, gap: 8 },
  divider: { height: 1, marginVertical: 8 },
  footer: { paddingTop: 4 },
  countPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  countNumber: { fontWeight: '800', fontSize: 13 },
  countText: { fontWeight: '600', fontSize: 13 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
});
