import { BibleActionsSheet } from '@/components/BibleActionsSheet';
import { BibleBottomSheet } from '@/components/BibleBottomSheet';
import { BibleIcon } from '@/components/BibleIcon';
import { BibleConfirmModal } from '@/components/modals/BibleConfirmModal';
import { FlashList } from '@shopify/flash-list';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BibleDrawerMenu } from '../../components/BibleDrawerMenu';
import { BibleHeader } from '../../components/BibleHeader';
import { BibleSkeleton } from '../../components/BibleSkeleton';
import { BibleText } from '../../components/BibleText';
import { DonateModal } from '../../components/modals/DonateModal';
import { ROUTES, ROUTE_LABELS } from '../../constants/routes';
import { useResponsive } from '../../hooks/use-responsive';
import { Study, useStudies } from '../../hooks/use-studies';
import { useTheme } from '../../hooks/use-theme';

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
  const insets = useSafeAreaInsets();

  const { deleteMultiple, studies, createStudy, deleteStudy, importBulk, loaded } = useStudies();
  const currentStudies = studies;

  if (!loaded) {
    return <BibleSkeleton />;
  }

  const isSelectionMode = selectedIds.size > 0;

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
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  const exportPDFs = async (ids: Set<string>) => {
    setShareMenuVisible(false);
    try {
      const selectedStudies = studies.filter(s => ids.has(s.id));
      if (selectedStudies.length === 0) return;

      const css = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap');
        @media print { @page { margin: 0; size: auto; } body { padding: 20mm; } }
        body { font-family: 'Inter', -apple-system, sans-serif; color: #222; max-width: 800px; margin: 0 auto; line-height: 1.6; padding: 24px; }
        h1.main-title { color: #008080; font-size: 32px; font-weight: 800; margin-bottom: 8px; border-bottom: 2px solid #e0f2f1; padding-bottom: 12px; }
        .meta { color: #888; font-size: 13px; margin-bottom: 32px; font-weight: 600; }
        .bible-verse { border-left: 4px solid #008080; padding: 16px 24px; background: #f4faf9; border-radius: 8px; margin: 24px 0; page-break-inside: avoid; }
        .bible-verse b, .bible-verse .verse-title { color: #008080; display: block; margin-bottom: 12px; font-size: 16px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }
        .verse-line { margin-bottom: 10px; line-height: 1.7; display: flex; gap: 8px; }
        .verse-num { font-weight: 800; color: #008080; font-size: 12px; margin-top: 2px; }
        .verse-text { font-style: italic; color: #333; flex: 1; }
        img { max-width: 100%; border-radius: 12px; margin: 24px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); page-break-inside: avoid; }
        .study-divider { border-top: 2px dashed #ccc; margin: 40px 0; }
        ul, ol { padding-left: 24px; margin-top: 8px; margin-bottom: 8px; }
        li { margin-bottom: 4px; }
        ul.task-list { list-style: none; padding-left: 28px; }
        ul.task-list li { position: relative; margin-bottom: 8px; }
        ul.task-list li::before {
          content: ''; position: absolute; left: -26px; top: 4px; width: 18px; height: 18px;
          border: 2px solid #008080; border-radius: 4px; background-color: transparent; box-sizing: border-box;
        }
        ul.task-list li[data-checked="true"]::before {
          background-color: #008080;
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');
          background-size: 12px; background-repeat: no-repeat; background-position: center;
        }
        ul.task-list li[data-checked="true"] { text-decoration: line-through; opacity: 0.6; }
      `;

      const bodyHtml = selectedStudies.map(study => `
        <div style="page-break-after: always;">
          <h1 class="main-title">${study.title}</h1>
          <div class="meta">Criado em ${study.createdAt} • Exportado em ${new Date().toLocaleDateString('pt-BR')}</div>
          ${study.content}
        </div>
      `).join('');

      const htmlDocument = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Estudos Exportados</title><style>${css}</style></head><body>${bodyHtml}</body></html>`;

      if (Platform.OS === 'web') {
        const htmlWithScript = htmlDocument.replace('</body>', '<script>setTimeout(()=>window.print(),500);</script></body>');
        const blob = new Blob([htmlWithScript], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.target = '_blank';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      } else {
        const Print = require('expo-print');
        const Sharing = require('expo-sharing');
        const { uri } = await Print.printToFileAsync({ html: htmlDocument, width: 612, height: 792 });
        const safeTitle = selectedStudies.length === 1 ? selectedStudies[0].title.replace(/[^a-zA-Z0-9]/g, '_') : 'estudos_exportados';
        const newUri = `${(FileSystem as any).documentDirectory}${safeTitle}.pdf`;
        try { await FileSystem.deleteAsync(newUri, { idempotent: true }); } catch (e) { }
        await FileSystem.copyAsync({ from: uri, to: newUri });
        await Sharing.shareAsync(newUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      }
      setSelectedIds(new Set());
    } catch (e: any) { Alert.alert('Erro', String(e?.message || e)); }
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const id = createStudy(newTitle.trim(), newDescription.trim());
    setNewTitle('');
    setNewDescription('');
    setModalVisible(false);
    router.push(ROUTES.STUDY_EDITOR(id) as any);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <BibleIcon name="book" size={ms(64)} color={colors.primaryVariant} style={{ marginBottom: ms(16) }} />
      <BibleText style={[styles.emptyTitle, { fontSize: ms(20), color: colors.onBackground }]}>Nenhum estudo ainda</BibleText>
      <BibleText style={[styles.emptySubtitle, { fontSize: ms(14), color: colors.textMuted }]}>
        Abra o menu superior nos três pontos para criar seu primeiro estudo
      </BibleText>
    </View>
  );

  const renderItem = ({ item }: { item: Study }) => {
    const rawText = (item.content || '').replace(/<[^>]+>/g, ' ').trim();
    const firstPara = rawText.length > 80 ? rawText.substring(0, 80) + '...' : rawText;
    const isSelected = selectedIds.has(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, {
          backgroundColor: isSelected ? colors.primary + '20' : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: isSelected ? 2 : 1
        }]}
        onPress={() => isSelectionMode ? toggleSelection(item.id) : router.push(ROUTES.STUDY_EDITOR(item.id) as any)}
        onLongPress={() => toggleSelection(item.id)}
        activeOpacity={0.75}
      >
        <View style={styles.cardContent}>
          <TouchableOpacity onPress={() => toggleSelection(item.id)} style={[styles.cardIcon, { backgroundColor: isSelected ? colors.primary : colors.surfaceHighlight }]}>
            {isSelected ? (
              <BibleIcon name="check" color={colors.onPrimary} />
            ) : (
              <BibleIcon name="book-open" color={colors.primary} />
            )}
          </TouchableOpacity>
          <View style={styles.cardText}>
            <BibleText style={[styles.cardTitle, { fontSize: ms(16), color: colors.onSurface, fontWeight: '600' }]} numberOfLines={2}>{item.title}</BibleText>
            <BibleText style={[styles.cardDate, { fontSize: ms(12), color: colors.textMuted }]}>{item.createdAt}</BibleText>
          </View>
          {!isSelectionMode && (
            <TouchableOpacity onPress={() => setStudyToDelete(item.id)} style={[styles.deleteBtn, { backgroundColor: colors.error + '20' }]}>
              <BibleIcon name="trash-2" color={colors.error} />
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
          showBack={true}
          backIcon="x"
          onBack={() => setSelectedIds(new Set())}
          rightContent={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity onPress={() => setShareMenuVisible(true)}>
                <BibleIcon name="share-2" color={colors.onPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMultiDeleteVisible(true)}>
                <BibleIcon name="trash-2" color={colors.onPrimary} />
              </TouchableOpacity>
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

      <BibleBottomSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        resizable={false}
        header={
          <View style={styles.modalHeader}>
            <BibleIcon name="file-plus" color={colors.primary} backgroundColor={colors.primary + '15'} style={{ marginRight: 8 }} />
            <BibleText style={[styles.modalTitle, { fontSize: ms(16), color: colors.onSurface, fontWeight: '700' }]}>Novo Estudo</BibleText>
            <BibleIcon name="x" color={colors.error} backgroundColor={colors.error + '20'} onPress={() => setModalVisible(false)} style={{ marginLeft: 'auto' }} />
          </View>
        }
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TextInput
            style={[styles.input, { fontSize: ms(16), backgroundColor: colors.surfaceHighlight, color: colors.onSurface }]}
            placeholder="Título do estudo"
            placeholderTextColor={colors.textMuted}
            value={newTitle}
            onChangeText={setNewTitle}
            {...({ outlineStyle: 'none' } as any)}
          />
          <TextInput
            style={[styles.input, styles.inputMultiline, { fontSize: ms(15), backgroundColor: colors.surfaceHighlight, color: colors.onSurface }]}
            placeholder="Descrição (opcional)"
            placeholderTextColor={colors.textMuted}
            value={newDescription}
            onChangeText={setNewDescription}
            multiline
            numberOfLines={3}
            {...({ outlineStyle: 'none' } as any)}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.primary }, !newTitle.trim() && styles.createBtnDisabled]}
              onPress={handleCreate}
            >
              <BibleText style={[styles.createText, { fontSize: ms(15), color: colors.onPrimary }]}>Criar</BibleText>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </BibleBottomSheet>

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

      <BibleActionsSheet
        visible={headerMenuVisible}
        onClose={() => setHeaderMenuVisible(false)}
        title="Ações"
        items={[
          { icon: 'file-plus', label: 'Novo Estudo', onPress: () => setModalVisible(true) },
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
  cardIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontWeight: '700' },
  cardDate: { marginTop: 2 },
  deleteBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center' },
  modalTitle: { fontWeight: '800' },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8 },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  cancelText: { fontWeight: '700' },
  createBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  createBtnDisabled: { opacity: 0.5 },
  createText: { fontWeight: '700' },
});
