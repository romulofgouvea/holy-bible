import { FlashList } from '@shopify/flash-list';
import React, { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { LIMITS } from '../../constants/limits';
import { useResponsive } from '../../hooks/useResponsive';
import { useStudies } from '../../hooks/useStudies';
import { useTheme } from '../../hooks/useTheme';
import { SelectedVerse } from '../../models';
import { BibleIcon } from '../BibleIcon';
import { BiblePageEmpty } from '../BiblePageEmpty';
import { BibleText } from '../BibleText';
import { BiblePageModal } from './BiblePageModal';

type BibleAddToStudyModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedVerses: SelectedVerse[];
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'warning') => void;
};

export function BibleAddToStudyModal({ visible, onClose, selectedVerses, onShowToast }: BibleAddToStudyModalProps) {
  const { studies, updateStudy, createStudy } = useStudies();
  const { ms, DESIGN } = useResponsive();
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center' },
    headerIconWrap: { marginRight: ms(DESIGN.spacing.sm) },
    title: { flex: 1 },
    createBtn: { paddingVertical: ms(DESIGN.spacing.lg), borderRadius: ms(DESIGN.borderRadius.md), alignItems: 'center' },
    createText: { fontWeight: '700' },
    studyItem: {
      borderWidth: 1,
      marginBottom: ms(DESIGN.spacing.sm),
      borderRadius: ms(DESIGN.borderRadius.lg),
      overflow: 'hidden',
      elevation: 1,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: ms(DESIGN.borderRadius.xs),
    },
    studyItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: ms(DESIGN.button.padding.sm),
      paddingVertical: ms(DESIGN.button.padding.sm),
      gap: ms(DESIGN.spacing.md),
    },
    empty: { padding: ms(DESIGN.spacing.giant), alignItems: 'center' },
    input: { borderRadius: ms(DESIGN.borderRadius.md), paddingHorizontal: ms(DESIGN.spacing.lg), paddingVertical: ms(DESIGN.spacing.lg), marginBottom: ms(DESIGN.spacing.sm) },
    inputMultiline: { minHeight: ms(DESIGN.layout.settingsIconOffset), textAlignVertical: 'top' },
    createActions: { flexDirection: 'row', gap: ms(DESIGN.spacing.md) },
    cancelBtn: { flex: 1, paddingVertical: ms(DESIGN.spacing.lg), borderRadius: ms(DESIGN.borderRadius.md), alignItems: 'center' },
    cancelText: { fontWeight: '700' },
    sectionTitle: {
      fontSize: ms(DESIGN.fontSize.xs),
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
      opacity: 0.6,
      paddingBottom: ms(DESIGN.spacing.sm),
    },
  }), [ms, colors, DESIGN]);

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  React.useEffect(() => {
    if (visible) {
      setIsCreating(false);
      setNewTitle('');
    }
  }, [visible]);

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

    const versesBody = sorted.map(v => `<div class="verse-line"><span class="verse-num">${v.verse}</span> <span class="verse-text">${v.text}</span></div>`).join('');

    const hasCompare = sorted.some(v => v.compareText);
    if (hasCompare) {
      const compareVersion = sorted.find(v => v.compareVersion)?.compareVersion || '';
      const compareVersesBody = sorted.map(v => {
        if (!v.compareText) return '';
        return `<div class="verse-line"><span class="verse-num">${v.verse}</span> <span class="verse-text">${v.compareText}</span></div>`;
      }).join('');
      
      const refPrimary = `${ref} (${version})`;
      const refCompare = `${ref} (${compareVersion})`;

      return `<blockquote class="bible-verse" contenteditable="false"><div class="remove-verse-btn" contenteditable="false">×</div><div class="verse-title">${refPrimary}</div>${versesBody}</blockquote><blockquote class="bible-verse" contenteditable="false"><div class="remove-verse-btn" contenteditable="false">×</div><div class="verse-title">${refCompare}</div>${compareVersesBody}</blockquote><p><br></p>`;
    }

    ref = `${ref} (${version})`;
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
    <BiblePageModal visible={visible} onClose={onClose} fullHeight={!isCreating}
      header={<View style={styles.header}>
        <BibleIcon
          name={isCreating ? "arrow-left" : "file-plus"}
          size={ms(DESIGN.spacing.lg)}
          color={colors.primary}
          backgroundColor={colors.primary + '25'}
          style={styles.headerIconWrap}
          onPress={isCreating ? () => setIsCreating(false) : undefined}
        />
        <BibleText style={[styles.title, { color: colors.primary, fontSize: ms(DESIGN.spacing.lg), fontWeight: '800' }]}>
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
            <BibleText style={[styles.createText, { color: colors.onPrimary, fontSize: ms(DESIGN.spacing.lg) }]}>Criar e Adicionar</BibleText>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => setIsCreating(true)}
        >
          <BibleText style={[styles.createText, { color: colors.onPrimary, fontSize: ms(DESIGN.spacing.lg) }]}>Criar Novo Estudo</BibleText>
        </TouchableOpacity>
      )}
    >
      <View style={[isCreating ? undefined : styles.container, { padding: ms(DESIGN.spacing.lg) }]}>
        {isCreating ? (
          <ScrollView keyboardShouldPersistTaps="handled">
            <BibleText style={[styles.sectionTitle, { color: colors.textMuted }]}>Título do Estudo</BibleText>
            <TextInput
              style={[
                styles.input,
                { color: colors.onSurface, backgroundColor: colors.surfaceHighlight },
                Platform.select({ web: { outline: 'none' } as any, default: {} })
              ]}
              placeholder="Ex: Esperança em Meio à Provação"
              placeholderTextColor={colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              maxLength={LIMITS.STUDY_TITLE_MAX_LENGTH}
              underlineColorAndroid="transparent"
            />
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            <FlashList
              data={studies}
              keyExtractor={(item) => item.id}
              // @ts-ignore
              estimatedItemSize={ms(DESIGN.layout.settingsIconOffset)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: ms(DESIGN.spacing.md) }}
              ListEmptyComponent={
                <BiblePageEmpty
                  title="Nenhum estudo ainda"
                  description="Você ainda não tem estudos para adicionar os versículos selecionados."
                  icon="book"
                />
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.studyItem,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                    }
                  ]}
                  onPress={() => handleAddToStudy(item.id, item.content)}
                  activeOpacity={0.7}
                >
                  <View style={styles.studyItemContent}>
                    <BibleIcon
                      name="book-open"
                      color={colors.primary}
                      backgroundColor={colors.primary + '20'}
                    />
                    <View style={{ flex: 1, gap: ms(DESIGN.spacing.xs) }}>
                      <BibleText style={{ color: colors.onSurface, fontWeight: '600', fontSize: ms(DESIGN.fontSize.lg) }} numberOfLines={1}>
                        {item.title}
                      </BibleText>
                      <BibleText style={{ color: colors.textMuted, fontSize: ms(DESIGN.fontSize.md) }}>
                        {item.createdAt}
                      </BibleText>
                    </View>
                    <BibleIcon name="chevron-right" color={colors.textMuted} size={ms(DESIGN.fontSize.xl)} />
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </BiblePageModal>
  );
}
