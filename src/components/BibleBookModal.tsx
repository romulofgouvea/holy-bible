import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Book } from '../data';
import { useResponsive } from '../hooks/use-responsive';
import { BibleGridBlock } from './BibleGridBlock';
import { BibleListCard } from './BibleListCard';
import { BibleText } from './BibleText';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredBooks = useMemo(() => {
    const query = normalize(searchQuery.trim());
    if (!query) return books;
    return books.filter((item) => normalize(item.name || '').includes(query) || normalize(item.abbrev || '').includes(query));
  }, [searchQuery, books]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={[styles.bottomSheet, { height: height * 0.85 }]}>
            <View style={styles.header}>
              <View style={styles.headerIconWrap}>
                <Feather name="book" size={ms(18)} color="#008080" />
              </View>
              <BibleText style={[styles.title, { fontSize: ms(18) }]}>Livros</BibleText>
              {versionSigla && onVersionPress && (
                <TouchableOpacity activeOpacity={0.7} style={styles.versionPill} onPress={onVersionPress}>
                  <BibleText style={[styles.versionPillText, { fontSize: ms(13) }]}>{versionSigla}</BibleText>
                  <Feather name="chevron-down" size={ms(14)} color="#008080" style={{ marginLeft: 2 }} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={ms(22)} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Feather name="search" size={ms(18)} color="#008080" style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { fontSize: ms(14) }]}
                placeholder="Pesquisar livro..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                underlineColorAndroid="transparent"
              />
            </View>

            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
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
                    const numCols = width > 600 ? 7 : 5;
                    const itemWidthPercentage = (100 / numCols) - 2;
                    return (
                      <BibleGridBlock
                        key={`grid-${item.abbrev || item.name}-${index}`}
                        title={item.abbrev || item.name.substring(0, 3)}
                        widthPercentage={itemWidthPercentage}
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

            <View style={styles.footer}>
              <View style={styles.countPill}>
                <BibleText style={styles.countNumber}>{filteredBooks.length}</BibleText>
                <BibleText style={styles.countText}> {filteredBooks.length === 1 ? 'livro' : 'livros'}</BibleText>
              </View>
              <View style={styles.viewToggles}>
                <TouchableOpacity onPress={() => setViewMode('grid')} style={[styles.toggleBtn, viewMode === 'grid' && styles.toggleBtnActive]}>
                  <Feather name="grid" size={ms(18)} color={viewMode === 'grid' ? '#008080' : '#888'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setViewMode('list')} style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}>
                  <Feather name="list" size={ms(18)} color={viewMode === 'list' ? '#008080' : '#888'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
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
    paddingTop: 16,
    paddingBottom: 24,
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e6f3f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontWeight: '700',
    color: '#008080',
  },
  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f3f3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 12,
  },
  versionPillText: {
    color: '#008080',
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#333',
    ...({ outlineStyle: 'none' } as any),
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#0080806e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countNumber: {
    fontWeight: '800',
    color: '#666',
    fontSize: 13,
  },
  countText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
  },
  viewToggles: { flexDirection: 'row', backgroundColor: '#f5f5f5', borderRadius: 8, padding: 6, gap: 4 },
  toggleBtn: { padding: 6, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
  }
});
