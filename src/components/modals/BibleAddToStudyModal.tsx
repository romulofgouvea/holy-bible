import { FlashList } from '@shopify/flash-list';
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useResponsive } from '../../hooks/use-responsive';
import { useStudies } from '../../hooks/use-studies';
import { useTheme } from '../../hooks/use-theme';
import { BibleBottomSheet } from '../BibleBottomSheet';
import { BibleIcon } from '../BibleIcon';
import { BibleText } from '../BibleText';
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

    return `<blockquote class="bible-verse" contenteditable="false"><div class="remove-verse-btn" contenteditable="false">×</div><div class="verse-title">${ref}</div>${versesBody}</blockquote><p><br></p>`;
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
    <BibleBottomSheet visible={visible} onClose={onClose}
      resizable={true}
      header={<View style={styles.header}>
        <BibleIcon
          name={isCreating ? "arrow-left" : "plus-circle"}
          size={ms(16)}
          color={colors.primary}
          backgroundColor={colors.primary + '25'}
          style={styles.headerIconWrap}
          onPress={isCreating ? () => setIsCreating(false) : undefined}
        />
        <BibleText style={[styles.title, { color: colors.primary, fontSize: ms(16), fontWeight: '800' }]}>
          {isCreating ? 'Novo Estudo' : 'Adicionar ao Estudo'}
        </BibleText>
        <BibleIcon
          name="x"
          color={colors.error}
          backgroundColor={colors.error + '20'}
          onPress={onClose}
          style={{ marginLeft: 'auto' }}
        />
      </View>}
      footer={isCreating ? (
        <View style={styles.createActions}>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: colors.primary, flex: 1.5 }]}
            onPress={handleCreateAndAdd}
          >
            <BibleText style={[styles.createText, { color: colors.onPrimary, fontSize: ms(16) }]}>Criar e Adicionar</BibleText>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => setIsCreating(true)}
        >
          <BibleText style={[styles.createText, { color: colors.onPrimary, fontSize: ms(16) }]}>Criar Novo Estudo</BibleText>
        </TouchableOpacity>
      )}
    >
      <View style={[styles.container]}>
        {isCreating ? (
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            <TextInput
              style={[
                styles.input, 
                { color: colors.onSurface, backgroundColor: colors.surfaceHighlight },
                Platform.select({ web: { outline: 'none' } as any, default: {} })
              ]}
              placeholder="Título do estudo..."
              placeholderTextColor={colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              underlineColorAndroid="transparent"
            />
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            <FlashList
              data={studies}
              keyExtractor={(item) => item.id}
              // @ts-ignore
              estimatedItemSize={60}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
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
                  <BibleIcon name="book" color={colors.onSurface} backgroundColor={colors.surfaceHighlight} />
                  <View style={{ flex: 1 }}>
                    <BibleText style={{ color: colors.onSurface, fontWeight: '600', fontSize: ms(15) }} numberOfLines={1}>
                      {item.title}
                    </BibleText>
                    <BibleText style={{ color: colors.textMuted, fontSize: ms(12) }}>
                      {item.createdAt}
                    </BibleText>
                  </View>
                  <BibleIcon name="chevron-right" color={colors.textMuted} />
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
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  headerIconWrap: { marginRight: 8 },
  title: { flex: 1 },
  createBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  createText: { fontWeight: '700' },
  studyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  empty: { padding: 40, alignItems: 'center' },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginBottom: 8 },
  createActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  cancelText: { fontWeight: '700' },
});
