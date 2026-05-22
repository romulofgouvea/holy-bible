import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

const VERSIONS = [
  { id: '1608', sigla: 'ara' },
  // { id: '1840', sigla: 'naa' },
  // { id: '4360', sigla: 'nvi' },
  // { id: '1930', sigla: 'nvt' }
];
const BASE_URL = 'https://www.bible.com/pt/bible';

const BIBLE_COM_MAPPING: Record<string, string> = {
  'gn': 'GEN', 'ex': 'EXO', 'êx': 'EXO', 'lv': 'LEV', 'nm': 'NUM', 'dt': 'DEU',
  'js': 'JOS', 'jz': 'JDG', 'rt': 'RUT', '1sm': '1SA', '2sm': '2SA',
  '1rs': '1KI', '2rs': '2KI', '1cr': '1CH', '2cr': '2CH', 'ed': 'EZR',
  'ne': 'NEH', 'et': 'EST', 'jó': 'JOB', 'job': 'JOB', 'sl': 'PSA',
  'pv': 'PRO', 'ec': 'ECC', 'ct': 'SNG', 'is': 'ISA', 'jr': 'JER',
  'lm': 'LAM', 'ez': 'EZK', 'dn': 'DAN', 'os': 'HOS', 'jl': 'JOL',
  'am': 'AMO', 'ob': 'OBA', 'jn': 'JON', 'mq': 'MIC', 'na': 'NAM',
  'hc': 'HAB', 'sf': 'ZEP', 'ag': 'HAG', 'zc': 'ZEC', 'ml': 'MAL',
  'mt': 'MAT', 'mc': 'MRK', 'lc': 'LUK', 'jo': 'JHN', 'at': 'ACT',
  'rm': 'ROM', '1co': '1CO', '2co': '2CO', 'gl': 'GAL', 'ef': 'EPH',
  'fp': 'PHP', 'cl': 'COL', '1ts': '1TH', '2ts': '2TH', '1tm': '1TI',
  '2tm': '2TI', 'tt': 'TIT', 'fm': 'PHM', 'hb': 'HEB', 'tg': 'JAS',
  '1pe': '1PE', '2pe': '2PE', '1jo': '1JN', '2jo': '2JN', '3jo': '3JN',
  'jd': 'JUD', 'ap': 'REV'
};

const BIBLE_DATA_PATH = path.join(process.cwd(), 'src/data/bible-version/ara.json');
const OUTPUT_DIR = path.join(process.cwd(), 'src/data/bible-titles');

async function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 308) && res.headers.location) {
        const loc = res.headers.location;
        const redirectUrl = loc.startsWith('http') ? loc : `https://www.bible.com${loc}`;
        return https.get(redirectUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (redirectRes) => {
          let data = '';
          redirectRes.on('data', chunk => data += chunk);
          redirectRes.on('end', () => resolve(data));
        }).on('error', reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url}. Status code: ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function main() {
  const rawData = fs.readFileSync(BIBLE_DATA_PATH, 'utf8');
  const araData = JSON.parse(rawData);

  const books = araData.map((b: any) => ({
    abbrev: b.abbrev.toLowerCase(),
    name: b.name,
    chapters: b.chapters.length
  }));

  for (const { id: versionId, sigla: versionSigla } of VERSIONS) {
    const versionBooks: any[] = [];
    const outputPath = path.join(OUTPUT_DIR, `${versionSigla}-titles-biblecom.json`);

    const versionDataPath = path.join(process.cwd(), `src/data/bible-version/${versionSigla.toUpperCase()}.json`);
    let localBibleData: any[] = [];
    if (fs.existsSync(versionDataPath)) {
      localBibleData = JSON.parse(fs.readFileSync(versionDataPath, 'utf8'));
    }

    const oldTitlesPath = path.join(process.cwd(), `src/data/bible-titles/${versionSigla}-titles.json`);
    let oldTitlesData: any = null;
    if (fs.existsSync(oldTitlesPath)) {
      oldTitlesData = JSON.parse(fs.readFileSync(oldTitlesPath, 'utf8'));
    }

    for (const book of books) {
      let bibleComAbbrev = BIBLE_COM_MAPPING[book.abbrev];
      if (book.name === 'Jó') bibleComAbbrev = 'JOB';
      if (book.name === 'João') bibleComAbbrev = 'JHN';

      if (!bibleComAbbrev) {
        console.log('Missing mapping for', book.abbrev);
        continue;
      }

      const bookTitle = {
        name: book.name,
        abbrev: book.abbrev,
        chapters: [] as any[]
      };

      const localBook = localBibleData.find(b => b.abbrev.toLowerCase() === book.abbrev);

      for (let chapter = 1; chapter <= book.chapters; chapter++) {
        const url = `${BASE_URL}/${versionId}/${bibleComAbbrev}.${chapter}.${versionSigla.toUpperCase()}`;

        const oldBook = oldTitlesData?.books.find((b: any) => b.abbrev.toLowerCase() === book.abbrev.toLowerCase());
        const oldChapter = oldBook?.chapters.find((c: any) => c.number === chapter);
        const oldChapterTitles = oldChapter?.titles || [];

        try {
          const html = await fetchHtml(url);
          const $ = cheerio.load(html);
          const chapterVerses: any[] = [];

          const elements = $('[class*="__s"], [class*="__sp"], [class*="__d"], span[data-usfm]');

          let chapterTitles: any[] = [];
          let pendingStartTitles: any[] = [];
          let maxVerse = 0;
          let positionIndex = 0;

          elements.each((_, el) => {
            const className = $(el).attr('class') || '';
            const isSection = /(^|\s)[a-zA-Z0-9_-]+__s(\s|$)/.test(className);
            const isSubSection = /(^|\s)[a-zA-Z0-9_-]+__(s\d+|d\d*)(\s|$)/.test(className);
            const isSpeech = /(^|\s)[a-zA-Z0-9_-]+__sp\d*(\s|$)/.test(className);

            if (isSection || isSubSection || isSpeech) {
              const titleText = $(el).text().trim();
              if (!titleText) return;

              let tType = 'section';
              if (isSpeech) tType = 'speech';
              else if (isSubSection) tType = 'subsection';

              const newTitle = {
                title: titleText,
                startVerse: -1,
                endVerse: -1,
                type: tType,
                positionIndex: 0,
                _verseBefore: maxVerse
              };
              chapterTitles.push(newTitle);
              pendingStartTitles.push(newTitle);
            }

            const usfm = $(el).attr('data-usfm');
            if (usfm) {
              const parts = usfm.split('.');
              if (parts.length >= 3) {
                const vBook = parts[0];
                const vChap = parseInt(parts[1], 10);
                const vVerse = parseInt(parts[2], 10);

                // bibleComAbbrev is something like "GEN"
                if (vBook === bibleComAbbrev && vChap === chapter && !isNaN(vVerse)) {
                  pendingStartTitles.forEach(t => t.startVerse = vVerse);
                  pendingStartTitles = [];

                  if (vVerse > maxVerse) {
                    maxVerse = vVerse;
                  }
                }
              }
            }
          });

          // Fallback if some titles appeared after all verses
          pendingStartTitles.forEach(t => t.startVerse = maxVerse);

          // Calculate endVerses based on title type
          for (let i = 0; i < chapterTitles.length; i++) {
            let endV = maxVerse;
            if (chapterTitles[i].type === 'section') {
              // End at the verse before the NEXT section title
              for (let j = i + 1; j < chapterTitles.length; j++) {
                if (chapterTitles[j].type === 'section') {
                  endV = chapterTitles[j]._verseBefore;
                  break;
                }
              }
            } else if (chapterTitles[i].type === 'subsection') {
              // End at the verse before the NEXT section or subsection
              for (let j = i + 1; j < chapterTitles.length; j++) {
                if (chapterTitles[j].type === 'section' || chapterTitles[j].type === 'subsection') {
                  endV = chapterTitles[j]._verseBefore;
                  break;
                }
              }
            } else {
              // End at the verse before the NEXT title (any type)
              if (i < chapterTitles.length - 1) {
                endV = chapterTitles[i + 1]._verseBefore;
              }
            }
            chapterTitles[i].endVerse = Math.max(chapterTitles[i].startVerse, endV);
            delete chapterTitles[i]._verseBefore;

            // Inherit positionIndex from the old file
            const oldT = oldChapterTitles.find((t: any) => t.title === chapterTitles[i].title);
            if (oldT) {
                if (oldT.startVerse === chapterTitles[i].startVerse) {
                    chapterTitles[i].positionIndex = oldT.positionIndex;
                } else if (oldT.startVerse === chapterTitles[i].startVerse + 1 && localBook && localBook.chapters[chapter - 1]) {
                    const prevVerseText = localBook.chapters[chapter - 1][chapterTitles[i].startVerse - 1];
                    if (prevVerseText) {
                        chapterTitles[i].positionIndex = prevVerseText.length;
                    }
                }
            }
          }

          if (chapterTitles.length > 0) {
            for (const cv of chapterTitles) {
              console.log(`${versionSigla.toUpperCase()}/${book.name}/${chapter}/${cv.startVerse}${cv.startVerse !== cv.endVerse ? '-' + cv.endVerse : ''} [${cv.type}, idx:${cv.positionIndex}]: ${cv.title}`);
            }

            bookTitle.chapters.push({
              number: chapter,
              titles: chapterTitles
            });
          }

        } catch (err: any) {
          console.error(`Error ${url}: ${err.message}`);
        }

        await delay(50);
      }

      if (bookTitle.chapters.length > 0) {
        versionBooks.push(bookTitle);
      }
    }

    const outputData = {
      version: versionSigla.toUpperCase(),
      books: versionBooks
    };

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    console.log(`Saved ${versionSigla} to ${outputPath}`);
  }
}

main().catch(console.error);
