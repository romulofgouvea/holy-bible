import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BibleDrawerMenu } from '../../components/BibleDrawerMenu';
import { BibleHeader } from '../../components/BibleHeader';
import { BibleModals } from '../../components/BibleModals';
import { BibleSkeleton } from '../../components/BibleSkeleton';
import { BibleText } from '../../components/BibleText';
import { DonateModal } from '../../components/DonateModal';
import { useBible } from '../../hooks/use-bible';
import { useReaderSettings } from '../../hooks/use-reader-settings';
import { useResponsive } from '../../hooks/use-responsive';
import { useTheme } from '../../hooks/use-theme';
import { handleSmartBack } from '../../utils/navigation';


export type SearchScope = 'bible' | 'book' | 'chapter';

export type SearchResult = {
  bookName: string;
  bookAbbrev: string;
  chapter: number;
  verse: number;
  text: string;
};

const STORAGE_SEARCH_SCOPE = '@bible:search_scope';
const STORAGE_SEARCH_QUERY = '@bible:search_query';
const STORAGE_SEARCH_HISTORY = '@bible:search_history';
const MAX_HISTORY = 20;

function HighlightText({ text, query, colors, fontSizeMultiplier, ms }: { text: string; query: string; colors: any; fontSizeMultiplier: number; ms: (v: number) => number }) {
  const baseSize = 20;
  const currentSize = ms(baseSize * fontSizeMultiplier);
  const currentLineHeight = ms(28 * fontSizeMultiplier);

  if (!query.trim()) return <BibleText variant="reading" style={[styles.verseText, { color: colors.onBackground, fontSize: currentSize, lineHeight: currentLineHeight }]}>{text}</BibleText>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <BibleText variant="reading" style={[styles.verseText, { color: colors.onBackground, fontSize: currentSize, lineHeight: currentLineHeight }]}>{text}</BibleText>;
  return (
    <BibleText variant="reading" style={[styles.verseText, { color: colors.onBackground, fontSize: currentSize, lineHeight: currentLineHeight }]}>
      {text.slice(0, idx)}
      <BibleText variant="reading" style={[styles.verseText, { backgroundColor: colors.primary, color: colors.onPrimary, fontWeight: '700', borderRadius: 4, paddingHorizontal: 2, fontSize: currentSize, lineHeight: currentLineHeight }]}>
        {text.slice(idx, idx + query.length)}
      </BibleText>
      {text.slice(idx + query.length)}
    </BibleText>
  );
}

export default function SearchScreen() {
  const { ms } = useResponsive();
  const { colors } = useTheme();
  const { fontSizeMultiplier, readerFontFamily } = useReaderSettings();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{ query?: string; from?: string }>();
  const { versionBooks, currentBook, chapter, setVersion, setBook, setChapter, chapterCount, version } = useBible();

  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('bible');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [donateVisible, setDonateVisible] = useState(false);

  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [chapterModalVisible, setChapterModalVisible] = useState(false);
  const [verseModalVisible, setVerseModalVisible] = useState(false);

  const searchTimeout = useRef<any>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    (async () => {
      try {
        const [savedScope, savedQuery, savedHistory] = await Promise.all([
          AsyncStorage.getItem(STORAGE_SEARCH_SCOPE),
          AsyncStorage.getItem(STORAGE_SEARCH_QUERY),
          AsyncStorage.getItem(STORAGE_SEARCH_HISTORY),
        ]);
        if (savedScope) setScope(savedScope as SearchScope);

        if (params.query) {
          setQuery(params.query);
        } else if (params.from === 'bible' && savedQuery) {
          setQuery(savedQuery);
        }

        if (savedHistory) setHistory(JSON.parse(savedHistory));
      } catch (e) { }
      setLoaded(true);
    })();
  }, []);

  const saveScope = async (s: SearchScope) => {
    try { await AsyncStorage.setItem(STORAGE_SEARCH_SCOPE, s); } catch (e) { }
  };

  const saveQuery = async (q: string) => {
    try { await AsyncStorage.setItem(STORAGE_SEARCH_QUERY, q); } catch (e) { }
  };

  const addToHistory = async (term: string) => {
    if (!term.trim() || term.trim().length < 2) return;
    setHistory(prev => {
      const filtered = prev.filter(h => h.toLowerCase() !== term.toLowerCase());
      const next = [term.trim(), ...filtered].slice(0, MAX_HISTORY);
      AsyncStorage.setItem(STORAGE_SEARCH_HISTORY, JSON.stringify(next)).catch(() => { });
      return next;
    });
  };

  const removeFromHistory = async (term: string) => {
    setHistory(prev => {
      const next = prev.filter(h => h !== term);
      AsyncStorage.setItem(STORAGE_SEARCH_HISTORY, JSON.stringify(next)).catch(() => { });
      return next;
    });
  };

  const clearHistory = async () => {
    setHistory([]);
    try { await AsyncStorage.removeItem(STORAGE_SEARCH_HISTORY); } catch (e) { }
  };

  const activeBook = currentBook || versionBooks?.[0];

  const runSearch = useCallback((q: string, sc: SearchScope, immediate = false) => {
    clearTimeout(searchTimeout.current);
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const delay = immediate ? 0 : 350;
    searchTimeout.current = setTimeout(() => {
      const term = q.trim().toLowerCase();
      const found: SearchResult[] = [];

      const booksToSearch = sc === 'bible'
        ? versionBooks
        : activeBook ? [activeBook] : versionBooks;

      if (!booksToSearch) {
        setSearching(false);
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
      setSearching(false);
    }, delay);
  }, [versionBooks, activeBook, chapter]);

  const handleChangeQuery = (q: string) => {
    setQuery(q);
    saveQuery(q);
    runSearch(q, scope);
    router.setParams({ query: q });
  };

  useEffect(() => {
    if (loaded && query.trim().length >= 2) {
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
    setQuery(term);
    saveQuery(term);
    addToHistory(term);
    runSearch(term, scope, true);
    router.setParams({ query: term });
  };

  const handleNavigate = (r: SearchResult) => {
    addToHistory(query.trim());
    router.push({ pathname: '/bible', params: { book: r.bookAbbrev, ch: r.chapter, v: r.verse, ver: version } } as any);
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
  const showNoResults = !searching && query.trim().length >= 2 && results.length === 0;
  const showResults = !searching && results.length > 0;

  if (!loaded || !versionBooks) {
    return <BibleSkeleton />;
  }

  const btnBg = colors.onPrimary + '4D';
  const btnText = colors.onPrimary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BibleHeader
        showMenu={params.from !== 'bible'}
        showBack={params.from === 'bible'}
        onBack={() => handleSmartBack(pathname)}
        onMenuPress={() => setDrawerVisible(true)}
        leftContent={
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: btnBg }]} onPress={() => setVersionModalVisible(true)}>
              <BibleText style={[styles.navBtnText, { color: btnText }]}>{version}</BibleText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: btnBg }]} onPress={() => setBookModalVisible(true)}>
              <BibleText style={[styles.navBtnText, { color: btnText }]}>{currentBook.name}</BibleText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: btnBg }]} onPress={() => setChapterModalVisible(true)}>
              <BibleText style={[styles.navBtnText, { color: btnText }]}>{chapter}</BibleText>
            </TouchableOpacity>
          </View>
        }
      />

      <View style={[styles.searchContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
          <Feather name="search" size={ms(18)} color={colors.primary} style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            style={[styles.input, Platform.select({ web: { outline: 'none', outlineWidth: 0 } as any, default: {} }), { fontSize: ms(15), color: colors.onSurface }]}
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
            <TouchableOpacity onPress={handleClearQuery} style={{ padding: 4 }}>
              <Feather name="x" size={ms(16)} color={colors.textMuted} />
            </TouchableOpacity>
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

      {searching ? (
        <BibleSkeleton onlyContent />
      ) : showEmpty ? (
        <View style={styles.centerBox}>
          <Feather name="search" size={ms(48)} color={colors.border} />
          <BibleText style={[styles.hint, { color: colors.textMuted, fontSize: ms(15), marginTop: 12 }]}>
            Pesquise uma palavra ou frase
          </BibleText>
          <BibleText style={[styles.hint, { color: colors.textMuted, fontSize: ms(13), marginTop: 4 }]}>
            Bíblia toda, livro ou capítulo
          </BibleText>
        </View>
      ) : showHistory ? (
        <FlatList
          data={history}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <BibleText style={{ fontWeight: '800', color: colors.textMuted, fontSize: ms(12), letterSpacing: 0.5 }}>
                BUSCAS RECENTES
              </BibleText>
              <TouchableOpacity onPress={clearHistory} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary + '15', borderRadius: 12 }}>
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
              <View style={{ width: ms(32), height: ms(32), borderRadius: ms(10), backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Feather name="clock" size={ms(14)} color={colors.onPrimary} />
              </View>
              <BibleText style={[styles.historyText, { color: colors.onSurface, fontSize: ms(15), flex: 1 }]}>
                {item}
              </BibleText>
              <TouchableOpacity onPress={() => removeFromHistory(item)} style={{ padding: 6, backgroundColor: colors.error + '20', borderRadius: ms(14) }}>
                <Feather name="x" size={ms(12)} color={colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      ) : showTooShort ? (
        <View style={styles.centerBox}>
          <BibleText style={[styles.hint, { color: colors.textMuted, fontSize: ms(14) }]}>
            Digite ao menos 2 caracteres
          </BibleText>
        </View>
      ) : showNoResults ? (
        <View style={styles.centerBox}>
          <Feather name="search" size={ms(40)} color={colors.border} />
          <BibleText style={[styles.hint, { color: colors.textMuted, fontSize: ms(15), marginTop: 12 }]}>
            Nenhum resultado encontrado
          </BibleText>
          <BibleText style={[styles.hint, { color: colors.textMuted, fontSize: ms(13), marginTop: 4 }]}>
            "{query.trim()}"
          </BibleText>
        </View>
      ) : showResults ? (
        <FlatList
          data={results}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <BibleText style={[styles.resultCount, { color: colors.textMuted, fontSize: ms(12) }]}>
              {results.length >= 300 ? '300+ resultados' : `${results.length} resultado${results.length !== 1 ? 's' : ''}`}
            </BibleText>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.75}
              style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleNavigate(item)}
            >
              <View style={[styles.refBadge, { backgroundColor: colors.primary, paddingVertical: ms(2) }]}>
                <BibleText style={[styles.refText, { color: colors.onPrimary, fontSize: ms(11 * fontSizeMultiplier) }]}>
                  {item.bookName} {item.chapter}:{item.verse}
                </BibleText>
              </View>
              <View style={{ flex: 1, marginTop: 6 }}>
                <HighlightText text={item.text} query={query.trim()} colors={colors} fontSizeMultiplier={fontSizeMultiplier} ms={ms} />
              </View>
            </TouchableOpacity>
          )}
        />
      ) : null}

      <BibleDrawerMenu
        visible={drawerVisible}
        activeItem="search"
        onClose={() => setDrawerVisible(false)}
        onSelectItem={() => { }}
        onOpenDonate={() => { setDrawerVisible(false); setTimeout(() => setDonateVisible(true), 250); }}
      />

      <DonateModal visible={donateVisible} onClose={() => setDonateVisible(false)} />
      <BibleModals
        versionBooks={versionBooks}
        currentBook={currentBook}
        chapter={chapter}
        chapterCount={chapterCount}
        versionModalVisible={versionModalVisible}
        bookModalVisible={bookModalVisible}
        chapterModalVisible={chapterModalVisible}
        verseModalVisible={verseModalVisible}
        setVersionModalVisible={setVersionModalVisible}
        setBookModalVisible={setBookModalVisible}
        setChapterModalVisible={setChapterModalVisible}
        setVerseModalVisible={setVerseModalVisible}
        skipVerseSelection={true}
        onVersionSelect={(v) => {
          setVersion(v);
        }}
        onBookSelect={(b) => {
          setBook(b);
          // Chapter selection will follow
        }}
        onChapterSelect={(c) => {
          setChapter(c);
        }}
        onVerseSelect={() => { }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: { flex: 1, height: '100%' },
  segmentedControl: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    height: 40,
  },
  segmentItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  scopeLabel: { fontWeight: '700' },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  hint: { textAlign: 'center' },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyTitle: { fontWeight: '700', letterSpacing: 0.5 },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  historyText: { fontWeight: '500' },
  resultCount: {
    marginBottom: 8,
    fontWeight: '600',
  },
  resultCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  refBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  refText: { fontWeight: '700' },
  verseText: { fontSize: 14, lineHeight: 20 },
  navBtn: { height: 38, paddingHorizontal: 12, marginHorizontal: 3, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  navBtnText: { fontSize: 15, fontWeight: '700' },
});
