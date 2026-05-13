import { Feather } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { availableVersions } from '../../data';
import { useResponsive } from '../../hooks/use-responsive';
import { useTheme } from '../../hooks/use-theme';
import { BibleText } from '../BibleText';

interface VersionPickerProps {
  onSelect: (sigla: string) => void;
  onClose: () => void;
}

export function VersionPicker({ onSelect, onClose }: VersionPickerProps) {
  const { colors } = useTheme();
  const { ms } = useResponsive();
  const [search, setSearch] = useState('');

  const versions = availableVersions.map(v => ({
    sigla: v,
    nome: v === 'NVI' ? 'Nova Versão Internacional' : v === 'ARA' ? 'Almeida Revista e Atualizada' : 'Nova Almeida Atualizada'
  })).filter(v =>
    v.sigla.toLowerCase().includes(search.toLowerCase()) ||
    v.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container} testID="version-picker-modal">
      <View style={[styles.header, { borderBottomColor: colors.border }]} testID="version-picker-header">
        <BibleText style={[styles.title, { fontSize: ms(16), color: colors.onBackground }]} testID="version-picker-title">
          Versão da Bíblia
        </BibleText>
        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.error }]} testID="version-picker-close-btn">
          <Feather name="x" size={ms(14)} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.surfaceHighlight }]}>
        <Feather name="search" size={ms(16)} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.onBackground, fontSize: ms(14) }]}
          placeholder="Pesquisar versão..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={{ flex: 1, minHeight: 200 }}>
        <FlashList
          data={versions}
          keyExtractor={item => item.sigla}
          // @ts-ignore
          estimatedItemSize={60}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.item, { borderBottomColor: colors.border }]}
              onPress={() => onSelect(item.sigla)}
            >
              <View style={styles.itemText}>
                <BibleText style={[styles.sigla, { fontSize: ms(15), color: colors.primary }]}>{item.sigla}</BibleText>
                <BibleText style={[styles.nome, { fontSize: ms(13), color: colors.onBackground }]}>{item.nome}</BibleText>
              </View>
              <Feather name="chevron-right" size={ms(16)} color={colors.border} />
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: '80%',
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '800',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
  },
  list: {
    paddingBottom: 32,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemText: {
    flex: 1,
  },
  sigla: {
    fontWeight: '800',
  },
  nome: {
    marginTop: 2,
    opacity: 0.8,
  },
});
