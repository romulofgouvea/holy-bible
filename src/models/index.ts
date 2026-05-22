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

// Reading Plan Domain Models
export type ReadingPlanEntry = {
  bookAbbrev: string;
  chapter: number;
};

export type ReadingPlanDay = {
  day: number;
  entries: ReadingPlanEntry[];
  isCompleted: boolean;
  completedAt?: number;
  group?: string;
  label?: string;
  reading?: string;
};

export type ReadingPlan = {
  id: string;
  templateId: string;
  title: string;
  totalDays: number;
  startedAt: number;
  days: ReadingPlanDay[];
};

export type ActiveBiblePlanDay = {
  isCompleted: boolean;
  completedAt?: number;
};

export type ActiveBiblePlan = {
  id: string;
  templateId: string;
  title: string;
  startedAt: number;
  completedDays: Record<string, ActiveBiblePlanDay>;
  completedChapters?: Record<string, ActiveBiblePlanDay>;
};

// Reader Settings Domain Models
export type ReaderTheme = 'light' | 'dark' | 'sepia';
export type ReaderFont = 'poppins' | 'monospace';
export type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify';

// Bible Title Models
export interface VerseTitle {
  title: string;
  startVerse: number;
  endVerse: number;
  type: 'section' | 'subsection' | 'speech' | string;
  positionIndex: number;
}

export interface ChapterTitle {
  number: number;
  titles: VerseTitle[];
}

export interface BookTitle {
  name: string;
  abbrev: string;
  chapters: ChapterTitle[];
}

export interface VersionTitle {
  version: string;
  books: BookTitle[];
}
