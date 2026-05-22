import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

const VERSIONS = ['ara', 'naa', 'nvt'];
const BASE_URL = 'https://www.bibliaonline.com.br';

interface BookReference {
  abbrev: string;
  name: string;
  chapters: number;
}

interface VerseTitle {
  title: string;
  startVerse: number;
  endVerse: number;
  type: string;
  positionIndex: number;
}

interface ChapterTitle {
  number: number;
  titles: VerseTitle[];
}

interface BookTitle {
  name: string;
  abbrev: string;
  chapters: ChapterTitle[];
}

const BIBLE_DATA_PATH = path.join(process.cwd(), 'src/data/bible-version/ara.json');

async function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 308) && res.headers.location) {
        const loc = res.headers.location;
        const redirectUrl = loc.startsWith('http') ? loc : BASE_URL + loc;
        return https.get(redirectUrl, (redirectRes) => {
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

const OUTPUT_DIR = path.join(process.cwd(), 'src/data/bible-titles');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function main() {
  console.log(`Loading reference book data to determine chapters...`);
  const rawData = fs.readFileSync(BIBLE_DATA_PATH, 'utf8');
  const araData = JSON.parse(rawData);

  const books: BookReference[] = araData.map((b: any) => ({
    abbrev: b.abbrev,
    name: b.name,
    chapters: b.chapters.length
  }));

  const totalChapters = books.reduce((acc, book) => acc + book.chapters, 0);

  for (const version of VERSIONS) {
    const outputPath = path.join(OUTPUT_DIR, `${version}-titles.json`);
    if (fs.existsSync(outputPath)) {
      console.log(`\nSkipping ${version.toUpperCase()} - file already exists at ${outputPath}`);
      continue;
    }

    console.log(`\n--- Starting scraper for version ${version.toUpperCase()} (${totalChapters} chapters) ---`);
    
    // Load local version JSON to find exactly where the text matches
    const versionDataPath = path.join(process.cwd(), `src/data/bible-version/${version.toUpperCase()}.json`);
    let localBibleData: any[] = [];
    if (fs.existsSync(versionDataPath)) {
      localBibleData = JSON.parse(fs.readFileSync(versionDataPath, 'utf8'));
    } else {
      console.warn(`Local data for ${version.toUpperCase()} not found, index fallback to 0`);
    }

    const versionBooks: BookTitle[] = [];
    let processedChapters = 0;

    for (const book of books) {
      const abbrev = book.abbrev.toLowerCase();
      let urlAbbrev = abbrev.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (urlAbbrev === 'jo' && book.name === 'Jó') {
        urlAbbrev = 'job';
      }

      const localBook = localBibleData.find(b => b.abbrev.toLowerCase() === abbrev);
      
      const bookTitle: BookTitle = {
        name: book.name,
        abbrev: book.abbrev,
        chapters: []
      };

      for (let chapter = 1; chapter <= book.chapters; chapter++) {
        const url = `${BASE_URL}/${version}/${urlAbbrev}/${chapter}`;

        try {
          const html = await fetchHtml(url);
          const $ = cheerio.load(html);

          const chapterVerses: VerseTitle[] = [];

          $('div.s').each((_, el) => {
            const title = $(el).find('span.t').text().trim();
            const dataV = $(el).attr('data-v');
            
            let type = 'section';
            if ($(el).hasClass('sp')) type = 'speech';
            else if ($(el).hasClass('l1') || $(el).hasClass('l2')) type = 'subsection';

            // Extract the following text to locate where in the verse this title goes
            let nextElem = $(el).next();
            // Skip over other title divs if there are multiple in a row
            while (nextElem.length > 0 && nextElem.hasClass('s')) {
              nextElem = nextElem.next();
            }
            let positionText = '';
            if (nextElem.length > 0) {
              positionText = nextElem.text().replace(/\n/g, ' ').replace(/^\d+\s*/, '').trim().substring(0, 40);
            }

            if (title && dataV) {
              const verseParts = dataV.split('.').filter(Boolean);
              if (verseParts.length > 0) {
                const startVerse = parseInt(verseParts[0], 10);
                const endVerse = parseInt(verseParts[verseParts.length - 1], 10);
                let positionIndex = 0;

                if (localBook && localBook.chapters[chapter - 1]) {
                  const localVerseText = localBook.chapters[chapter - 1][startVerse - 1];
                  if (localVerseText && positionText) {
                    const idx = localVerseText.indexOf(positionText);
                    if (idx !== -1) {
                      positionIndex = idx;
                    } else {
                      const firstWord = positionText.split(' ')[0];
                      const idx2 = localVerseText.indexOf(firstWord);
                      if (idx2 !== -1) positionIndex = idx2;
                    }
                  }
                }

                chapterVerses.push({
                  title,
                  startVerse,
                  endVerse,
                  type,
                  positionIndex
                });
                console.log(`${version.toUpperCase()}/${book.name}/${chapter}/${startVerse}-${endVerse} [${type}, idx:${positionIndex}]: ${title}`);
              }
            }
          });

          if (chapterVerses.length > 0) {
            bookTitle.chapters.push({
              number: chapter,
              titles: chapterVerses
            });
          }

          processedChapters++;
          process.stdout.write(`\rProgress [${version.toUpperCase()}]: ${processedChapters}/${totalChapters} (Book: ${book.name}, Chapter: ${chapter})`);
        } catch (error: any) {
          console.error(`\nError fetching ${url}:`, error.message);
        }

        await delay(30);
      }
      
      if (bookTitle.chapters.length > 0) {
        versionBooks.push(bookTitle);
      }
    }

    const outputData = {
      version: version.toUpperCase(),
      books: versionBooks
    };

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    console.log(`\nSaved ${version.toUpperCase()} titles to ${outputPath}`);
  }

  console.log(`\n\nSuccess! Extracted titles for ${VERSIONS.join(', ')}.`);
}

main().catch(console.error);
