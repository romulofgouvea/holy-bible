/**
 * Centralized Domain Models for the Holy Bible application
 */

// Bible Domain Models
export type Book = {
  abbrev: string;
  name: string;
  chapters: string[][];
};

export type BibleVersionInfo = {
  name: string;
  sigla: string;
  year: number;
  publisher: string;
};

export interface HighlightItem {
  color: string;
  abbrev: string; // Replacing 'book' with 'abbrev' as requested
  chapter: number;
  verse: number;
}

export type SelectedVerse = {
  chapter: number;
  verse: number;
  text: string;
  bookName: string;
  bookAbbrev: string;
  version: string;
  compareText?: string;
  compareVersion?: string;
};

export type HistoryItem = {
  version: string;
  bookName: string;
  bookAbbrev: string;
  chapter: number;
  verse: number;
  timestamp: number;
};

// Studies Domain Models
export type Study = {
  id: string;
  title: string;
  createdAt: string;
  timestamp?: number;
  content: string;
  isActive?: boolean;
  deletedAt?: number;
};

// Reader Settings Domain Models
export type ReaderTheme = 'light' | 'dark' | 'sepia';
export type ReaderFont = 'poppins' | 'monospace';
export type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify';
