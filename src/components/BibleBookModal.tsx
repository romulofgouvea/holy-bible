import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { STORAGE_KEYS } from '../constants/storage';
import { Book } from '../data';
import bibleBooks from '../data/bible-books.json';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
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
  currentBookAbbrev?: string;
};

type BookEntry = { abbrev: string; name: string };
type GroupEntry = { group: string; label: string; books: BookEntry[] };

const ALL_OT_ABBREVS = new Set(
  (bibleBooks.oldTestament as GroupEntry[]).flatMap(g => g.books.map(b => b.abbrev))
);

const ABBREV_TO_NAME: Record<string, string> = {};
[...(bibleBooks.oldTestament as GroupEntry[]), ...(bibleBooks.newTestament as GroupEntry[])].forEach(g => {
  g.books.forEach(b => {
    ABBREV_TO_NAME[b.abbrev] = b.name;
  });
});

export function BibleBookModal({ visible, onClose, books, versionSigla, onVersionPress, onSelect, currentBookAbbrev }: BibleBookModalProps) {
  const { ms, height, width } = useResponsive();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  const scrollViewRef = React.useRef<ScrollView>(null);
  const hasScrolledRef = React.useRef(false);

  React.useEffect(() => {
    if (visible) {
      setSearchQuery('');
      hasScrolledRef.current = false;
      AsyncStorage.getItem(STORAGE_KEYS.VIEW_MODE_BOOK).then(val => {
        if (val === 'list' || val === 'grid') setViewMode(val);
      }).catch(() => { });
    }
  }, [visible]);

  const handleSetViewMode = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    AsyncStorage.setItem(STORAGE_KEYS.VIEW_MODE_BOOK, mode).catch(() => { });
  };

  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const enrichedBooks = useMemo(() => books.map(b => ({
    ...b,
    name: ABBREV_TO_NAME[b.abbrev] || b.name,
  })), [books]);

  const filteredBooks = useMemo(() => {
    const query = normalize(searchQuery.trim());
    if (!query) return enrichedBooks;
    return enrichedBooks.filter((item) =>
      normalize(item.name || '').includes(query) || normalize(item.abbrev || '').includes(query)
    );
  }, [searchQuery, enrichedBooks]);

  const groupedSections = useMemo(() => {
    const query = normalize(searchQuery.trim());

    const buildSection = (testament: 'AT' | 'NT', groups: GroupEntry[]) =>
      groups.map(group => {
        const filtered = group.books.filter(b => {
          const realBook = enrichedBooks.find(rb => rb.abbrev === b.abbrev);
          if (!realBook) return false;
          if (!query) return true;
          return normalize(realBook.name || '').includes(query) || normalize(realBook.abbrev || '').includes(query);
        }).map(b => enrichedBooks.find(rb => rb.abbrev === b.abbrev)!).filter(Boolean);
        return { testament, label: group.label, books: filtered };
      }).filter(g => g.books.length > 0);

    return [
      ...buildSection('AT', bibleBooks.oldTestament as GroupEntry[]),
      ...buildSection('NT', bibleBooks.newTestament as GroupEntry[]),
    ];
  }, [searchQuery, enrichedBooks]);

  const availableWidth = width - 32;
  const numCols = Math.max(4, Math.floor(availableWidth / ms(72)));
  const itemWidth = ((availableWidth - (numCols - 1) * 8) / numCols) - 0.01;

  if (!visible) return null;

  const testamentHeaderOT = (
    <View style={[styles.testamentHeader, { backgroundColor: colors.surfaceHighlight, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <BibleText style={[styles.testamentTitle, { color: colors.onSurface, fontSize: ms(12), fontWeight: '800', opacity: 0.6 }]}>
        ANTIGO TESTAMENTO
      </BibleText>
    </View>
  );

  const testamentHeaderNT = (
    <View style={[styles.testamentHeader, { backgroundColor: colors.surfaceHighlight, borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: ms(16) }]}>
      <BibleText style={[styles.testamentTitle, { color: colors.onSurface, fontSize: ms(12), fontWeight: '800', opacity: 0.6 }]}>
        NOVO TESTAMENTO
      </BibleText>
    </View>
  );

  let lastTestament: string | null = null;

  return (
    <View style={styles.container} testID="bible-book-modal">
      <View style={styles.header} testID="bible-book-header">
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {versionSigla && onVersionPress ? (
            <TouchableOpacity activeOpacity={0.7} style={[styles.versionPill, { backgroundColor: colors.primary + '15' }]} onPress={onVersionPress} testID="bible-book-version-pill">
              <BibleText style={[styles.versionPillText, { fontSize: ms(13), color: colors.primary, fontWeight: '700' }]}>{versionSigla}</BibleText>
              <Feather name="chevron-down" size={ms(16)} color={colors.primary} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          ) : (
            <>
              <View style={[styles.iconBtn, styles.headerIconWrap, { backgroundColor: colors.primary + '15' }]}>
                <Feather name="book" size={ms(16)} color={colors.primary} />
              </View>
              <BibleText style={[styles.title, { flex: 0, flexShrink: 1, fontSize: ms(18), color: colors.primary, fontWeight: '800' }]} testID="bible-book-title">Livros</BibleText>
            </>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setIsSearchVisible(!isSearchVisible)} style={[styles.iconBtn, styles.headerActionSpacing, { backgroundColor: colors.surfaceHighlight }]} testID="bible-book-search-btn">
            <Feather name="search" size={ms(16)} color={isSearchVisible ? colors.primary : colors.onSurface} />
          </TouchableOpacity>

          <View style={[styles.viewToggles, { backgroundColor: colors.surfaceHighlight }]} testID="bible-book-view-toggles">
            <TouchableOpacity onPress={() => handleSetViewMode('grid')} style={[styles.toggleBtn, viewMode === 'grid' && { backgroundColor: colors.surface }]} testID="bible-book-grid-view-btn">
              <Feather name="grid" size={ms(16)} color={viewMode === 'grid' ? colors.primary : colors.onSurface} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSetViewMode('list')} style={[styles.toggleBtn, viewMode === 'list' && { backgroundColor: colors.surface }]} testID="bible-book-list-view-btn">
              <Feather name="list" size={ms(16)} color={viewMode === 'list' ? colors.primary : colors.onSurface} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onClose} style={[styles.iconBtn, styles.headerActionSpacing, { backgroundColor: colors.surfaceHighlight }]} testID="bible-book-close-btn">
            <Feather name="x" size={ms(16)} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {isSearchVisible && (
        <View style={[styles.searchContainer, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
          <Feather name="search" size={ms(16)} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { fontSize: ms(14), color: colors.onSurface }]}
            placeholder="Pesquisar livro..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            underlineColorAndroid="transparent"
          />
        </View>
      )}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        overScrollMode="always"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {groupedSections.map((section, sIdx) => {
          const showTestamentHeader = section.testament !== lastTestament;
          if (showTestamentHeader) lastTestament = section.testament;
          const groupHasCurrent = currentBookAbbrev && section.books.some((b) => b.abbrev === currentBookAbbrev);

          return (
            <View
              key={`section-${sIdx}`}
              onLayout={(e) => {
                if (groupHasCurrent && !hasScrolledRef.current && visible && !searchQuery) {
                  hasScrolledRef.current = true;
                  const y = Math.max(0, e.nativeEvent.layout.y - 16);
                  scrollViewRef.current?.scrollTo({ y, animated: false });
                }
              }}
            >
              {showTestamentHeader && (
                section.testament === 'AT' ? testamentHeaderOT : testamentHeaderNT
              )}
              <View style={styles.groupLabelRow}>
                <View style={[styles.groupLabelLine, { backgroundColor: colors.border }]} />
                <BibleText style={[styles.groupLabel, { color: colors.textMuted, fontSize: ms(10) }]}>
                  {section.label.toUpperCase()}
                </BibleText>
                <View style={[styles.groupLabelLine, { backgroundColor: colors.border }]} />
              </View>
              {viewMode === 'list' ? (
                <View style={styles.listGroup}>
                  {section.books.map((item, index) => {
                    const isSelected = item.abbrev === currentBookAbbrev;
                    return (
                      <BibleListCard
                        key={`${item.abbrev || item.name}-${index}`}
                        title={item.name}
                        pillText={item.abbrev}
                        isSelected={isSelected}
                        onPress={() => {
                          onSelect(item.abbrev || item.name);
                          setSearchQuery('');
                        }}
                      />
                    );
                  })}
                </View>
              ) : (
                <View style={styles.gridContainer}>
                  {section.books.map((item, index) => {
                    const isSelected = item.abbrev === currentBookAbbrev;
                    return (
                      <BibleGridBlock
                        key={`grid-${item.abbrev || item.name}-${index}`}
                        title={item.abbrev || item.name.substring(0, 3)}
                        exactWidth={itemWidth}
                        isSelected={isSelected}
                        onPress={() => {
                          onSelect(item.abbrev || item.name);
                          setSearchQuery('');
                        }}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.footer}>
        <View style={[styles.countPill, { backgroundColor: colors.surfaceHighlight, borderColor: colors.primary + '30' }]}>
          <BibleText style={[styles.countNumber, { color: colors.primary, fontWeight: '700' }]}>{filteredBooks.length}</BibleText>
          <BibleText style={[styles.countText, { color: colors.primary, fontWeight: '600' }]}> {filteredBooks.length === 1 ? 'livro' : 'livros'}</BibleText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  iconBtn: { width: 32, height: 32, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  headerActionSpacing: { marginLeft: 8 },
  headerIconWrap: { marginRight: 8 },
  title: { flex: 1, fontWeight: '700' },
  versionPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, height: 32, borderRadius: 6, marginRight: 8 },
  versionPillText: { fontWeight: '800' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginTop: 8, marginBottom: 4, height: 44 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: '100%', ...({ outlineStyle: 'none' } as any) },
  scrollContent: { paddingVertical: 4 },
  divider: { height: 1, marginVertical: 4 },
  footer: { paddingTop: 4 },
  countPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  countNumber: { fontWeight: '800', fontSize: 13 },
  countText: { fontWeight: '600', fontSize: 13 },
  viewToggles: { flexDirection: 'row', alignItems: 'center', borderRadius: 6, padding: 3, gap: 2, marginLeft: 8, height: 32 },
  toggleBtn: { width: 26, height: 26, justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start', marginBottom: 8 },
  listGroup: { gap: 8, marginBottom: 8 },
  testamentHeader: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 10,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  testamentTitle: {
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  groupLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 6,
  },
  groupLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  groupLabelLine: {
    flex: 1,
    height: 1,
  },
});
