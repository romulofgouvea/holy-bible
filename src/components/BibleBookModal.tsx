import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Book } from '../data';
import { useResponsive } from '../hooks/use-responsive';
import { BibleGridBlock } from './BibleGridBlock';
import { BibleListCard } from './BibleListCard';
import { BibleText } from './BibleText';
import { useTheme } from '../hooks/use-theme';

type BibleBookModalProps = {
  visible: boolean;
  onClose: () => void;
  books: Book[];
  versionSigla?: string;
  onVersionPress?: () => void;
  onSelect: (bookName: string) => void;
};

export function BibleBookModal({ visible, onClose, books, versionSigla, onVersionPress, onSelect }: BibleBookModalProps) {
  const { ms, height, width } = useResponsive();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredBooks = useMemo(() => {
    const query = normalize(searchQuery.trim());
    if (!query) return books;
    return books.filter((item) => normalize(item.name || '').includes(query) || normalize(item.abbrev || '').includes(query));
  }, [searchQuery, books]);

  if (!visible) return null;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {versionSigla && onVersionPress ? (
                  <TouchableOpacity activeOpacity={0.7} style={[styles.versionPill, { backgroundColor: colors.primaryContainer }]} onPress={onVersionPress}>
                    <BibleText style={[styles.versionPillText, { fontSize: ms(13), color: colors.primary }]}>{versionSigla}</BibleText>
                    <Feather name="chevron-down" size={ms(14)} color={colors.primary} style={{ marginLeft: 2 }} />
                  </TouchableOpacity>
                ) : (
                  <>
                    <View style={[styles.headerIconWrap, { backgroundColor: colors.primaryContainer }]}>
                      <Feather name="book" size={ms(18)} color={colors.primary} />
                    </View>
                    <BibleText style={[styles.title, { flex: 0, flexShrink: 1, fontSize: ms(18), color: colors.primary }]}>Livros</BibleText>
                  </>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setIsSearchVisible(!isSearchVisible)} style={[styles.searchToggleBtn, { backgroundColor: colors.surfaceVariant }]}>
                  <Feather name="search" size={ms(18)} color={isSearchVisible ? colors.primary : colors.textMuted} />
                </TouchableOpacity>

                <View style={[styles.viewToggles, { backgroundColor: colors.surfaceVariant }]}>
                  <TouchableOpacity onPress={() => setViewMode('grid')} style={[styles.toggleBtn, viewMode === 'grid' && { backgroundColor: colors.surface }]}>
                    <Feather name="grid" size={ms(16)} color={viewMode === 'grid' ? colors.primary : colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setViewMode('list')} style={[styles.toggleBtn, viewMode === 'list' && { backgroundColor: colors.surface }]}>
                    <Feather name="list" size={ms(16)} color={viewMode === 'list' ? colors.primary : colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}>
                  <Feather name="x" size={ms(18)} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </View>

            {isSearchVisible && (
              <View style={[styles.searchContainer, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
                <Feather name="search" size={ms(18)} color={colors.primary} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { fontSize: ms(14), color: colors.text }]}
                  placeholder="Pesquisar livro..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  underlineColorAndroid="transparent"
                />
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} bounces={true} overScrollMode="always" keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
              {viewMode === 'list' ? (
                filteredBooks.map((item, index) => (
                  <BibleListCard
                    key={`${item.abbrev || item.name}-${index}`}
                    title={item.name}
                    pillText={item.abbrev}
                    onPress={() => {
                      onSelect(item.name || item.abbrev || '');
                      setSearchQuery('');
                    }}
                  />
                ))
              ) : (
                <View style={styles.gridContainer}>
                  {filteredBooks.map((item, index) => {
                    const availableWidth = width - 32;
                    const numCols = Math.max(4, Math.floor(availableWidth / ms(72)));
                    const itemWidth = ((availableWidth - (numCols - 1) * 8) / numCols) - 0.01;
                    return (
                      <BibleGridBlock
                        key={`grid-${item.abbrev || item.name}-${index}`}
                        title={item.abbrev || item.name.substring(0, 3)}
                        exactWidth={itemWidth}
                        onPress={() => {
                          onSelect(item.name || item.abbrev || '');
                          setSearchQuery('');
                        }}
                      />
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.footer}>
        <View style={[styles.countPill, { backgroundColor: colors.surfaceVariant, borderColor: colors.primary }]}>
          <BibleText style={[styles.countNumber, { color: colors.primary }]}>{filteredBooks.length}</BibleText>
          <BibleText style={[styles.countText, { color: colors.primary }]}> {filteredBooks.length === 1 ? 'livro' : 'livros'}</BibleText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 8,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, alignSelf: 'center', marginBottom: 4, marginTop: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 8 },
  headerIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#e6f3f3', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  title: { flex: 1, fontWeight: '700', color: '#008080' },
  versionPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e6f3f3', paddingHorizontal: 10, height: 42, borderRadius: 12, marginRight: 12 },
  versionPillText: { color: '#008080', fontWeight: '800' },
  searchToggleBtn: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, marginLeft: 12 },
  closeBtn: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fdeded', borderRadius: 8, marginLeft: 12 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, marginHorizontal: 8, paddingHorizontal: 12, marginTop: 8, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: '100%', color: '#333', ...({ outlineStyle: 'none' } as any) },
  list: { padding: 8, flexGrow: 1, gap: 8 },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 },
  footer: { paddingTop: 4 },
  countPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#fff', borderWidth: 1, borderColor: '#0080806e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  countNumber: { fontWeight: '800', color: '#666', fontSize: 13 },
  countText: { color: '#666', fontWeight: '600', fontSize: 13 },
  viewToggles: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, padding: 4, gap: 4, marginLeft: 12, height: 42 },
  toggleBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
  toggleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', padding: 8, marginBottom: 8 },
});
