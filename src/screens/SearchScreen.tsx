import { BibleCountPill } from '@/components/BibleCountPill';
import { BibleIcon } from '@/components/BibleIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BibleDrawerMenu } from '../components/BibleDrawerMenu';
import { BibleHeader } from '../components/BibleHeader';
import { BiblePageEmpty } from '../components/BiblePageEmpty';
import { BibleSkeleton } from '../components/BibleSkeleton';
import { BibleText } from '../components/BibleText';
import { DonateModal } from '../components/modals/DonateModal';
import { ROUTES } from '../constants/routes';
import { STORAGE_KEYS } from '../constants/storage';
import { useBible } from '../hooks/useBible';
import { useHistory } from '../hooks/useHistory';
import { useReaderSettings } from '../hooks/useReaderSettings';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../hooks/useTheme';
import { useBibleModals } from '../hooks/useBibleModals';
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


const HighlightText = React.memo(({ text, query, colors, fontSizeMultiplier, ms }: { text: string; query: string; colors: any; fontSizeMultiplier: number; ms: (v: number) => number }) => {
  const baseSize = 20;
  const currentSize = ms(baseSize * fontSizeMultiplier);
  const currentLineHeight = ms(28 * fontSizeMultiplier);
  const textStyle = { color: colors.onBackground, fontSize: currentSize, lineHeight: currentLineHeight };

  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return <BibleText variant="reading" style={[styles.verseText, textStyle]}>{text}</BibleText>;
  }

  // Tokenize by splitting on spaces, keeping each token (word or space run)
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Split text keeping the query as a whole token, then split non-match parts by space
  const rawParts = text.split(new RegExp(`(${escapeRegExp(cleanQuery)})`, 'gi'));
  const tokens: { text: string; highlighted: boolean }[] = [];
  for (const part of rawParts) {
    if (part.toLowerCase() === cleanQuery) {
      tokens.push({ text: part, highlighted: true });
    } else {
      // Split non-highlighted part into individual words+spaces
      const words = part.split(/(\s+)/);
      for (const w of words) {
        if (w) tokens.push({ text: w, highlighted: false });
      }
    }
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
      {tokens.map((token, i) =>
        token.highlighted ? (
          <View key={i} style={{ backgroundColor: colors.primary + '20', borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1, marginVertical: 1 }}>
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
const SearchResultItem = React.memo(({ item, query, colors, fontSizeMultiplier, ms, onPress }: {
  item: SearchResult;
  query: string;
  colors: any;
  fontSizeMultiplier: number;
  ms: (v: number) => number;
  onPress: (item: SearchResult) => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.75}
    style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
    onPress={() => onPress(item)}
  >
    <View style={[styles.refBadge, { backgroundColor: colors.primary, paddingVertical: ms(4), paddingHorizontal: ms(10), borderRadius: ms(8) }]}>
      <BibleText variant="reading" style={[styles.refText, { color: colors.onPrimary, fontSize: ms(12 * fontSizeMultiplier), fontWeight: '800' }]}>
        {item.bookName} {item.chapter}:{item.verse}
      </BibleText>
    </View>
    <View style={{ flex: 1, marginTop: 12 }}>
      <HighlightText text={item.text} query={query} colors={colors} fontSizeMultiplier={fontSizeMultiplier} ms={ms} />
    </View>
  </TouchableOpacity>
));

export default function SearchScreen() {
  const { ms } = useResponsive();
  const { colors } = useTheme();
  const { fontSizeMultiplier } = useReaderSettings();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ query?: string; from?: string }>();
  const { versionBooks, currentBook, chapter, setVersion, setBook, setChapter, version, navigateTo } = useBible();
  const { addHistoryEntry } = useHistory();
  const { openModal } = useBibleModals();

  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('bible');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isDonateVisible, setIsDonateVisible] = useState(false);

  const searchTimeout = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    (async () => {
      try {
        const [savedScope, savedQuery, savedHistory] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SEARCH_SCOPE),
          AsyncStorage.getItem(STORAGE_KEYS.SEARCH_QUERY),
          AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY),
        ]);
        if (savedScope) setScope(savedScope as SearchScope);

        if (params.query) {
          setQuery(params.query);
        } else if (params.from === 'bible' && savedQuery) {
          setQuery(savedQuery);
        }

        if (savedHistory) setHistory(JSON.parse(savedHistory));
      } catch (e) { }
      setIsLoaded(true);
    })();
  }, []);

  const saveScope = async (s: SearchScope) => {
    try { await AsyncStorage.setItem(STORAGE_KEYS.SEARCH_SCOPE, s); } catch (e) { }
  };

  const saveQuery = async (q: string) => {
    try { await AsyncStorage.setItem(STORAGE_KEYS.SEARCH_QUERY, q); } catch (e) { }
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

  const activeBook = currentBook || versionBooks?.[0];

  const runSearch = useCallback((q: string, sc: SearchScope, immediate = false) => {
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

      const booksToSearch = sc === 'bible'
        ? versionBooks
        : activeBook ? [activeBook] : versionBooks;

      if (!booksToSearch) {
        setIsSearching(false);
        return;
      }

      for (const book of booksToSearch) {
        const chaptersToSearch = sc === 'chapter'
          ? [{ idx: chapter - 1, verses: book.chapters[chapter - 1] || [] }]
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
              if (found.length >= 300) break;
            }
          }
          if (found.length >= 300) break;
        }
        if (found.length >= 300) break;
      }

      setResults(found);
      setIsSearching(false);
    }, delay);
  }, [versionBooks, activeBook, chapter]);

  const handleChangeQuery = (q: string) => {
    setQuery(q);
    saveQuery(q);
    runSearch(q, scope);
    router.setParams({ query: q });
  };

  useEffect(() => {
    if (isLoaded && query.trim().length >= 2) {
      runSearch(query, scope, true);
    }
  }, [version, activeBook, chapter, scope]);

  const handleChangeScope = (sc: SearchScope) => {
    setScope(sc);
    saveScope(sc);
    runSearch(query, sc);
  };

  const handleSubmit = () => {
    if (query.trim().length >= 2) {
      addToHistory(query.trim());
      runSearch(query, scope, true);
    }
  };

  const handleHistorySelect = (term: string) => {
    selectionHaptic();
    setQuery(term);
    saveQuery(term);
    addToHistory(term);
    runSearch(term, scope, true);
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

  const showHistory = query.trim().length === 0 && history.length > 0;
  const showEmpty = query.trim().length === 0 && history.length === 0;
  const showTooShort = query.trim().length > 0 && query.trim().length < 2;
  const showNoResults = !isSearching && query.trim().length >= 2 && results.length === 0;
  const showResults = !isSearching && results.length > 0;

  if (!isLoaded || !versionBooks) {
    return <BibleSkeleton />;
  }

  const btnBg = colors.onPrimary + '4D';
  const btnText = colors.onPrimary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="search-screen">
      <BibleHeader
        showMenu={params.from !== 'bible'}
        showBack={params.from === 'bible'}
        onBack={() => handleSmartBack(pathname)}
        onMenuPress={() => setIsDrawerVisible(true)}
        leftContent={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={{ backgroundColor: btnBg, height: ms(38), paddingHorizontal: ms(12), marginHorizontal: ms(3), borderRadius: ms(10), justifyContent: 'center' }} onPress={() => openModal({ initialStep: 'version', onSelect: (s) => s.version && setVersion(s.version) })}>
              <BibleText style={{ color: btnText, fontSize: ms(15), fontWeight: '700' }}>{version}</BibleText>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: btnBg, height: ms(38), paddingHorizontal: ms(12), marginHorizontal: ms(3), borderRadius: ms(10), justifyContent: 'center' }} onPress={() => openModal({ initialStep: 'book', onSelect: (s) => s.book && setBook(s.book.abbrev) })}>
              <BibleText style={{ color: btnText, fontSize: ms(15), fontWeight: '700' }}>{currentBook.name}</BibleText>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: btnBg, height: ms(38), paddingHorizontal: ms(12), marginHorizontal: ms(3), borderRadius: ms(10), justifyContent: 'center' }} onPress={() => openModal({ initialStep: 'chapter', skipVerseSelection: true, onSelect: (s) => s.chapter && setChapter(s.chapter) })}>
              <BibleText style={{ color: btnText, fontSize: ms(15), fontWeight: '700' }}>{chapter}</BibleText>
            </TouchableOpacity>
          </View>
        }
      />

      <View style={[styles.searchContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]} testID="search-container">
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
          <BibleIcon name="search" size={ms(16)} color={colors.primary} style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            style={[styles.input, Platform.select({ web: { outline: 'none', outlineWidth: 0 } as any, default: {} }), { fontSize: ms(14), color: colors.onSurface }]}
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
          {query.length > 0 && (
            <BibleIcon
              name="x"
              color={colors.error}
              backgroundColor={colors.error + '20'}
              onPress={handleClearQuery}
            />
          )}
        </View>

        <View style={[styles.segmentedControl, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { key: 'bible' as SearchScope, label: `Bíblia: ${version}` },
            { key: 'book' as SearchScope, label: `Livro: ${currentBook.name}` },
            { key: 'chapter' as SearchScope, label: `Capítulo: ${chapter}` },
          ].map((s, idx) => (
            <React.Fragment key={s.key}>
              {idx > 0 && <View style={{ width: 1, backgroundColor: colors.border, marginVertical: 8 }} />}
              <TouchableOpacity
                style={[styles.segmentItem, scope === s.key && { backgroundColor: colors.primary }]}
                onPress={() => handleChangeScope(s.key)}
              >
                <BibleText style={[styles.scopeLabel, { color: scope === s.key ? colors.onPrimary : colors.primary, fontSize: ms(11) }]} numberOfLines={1}>
                  {s.label}
                </BibleText>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
      </View>

      {isSearching ? (
        <BibleSkeleton onlyContent />
      ) : showEmpty ? (
        <BiblePageEmpty
          title="Pesquise uma palavra ou frase"
          description="Bíblia toda, livro ou capítulo"
          icon="search"
        />
      ) : showHistory ? (
        <View style={{ flex: 1 }}>
          <FlashList
            data={history}
            keyExtractor={(item) => item}
            // @ts-ignore
            estimatedItemSize={60}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListHeaderComponent={
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <BibleText style={{ fontSize: ms(10), fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, color: colors.textMuted, opacity: 0.6 }}>
                  BUSCAS RECENTES
                </BibleText>
                <TouchableOpacity onPress={clearHistory} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary + '20', borderRadius: 12 }}>
                  <BibleText style={{ color: colors.primary, fontSize: ms(11), fontWeight: '800' }}>
                    Limpar
                  </BibleText>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.resultCard, { borderColor: colors.border, backgroundColor: colors.background, flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }]}
                onPress={() => handleHistorySelect(item)}
                activeOpacity={0.7}
              >
                <BibleIcon name="clock" backgroundColor={colors.primary + '20'} color={colors.primary} />
                <BibleText style={[styles.historyText, { marginLeft: ms(8), color: colors.onSurface, fontSize: ms(15), flex: 1 }]}>
                  {item}
                </BibleText>
                <BibleIcon
                  name="x"
                  color={colors.error}
                  backgroundColor={colors.error + '20'}
                  onPress={() => removeFromHistory(item)}
                />
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
        <View style={{ flex: 1 }}>
          <View style={{ marginHorizontal: 12, marginBottom: 8 }}>
            <BibleCountPill
              count={results.length}
              label="resultado"
              labelPlural="resultados"
            />
          </View>
          <FlashList
            data={results}
            keyExtractor={(_, i) => String(i)}
            // @ts-ignore
            estimatedItemSize={100}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 12 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <SearchResultItem
                item={item}
                query={query.trim()}
                colors={colors}
                fontSizeMultiplier={fontSizeMultiplier}
                ms={ms}
                onPress={handleNavigate}
              />
            )}
          />
        </View>
      ) : null}

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    padding: 16,
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  input: { flex: 1, height: '100%' },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    height: 40,
  },
  segmentItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scopeLabel: { fontWeight: '700' },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  hint: { textAlign: 'center' },
  historyText: { fontWeight: '500' },
  resultCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  refBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  refText: { fontWeight: '700' },
  verseText: { fontSize: 14, lineHeight: 20 },
});
