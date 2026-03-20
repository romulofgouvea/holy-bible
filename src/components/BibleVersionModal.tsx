import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { ALIASES, BibleVersionInfo } from '../data';
import { useResponsive } from '../hooks/use-responsive';
import { BibleGridBlock } from './BibleGridBlock';
import { BibleListCard } from './BibleListCard';
import { BibleText } from './BibleText';

type BibleVersionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (version: BibleVersionInfo) => void;
};

export function BibleVersionModal({ visible, onClose, onSelect }: BibleVersionModalProps) {
  const { ms, height, width } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredVersions = useMemo(() => {
    const query = normalize(searchQuery.trim());
    if (!query) return ALIASES;
    return ALIASES.filter((item) => normalize(item.name).includes(query) || normalize(item.sigla).includes(query));
  }, [searchQuery]);

  const handleSelect = (item: BibleVersionInfo) => {
    onSelect(item);
    setSearchQuery('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={[styles.bottomSheet, { height: height * 0.85 }]}>
            <View style={styles.header}>
              <View style={styles.headerIconWrap}>
                <Feather name="book-open" size={ms(18)} color="#008080" />
              </View>
              <BibleText style={[styles.title, { fontSize: ms(18) }]}>Versões</BibleText>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={ms(22)} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Feather name="search" size={ms(18)} color="#008080" style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { fontSize: ms(14) }]}
                placeholder="Pesquisar versão..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                underlineColorAndroid="transparent"
              />
            </View>

            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {viewMode === 'list' ? (
                filteredVersions.map((item) => (
                  <BibleListCard
                    key={item.sigla}
                    title={item.name}
                    pillText={item.sigla}
                    onPress={() => handleSelect(item)}
                  />
                ))
              ) : (
                <View style={styles.gridContainer}>
                  {filteredVersions.map((item) => {
                    const numCols = width > 600 ? 5 : 4;
                    const itemWidthPercentage = (100 / numCols) - 2;
                    return (
                      <BibleGridBlock
                        key={item.sigla}
                        title={item.sigla}
                        widthPercentage={itemWidthPercentage}
                        onPress={() => handleSelect(item)}
                      />
                    );
                  })}
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.countPill}>
                <BibleText style={styles.countNumber}>{filteredVersions.length}</BibleText>
                <BibleText style={styles.countText}> {filteredVersions.length === 1 ? 'versão' : 'versões'}</BibleText>
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
  list: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1, gap: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  countPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e6f3f3', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  countNumber: { fontWeight: '800', color: '#008080', marginRight: 4 },
  countText: { color: '#008080', fontWeight: '500' },
  viewToggles: { flexDirection: 'row', backgroundColor: '#f5f5f5', borderRadius: 8, padding: 6, gap: 4 },
  toggleBtn: { padding: 6, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
});
