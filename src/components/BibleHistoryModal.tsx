import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ROUTE_LABELS } from '../constants/routes';
import { HistoryItem, useHistory } from '../hooks/use-history';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleBottomSheet } from './BibleBottomSheet';
import { BibleCountPill } from './BibleCountPill';
import { BibleIcon } from './BibleIcon';
import { BibleText } from './BibleText';
import { BibleDivider } from './BibleDivider';

type BibleHistoryModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
};

export function BibleHistoryModal({ visible, onClose, onSelect }: BibleHistoryModalProps) {
  const { history, loadHistory } = useHistory();
  const { ms } = useResponsive();
  const { colors } = useTheme();

  const listRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (visible) {
      loadHistory();

      setTimeout(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      }, 50);
    }
  }, [visible, loadHistory]);

  return (
    <BibleBottomSheet visible={visible} onClose={onClose}>
      <View style={styles.container} testID="bible-history-modal">
        <View style={styles.header} testID="bible-history-header">
          <View style={[styles.iconBtn, styles.headerIconWrap, { backgroundColor: colors.primary + '25' }]} testID="bible-history-icon">
            <BibleIcon name="clock" color={colors.primary} />
          </View>
          <BibleText style={[styles.title, { fontSize: ms(16), color: colors.primary, fontWeight: '800' }]} testID="bible-history-title">{ROUTE_LABELS.HISTORY}</BibleText>
          <BibleIcon
            name="x"
            color={colors.error}
            backgroundColor={colors.error + '20'}
            onPress={onClose}
            testID="bible-history-close-btn"
          />
        </View>
        <BibleDivider />
        {history.length > 0 ? (
          <>
            <View style={styles.list}>
              <FlashList
                ref={listRef}
                data={history}
                keyExtractor={(item) => `${item.timestamp}`}
                // @ts-ignore
                estimatedItemSize={70}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    onPress={() => {
                      onSelect(item);
                      onClose();
                    }}
                  >
                    <View style={styles.cardBody}>
                      <View style={{ flex: 1 }}>
                        <BibleText style={[styles.refText, { color: colors.onSurface, fontSize: ms(16) }]}>
                          {item.bookName} {item.chapter}:{item.verse}
                        </BibleText>
                        <BibleText style={[styles.versionSubText, { color: colors.textMuted, fontSize: ms(12), marginTop: 2 }]}>
                          {new Date(item.timestamp).toLocaleDateString()}
                        </BibleText>
                      </View>
                      <View style={[styles.versionBadge, { backgroundColor: colors.primary }]}>
                        <BibleText style={[styles.versionBadgeText, { color: colors.onPrimary, fontSize: ms(11) }]}>
                          {item.version}
                        </BibleText>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
            <BibleDivider />

            <View style={styles.footer}>
              <BibleCountPill
                count={history.length}
                label="item"
                labelPlural="itens"
              />
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <BibleIcon name="clock" size={ms(48)} color={colors.border} />
            <BibleText style={[styles.emptyTitle, { color: colors.textMuted, fontSize: ms(15), marginTop: 12 }]}>
              Nenhum histórico encontrado
            </BibleText>
            <BibleText style={[styles.emptySubtitle, { color: colors.textMuted, fontSize: ms(13), marginTop: 4 }]}>
              Navegue pelos livros e capítulos para registrar
            </BibleText>
          </View>
        )}
      </View>
    </BibleBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconWrap: {
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontWeight: '700',
  },
  closeBtn: {
    marginLeft: 8,
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    gap: 10,
    paddingBottom: 10,
  },
  footer: {
    paddingTop: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refText: {
    fontWeight: '700',
  },
  versionSubText: {
    fontWeight: '500',
  },
  versionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  versionBadgeText: {
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
});
