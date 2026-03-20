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

// ============================================================================
// ATENÇÃO: O compilador do React Native (Metro) exige caminhos explícitos.
// Para adicionar uma nova Bíblia (ex: NVI.json), faça apenas 2 coisas:
// 1. Cadastre no `bible-versions.json`
// 2. Adicione 1 ÚNICA LINHA no objeto abaixo mapeando a sigla pro arquivo:
// ============================================================================
const bibleDataFiles: Record<string, any> = {
  'KJF': require('./KJF.json'),
  'NAA': require('./NAA.json'),
  // 'NVI': require('./NVI.json'), <-- Exemplo de como adicionar a próxima!
};

export const getBibleData = (sigla: string): Book[] => {
  try {
    const data = bibleDataFiles[sigla];
    
    if (!data) {
      console.warn(`[BibleData] Versão ${sigla} não mapeada. Adicione no bibleDataFiles em data/index.ts.`);
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
