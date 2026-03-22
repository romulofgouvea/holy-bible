import { BibleConfirmModal } from '@/components/BibleConfirmModal';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
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
  const { studies, createStudy, deleteStudy, importBulk } = useStudies();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [fabMenuVisible, setFabMenuVisible] = useState(false);
  const [studyToDelete, setStudyToDelete] = useState<string | null>(null);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const id = createStudy(newTitle.trim(), newDescription.trim());
    setNewTitle('');
    setNewDescription('');
    setModalVisible(false);
    router.push(ROUTES.STUDY_EDITOR(id) as any);
  };

  const handleBackup = async () => {
    setFabMenuVisible(false);
    try {
      if (studies.length === 0) {
        Alert.alert('Aviso', 'Não há estudos para exportar.');
        return;
      }
      const json = JSON.stringify(studies, null, 2);
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `backup_estudos_biblia_${new Date().getTime()}.json`; a.click();
      } else {
        const path = `${(FileSystem as any).documentDirectory}backup_estudos_${new Date().getTime()}.json`;
        await FileSystem.writeAsStringAsync(path, json);
        await Sharing.shareAsync(path, { mimeType: 'application/json' });
      }
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível criar o arquivo de backup.');
    }
  };

  const handleImport = async () => {
    setFabMenuVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;

      let raw = '';
      if (Platform.OS === 'web' && (result.assets[0] as any).file) {
        raw = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText((result.assets[0] as any).file);
        });
      } else if (Platform.OS === 'web') {
        raw = await fetch(result.assets[0].uri).then(r => r.text());
      } else {
        raw = await FileSystem.readAsStringAsync(result.assets[0].uri);
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        Alert.alert('Erro', 'Formato de arquivo inválido. É esperado um backup de múltiplos estudos (Array). Se você está tentando importar um único estudo antigo, crie um novo e cole os dados.');
        return;
      }

      const importedCount = importBulk(parsed);
      Alert.alert(
        'Restauração Concluída',
        `${importedCount} estudo(s) restaurado(s) com sucesso.\n\n(${parsed.length - importedCount} ignorados pois já existem no app.)`
      );
    } catch (err) {
      console.log('Import err', err);
      Alert.alert('Erro', 'Não foi possível tratar o arquivo de restauração.');
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="book" size={ms(64)} color={colors.surfaceVariant} />
      <BibleText style={[styles.emptyTitle, { fontSize: ms(20), color: colors.text }]}>Nenhum estudo ainda</BibleText>
      <BibleText style={[styles.emptySubtitle, { fontSize: ms(14), color: colors.textMuted }]}>
        Toque no botão + para criar seu primeiro estudo
      </BibleText>
    </View>
  );

  const renderItem = ({ item }: { item: Study }) => {
    const rawText = (item.content || '').replace(/<[^>]+>/g, ' ').trim();
    const firstPara = rawText.length > 80 ? rawText.substring(0, 80) + '...' : rawText;
    return (
      <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push(ROUTES.STUDY_EDITOR(item.id) as any)} activeOpacity={0.75}>
        <View style={styles.cardContent}>
          <View style={[styles.cardIcon, { backgroundColor: colors.surfaceVariant }]}>
            <Feather name="book-open" size={ms(18)} color={colors.primary} />
          </View>
          <View style={styles.cardText}>
            <BibleText style={[styles.cardTitle, { fontSize: ms(16), color: colors.text }]}>{item.title}</BibleText>
            <BibleText style={[styles.cardDate, { fontSize: ms(12), color: colors.border }]}>{item.createdAt}</BibleText>
          </View>
          <TouchableOpacity onPress={() => setStudyToDelete(item.id)} style={[styles.deleteBtn]}>
            <Feather name="trash-2" size={ms(20)} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BibleHeader title="Estudos" onMenuPress={() => setDrawerVisible(true)} />

      <FlatList
        data={studies}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {fabMenuVisible && (
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setFabMenuVisible(false)}>
          <View style={styles.fabMenuBackdrop} />
        </TouchableOpacity>
      )}

      {fabMenuVisible && (
        <View style={styles.fabActions}>
          <TouchableOpacity style={styles.fabActionItem} onPress={() => { setFabMenuVisible(false); setModalVisible(true); }}>
            <BibleText style={[styles.fabActionLabel, { fontSize: ms(14), color: colors.text, backgroundColor: colors.surface }]}>Novo Estudo</BibleText>
            <View style={[styles.fabActionIcon, { backgroundColor: colors.primary }]}><Feather name="file-plus" size={ms(20)} color={colors.onPrimary} /></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.fabActionItem} onPress={handleBackup}>
            <BibleText style={[styles.fabActionLabel, { fontSize: ms(14), color: colors.text, backgroundColor: colors.surface }]}>Fazer Bkp</BibleText>
            <View style={[styles.fabActionIcon, { backgroundColor: '#3498db' }]}><Feather name="download" size={ms(20)} color="#fff" /></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.fabActionItem} onPress={handleImport}>
            <BibleText style={[styles.fabActionLabel, { fontSize: ms(14), color: colors.text, backgroundColor: colors.surface }]}>Restaurar Bkp</BibleText>
            <View style={[styles.fabActionIcon, { backgroundColor: '#e74c3c' }]}><Feather name="upload" size={ms(20)} color="#fff" /></View>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setFabMenuVisible(!fabMenuVisible)} activeOpacity={0.85}>
        <Feather name={fabMenuVisible ? 'x' : 'plus'} size={ms(28)} color={colors.onPrimary} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrapper}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
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
        title="Excluir estudo"
        message="Tem certeza? Esta ação não pode ser desfeita e todos os blocos do estudo serão perdidos."
        confirmText="Excluir"
        onCancel={() => setStudyToDelete(null)}
        onConfirm={() => {
          if (studyToDelete) deleteStudy(studyToDelete);
          setStudyToDelete(null);
        }}
      />

      <BibleDrawerMenu
        visible={drawerVisible}
        activeItem="studies"
        onClose={() => setDrawerVisible(false)}
        onSelectItem={() => { }}
      />
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
  fabMenuBackdrop: { flex: 1, backgroundColor: 'rgba(255,255,255,0.8)' },
  fabActions: { position: 'absolute', bottom: 100, right: 24, alignItems: 'flex-end', gap: 16 },
  fabActionItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fabActionLabel: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, color: '#333', fontWeight: '700', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  fabActionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#008080', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6 },
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#008080', alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#008080',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
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
