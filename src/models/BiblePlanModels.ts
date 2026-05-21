export type BiblePlanVerse = {
  chapter: number;
  startVerse?: number;
  endVerse?: number;
};

export type BiblePlanBook = {
  abbrev: string;
  name: string;
  chapters?: number[];
  verses?: BiblePlanVerse[];
};

export type BiblePlanDay = {
  day: number;
  reading: string;
  books: BiblePlanBook[];
};

export type BiblePlanMonth = {
  monthNumber: number;
  month: string;
  theme: string;
  days: BiblePlanDay[];
};

export type BiblePlanTemplate = {
  id: string;
  title: string;
  description: string;
  icon: string;
  months: BiblePlanMonth[];
};
