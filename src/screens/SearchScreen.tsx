import { BibleCountPill } from '@/components/BibleCountPill';
import { BibleDivider } from '@/components/BibleDivider';
import { BibleIcon } from '@/components/BibleIcon';
import { BiblePageModal } from '@/components/modals/BiblePageModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BibleDrawerMenu } from '../components/BibleDrawerMenu';
import { BibleHeader } from '../components/BibleHeader';
import { BiblePageEmpty } from '../components/BiblePageEmpty';
import { BibleSkeleton } from '../components/BibleSkeleton';
import { BibleText } from '../components/BibleText';
import { DonateModal } from '../components/modals/DonateModal';
import { ROUTES } from '../constants/routes';
import { STORAGE_KEYS } from '../constants/storage';
import { Book } from '../data';
import { useBible } from '../hooks/useBible';
import { useBibleModals } from '../hooks/useBibleModals';
import { useHistory } from '../hooks/useHistory';
import { useReaderSettings } from '../hooks/useReaderSettings';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../hooks/useTheme';
import { impactLight, selectionHaptic } from '../utils/haptics';
import { handleSmartBack } from '../utils/navigation';


export type SearchScope = 'bible' | 'book' | 'chapter';

export type SearchResult = {
  bookName: string;
  bookAbbrev: string;
  chapter: number;
  verse: number;
  text: string;
};

const MAX_HISTORY = 20;


const HighlightText = React.memo(({ text, query, colors, fontSizeMultiplier, ms, DESIGN, styles }: { text: string; query: string; colors: any; fontSizeMultiplier: number; ms: (v: number) => number; DESIGN: any; styles: any }) => {
  const currentSize = ms(DESIGN.fontSize.xxl * fontSizeMultiplier);
  const currentLineHeight = ms(DESIGN.spacing.xxl * fontSizeMultiplier);
  const textStyle = { color: colors.onBackground, fontSize: currentSize, lineHeight: currentLineHeight };

  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return <BibleText variant="reading" style={[styles.verseText, textStyle]}>{text}</BibleText>;
  }

  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rawParts = text.split(new RegExp(`(${escapeRegExp(cleanQuery)})`, 'gi'));
  const tokens: { text: string; highlighted: boolean }[] = [];
  for (const part of rawParts) {
    if (part.toLowerCase() === cleanQuery) {
      tokens.push({ text: part, highlighted: true });
    } else {
      const words = part.split(/(\s+)/);
      for (const w of words) {
        if (w) tokens.push({ text: w, highlighted: false });
      }
    }
  }

  return (
    <View style={styles.highlightTextContainer}>
      {tokens.map((token, i) =>
        token.highlighted ? (
          <View key={i} style={[styles.highlightedToken, { backgroundColor: colors.primary + '20' }]}>
            <BibleText variant="reading" style={[styles.verseText, { color: colors.primary, fontWeight: '800', fontSize: currentSize, lineHeight: currentLineHeight }]}>
              {token.text}
            </BibleText>
          </View>
        ) : (
          <BibleText key={i} variant="reading" style={[styles.verseText, textStyle]}>{token.text}</BibleText>
        )
      )}
    </View>
  );
});

const SearchResultItem = React.memo(({ item, query, colors, fontSizeMultiplier, ms, DESIGN, styles, onPress }: {
  item: SearchResult;
  query: string;
  colors: any;
  fontSizeMultiplier: number;
  ms: (v: number) => number;
  DESIGN: any;
  styles: any;
  onPress: (item: SearchResult) => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.75}
    style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    onPress={() => onPress(item)}
  >
    <View style={[styles.refBadge, { backgroundColor: colors.primary + '15' }]}>
      <BibleText variant="reading" style={[styles.refText, { color: colors.primary, fontSize: ms(DESIGN.fontSize.sm * fontSizeMultiplier), fontWeight: '800' }]}>
        {item.bookName} {item.chapter}:{item.verse}
      </BibleText>
    </View>
    <View style={styles.resultTextContent}>
      <HighlightText text={item.text} query={query} colors={colors} fontSizeMultiplier={fontSizeMultiplier} ms={ms} DESIGN={DESIGN} styles={styles} />
    </View>
  </TouchableOpacity>
));

export default function SearchScreen() {
  const { ms, DESIGN } = useResponsive();
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1 },
    highlightTextContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    highlightedToken: {
      borderRadius: ms(DESIGN.borderRadius.xs),
      paddingHorizontal: ms(DESIGN.spacing.xs),
      paddingVertical: ms(DESIGN.spacing.tiny),
      marginVertical: ms(DESIGN.spacing.tiny),
    },
    resultTextContent: {
      flex: 1,
      marginTop: ms(DESIGN.spacing.md),
    },
    searchContainer: {
      paddingHorizontal: ms(DESIGN.spacing.lg),
      paddingVertical: ms(DESIGN.spacing.md),
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(DESIGN.spacing.sm),
      flex: 1,
    },
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      height: ms(DESIGN.button.height.md),
      borderRadius: ms(DESIGN.borderRadius.md),
      paddingHorizontal: ms(DESIGN.spacing.sm),
      borderWidth: 1,
    },
    input: {
      flex: 1,
      height: '100%',
      padding: 0,
      includeFontPadding: false,
    },
    searchIcon: {
      marginRight: ms(DESIGN.spacing.sm),
    },
    activityIndicator: {
      marginRight: ms(DESIGN.spacing.xs),
    },
    filterBtn: {
      width: ms(44),
      height: ms(44),
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.primary + '20',
      borderRadius: ms(DESIGN.borderRadius.md),
    },
    resultsInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: ms(DESIGN.spacing.lg),
      paddingVertical: ms(DESIGN.spacing.sm),
      borderBottomWidth: 1,
    },
    appliedFilterLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(DESIGN.spacing.xs),
    },
    appliedFilterText: {
      fontWeight: '600',
    },
    centerBox: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center'
    },
    historyList: {
      flex: 1,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: ms(DESIGN.spacing.sm),
    },
    historyHeaderText: {
      fontSize: ms(DESIGN.fontSize.xs),
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
      opacity: 0.6,
    },
    clearHistoryBtn: {
      paddingHorizontal: ms(DESIGN.spacing.md),
      paddingVertical: ms(DESIGN.spacing.xs),
      borderRadius: ms(DESIGN.borderRadius.md),
    },
    clearHistoryText: {
      fontSize: ms(DESIGN.fontSize.xs),
      fontWeight: '800',
    },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    historyText: {
      fontWeight: '500',
      marginLeft: ms(DESIGN.spacing.sm),
      flex: 1,
    },
    resultCard: {
      borderRadius: ms(DESIGN.borderRadius.lg),
      borderWidth: 1,
      padding: ms(DESIGN.spacing.lg),
    },
    refBadge: {
      alignSelf: 'flex-start',
      borderRadius: ms(DESIGN.borderRadius.sm),
      paddingHorizontal: ms(DESIGN.spacing.sm),
      paddingVertical: ms(DESIGN.spacing.tiny),
    },
    refText: { fontWeight: '700' },
    verseText: { fontSize: ms(DESIGN.fontSize.md), lineHeight: ms(DESIGN.fontSize.xxl) },
    filterModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    filterModalIcon: {
      marginRight: ms(DESIGN.spacing.sm),
    },
    filterModalTitle: {
      fontSize: ms(DESIGN.fontSize.lg),
      fontWeight: '800',
      flex: 1,
    },
    resetFiltersBtn: {
      marginRight: ms(DESIGN.spacing.md),
    },
    resetFiltersText: {
      fontWeight: '700',
      fontSize: ms(DESIGN.fontSize.sm),
    },
    filterModalContent: {
      paddingHorizontal: ms(DESIGN.spacing.lg),
      paddingBottom: ms(DESIGN.spacing.xl),
    },
    filterModalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: ms(DESIGN.spacing.md),
    },
    filterModalItemIcon: {
      marginRight: ms(DESIGN.spacing.md),
    },
    filterModalLabelContainer: {
      flex: 1,
    },
    filterModalLabel: {
      fontWeight: '600',
      fontSize: ms(DESIGN.fontSize.xs),
    },
    filterModalValue: {
      fontWeight: '800',
      fontSize: ms(DESIGN.fontSize.md),
    },
    filterBtnFooter: {
      borderRadius: ms(DESIGN.borderRadius.md),
      paddingVertical: ms(DESIGN.spacing.md),
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBtnText: {
      fontWeight: '800',
    },
    filterBadge: {
      paddingHorizontal: ms(DESIGN.spacing.sm),
      paddingVertical: ms(DESIGN.spacing.tiny),
      borderRadius: ms(DESIGN.borderRadius.sm),
    }
  }), [ms, colors, DESIGN]);

  const { fontSizeMultiplier } = useReaderSettings();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ query?: string; from?: string }>();
  const { versionBooks, setVersion, version, navigateTo } = useBible();
  const { addHistoryEntry } = useHistory();
  const { openModal } = useBibleModals();

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Local Filter State
  const [searchBook, setSearchBook] = useState<Book | null>(null);
  const [searchChapter, setSearchChapter] = useState<number | null>(null);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isDonateVisible, setIsDonateVisible] = useState(false);

  const searchTimeout = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    (async () => {
      try {
        const [savedQuery, savedHistory, savedVersion, savedBookAbbrev, savedChapter] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SEARCH_QUERY),
          AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY),
          AsyncStorage.getItem(STORAGE_KEYS.SEARCH_VERSION),
          AsyncStorage.getItem(STORAGE_KEYS.SEARCH_BOOK),
          AsyncStorage.getItem(STORAGE_KEYS.SEARCH_CHAPTER),
        ]);

        // Always start with an empty query as requested
        setQuery('');

        if (savedHistory) setHistory(JSON.parse(savedHistory));
        
        if (savedVersion) setVersion(savedVersion);
        if (savedBookAbbrev && versionBooks) {
          const book = versionBooks.find(b => b.abbrev === savedBookAbbrev);
          if (book) setSearchBook(book);
        }
        if (savedChapter) setSearchChapter(parseInt(savedChapter, 10));

      } catch (e) { }
      setIsLoaded(true);
    })();
  }, [versionBooks]);

  const saveQuery = async (q: string) => {
    try { await AsyncStorage.setItem(STORAGE_KEYS.SEARCH_QUERY, q); } catch (e) { }
  };

  const saveFilters = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.SEARCH_VERSION, version),
        searchBook ? AsyncStorage.setItem(STORAGE_KEYS.SEARCH_BOOK, searchBook.abbrev) : AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_BOOK),
        searchChapter ? AsyncStorage.setItem(STORAGE_KEYS.SEARCH_CHAPTER, searchChapter.toString()) : AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_CHAPTER),
      ]);
    } catch (e) { }
  };

  const addToHistory = async (term: string) => {
    if (!term.trim() || term.trim().length < 2) return;
    setHistory(prev => {
      const filtered = prev.filter(h => h.toLowerCase() !== term.toLowerCase());
      const next = [term.trim(), ...filtered].slice(0, MAX_HISTORY);
      AsyncStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(next)).catch(() => { });
      return next;
    });
  };

  const removeFromHistory = async (term: string) => {
    setHistory(prev => {
      const next = prev.filter(h => h !== term);
      AsyncStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(next)).catch(() => { });
      return next;
    });
  };

  const clearHistory = async () => {
    impactLight();
    setHistory([]);
    try { await AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY); } catch (e) { }
  };

  const scope = useMemo(() => {
    if (searchChapter) return 'chapter';
    if (searchBook) return 'book';
    return 'bible';
  }, [searchBook, searchChapter]);

  const filterLabelText = useMemo(() => {
    if (searchBook && searchChapter) return `${searchBook.name} ${searchChapter}`;
    if (searchBook) return searchBook.name;
    return 'Bíblia Toda';
  }, [searchBook, searchChapter]);

  const runSearch = useCallback((q: string, immediate = false) => {
    clearTimeout(searchTimeout.current);
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const delay = immediate ? 0 : 350;
    searchTimeout.current = setTimeout(() => {
      const term = q.trim().toLowerCase();
      const found: SearchResult[] = [];

      const booksToSearch = scope === 'bible'
        ? versionBooks
        : searchBook ? [searchBook] : versionBooks;

      if (!booksToSearch) {
        setIsSearching(false);
        return;
      }

      for (const book of booksToSearch) {
        const chaptersToSearch = scope === 'chapter' && searchChapter
          ? [{ idx: searchChapter - 1, verses: book.chapters[searchChapter - 1] || [] }]
          : book.chapters.map((verses, idx) => ({ idx, verses }));

        for (const { idx, verses } of chaptersToSearch) {
          for (let vi = 0; vi < verses.length; vi++) {
            if (verses[vi].toLowerCase().includes(term)) {
              found.push({
                bookName: book.name,
                bookAbbrev: book.abbrev,
                chapter: idx + 1,
                verse: vi + 1,
                text: verses[vi],
              });
            }
          }
        }
      }

      setResults(found);
      setIsSearching(false);
    }, delay);
  }, [versionBooks, searchBook, searchChapter, scope]);

  const handleChangeQuery = (q: string) => {
    setQuery(q);
    saveQuery(q);
    runSearch(q);
    router.setParams({ query: q });
  };

  // REMOVED: Only filter when clicking the Filter button or submitting search

  const handleSubmit = () => {
    if (query.trim().length >= 2) {
      addToHistory(query.trim());
      runSearch(query, true);
    }
  };

  const handleHistorySelect = (term: string) => {
    selectionHaptic();
    setQuery(term);
    saveQuery(term);
    addToHistory(term);
    runSearch(term, true);
    router.setParams({ query: term });
  };

  const handleNavigate = (r: SearchResult) => {
    impactLight();
    addToHistory(query.trim());
    addHistoryEntry({
      version,
      bookName: r.bookName,
      bookAbbrev: r.bookAbbrev,
      chapter: r.chapter,
      verse: r.verse,
    });
    navigateTo({ book: r.bookAbbrev, chapter: r.chapter, verse: r.verse, version });
    router.replace({ pathname: ROUTES.BIBLE } as any);
  };

  const handleClearQuery = () => {
    setQuery('');
    saveQuery('');
    setResults([]);
    inputRef.current?.focus();
    router.setParams({ query: '' });
  };

  const handleResetFilters = () => {
    setSearchBook(null);
    setSearchChapter(null);
  };

  const showHistory = query.trim().length === 0 && history.length > 0;
  const showEmpty = query.trim().length === 0 && history.length === 0;
  const showTooShort = query.trim().length > 0 && query.trim().length < 2;
  const showNoResults = !isSearching && query.trim().length >= 2 && results.length === 0;
  const showResults = !isSearching && results.length > 0;

  if (!isLoaded || !versionBooks) {
    return <BibleSkeleton />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="search-screen">
      <BibleHeader
        showMenu={params.from !== 'bible'}
        showBack={params.from === 'bible'}
        onBack={() => handleSmartBack(pathname)}
        onMenuPress={() => setIsDrawerVisible(true)}

        leftContent={
          <View style={[styles.searchBox, { backgroundColor: colors.onPrimary, borderColor: colors.border }]}>
            <BibleIcon name="search" size={ms(DESIGN.spacing.lg)} color={colors.primary} style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={[styles.input, Platform.select({ web: { outline: 'none', outlineWidth: 0 } as any, default: {} }), { fontSize: ms(DESIGN.fontSize.md), color: colors.onSurface }]}
              placeholder="Pesquisar na Bíblia..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={handleChangeQuery}
              onSubmitEditing={handleSubmit}
              autoFocus
              returnKeyType="search"
              underlineColorAndroid="transparent"
              {...({ outlineStyle: 'none' } as any)}
            />
            {isSearching ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.activityIndicator} />
            ) : query.length > 0 ? (
              <BibleIcon
                name="x"
                color={colors.error}
                backgroundColor={colors.error + '20'}
                onPress={handleClearQuery}
                size={ms(DESIGN.spacing.md)}
              />
            ) : null}
          </View>
        }
        rightContent={
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setIsFilterModalVisible(true)}
            activeOpacity={0.7}
          >
            <BibleIcon name="sliders" color={colors.onPrimary} size={ms(DESIGN.spacing.lg)} />
          </TouchableOpacity>
        }
      />

      {results.length > 0 && (
        <View style={[styles.resultsInfoContainer, { backgroundColor: colors.onPrimary, borderBottomColor: colors.border }]}>
          <View style={styles.appliedFilterLabel}>
            <BibleText style={[styles.appliedFilterText, { color: colors.textMuted, fontSize: ms(DESIGN.fontSize.xs) }]}>
              FILTRO APLICADO:
            </BibleText>
            <View style={[styles.filterBadge, { backgroundColor: colors.primary + '15' }]}>
              <BibleText style={{ color: colors.primary, fontWeight: '800', fontSize: ms(DESIGN.fontSize.sm) }}>
                {filterLabelText.toUpperCase()}
              </BibleText>
            </View>
          </View>
          <BibleCountPill
            count={results.length}
            label="resultado"
            labelPlural="resultados"
          />
        </View>
      )}

      {isSearching ? (
        <BibleSkeleton onlyContent />
      ) : showEmpty ? (
        <BiblePageEmpty
          title="Pesquise uma palavra ou frase"
          description="Bíblia toda, livro ou capítulo"
          icon="search"
        />
      ) : showHistory ? (
        <View style={styles.historyList}>
          <FlashList
            data={history}
            keyExtractor={(item) => item}
            // @ts-ignore
            estimatedItemSize={ms(DESIGN.layout.footerHeight)}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: ms(DESIGN.spacing.lg) }}
            ItemSeparatorComponent={() => <View style={{ height: ms(DESIGN.spacing.sm) }} />}
            ListHeaderComponent={
              <View style={styles.historyHeader}>
                <BibleText style={[styles.historyHeaderText, { color: colors.textMuted }]}>
                  BUSCAS RECENTES
                </BibleText>
                <TouchableOpacity onPress={clearHistory} style={[styles.clearHistoryBtn, { backgroundColor: colors.primary + '20' }]}>
                  <BibleText style={[styles.clearHistoryText, { color: colors.primary }]}>
                    Limpar
                  </BibleText>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.resultCard, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => handleHistorySelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.historyItem}>
                  <BibleIcon name="clock" backgroundColor={colors.primary + '20'} color={colors.primary} />
                  <BibleText style={[styles.historyText, { color: colors.onSurface, fontSize: ms(DESIGN.fontSize.md) }]}>
                    {item}
                  </BibleText>
                  <BibleIcon
                    name="x"
                    color={colors.error}
                    backgroundColor={colors.error + '20'}
                    onPress={() => removeFromHistory(item)}
                  />
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : showTooShort ? (
        <BiblePageEmpty
          title="Pesquisa"
          description="Digite ao menos 2 caracteres para pesquisar"
          icon="search"
        />
      ) : showNoResults ? (
        <BiblePageEmpty
          title="Sem resultados"
          description={`Nenhum versículo encontrado com o texto: "${query.trim()}"`}
          icon="slash"
          actionLabel="Limpar Busca"
          onAction={handleClearQuery}
        />
      ) : showResults ? (
        <View style={styles.container}>
          <FlashList
            data={results}
            keyExtractor={(_, i) => String(i)}
            // @ts-ignore
            estimatedItemSize={ms(DESIGN.layout.listPaddingBottom)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: ms(DESIGN.spacing.md) }}
            ItemSeparatorComponent={() => <View style={{ height: ms(DESIGN.spacing.sm) }} />}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <SearchResultItem
                item={item}
                query={query.trim()}
                colors={colors}
                fontSizeMultiplier={fontSizeMultiplier}
                ms={ms}
                DESIGN={DESIGN}
                styles={styles}
                onPress={handleNavigate}
              />
            )}
          />
        </View>
      ) : null}

      {/* Filter Modal */}
      <BiblePageModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        header={
          <View style={styles.filterModalHeader}>
            <BibleIcon name="filter" color={colors.primary} backgroundColor={colors.primary + '15'} style={styles.filterModalIcon} />
            <BibleText style={[styles.filterModalTitle, { color: colors.onSurface }]}>Filtros de Busca</BibleText>
            <BibleIcon name="x" color={colors.error} backgroundColor={colors.error + '20'} onPress={() => setIsFilterModalVisible(false)} />
          </View>
        }
        footer={
          <View style={{ flexDirection: 'row', gap: ms(DESIGN.spacing.sm) }}>
            <TouchableOpacity
              style={[styles.filterBtnFooter, { flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.primary + '20' }]}
              onPress={handleResetFilters}
            >
              <BibleText style={[styles.filterBtnText, { color: colors.onSurface, fontSize: ms(DESIGN.fontSize.lg) }]}>Limpar</BibleText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtnFooter, { flex: 1, backgroundColor: colors.primary }]}
              onPress={() => {
                setIsFilterModalVisible(false);
                saveFilters();
                runSearch(query, true);
              }}
            >
              <BibleText style={[styles.filterBtnText, { color: colors.onPrimary, fontSize: ms(DESIGN.fontSize.lg) }]}>Filtrar</BibleText>
            </TouchableOpacity>
          </View>
        }
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterModalContent}>
          <TouchableOpacity
            style={styles.filterModalItem}
            onPress={() => openModal({ initialStep: 'version', onSelect: (s) => s.version && setVersion(s.version) })}
          >
            <BibleIcon name="book" color={colors.primary} backgroundColor={colors.primary + '15'} style={styles.filterModalItemIcon} />
            <View style={styles.filterModalLabelContainer}>
              <BibleText style={[styles.filterModalLabel, { color: colors.textMuted }]}>BIBLIA</BibleText>
              <BibleText style={[styles.filterModalValue, { color: colors.onSurface }]}>{version}</BibleText>
            </View>
            <BibleIcon name="chevron-right" color={colors.textMuted} />
          </TouchableOpacity>
          <BibleDivider />

          <TouchableOpacity
            style={styles.filterModalItem}
            onPress={() => openModal({
              initialStep: 'book',
              skipChapterSelection: true,
              initialBook: searchBook || undefined,
              onSelect: (s) => {
                if (s.book) {
                  setSearchBook(s.book);
                  setSearchChapter(null);
                }
              }
            })}
          >
            <BibleIcon name="list" color={colors.primary} backgroundColor={colors.primary + '15'} style={styles.filterModalItemIcon} />
            <View style={styles.filterModalLabelContainer}>
              <BibleText style={[styles.filterModalLabel, { color: colors.textMuted }]}>LIVRO</BibleText>
              <BibleText style={[styles.filterModalValue, { color: colors.onSurface }]}>
                {searchBook ? searchBook.name : 'Todos os Livros'}
              </BibleText>
            </View>
            <BibleIcon name="chevron-right" color={colors.textMuted} />
          </TouchableOpacity>
          <BibleDivider />

          <TouchableOpacity
            style={[styles.filterModalItem, !searchBook && { opacity: 0.5 }]}
            disabled={!searchBook}
            onPress={() => openModal({
              initialStep: 'chapter',
              skipChapterSelection: true,
              skipVerseSelection: true,
              initialBook: searchBook || undefined,
              initialChapter: searchChapter || undefined,
              onSelect: (s) => s.chapter && setSearchChapter(s.chapter)
            })}
          >
            <BibleIcon name="hash" color={colors.primary} backgroundColor={colors.primary + '15'} style={styles.filterModalItemIcon} />
            <View style={styles.filterModalLabelContainer}>
              <BibleText style={[styles.filterModalLabel, { color: colors.textMuted }]}>CAPÍTULO</BibleText>
              <BibleText style={[styles.filterModalValue, { color: colors.onSurface }]}>
                {searchChapter ? `Capítulo ${searchChapter}` : 'Todos os Capítulos'}
              </BibleText>
            </View>
            <BibleIcon name="chevron-right" color={colors.textMuted} />
          </TouchableOpacity>
        </ScrollView>
      </BiblePageModal>

      <BibleDrawerMenu
        visible={isDrawerVisible}
        activeItem="search"
        onClose={() => setIsDrawerVisible(false)}
        onSelectItem={() => { }}
        onOpenDonate={() => { setIsDrawerVisible(false); setTimeout(() => setIsDonateVisible(true), 250); }}
      />

      <DonateModal visible={isDonateVisible} onClose={() => setIsDonateVisible(false)} />
    </View>
  );
}
