import { BibleActionsDrawer } from '@/components/modals/BibleActionsDrawer';
import { BibleIcon } from '@/components/BibleIcon';
import { BibleSkeleton } from '@/components/BibleSkeleton';
import { BibleConfirmModal } from '@/components/modals/BibleConfirmModal';
import { FlashList } from '@shopify/flash-list';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { BibleHeader } from '../components/BibleHeader';
import { BiblePageEmpty } from '../components/BiblePageEmpty';
import { BibleText } from '../components/BibleText';
import { ROUTES, ROUTE_LABELS } from '../constants/routes';
import { useResponsive } from '../hooks/useResponsive';
import { Study, useStudies } from '../hooks/useStudies';
import { useTheme } from '../hooks/useTheme';
import { handleSmartBack } from '../utils/navigation';

export default function TrashScreen() {
  const { ms } = useResponsive();
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const [isMultiDeleteVisible, setIsMultiDeleteVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionPurpose, setSelectionPurpose] = useState<'delete' | 'restore' | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const { trashedStudies, restoreMultiple, deleteMultiplePermanently, isLoaded } = useStudies();
  const currentStudies = trashedStudies;

  if (!isLoaded) {
    return <BibleSkeleton />;
  }

  const isSelectionMode = selectedIds.size > 0 || !!selectionPurpose;

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderEmpty = () => (
    <BiblePageEmpty
      title="Lixeira vazia"
      description="Nenhum estudo foi movido para a lixeira."
      icon="trash-2"
    />
  );

  const renderItem = ({ item }: { item: Study }) => {
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
            borderColor: isSelected ? colors.primary + '20' : colors.border,
            borderWidth: isSelected ? 1.5 : 1,
            elevation: isSelected ? 0 : 1
          }
        ]}
        onPress={() => isSelectionMode ? toggleSelection(item.id) : router.push({ pathname: ROUTES.STUDY_EDITOR(item.id) as any, params: { readonly: 'true' } })}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {isSelectionMode ? (
            <TouchableOpacity
              onPress={() => toggleSelection(item.id)}
              style={[
                styles.cardIcon,
                {
                  backgroundColor: isSelected ? colors.primary : 'transparent',
                  borderWidth: isSelected ? 0 : 1.5,
                  borderColor: isSelected ? 'transparent' : colors.border
                }
              ]}
            >
              {isSelected ? (
                <BibleIcon name="check" color={colors.onPrimary} size={ms(16)} />
              ) : null}
            </TouchableOpacity>
          ) : (
            <BibleIcon 
              name="book-open" 
              color={colors.primary} 
              backgroundColor={colors.primary + '15'} 
              containerSize={40} 
              borderRadius={12} 
            />
          )}
          <View style={styles.cardText}>
            <BibleText style={[styles.cardTitle, { fontSize: ms(16), color: colors.onSurface, fontWeight: '600' }]} numberOfLines={2}>{item.title}</BibleText>
            <BibleText style={[styles.cardDate, { fontSize: ms(12), color: colors.textMuted }]}>{item.createdAt}</BibleText>
          </View>
          <View style={{ opacity: isSelectionMode ? 0.2 : 0.8 }}>
            <BibleIcon name="chevron-right" color={colors.textMuted} size={ms(18)} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handlePermanentDelete = () => {
    deleteMultiplePermanently(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSelectionPurpose(null);
    setIsMultiDeleteVisible(false);
  };

  const handleRestore = () => {
    restoreMultiple(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSelectionPurpose(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isSelectionMode ? (
        <BibleHeader
          title={`${selectedIds.size} selecionado${selectedIds.size !== 1 ? 's' : ''}`}
          showMenu={false}
          showBack={true}
          backIcon="x"
          onBack={() => {
            setSelectedIds(new Set());
            setSelectionPurpose(null);
          }}
          rightContent={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {(!selectionPurpose || selectionPurpose === 'restore') && (
                <TouchableOpacity
                  onPress={handleRestore}
                  disabled={selectedIds.size === 0}
                  style={{ opacity: selectedIds.size === 0 ? 0.3 : 1 }}
                >
                  <BibleIcon name="corner-up-left" color={colors.onPrimary} />
                </TouchableOpacity>
              )}
              {(!selectionPurpose || selectionPurpose === 'delete') && (
                <TouchableOpacity
                  onPress={() => setIsMultiDeleteVisible(true)}
                  disabled={selectedIds.size === 0}
                  style={{ opacity: selectedIds.size === 0 ? 0.3 : 1 }}
                >
                  <BibleIcon name="trash-2" color={colors.onPrimary} />
                </TouchableOpacity>
              )}
            </View>
          }
        />
      ) : (
        <BibleHeader
          title={ROUTE_LABELS[ROUTES.TRASH]}
          showMenu={false}
          showBack={true}
          onBack={() => handleSmartBack(pathname)}
          rightContent={
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={{ width: ms(44), height: ms(44), alignItems: 'center', justifyContent: 'center' }}
            >
              <BibleIcon name="more-vertical" color={colors.onPrimary} size={ms(20)} />
            </TouchableOpacity>
          }
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

      <BibleActionsDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        title="Ações"
        items={[
          { icon: 'corner-up-left', label: 'Restaurar Estudos', onPress: () => setSelectionPurpose('restore') },
          { icon: 'trash-2', label: 'Excluir Permanentemente', onPress: () => setSelectionPurpose('delete') }
        ]}
      />

      <BibleConfirmModal
        visible={isMultiDeleteVisible}
        title="Excluir Permanentemente"
        message={`Deseja apagar definitivamente ${selectedIds.size} estudo(s)? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isDanger={true}
        onCancel={() => setIsMultiDeleteVisible(false)}
        onConfirm={handlePermanentDelete}
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
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 14 },
  cardIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontWeight: '700' },
  cardDate: { marginTop: 2 },
});
