import { BibleConfirmModal } from '@/components/BibleConfirmModal';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
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
import { BibleDrawerMenu } from '../../components/BibleDrawerMenu';
import { BibleText } from '../../components/BibleText';
import { useResponsive } from '../../hooks/use-responsive';
import { Study, useStudies } from '../../hooks/use-studies';

export default function EstudosScreen() {
  const { ms } = useResponsive();
  const router = useRouter();
  const { studies, createStudy, deleteStudy, importStudy } = useStudies();
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
    router.push(`/estudo/${id}` as any);
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

      const parsed = JSON.parse(raw) as Partial<Study>;
      if (!parsed.blocks || !parsed.title) { Alert.alert('Erro', 'Arquivo inválido'); return; }

      const id = importStudy(parsed);

      setTimeout(() => {
        router.push(`/study/${id}` as any);
      }, 100);
    } catch (err) {
      console.log('Import err', err);
      Alert.alert('Erro', 'Não foi possível importar o arquivo');
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="book" size={ms(64)} color="#d0e8e8" />
      <BibleText style={[styles.emptyTitle, { fontSize: ms(20) }]}>Nenhum estudo ainda</BibleText>
      <BibleText style={[styles.emptySubtitle, { fontSize: ms(14) }]}>
        Toque no botão + para criar seu primeiro estudo
      </BibleText>
    </View>
  );

  const renderItem = ({ item }: { item: Study }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/study/${item.id}` as any)} activeOpacity={0.75}>
      <View style={styles.cardContent}>
        <View style={styles.cardIcon}>
          <Feather name="book-open" size={ms(17)} color="#008080" />
        </View>
        <View style={styles.cardText}>
          <BibleText style={[styles.cardTitle, { fontSize: ms(14) }]}>{item.title}</BibleText>
          <BibleText style={[styles.cardDate, { fontSize: ms(10) }]}>{item.createdAt}</BibleText>
        </View>
        <TouchableOpacity onPress={() => setStudyToDelete(item.id)} style={styles.deleteBtn}>
          <Feather name="trash-2" size={ms(16)} color="#ccc" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BibleText style={[styles.headerTitle, { fontSize: ms(15) }]}>Estudos</BibleText>
        <TouchableOpacity style={styles.menuBtn} onPress={() => setDrawerVisible(true)}>
          <Feather name="menu" size={ms(22)} color="#fff" />
        </TouchableOpacity>
      </View>

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
            <BibleText style={[styles.fabActionLabel, { fontSize: ms(14) }]}>Novo Estudo</BibleText>
            <View style={styles.fabActionIcon}><Feather name="file-plus" size={ms(20)} color="#fff" /></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.fabActionItem} onPress={handleImport}>
            <BibleText style={[styles.fabActionLabel, { fontSize: ms(14) }]}>Importar JSON</BibleText>
            <View style={[styles.fabActionIcon, { backgroundColor: '#e74c3c' }]}><Feather name="upload" size={ms(20)} color="#fff" /></View>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setFabMenuVisible(!fabMenuVisible)} activeOpacity={0.85}>
        <Feather name={fabMenuVisible ? 'x' : 'plus'} size={ms(28)} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrapper}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <BibleText style={[styles.modalTitle, { fontSize: ms(20) }]}>Novo Estudo</BibleText>
            <TextInput
              style={[styles.input, { fontSize: ms(16) }]}
              placeholder="Título do estudo"
              placeholderTextColor="#aaa"
              value={newTitle}
              onChangeText={setNewTitle}
              {...({ outlineStyle: 'none' } as any)}
            />
            <TextInput
              style={[styles.input, styles.inputMultiline, { fontSize: ms(15) }]}
              placeholder="Descrição inicial (opcional)"
              placeholderTextColor="#aaa"
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              numberOfLines={3}
              {...({ outlineStyle: 'none' } as any)}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <BibleText style={[styles.cancelText, { fontSize: ms(15) }]}>Cancelar</BibleText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, !newTitle.trim() && styles.createBtnDisabled]}
                onPress={handleCreate}
              >
                <BibleText style={[styles.createText, { fontSize: ms(15) }]}>Criar</BibleText>
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
  header: {
    backgroundColor: '#008080',
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuBtn: { padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', marginLeft: 4 },
  headerTitle: { color: '#fff', fontWeight: '700', marginHorizontal: 8 },
  listContent: { padding: 10, paddingTop: 8, flexGrow: 1 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontWeight: '700', color: '#555' },
  emptySubtitle: { color: '#aaa', textAlign: 'center', paddingHorizontal: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#008080',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
  cardIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#e6f3f3', alignItems: 'center', justifyContent: 'center' },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontWeight: '700', color: '#222' },
  cardDate: { color: '#bbb', marginTop: 2 },
  deleteBtn: { padding: 6 },
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
