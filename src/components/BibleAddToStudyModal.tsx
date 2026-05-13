import { Feather } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useStudies } from '../hooks/use-studies';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleBottomSheet } from './BibleBottomSheet';
import { BibleText } from './BibleText';
import { SelectedVerse } from './BibleVerseActionSheet';

type BibleAddToStudyModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedVerses: SelectedVerse[];
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning') => void;
};

export function BibleAddToStudyModal({ visible, onClose, selectedVerses, onShowToast }: BibleAddToStudyModalProps) {
  const { studies, updateStudy, createStudy } = useStudies();
  const { ms } = useResponsive();
  const { colors } = useTheme();
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const buildVersesHtml = () => {
    if (selectedVerses.length === 0) return '';
    const sorted = [...selectedVerses].sort((a, b) => a.chapter !== b.chapter ? a.chapter - b.chapter : a.verse - b.verse);
    
    const sameChapter = sorted.every((v) => v.chapter === sorted[0].chapter);
    const bookName = sorted[0].bookName;
    const chapter = sorted[0].chapter;
    
    let ref = '';
    if (sameChapter) {
        const groups: string[] = [];
        let start = sorted[0].verse;
        let end = sorted[0].verse;
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].verse === end + 1) {
            end = sorted[i].verse;
          } else {
            groups.push(start === end ? `${start}` : `${start}-${end}`);
            start = sorted[i].verse;
            end = sorted[i].verse;
          }
        }
        groups.push(start === end ? `${start}` : `${start}-${end}`);
        ref = `${bookName} ${chapter}:${groups.join(', ')}`;
    } else {
        ref = `${bookName} ${sorted[0].chapter}:${sorted[0].verse}–${sorted[sorted.length - 1].chapter}:${sorted[sorted.length - 1].verse}`;
    }

    const version = sorted[0].version;
    ref = `${ref} (${version})`;

    const versesBody = sorted.map(v => `<div class="verse-line"><span class="verse-num">${v.verse}</span> <span class="verse-text">${v.text}</span></div>`).join('');
    
    return `<p><br></p><blockquote class="bible-verse"><div class="remove-verse-btn" contenteditable="false">×</div><b>${ref}</b>${versesBody}</blockquote><p><br></p>`;
  };

  const handleAddToStudy = (studyId: string, currentContent: string) => {
    const html = buildVersesHtml();
    updateStudy(studyId, currentContent + html);
    onShowToast?.('Versículos adicionados ao estudo', 'success');
    onClose();
  };

  const handleCreateAndAdd = () => {
    if (!newTitle.trim()) return;
    const html = buildVersesHtml();
    createStudy(newTitle.trim(), html);
    onShowToast?.('Estudo criado com os versículos', 'success');
    setIsCreating(false);
    setNewTitle('');
    onClose();
  };

  return (
    <BibleBottomSheet visible={visible} onClose={onClose}>
      <View style={styles.container} testID="bible-add-to-study-modal">
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + '25' }]}>
            <Feather name="plus-circle" size={ms(16)} color={colors.primary} />
          </View>
          <BibleText style={[styles.title, { color: colors.primary, fontSize: ms(16), fontWeight: '800' }]}>
            {isCreating ? 'Novo Estudo' : 'Adicionar ao Estudo'}
          </BibleText>
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceHighlight }]}>
            <Feather name="x" size={ms(14)} color={colors.error} />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {isCreating ? (
          <View style={styles.createArea}>
            <TextInput
              style={[styles.input, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surfaceHighlight }]}
              placeholder="Título do estudo..."
              placeholderTextColor={colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
            />
            <View style={styles.createActions}>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: colors.surfaceHighlight }]} 
                onPress={() => setIsCreating(false)}
              >
                <BibleText style={{ color: colors.onSurface, fontWeight: '600' }}>Cancelar</BibleText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.btn, { backgroundColor: colors.primary }]} 
                onPress={handleCreateAndAdd}
              >
                <BibleText style={{ color: colors.onPrimary, fontWeight: '700' }}>Criar e Adicionar</BibleText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <TouchableOpacity 
              style={[styles.createToggle, { borderColor: colors.primary + '30', backgroundColor: colors.primary + '10' }]}
              onPress={() => setIsCreating(true)}
            >
              <Feather name="plus" size={ms(18)} color={colors.primary} />
              <BibleText style={{ color: colors.primary, fontWeight: '700', marginLeft: 8 }}>Criar novo estudo</BibleText>
            </TouchableOpacity>

            <FlashList
              data={studies}
              keyExtractor={(item) => item.id}
              // @ts-ignore
              estimatedItemSize={60}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <BibleText style={{ color: colors.textMuted, textAlign: 'center' }}>Você ainda não tem estudos ativos.</BibleText>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.studyItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleAddToStudy(item.id, item.content)}
                >
                  <View style={[styles.studyIcon, { backgroundColor: colors.surfaceHighlight }]}>
                    <Feather name="book" size={ms(16)} color={colors.onSurface} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <BibleText style={{ color: colors.onSurface, fontWeight: '600', fontSize: ms(15) }} numberOfLines={1}>
                      {item.title}
                    </BibleText>
                    <BibleText style={{ color: colors.textMuted, fontSize: ms(12) }}>
                      {item.createdAt}
                    </BibleText>
                  </View>
                  <Feather name="chevron-right" size={ms(16)} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </BibleBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, minHeight: 300 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  iconWrap: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  title: { flex: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, marginVertical: 12 },
  createToggle: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16, borderStyle: 'dashed' },
  studyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  studyIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  empty: { padding: 40, alignItems: 'center' },
  createArea: { gap: 12 },
  input: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  createActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
