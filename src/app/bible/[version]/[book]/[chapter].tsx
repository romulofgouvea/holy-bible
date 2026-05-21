import { STORAGE_KEYS } from '@/constants/storage';
import { availableVersions, getBibleData } from '@/data/bible-version';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function findBookBySlug(books: { abbrev: string; name: string }[], slug: string) {
  const slugLower = slug.toLowerCase();
  const slugStripped = stripAccents(slug);

  const byAbbrevExact = books.find((b) => b.abbrev.toLowerCase() === slugLower);
  if (byAbbrevExact) return byAbbrevExact;

  const byAbbrevStripped = books.find((b) => stripAccents(b.abbrev) === slugStripped);
  if (byAbbrevStripped) return byAbbrevStripped;

  const byName = books.find((b) => stripAccents(b.name) === slugStripped);
  if (byName) return byName;

  return null;
}

export default function BibleChapterRoute() {
  const { version, book, chapter, verse } = useLocalSearchParams<{
    version: string;
    book: string;
    chapter: string;
    verse?: string;
  }>();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = (version || availableVersions[0] || 'NAA').toUpperCase();
    const ch = Number(chapter) || 1;
    const ve = Number(verse) || 1;

    const books = getBibleData(v);
    const bookObj = findBookBySlug(books, book || 'gn');
    const abbrev = bookObj?.abbrev || book || 'Gn';

    Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.CURRENT_READ, JSON.stringify({ version: v, book: abbrev, chapter: ch, verse: ve })),
      AsyncStorage.setItem(STORAGE_KEYS.BIBLE_VERSION_GLOBAL, v),
    ]).finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <Redirect href="/bible" />;
}
