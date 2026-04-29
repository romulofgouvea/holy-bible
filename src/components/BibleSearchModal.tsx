import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Book } from '../data';
import { useResponsive } from '../hooks/use-responsive';
import { useTheme } from '../hooks/use-theme';
import { BibleText } from './BibleText';

export type SearchScope = 'bible' | 'book' | 'chapter';

export type SearchResult = {
  bookName: string;
  bookAbbrev: string;
  chapter: number;
  verse: number;
  text: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  books: Book[];
  currentBookAbbrev: string;
  currentChapter: number;
  onNavigate: (bookAbbrev: string, chapter: number, verse: number) => void;
};

const SCOPES: { key: SearchScope; label: string }[] = [
  { key: 'bible', label: 'Bíblia toda' },
  { key: 'book', label: 'Livro' },
  { key: 'chapter', label: 'Capítulo' },
];

const STORAGE_SEARCH_SCOPE = '@bible:search_scope';
const STORAGE_SEARCH_QUERY = '@bible:search_query';
const STORAGE_SEARCH_HISTORY = '@bible:search_history';
const MAX_HISTORY = 20;

function HighlightText({ text, query, primaryColor }: { text: string; query: string; primaryColor: string }) {
  if (!query.trim()) return <BibleText style={styles.verseText}>{text}</BibleText>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <BibleText style={styles.verseText}>{text}</BibleText>;
  return (
    <BibleText style={styles.verseText}>
      {text.slice(0, idx)}
      <BibleText style={[styles.verseText, { backgroundColor: primaryColor + '33', color: primaryColor, fontWeight: '700' }]}>
        {text.slice(idx, idx + query.length)}
      </BibleText>
      {text.slice(idx + query.length)}
    </BibleText>
  );
}

export function BibleSearchModal({ visible, onClose, books, currentBookAbbrev, currentChapter, onNavigate }: Props) {
  const { ms } = useResponsive();
  const { colors } = useTheme();

  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('bible');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

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
        if (savedQuery) setQuery(savedQuery);
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

  const currentBook = useMemo(
    () => books.find(b => b.abbrev === currentBookAbbrev) || books[0],
    [books, currentBookAbbrev]
  );

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
        ? books
        : currentBook ? [currentBook] : books;

      for (const book of booksToSearch) {
        const chaptersToSearch = sc === 'chapter'
          ? [{ idx: currentChapter - 1, verses: book.chapters[currentChapter - 1] || [] }]
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
  }, [books, currentBook, currentChapter]);

  useEffect(() => {
    if (loaded && query.trim().length >= 2) {
      runSearch(query, scope, true);
    }
  }, [loaded]);

  const handleChangeQuery = (q: string) => {
    setQuery(q);
    saveQuery(q);
    runSearch(q, scope);
  };

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
  };

  const handleNavigate = (r: SearchResult) => {
    addToHistory(query.trim());
    onNavigate(r.bookAbbrev, r.chapter, r.verse);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  const handleClearQuery = () => {
    setQuery('');
    saveQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  if (!visible) return null;

  const showHistory = query.trim().length === 0 && history.length > 0;
  const showEmpty = query.trim().length === 0 && history.length === 0;
  const showTooShort = query.trim().length > 0 && query.trim().length < 2;
  const showNoResults = !searching && query.trim().length >= 2 && results.length === 0;
  const showResults = !searching && results.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleClose} style={styles.backBtn}>
          <Feather name="arrow-left" size={ms(22)} color={colors.primary} />
        </TouchableOpacity>

        <View style={[styles.searchBox, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Feather name="search" size={ms(18)} color={colors.primary} style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { fontSize: ms(15), color: colors.text }]}
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
      </View>

      <View style={[styles.scopeRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {SCOPES.map(s => (
          <TouchableOpacity
            key={s.key}
            style={[styles.scopeBtn, scope === s.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => handleChangeScope(s.key)}
          >
            <BibleText style={[styles.scopeLabel, { color: scope === s.key ? colors.primary : colors.textMuted, fontSize: ms(13) }]}>
              {s.label}
            </BibleText>
          </TouchableOpacity>
        ))}
      </View>

      {searching ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
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
          ListHeaderComponent={
            <View style={[styles.historyHeader, { borderBottomColor: colors.border }]}>
              <BibleText style={[styles.historyTitle, { color: colors.textMuted, fontSize: ms(12) }]}>
                HISTÓRICO
              </BibleText>
              <TouchableOpacity onPress={clearHistory}>
                <BibleText style={[{ color: colors.primary, fontSize: ms(12), fontWeight: '700' }]}>
                  Limpar
                </BibleText>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.historyItem, { borderBottomColor: colors.border }]}
              onPress={() => handleHistorySelect(item)}
            >
              <Feather name="clock" size={ms(16)} color={colors.textMuted} style={{ marginRight: 12 }} />
              <BibleText style={[styles.historyText, { color: colors.text, fontSize: ms(15), flex: 1 }]}>
                {item}
              </BibleText>
              <TouchableOpacity onPress={() => removeFromHistory(item)} style={{ padding: 4 }}>
                <Feather name="x" size={ms(14)} color={colors.textMuted} />
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
              <View style={[styles.refBadge, { backgroundColor: colors.primaryContainer }]}>
                <BibleText style={[styles.refText, { color: colors.primary, fontSize: ms(11) }]}>
                  {item.bookName} {item.chapter}:{item.verse}
                </BibleText>
              </View>
              <View style={{ flex: 1, marginTop: 6 }}>
                <HighlightText text={item.text} query={query.trim()} primaryColor={colors.primary} />
              </View>
            </TouchableOpacity>
          )}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  backBtn: { padding: 4 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: { flex: 1, height: '100%' },
  scopeRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  scopeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
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
});
