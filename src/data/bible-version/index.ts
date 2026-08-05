import bibleVersions from "./bible-versions.json";

import { BibleVersionInfo, Book } from "../../models";

export type { BibleVersionInfo, Book };

export const ALIASES = bibleVersions as BibleVersionInfo[];
export const availableVersions = ALIASES.map((v) => v.sigla);

const jsonContext =
  typeof (require as any).context === "function"
    ? (require as any).context(".", false, /\.json$/)
    : null;

const bibleDataFiles: Record<string, any> = {};

ALIASES.forEach((v) => {
  try {
    if (jsonContext) {
      bibleDataFiles[v.sigla] = jsonContext(`./${v.sigla}.json`);
    }
  } catch {}
});

export const getBibleData = (sigla: string): Book[] => {
  try {
    const data = bibleDataFiles[sigla];

    if (!data) {
      return [];
    }

    if (data.books && Array.isArray(data.books)) return data.books;
    if (Array.isArray(data)) return data;

    return [];
  } catch {
    return [];
  }
};
