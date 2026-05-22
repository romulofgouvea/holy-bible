import { VersionTitle } from '../../models';

// @ts-ignore
const jsonContext = require.context('.', false, /\.json$/);

const titlesDataFiles: Record<string, VersionTitle> = {};

export const getBibleTitles = (sigla: string): VersionTitle | null => {
  try {
    if (titlesDataFiles[sigla]) {
      return titlesDataFiles[sigla];
    }
    
    const data = jsonContext(`./${sigla.toLowerCase()}-titles.json`);
    if (data) {
      titlesDataFiles[sigla] = data as VersionTitle;
      return titlesDataFiles[sigla];
    }
    return null;
  } catch (error) {
    return null;
  }
};
