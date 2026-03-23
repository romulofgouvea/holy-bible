import { BibleConfirmModal } from '@/components/BibleConfirmModal';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BibleDrawerMenu } from '../../components/BibleDrawerMenu';
import { BibleHeader } from '../../components/BibleHeader';
import { BibleText } from '../../components/BibleText';
import { ROUTES } from '../../constants/routes';
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
  const [showTrash, setShowTrash] = useState(false);
  const insets = useSafeAreaInsets();

  const { deleteMultiple, restoreMultiple, deleteMultiplePermanently, trashedStudies, studies, createStudy, deleteStudy, importBulk } = useStudies();
  const currentStudies = showTrash ? trashedStudies : studies;

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
      const selectedStudies = showTrash ? trashedStudies.filter(s => ids.has(s.id)) : studies.filter(s => ids.has(s.id));
      if (selectedStudies.length === 0) return;
      const Sharing = require('expo-sharing');
      const safeTitle = selectedStudies.length === 1 ? selectedStudies[0].title.replace(/[^a-zA-Z0-9]/g, '_') : 'backup_estudos';
      const newUri = `${(FileSystem as any).documentDirectory}${safeTitle}.json`;
      await FileSystem.writeAsStringAsync(newUri, JSON.stringify(selectedStudies, null, 2));
      await Sharing.shareAsync(newUri, { mimeType: 'application/json' });
      setSelectedIds(new Set());
    } catch (e) { }
  };

  const exportPDFs = async (ids: Set<string>) => {
    setShareMenuVisible(false);
    try {
      const selectedStudies = showTrash ? trashedStudies.filter(s => ids.has(s.id)) : studies.filter(s => ids.has(s.id));
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
      <Feather name="book" size={ms(64)} color={colors.surfaceVariant} />
      <BibleText style={[styles.emptyTitle, { fontSize: ms(20), color: colors.text }]}>Nenhum estudo ainda</BibleText>
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
        style={[styles.card, { backgroundColor: isSelected ? colors.primaryContainer : (showTrash ? '#fff0f0' : colors.surface), borderColor: isSelected ? colors.primary : (showTrash ? '#ffcdd2' : colors.border) }]}
        onPress={() => isSelectionMode ? toggleSelection(item.id) : (showTrash ? toggleSelection(item.id) : router.push(ROUTES.STUDY_EDITOR(item.id) as any))}
        onLongPress={() => toggleSelection(item.id)}
        activeOpacity={0.75}
      >
        <View style={styles.cardContent}>
          <TouchableOpacity onPress={() => toggleSelection(item.id)} style={[styles.cardIcon, { backgroundColor: isSelected ? colors.primary : colors.surfaceVariant }]}>
            {isSelected ? (
              <Feather name="check" size={ms(18)} color={colors.onPrimary} />
            ) : (
              <Feather name="book-open" size={ms(18)} color={colors.primary} />
            )}
          </TouchableOpacity>
          <View style={styles.cardText}>
            <BibleText style={[styles.cardTitle, { fontSize: ms(16), color: showTrash ? '#d32f2f' : colors.text }]}>{item.title}</BibleText>
            <BibleText style={[styles.cardDate, { fontSize: ms(12), color: colors.border }]}>{item.createdAt}</BibleText>
          </View>
          {!isSelectionMode && (
            <TouchableOpacity onPress={() => {
              if (showTrash) restoreMultiple([item.id]);
              else setStudyToDelete(item.id);
            }} style={[styles.deleteBtn, showTrash && { backgroundColor: colors.primaryContainer }]}>
              <Feather name={showTrash ? "corner-up-left" : "trash-2"} size={ms(18)} color={showTrash ? colors.primary : "#e74c3c"} />
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
              {showTrash ? (
                <TouchableOpacity onPress={() => {
                  restoreMultiple(Array.from(selectedIds));
                  setSelectedIds(new Set());
                }}>
                  <Feather name="corner-up-left" size={ms(20)} color={colors.onPrimary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setShareMenuVisible(true)}>
                  <Feather name="share-2" size={ms(20)} color={colors.onPrimary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setMultiDeleteVisible(true)}>
                <Feather name="trash-2" size={ms(20)} color={colors.onPrimary} />
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <BibleHeader title={showTrash ? "Lixeira" : "Estudos"} onMenuPress={() => setDrawerVisible(true)} rightContent={
          <TouchableOpacity onPress={() => setHeaderMenuVisible(true)} style={{ padding: 4 }}>
            <Feather name="more-vertical" size={ms(24)} color={colors.onPrimary} />
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

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrapper}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, paddingBottom: Math.max(32, insets.bottom + 16) }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <BibleText style={[styles.modalTitle, { fontSize: ms(20), color: colors.text }]}>Novo Estudo</BibleText>
            <TextInput
              style={[styles.input, { fontSize: ms(16), backgroundColor: colors.surfaceVariant, color: colors.text }]}
              placeholder="Título do estudo"
              placeholderTextColor={colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              {...({ outlineStyle: 'none' } as any)}
            />
            <TextInput
              style={[styles.input, styles.inputMultiline, { fontSize: ms(15), backgroundColor: colors.surfaceVariant, color: colors.text }]}
              placeholder="Descrição inicial (opcional)"
              placeholderTextColor={colors.textMuted}
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              numberOfLines={3}
              {...({ outlineStyle: 'none' } as any)}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.surfaceVariant }]} onPress={() => setModalVisible(false)}>
                <BibleText style={[styles.cancelText, { fontSize: ms(15), color: colors.text }]}>Cancelar</BibleText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, { backgroundColor: colors.primary }, !newTitle.trim() && styles.createBtnDisabled]}
                onPress={handleCreate}
              >
                <BibleText style={[styles.createText, { fontSize: ms(15), color: colors.onPrimary }]}>Criar</BibleText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BibleConfirmModal
        visible={!!studyToDelete}
        title={showTrash ? "Excluir Permanentemente" : "Mover para lixeira"}
        message={showTrash ? "Tem certeza? Esta ação não pode ser desfeita e todos os blocos do estudo serão perdidos." : "O estudo ficará na lixeira por 30 dias e depois será excluído permanentemente. Você pode recuperá-lo a qualquer momento nesse período."}
        confirmText="Excluir"
        isDanger={true}
        onCancel={() => setStudyToDelete(null)}
        onConfirm={() => {
          if (studyToDelete) {
            if (showTrash) deleteMultiplePermanently([studyToDelete]);
            else deleteStudy(studyToDelete);
          }
          setStudyToDelete(null);
        }}
      />

      <BibleConfirmModal
        visible={multiDeleteVisible}
        title={showTrash ? "Excluir estudos selecionados permanentemente" : "Excluir estudos selecionados"}
        message={showTrash ? `Deseja apagar definitivamente ${selectedIds.size} estudo(s)?` : `Deseja mover ${selectedIds.size} estudo(s) para a lixeira?`}
        confirmText="Excluir"
        isDanger={true}
        onCancel={() => setMultiDeleteVisible(false)}
        onConfirm={() => {
          if (showTrash) deleteMultiplePermanently(Array.from(selectedIds));
          else deleteMultiple(Array.from(selectedIds));
          setSelectedIds(new Set());
          setMultiDeleteVisible(false);
        }}
      />

      <BibleDrawerMenu
        visible={drawerVisible}
        activeItem="studies"
        onClose={() => setDrawerVisible(false)}
        onSelectItem={() => { }}
      />

      <Modal visible={headerMenuVisible} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setHeaderMenuVisible(false)}>
          <View style={{ position: 'absolute', top: 50 + insets.top, right: 16, backgroundColor: colors.surface, borderRadius: 12, elevation: 8, padding: 8, minWidth: 160, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}>
            <TouchableOpacity style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.surfaceVariant, flexDirection: 'row', gap: 12, alignItems: 'center' }} onPress={() => { setHeaderMenuVisible(false); setModalVisible(true); }}>
              <Feather name="file-plus" size={ms(18)} color={colors.primary} />
              <BibleText style={{ fontSize: ms(16), color: colors.text, fontWeight: '600' }}>Novo Estudo</BibleText>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' }} onPress={() => { setHeaderMenuVisible(false); setShowTrash(!showTrash); setSelectedIds(new Set()); }}>
              <Feather name={showTrash ? "book-open" : "trash"} size={ms(18)} color={colors.primary} />
              <BibleText style={{ fontSize: ms(16), color: colors.text, fontWeight: '600' }}>{showTrash ? "Ver Estudos" : "Ver Lixeira"}</BibleText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={shareMenuVisible} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={() => setShareMenuVisible(false)}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, width: '80%', gap: 16 }}>
            <BibleText style={{ fontSize: ms(18), fontWeight: '700', color: colors.text }}>Como deseja compartilhar?</BibleText>
            <TouchableOpacity style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.surfaceVariant, padding: 16, borderRadius: 12 }} onPress={() => exportPDFs(selectedIds)}>
              <Feather name="file-text" size={ms(20)} color={colors.primary} />
              <BibleText style={{ fontSize: ms(15), color: colors.text, fontWeight: '600' }}>Compartilhar em PDF</BibleText>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.surfaceVariant, padding: 16, borderRadius: 12 }} onPress={() => exportBackup(selectedIds)}>
              <Feather name="file" size={ms(20)} color={colors.primary} />
              <BibleText style={{ fontSize: ms(15), color: colors.text, fontWeight: '600' }}>Compartilhar em arquivo</BibleText>
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems: 'center', marginTop: 8 }} onPress={() => setShareMenuVisible(false)}>
              <BibleText style={{ fontSize: ms(15), color: colors.primary, fontWeight: '700' }}>Cancelar</BibleText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafa' },
  listContent: {
    padding: 16,
    paddingBottom: 100,
    flexGrow: 1
  },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontWeight: '700', color: '#555' },
  emptySubtitle: { color: '#aaa', textAlign: 'center', paddingHorizontal: 32 },
  card: {
    borderWidth: 1,
    borderColor: '#0080806e',
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
  cardIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#e6f3f3', alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontWeight: '700', color: '#222' },
  cardDesc: { color: '#666', lineHeight: 18 },
  cardDate: { color: '#bbb', marginTop: 2 },
  deleteBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: 'rgba(231, 76, 60, 0.1)' },
  modalWrapper: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 16 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontWeight: '800', color: '#222' },
  input: { backgroundColor: '#f5f5f5', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: '#333' },
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#f0f0f0', alignItems: 'center' },
  cancelText: { fontWeight: '700', color: '#666' },
  createBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: '#008080', alignItems: 'center' },
  createBtnDisabled: { opacity: 0.5 },
  createText: { fontWeight: '700', color: '#fff' },
});
