const fs = require('fs');
const https = require('https');
const cheerio = require('cheerio');

// CONFIGURAÇÃO
// const VERSION = 'acf';
// const TARGET_FILE = 'src/data/ACF.json';

const VERSION = 'ara';
const TARGET_FILE = 'src/data/ARA.json';

// const VERSION = 'naa'; 
// const TARGET_FILE = 'src/data/NAA.json';

// const VERSION = 'nvi'; 
// const TARGET_FILE = 'src/data/NVI.json';

// const VERSION = 'nvt'; 
// const TARGET_FILE = 'src/data/NVT.json';

const PROGRESS_FILE = `scripts/scrapper_progress_${VERSION}.json`;

const fetchHtml = (url) => new Promise((resolve, reject) => {
    https.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'Connection': 'keep-alive',
        }
    }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
            const redirectLocation = res.headers.location.startsWith('http')
                ? res.headers.location
                : new URL(res.headers.location, url).href;
            return fetchHtml(redirectLocation).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
            reject(new Error(`Status ${res.statusCode}`));
            return;
        }
        let chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }).on('error', reject);
});

const delay = ms => new Promise(r => setTimeout(r, ms));

function fixEncodingErrors(scrapedVerse, localVerse) {
    if (!localVerse || !scrapedVerse.includes('')) return scrapedVerse;

    let scrapedWords = scrapedVerse.split(' ');
    let localWords = localVerse.split(' ');

    if (scrapedWords.length === localWords.length) {
        for (let i = 0; i < scrapedWords.length; i++) {
            if (scrapedWords[i].includes('')) {
                scrapedWords[i] = localWords[i];
            }
        }
        return scrapedWords.join(' ');
    }

    let fixedVerse = scrapedVerse;
    const errorWordsMatches = [...scrapedVerse.matchAll(/\S*\S*/g)];

    for (const match of errorWordsMatches) {
        const errorWord = match[0];
        const wordIndex = scrapedWords.indexOf(errorWord);
        if (wordIndex !== -1 && localWords[wordIndex]) {
            fixedVerse = fixedVerse.replace(errorWord, localWords[wordIndex]);
        }
    }

    return fixedVerse;
}

function preserveLocalQuotes(scrapedVerse, localVerse) {
    if (!localVerse) return scrapedVerse;

    let normalizedScraped = scrapedVerse.replace(/["“”]/g, '"').replace(/['‘’]/g, "'");
    let normalizedLocal = localVerse.replace(/["“”]/g, '"').replace(/['‘’]/g, "'");

    if (normalizedScraped === normalizedLocal) {
        return localVerse;
    }

    let scrapedQuotes = scrapedVerse.match(/["“”]/g) || [];
    let localQuotes = localVerse.match(/["“”]/g) || [];

    if (scrapedQuotes.length === localQuotes.length && scrapedQuotes.length > 0) {
        let quoteIndex = 0;
        scrapedVerse = scrapedVerse.replace(/["“”]/g, () => localQuotes[quoteIndex++]);
    }

    let scrapedSingleQuotes = scrapedVerse.match(/['‘’]/g) || [];
    let localSingleQuotes = localVerse.match(/['‘’]/g) || [];

    if (scrapedSingleQuotes.length === localSingleQuotes.length && scrapedSingleQuotes.length > 0) {
        let singleQuoteIndex = 0;
        scrapedVerse = scrapedVerse.replace(/['‘’]/g, () => localSingleQuotes[singleQuoteIndex++]);
    }

    return scrapedVerse;
}

async function main() {
    console.log(`Carregando ${TARGET_FILE}...`);
    const bibleStruct = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf8'));

    let changedCount = 0;

    let startBookIndex = 0;
    let startChapterIndex = 0;

    if (fs.existsSync(PROGRESS_FILE)) {
        const prog = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        startBookIndex = prog.bookIndex || 0;
        startChapterIndex = prog.chapterIndex || 0;
        console.log(`Retomando scrap a partir do Livro Index ${startBookIndex}, Capítulo ${startChapterIndex + 1}...`);
    }

    for (let b = startBookIndex; b < bibleStruct.length; b++) {
        const book = bibleStruct[b];

        for (let c = (b === startBookIndex ? startChapterIndex : 0); c < book.chapters.length; c++) {
            const chNum = c + 1;

            let abbrev = book.abbrev.toLowerCase();
            if (abbrev !== 'jó') {
                abbrev = abbrev.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
            }

            const url = `https://www.bibliaonline.com.br/${VERSION}/${abbrev}/${chNum}`;

            console.log(`Scraping ${book.name} ${chNum}... (${url})`);

            let html;
            let success = false;
            let retries = 0;

            while (!success && retries <= 3) {
                try {
                    html = await fetchHtml(url);
                    success = true;
                } catch (e) {
                    retries++;
                    console.error(`Erro ao acessar ${url} (Tentativa ${retries}/3)... ${e.message}`);
                    if (retries <= 3) {
                        console.log(`Aguardando 5 segundos antes de tentar novamente...`);
                        await delay(5000);
                    }
                }
            }

            if (!success) {
                console.log(`\n[!] Processo abortado. Muitas falhas em ${url}.`);
                console.log(`O progresso foi salvo. Rode o script novamente para continuar de onde parou.\n`);
                return;
            }

            const $ = cheerio.load(html);
            const versesMap = {};

            $('article p span.t').each((i, el) => {
                const dataV = $(el).attr('data-v');
                if (!dataV) return;
                const vNumMatch = dataV.match(/\d+/);
                if (!vNumMatch) return;
                const vNum = parseInt(vNumMatch[0], 10);

                let text = $(el).text().trim();

                if (!versesMap[vNum]) versesMap[vNum] = [];
                versesMap[vNum].push(text);
            });

            const maxVerse = Math.max(0, ...Object.keys(versesMap).map(Number));
            const newChapter = [];
            for (let i = 1; i <= maxVerse; i++) {
                let scrapedVerse = versesMap[i] ? versesMap[i].join(' ').replace(/\s+/g, ' ').trim() : '';
                let localVerse = book.chapters[c][i - 1] || '';

                scrapedVerse = fixEncodingErrors(scrapedVerse, localVerse);

                newChapter[i - 1] = preserveLocalQuotes(scrapedVerse, localVerse);
            }

            if (newChapter.length > 0) {
                let difference = false;
                for (let i = 0; i < newChapter.length; i++) {
                    if (newChapter[i] !== book.chapters[c][i]) {
                        difference = true;
                        break;
                    }
                }

                if (difference) {
                    changedCount++;
                }

                book.chapters[c] = newChapter;
            } else {
                console.log(`[-] Nenhum versículo encontrado em ${url}.`);
            }

            // Salva o JSON da Biblia e o progresso
            fs.writeFileSync(TARGET_FILE, JSON.stringify(bibleStruct, null, 2));
            fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ bookIndex: b, chapterIndex: c + 1 }, null, 2));

            await delay(500);
        }
    }

    // FIM
    if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
    console.log(`Scrap concluído! ${changedCount} capítulos precisaram de ajuste nos versículos.`);
}

main();
