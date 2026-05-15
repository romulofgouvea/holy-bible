import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ROUTE_LABELS } from '../../constants/routes';
import { HistoryItem, useHistory } from '../../hooks/use-history';
import { useResponsive } from '../../hooks/use-responsive';
import { useTheme } from '../../hooks/use-theme';
import { BibleCountPill } from '../BibleCountPill';
import { BibleIcon } from '../BibleIcon';
import { BiblePageEmpty } from '../BiblePageEmpty';
import { BiblePageModal } from '../BiblePageModal';
import { BibleText } from '../BibleText';

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
    <BiblePageModal visible={visible} onClose={onClose} fullHeight={true}
      header={
        <View style={styles.header} testID="bible-history-header">
          <BibleIcon name="clock"
            color={colors.primary}
            backgroundColor={`${colors.primary}20`}
            style={{ marginRight: 8 }} />
          <BibleText style={[styles.title, { fontSize: ms(18), color: colors.primary, fontWeight: '800' }]} testID="bible-history-title">{ROUTE_LABELS.HISTORY}</BibleText>
          <BibleIcon
            name="x"
            color={colors.error}
            backgroundColor={colors.error + '20'}
            onPress={onClose}
            testID="bible-history-close-btn"
          />
        </View>
      }
      footer={
        history.length ? <BibleCountPill
          count={history.length}
          label="item"
          labelPlural="itens"
        /> : null
      }>
      <View style={styles.container} testID="bible-history-modal">
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
          </>
        ) : (
          <BiblePageEmpty
            title="Nenhum histórico encontrado"
            description="Navegue pelos livros e capítulos para registrar"
            icon="clock"
          />
        )}
      </View>
    </BiblePageModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
