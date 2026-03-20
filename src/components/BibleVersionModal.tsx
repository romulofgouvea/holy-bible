import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { ALIASES, BibleVersionInfo } from '../data';
import { useResponsive } from '../hooks/use-responsive';
import { BibleText } from './BibleText';

type BibleVersionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (version: BibleVersionInfo) => void;
};

export function BibleVersionModal({ visible, onClose, onSelect }: BibleVersionModalProps) {
  const { ms, height } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');

  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredVersions = useMemo(() => {
    const query = normalize(searchQuery.trim());
    if (!query) return ALIASES;
    return ALIASES.filter((item) => normalize(item.name).includes(query) || normalize(item.sigla).includes(query));
  }, [searchQuery]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <TouchableOpacity activeOpacity={1} style={styles.modalBackdrop} onPress={onClose}>
        <TouchableWithoutFeedback>
          <View style={[styles.bottomSheet, { height: height * 0.85 }]}>
            <View style={styles.header}>
              <View style={styles.headerIconWrap}>
                <Feather name="book-open" size={ms(18)} color="#008080" />
              </View>
              <BibleText style={[styles.title, { fontSize: ms(18) }]}>Bíblias</BibleText>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={ms(22)} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Feather name="search" size={ms(18)} color="#008080" style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { fontSize: ms(14) }]}
                placeholder="Pesquisar tradução..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                underlineColorAndroid="transparent"
              />
            </View>

            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {filteredVersions.map((item) => (
                <TouchableOpacity
                  key={item.sigla}
                  activeOpacity={0.7}
                  style={styles.card}
                  onPress={() => {
                    onSelect(item);
                    setSearchQuery('');
                  }}
                >
                  <BibleText style={[styles.cardTitle, { fontSize: ms(14) }]}>{item.name}</BibleText>
                  <View style={styles.pill}>
                    <BibleText style={[styles.pillText, { fontSize: ms(11) }]}>{item.sigla}</BibleText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.footer}>
              <View style={styles.countPill}>
                <BibleText style={styles.countNumber}>{filteredVersions.length}</BibleText>
                <BibleText style={styles.countText}> {filteredVersions.length === 1 ? 'tradução encontrada' : 'traduções encontradas'}</BibleText>
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
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#0080806e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardTitle: {
    flex: 1,
    fontWeight: '700',
    color: '#333',
    marginRight: 12,
  },
  pill: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0080806e',
  },
  pillText: {
    fontWeight: '800',
    color: '#0080806e',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
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
  }
});
