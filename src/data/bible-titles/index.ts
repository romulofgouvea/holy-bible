import { VersionTitle } from "../../models";

const jsonContext =
  typeof (require as any).context === "function"
    ? (require as any).context(".", false, /\.json$/)
    : null;

const titlesDataFiles: Record<string, VersionTitle> = {};

export const getBibleTitles = (sigla: string): VersionTitle | null => {
  try {
    if (titlesDataFiles[sigla]) {
      return titlesDataFiles[sigla];
    }

    if (!jsonContext) {
      return null;
    }

    const data = jsonContext(`./${sigla.toLowerCase()}-titles.json`);
    if (data) {
      titlesDataFiles[sigla] = data as VersionTitle;
      return titlesDataFiles[sigla];
    }
    return null;
  } catch {
    return null;
  }
};
