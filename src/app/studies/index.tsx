import { BibleActionsDrawer } from '@/components/BibleActionsDrawer';
import { BibleActionsSheet } from '@/components/BibleActionsSheet';
import { BibleIcon } from '@/components/BibleIcon';
import { BiblePageModal } from '@/components/BiblePageModal';
import { BibleConfirmModal } from '@/components/modals/BibleConfirmModal';
import { FlashList } from '@shopify/flash-list';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BibleDrawerMenu } from '../../components/BibleDrawerMenu';
import { BibleHeader } from '../../components/BibleHeader';
import { BiblePageEmpty } from '../../components/BiblePageEmpty';
import { BibleSkeleton } from '../../components/BibleSkeleton';
import { BibleText } from '../../components/BibleText';
import { DonateModal } from '../../components/modals/DonateModal';
import { ROUTES, ROUTE_LABELS } from '../../constants/routes';
import { useResponsive } from '../../hooks/use-responsive';
import { Study, useStudies } from '../../hooks/use-studies';
import { useTheme } from '../../hooks/use-theme';
import { exportToPDF } from '../../utils/export';

export default function EstudosScreen() {
  const { ms } = useResponsive();
  const router = useRouter();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [studyToDelete, setStudyToDelete] = useState<string | null>(null);
  const [multiDeleteVisible, setMultiDeleteVisible] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const [shareMenuVisible, setShareMenuVisible] = useState(false);
  const [donateVisible, setDonateVisible] = useState(false);
  const [selectionPurpose, setSelectionPurpose] = useState<'delete' | 'share' | null>(null);
  const insets = useSafeAreaInsets();

  const { deleteMultiple, studies, createStudy, deleteStudy, importBulk, loaded } = useStudies();
  const currentStudies = studies;

  if (!loaded) {
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

  const exportBackup = async (ids: Set<string>) => {
    setShareMenuVisible(false);
    try {
      const selectedStudies = studies.filter(s => ids.has(s.id));
      if (selectedStudies.length === 0) return;

      const safeTitle = selectedStudies.length === 1 ? selectedStudies[0].title.replace(/[^a-zA-Z0-9]/g, '_') : 'backup_estudos';
      const jsonString = JSON.stringify(selectedStudies, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeTitle}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const Sharing = require('expo-sharing');
        const newUri = `${(FileSystem as any).documentDirectory}${safeTitle}.json`;
        await FileSystem.writeAsStringAsync(newUri, jsonString);
        await Sharing.shareAsync(newUri, { mimeType: 'application/json' });
      }
      setSelectedIds(new Set());
      setSelectionPurpose(null);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  const exportPDFs = async (ids: Set<string>) => {
    setShareMenuVisible(false);
    const selectedStudies = studies.filter(s => ids.has(s.id));
    if (selectedStudies.length === 0) return;

    const bodyHtml = selectedStudies.map((study, index) => `
      <div style="${index > 0 ? 'page-break-before: always;' : ''}">
        <h1 class="main-title">Estudo: ${study.title}</h1>
        ${study.content}
      </div>
    `).join('');

    const title = selectedStudies.length === 1 ? `Estudo: ${selectedStudies[0].title}` : 'Meus Estudos';
    await exportToPDF(title, bodyHtml, false);
    setSelectedIds(new Set());
    setSelectionPurpose(null);
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const id = createStudy(newTitle.trim(), undefined, newDescription.trim());
    setNewTitle('');
    setNewDescription('');
    setModalVisible(false);
    router.push(ROUTES.STUDY_EDITOR(id) as any);
  };

  const renderEmpty = () => (
    <BiblePageEmpty
      title="Nenhum estudo ainda"
      description="Abra o menu superior nos três pontos para criar seu primeiro estudo"
      icon="book"
    />
  );

  const renderItem = ({ item }: { item: Study }) => {
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, {
          backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
          borderColor: isSelected ? colors.primary + '20' : colors.border,
          borderWidth: isSelected ? 1.5 : 1,
          elevation: isSelected ? 0 : 1
        }]}
        onPress={() => isSelectionMode ? toggleSelection(item.id) : router.push(ROUTES.STUDY_EDITOR(item.id) as any)}
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
              backgroundColor={colors.primary + '20'}
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isSelectionMode ? (
        <BibleHeader
          title={`${selectedIds.size} selecionado${selectedIds.size > 1 ? 's' : ''}`}
          showMenu={false}
          showBack={true}
          backIcon="x"
          onBack={() => {
            setSelectedIds(new Set());
            setSelectionPurpose(null);
          }}
          rightContent={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              {(!selectionPurpose || selectionPurpose === 'share') && (
                <TouchableOpacity
                  onPress={() => setShareMenuVisible(true)}
                  disabled={selectedIds.size === 0}
                  style={{ opacity: selectedIds.size === 0 ? 0.3 : 1 }}
                >
                  <BibleIcon name="share-2" color={colors.onPrimary} />
                </TouchableOpacity>
              )}
              {(!selectionPurpose || selectionPurpose === 'delete') && (
                <TouchableOpacity
                  onPress={() => setMultiDeleteVisible(true)}
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
        <BibleHeader title={ROUTE_LABELS[ROUTES.STUDIES]} onMenuPress={() => setDrawerVisible(true)} rightContent={
          <TouchableOpacity onPress={() => setHeaderMenuVisible(true)} style={{ padding: 4 }}>
            <BibleIcon name="more-vertical" color={colors.onPrimary} />
          </TouchableOpacity>
        } />
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

      <BiblePageModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        header={
          <View style={styles.modalHeader}>
            <BibleIcon name="file-plus" color={colors.primary} backgroundColor={colors.primary + '15'} style={{ marginRight: 8 }} />
            <BibleText style={[styles.modalTitle, { fontSize: ms(16), color: colors.onSurface, fontWeight: '700' }]}>Novo Estudo</BibleText>
            <BibleIcon name="x" color={colors.error} backgroundColor={colors.error + '20'} onPress={() => setModalVisible(false)} style={{ marginLeft: 'auto' }} />
          </View>
        }
        footer={
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.primary }, !newTitle.trim() && styles.createBtnDisabled]}
              onPress={handleCreate}
              disabled={!newTitle.trim()}
            >
              <BibleText style={[styles.createText, { fontSize: ms(15), color: colors.onPrimary }]}>Criar</BibleText>
            </TouchableOpacity>
          </View>
        }
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Título do Estudo</BibleText>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surfaceHighlight, color: colors.onSurface },
              Platform.select({ web: { outline: 'none' } as any, default: {} })
            ]}
            placeholder="Ex: Esperança em Meio à Provação"
            placeholderTextColor={colors.textMuted}
            value={newTitle}
            onChangeText={setNewTitle}
            underlineColorAndroid="transparent"
          />
          <BibleText style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 8 }]}>Descrição (Opcional)</BibleText>
          <TextInput
            style={[
              styles.input,
              styles.inputMultiline,
              { backgroundColor: colors.surfaceHighlight, color: colors.onSurface },
              Platform.select({ web: { outline: 'none' } as any, default: {} })
            ]}
            placeholder="Uma breve introdução sobre este estudo"
            placeholderTextColor={colors.textMuted}
            value={newDescription}
            onChangeText={setNewDescription}
            multiline
            numberOfLines={3}
            underlineColorAndroid="transparent"
          />
        </ScrollView>
      </BiblePageModal>

      <BibleConfirmModal
        visible={!!studyToDelete}
        title="Mover para lixeira"
        message="O estudo ficará na lixeira por 30 dias e depois será excluído permanentemente. Você pode recuperá-lo a qualquer momento nesse período."
        confirmText="Excluir"
        isDanger={true}
        onCancel={() => setStudyToDelete(null)}
        onConfirm={() => {
          if (studyToDelete) {
            deleteStudy(studyToDelete);
          }
          setStudyToDelete(null);
        }}
      />

      <BibleConfirmModal
        visible={multiDeleteVisible}
        title="Excluir estudos selecionados"
        message={`Deseja mover ${selectedIds.size} estudo(s) para a lixeira?`}
        confirmText="Excluir"
        isDanger={true}
        onCancel={() => setMultiDeleteVisible(false)}
        onConfirm={() => {
          deleteMultiple(Array.from(selectedIds));
          setSelectedIds(new Set());
          setSelectionPurpose(null);
          setMultiDeleteVisible(false);
        }}
      />

      <BibleDrawerMenu
        visible={drawerVisible}
        activeItem="studies"
        onClose={() => setDrawerVisible(false)}
        onSelectItem={() => { }}
        onOpenDonate={() => { setDrawerVisible(false); setTimeout(() => setDonateVisible(true), 250); }}
      />

      <BibleActionsDrawer
        visible={headerMenuVisible}
        onClose={() => setHeaderMenuVisible(false)}
        title="Ações"
        items={[
          { icon: 'file-plus', label: 'Novo Estudo', onPress: () => setModalVisible(true) },
          { icon: 'trash-2', label: 'Excluir Estudos', onPress: () => setSelectionPurpose('delete') },
          { icon: 'share-2', label: 'Compartilhar', onPress: () => setSelectionPurpose('share') },
          { icon: 'trash', label: 'Lixeira', onPress: () => router.push(ROUTES.TRASH as any) }
        ]}
      />

      <BibleActionsSheet
        visible={shareMenuVisible}
        onClose={() => setShareMenuVisible(false)}
        title="Compartilhar"
        items={[
          { icon: 'file-text', label: 'Compartilhar em PDF', onPress: () => exportPDFs(selectedIds) },
          { icon: 'file', label: 'Compartilhar em arquivo', onPress: () => exportBackup(selectedIds) }
        ]}
      />

      <DonateModal visible={donateVisible} onClose={() => setDonateVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1
  },
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
  cardIcon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontWeight: '700' },
  cardDate: { marginTop: 2 },
  deleteBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center' },
  modalTitle: { fontWeight: '800' },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  cancelText: { fontWeight: '700' },
  createBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  createBtnDisabled: { opacity: 0.5 },
  createText: { fontWeight: '700' },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
    paddingBottom: 8,
  },
});
