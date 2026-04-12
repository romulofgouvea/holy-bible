import { BibleConfirmModal } from '@/components/BibleConfirmModal';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BibleHeader } from '../../components/BibleHeader';
import { BibleText } from '../../components/BibleText';
import { useResponsive } from '../../hooks/use-responsive';
import { Study, useStudies } from '../../hooks/use-studies';
import { useTheme } from '../../hooks/use-theme';

export default function TrashScreen() {
  const { ms } = useResponsive();
  const router = useRouter();
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
      <Feather name="trash-2" size={ms(64)} color={colors.surfaceVariant} />
      <BibleText style={[styles.emptyTitle, { fontSize: ms(20), color: colors.text }]}>
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
        style={[styles.card, { backgroundColor: isSelected ? colors.primaryContainer : '#fff0f0', borderColor: isSelected ? colors.primary : '#ffcdd2' }]}
        onPress={() => isSelectionMode ? toggleSelection(item.id) : toggleSelection(item.id)}
        onLongPress={() => toggleSelection(item.id)}
        activeOpacity={0.75}
      >
        <View style={styles.cardContent}>
          <TouchableOpacity onPress={() => toggleSelection(item.id)} style={[styles.cardIcon, { backgroundColor: isSelected ? colors.primary : colors.surfaceVariant }]}>
            {isSelected ? (
              <Feather name="check" size={ms(18)} color={colors.onPrimary} />
            ) : (
              <Feather name="trash-2" size={ms(18)} color={colors.primary} />
            )}
          </TouchableOpacity>
          <View style={styles.cardText}>
            <BibleText style={[styles.cardTitle, { fontSize: ms(16), color: '#d32f2f' }]}>{item.title}</BibleText>
            <BibleText style={[styles.cardDate, { fontSize: ms(12), color: colors.border }]}>{item.createdAt}</BibleText>
          </View>
          {!isSelectionMode && (
            <TouchableOpacity onPress={() => restoreMultiple([item.id])} style={[styles.deleteBtn, { backgroundColor: colors.primaryContainer }]}>
              <Feather name="corner-up-left" size={ms(18)} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isSelectionMode ? (
        <BibleHeader
          title={`${selectedIds.size} selecionado${selectedIds.size > 1 ? 's' : ''}`}
          showMenu={false}
          leftContent={
            <TouchableOpacity onPress={() => setSelectedIds(new Set())} style={{ padding: 8 }}>
              <Feather name="x" size={ms(22)} color={colors.onPrimary} />
            </TouchableOpacity>
          }
          rightContent={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity onPress={() => {
                restoreMultiple(Array.from(selectedIds));
                setSelectedIds(new Set());
              }}>
                <Feather name="corner-up-left" size={ms(20)} color={colors.onPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMultiDeleteVisible(true)}>
                <Feather name="trash-2" size={ms(20)} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <BibleHeader title="Lixeira de Estudos" showMenu={false} leftContent={
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Feather name="arrow-left" size={ms(24)} color={colors.onPrimary} />
          </TouchableOpacity>
        } />
      )}

      <FlatList
        data={currentStudies}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

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
  container: { flex: 1, backgroundColor: '#f8fafa' },
  listContent: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontWeight: '700', color: '#555' },
  emptySubtitle: { color: '#aaa', textAlign: 'center', paddingHorizontal: 32 },
  card: {
    borderWidth: 1,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 14 },
  cardIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontWeight: '700' },
  cardDate: { marginTop: 2 },
  deleteBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
});
