import { Feather } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HistoryItem, useHistory } from '../hooks/use-history';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleBottomSheet } from './BibleBottomSheet';
import { BibleText } from './BibleText';

type BibleHistoryModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: HistoryItem) => void;
};

export function BibleHistoryModal({ visible, onClose, onSelect }: BibleHistoryModalProps) {
  const { history, clearHistory, loadHistory } = useHistory();
  const { ms } = useResponsive();
  const { colors } = useTheme();

  React.useEffect(() => {
    if (visible) {
      loadHistory();
    }
  }, [visible, loadHistory]);

  return (
    <BibleBottomSheet visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.headerIconWrap, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="clock" size={ms(18)} color={colors.primary} />
          </View>
          <BibleText style={[styles.title, { fontSize: ms(18), color: colors.primary, fontWeight: '800' }]}>Histórico</BibleText>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceHighlight }]}>
            <Feather name="x" size={ms(18)} color={colors.error} />
          </TouchableOpacity>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        {history.length > 0 ? (
          <>
            <FlatList
              data={history}
              keyExtractor={(item) => `${item.timestamp}`}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surfaceHighlight + '20' }]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <View style={styles.cardBody}>
                    <View style={[styles.iconBox, { backgroundColor: colors.primary }]}>
                      <Feather name="clock" size={ms(14)} color={colors.onPrimary} />
                    </View>
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
              style={styles.list}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.footer}>
              <View style={[styles.countPill, { backgroundColor: colors.surfaceHighlight, borderColor: colors.primary + '30' }]}>
                <BibleText style={[styles.countNumber, { color: colors.primary, fontWeight: '700' }]}>{history.length}</BibleText>
                <BibleText style={[styles.countText, { color: colors.primary, fontWeight: '600' }]}> {history.length === 1 ? 'item' : 'itens'}</BibleText>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <BibleText style={{ color: colors.textMuted }}>Nenhum histórico encontrado.</BibleText>
          </View>
        )}
      </View>
    </BibleBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 0,
  },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontWeight: '700',
  },
  closeBtn: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 10,
  },
  footer: {
    paddingTop: 4,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countNumber: {
    fontWeight: '800',
    fontSize: 13,
  },
  countText: {
    fontWeight: '600',
    fontSize: 13,
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
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  clearButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
});
