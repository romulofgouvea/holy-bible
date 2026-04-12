import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { STORAGE_KEYS } from '@/constants/storage';
import { availableVersions, getBibleData } from '@/data';

/**
 * Strips only diacritics (accents), lowercases.
 * "Êx" -> "ex", "Jó" -> "jo", "João" -> "joao"
 */
function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Finds a book by URL slug with the following priority:
 *  1. Case-insensitive + ACCENT-PRESERVING abbrev match  → "jo" → "Jo" (João), "jó" → "Jó" (Jó)
 *  2. Case-insensitive + accent-STRIPPED abbrev match    → "ex" → "Êx" (Êxodo)
 *  3. Case-insensitive + accent-STRIPPED name match      → "joao" → "João"
 *
 * Step 1 must come before step 2 so that "jo" and "jó" remain distinct.
 */
function findBookBySlug(books: { abbrev: string; name: string }[], slug: string) {
  const slugLower = slug.toLowerCase();          // keeps accents: "jó" stays "jó"
  const slugStripped = stripAccents(slug);       // removes accents: "jó" → "jo"

  // 1. Exact case-insensitive abbrev (accent-preserving) — distinguishes jo vs jó
  const byAbbrevExact = books.find((b) => b.abbrev.toLowerCase() === slugLower);
  if (byAbbrevExact) return byAbbrevExact;

  // 2. Accent-stripped abbrev — handles "ex" → "Êx", "dt" → "Dt"
  const byAbbrevStripped = books.find((b) => stripAccents(b.abbrev) === slugStripped);
  if (byAbbrevStripped) return byAbbrevStripped;

  // 3. Accent-stripped full name — handles "apocalipse", "genesis", "joao"
  const byName = books.find((b) => stripAccents(b.name) === slugStripped);
  if (byName) return byName;

  return null;
}


/**
 * Intercepts direct URL access like /bible/naa/dt/8.
 * Saves the desired position to AsyncStorage so bible/index.tsx loads it,
 * then redirects to /bible (the actual screen).
 */
export default function BibleChapterRoute() {
  const { version, book, chapter } = useLocalSearchParams<{
    version: string;
    book: string;
    chapter: string;
  }>();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    const v = (version || availableVersions[0] || 'NAA').toUpperCase();
    const ch = Number(chapter) || 1;

    // Resolve book abbreviation from URL slug (handles case + accents)
    const books = getBibleData(v);
    const bookObj = findBookBySlug(books, book || 'gn');
    const abbrev = bookObj?.abbrev || book || 'Gn';

    // Override last read so bible/index.tsx loads this exact position
    Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.LAST_READ, JSON.stringify({ version: v, book: abbrev, chapter: ch })),
      AsyncStorage.setItem(STORAGE_KEYS.BIBLE_VERSION_GLOBAL, v),
    ]).finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <Redirect href="/bible" />;
}
