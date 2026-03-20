import bibleVersions from './bible-versions.json';

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

export const ALIASES = bibleVersions as BibleVersionInfo[];
export const availableVersions = ALIASES.map(v => v.sigla);

// Metro bundler magic context to dynamically bundle all adjacent .json files:
// @ts-ignore
const jsonContext = require.context('.', false, /\.json$/);

const bibleDataFiles: Record<string, any> = {};

ALIASES.forEach(v => {
  try {
    bibleDataFiles[v.sigla] = jsonContext(`./${v.sigla}.json`);
  } catch (e) {
    console.warn(`[BibleData] Aviso: Arquivo ${v.sigla}.json não encontrado na compilação.`);
  }
});

export const getBibleData = (sigla: string): Book[] => {
  try {
    const data = bibleDataFiles[sigla];
    
    if (!data) {
      console.warn(`[BibleData] Versão ${sigla} não foi montada no Record. Verifique os arquivos JSON.`);
      return [];
    }
    
    // Normalizes different json structuring out of the box
    if (data.books && Array.isArray(data.books)) return data.books;
    if (Array.isArray(data)) return data;
    
    return [];
  } catch (error) {
    console.warn(`[BibleData] Erro ao carregar versão ${sigla}.`);
    return [];
  }
};
