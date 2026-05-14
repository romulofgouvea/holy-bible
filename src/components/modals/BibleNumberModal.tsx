import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleCountPill } from './BibleCountPill';
import { BibleDivider } from './BibleDivider';
import { BibleGridBlock } from './BibleGridBlock';
import { BibleIcon } from './BibleIcon';
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
          <BibleIcon
            name="arrow-left"
            color={colors.primary}
            onPress={onBack}
            backgroundColor={colors.primary + '20'}
            style={{ marginRight: 8 }} />
        ) : (
          <BibleIcon
            name={iconName}
            color={colors.primary}
            backgroundColor={colors.primary + '20'}
            style={{ marginRight: 8 }} />
        )}
        <BibleText style={[styles.title, { fontSize: ms(18), color: colors.primary, fontWeight: '800' }]}>{title}</BibleText>

        <BibleIcon
          name="x"
          color={colors.error}
          backgroundColor={colors.error + '20'}
          onPress={onClose}
        />
      </View>

      <BibleDivider margin={8} />

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

      <BibleDivider margin={8} />

      <View style={styles.footer}>
        <BibleCountPill
          count={items.length}
          label={footerText ? footerText : title.toLowerCase()}
          labelPlural={footerText ? footerText : title.toLowerCase()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, fontWeight: '700' },
  list: { paddingBottom: 12, gap: 8 },
  footer: { paddingTop: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
});
