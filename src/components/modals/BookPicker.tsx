import { Feather } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Book } from '../../data';
import { useResponsive } from '../../hooks/use-responsive';
import { useTheme } from '../../hooks/use-theme';
import { BibleText } from '../BibleText';

interface BookPickerProps {
  books: Book[];
  onSelect: (bookName: string) => void;
  onClose: () => void;
}

export function BookPicker({ books, onSelect, onClose }: BookPickerProps) {
  const { colors } = useTheme();
  const { ms } = useResponsive();
  const [search, setSearch] = useState('');

  const filteredBooks = books.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.abbrev.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container} testID="book-picker-modal">
      <View style={[styles.header, { borderBottomColor: colors.border }]} testID="book-picker-header">
        <BibleText style={[styles.title, { fontSize: ms(16), color: colors.onBackground }]} testID="book-picker-title">
          Livros
        </BibleText>
        <TouchableOpacity onPress={onClose} style={[styles.iconBtn, { backgroundColor: colors.error }]} testID="book-picker-close-btn">
          <Feather name="x" size={ms(14)} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.surfaceHighlight }]}>
        <Feather name="search" size={ms(16)} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.onBackground, fontSize: ms(14) }]}
          placeholder="Pesquisar livro..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={{ flex: 1, minHeight: 200 }}>
        <FlashList
          data={filteredBooks}
          keyExtractor={item => item.abbrev}
          numColumns={2}
          // @ts-ignore
          estimatedItemSize={50}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.item, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}
              onPress={() => onSelect(item.name)}
            >
              <BibleText style={[styles.itemText, { fontSize: ms(14), color: colors.onBackground }]}>
                {item.name}
              </BibleText>
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
    marginBottom: 8,
  },
  title: {
    fontWeight: '800',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    gap: 8,
  },
  item: {
    flex: 1,
    height: 44,
    margin: 4,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  itemText: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
