import { BibleConfirmModal } from '@/components/BibleConfirmModal';
import { BibleIcon } from '@/components/BibleIcon';
import { Feather } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { BibleHeader } from '../../components/BibleHeader';
import { BibleText } from '../../components/BibleText';
import { ROUTES, ROUTE_LABELS } from '../../constants/routes';
import { useResponsive } from '../../hooks/use-responsive';
import { Study, useStudies } from '../../hooks/use-studies';
import { useTheme } from '../../hooks/use-theme';
import { handleSmartBack } from '../../utils/navigation';

export default function TrashScreen() {
  const { ms } = useResponsive();
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const [studyToDelete, setStudyToDelete] = useState<string | null>(null);
  const [multiDeleteVisible, setMultiDeleteVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { restoreMultiple, deleteMultiplePermanently, trashedStudies } = useStudies();
  const currentStudies = trashedStudies;

  const isSelectionMode = selectedIds.size > 0;

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <BibleIcon name="trash" size={ms(64)} color={colors.primary} />
      <BibleText style={[styles.emptyTitle, { fontSize: ms(20), color: colors.onBackground }]}>
        Lixeira vazia
      </BibleText>
      <BibleText style={[styles.emptySubtitle, { fontSize: ms(14), color: colors.textMuted }]}>
        Nenhum estudo foi movido para a lixeira.
      </BibleText>
    </View>
  );

  const renderItem = ({ item }: { item: Study }) => {
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
            borderColor: isSelected ? colors.primary : colors.error + '40',
            borderWidth: isSelected ? 2 : 1
          }
        ]}
        onPress={() => toggleSelection(item.id)}
        onLongPress={() => toggleSelection(item.id)}
        activeOpacity={0.75}
      >
        <View style={styles.cardContent}>
          <TouchableOpacity
            onPress={() => toggleSelection(item.id)}
            style={[styles.cardIcon, { backgroundColor: isSelected ? colors.primary : colors.error + '20' }]}
          >
            <Feather
              name={isSelected ? "check" : "trash-2"}
              size={ms(18)}
              color={isSelected ? colors.onPrimary : colors.error}
            />
          </TouchableOpacity>
          <View style={styles.cardText}>
            <BibleText style={[styles.cardTitle, { fontSize: ms(16), color: colors.onSurface, fontWeight: '600' }]} numberOfLines={2}>{item.title}</BibleText>
            <BibleText style={[styles.cardDate, { fontSize: ms(12), color: colors.textMuted }]}>{item.createdAt}</BibleText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isSelectionMode ? (
        <BibleHeader
          title={selectedIds.size === 0 ? "Lixeira" : `${selectedIds.size} selecionado${selectedIds.size > 1 ? 's' : ''}`}
          showMenu={false}
          showBack={true}
          backIcon="x"
          onBack={() => setSelectedIds(new Set())}
          rightContent={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity onPress={() => {
                restoreMultiple(Array.from(selectedIds));
                setSelectedIds(new Set());
              }}>
                <BibleIcon name="corner-up-left" size={ms(20)} color={colors.onPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMultiDeleteVisible(true)}>
                <BibleIcon name="trash-2" size={ms(20)} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <BibleHeader
          title={ROUTE_LABELS[ROUTES.TRASH]}
          showMenu={false}
          showBack={true}
          onBack={() => handleSmartBack(pathname)}
        />
      )}

      <View style={{ flex: 1 }}>
        <FlashList
          data={currentStudies}
          keyExtractor={(item) => item.id}
          // @ts-ignore
          estimatedItemSize={80}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <BibleConfirmModal
        visible={!!studyToDelete}
        title="Excluir Permanentemente"
        message="Tem certeza? Esta ação não pode ser desfeita e todos os blocos do estudo serão perdidos."
        confirmText="Excluir"
        isDanger={true}
        onCancel={() => setStudyToDelete(null)}
        onConfirm={() => {
          if (studyToDelete) {
            deleteMultiplePermanently([studyToDelete]);
          }
          setStudyToDelete(null);
        }}
      />

      <BibleConfirmModal
        visible={multiDeleteVisible}
        title="Excluir selecionados permanentemente"
        message={`Deseja apagar definitivamente ${selectedIds.size} estudo(s)?`}
        confirmText="Excluir"
        isDanger={true}
        onCancel={() => setMultiDeleteVisible(false)}
        onConfirm={() => {
          deleteMultiplePermanently(Array.from(selectedIds));
          setSelectedIds(new Set());
          setMultiDeleteVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontWeight: '700' },
  emptySubtitle: { textAlign: 'center', paddingHorizontal: 32 },
  card: {
    borderWidth: 1,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 14 },
  cardIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontWeight: '700' },
  cardDate: { marginTop: 2 },
});
