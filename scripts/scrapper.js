const fs = require('fs');
const https = require('https');
const cheerio = require('cheerio');

// CONFIGURAÇÃO
const VERSIONS_FILE = 'src/data/bible-versions.json';

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

function sanitizeVerse(verseText, localVerse) {
    if (!verseText) return '';
    let sanitized = verseText;

    // 1. Limpeza de espaços (invisíveis, extras e antes de pontuação)
    sanitized = sanitized.replace(/[\xA0\u200B-\u200D\uFEFF]/g, ' ');
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    sanitized = sanitized.replace(/\s+([.,:;!?”’])/g, '$1');

    // 2. Correção de Erros de Codificação (\ufffd)
    if (localVerse && sanitized.includes('\ufffd')) {
        let scrapedWords = sanitized.split(' ');
        let localWords = localVerse.split(' ');

        if (scrapedWords.length === localWords.length) {
            for (let i = 0; i < scrapedWords.length; i++) {
                if (scrapedWords[i].includes('\ufffd')) {
                    scrapedWords[i] = localWords[i];
                }
            }
            sanitized = scrapedWords.join(' ');
        } else {
            let fixedVerse = sanitized;
            const errorWordsMatches = [...sanitized.matchAll(/\S*\ufffd\S*/g)];
            for (const match of errorWordsMatches) {
                const errorWord = match[0];
                const wordIndex = scrapedWords.indexOf(errorWord);
                if (wordIndex !== -1 && localWords[wordIndex]) {
                    fixedVerse = fixedVerse.replace(errorWord, localWords[wordIndex]);
                }
            }
            sanitized = fixedVerse.includes('\ufffd') ? localVerse : fixedVerse;
        }
    }

    // 3. Preservação das Aspas Locais (Smart Quotes vs Retas)
    if (localVerse) {
        let normalizedScraped = sanitized.replace(/["“”]/g, '"').replace(/['‘’]/g, "'");
        let normalizedLocal = localVerse.replace(/["“”]/g, '"').replace(/['‘’]/g, "'");

        if (normalizedScraped === normalizedLocal) {
            sanitized = localVerse;
        } else {
            let scrapedQuotes = sanitized.match(/["“”]/g) || [];
            let localQuotes = localVerse.match(/["“”]/g) || [];
            if (scrapedQuotes.length === localQuotes.length && scrapedQuotes.length > 0) {
                let quoteIndex = 0;
                sanitized = sanitized.replace(/["“”]/g, () => localQuotes[quoteIndex++]);
            }

            let scrapedSingleQuotes = sanitized.match(/['‘’]/g) || [];
            let localSingleQuotes = localVerse.match(/['‘’]/g) || [];
            if (scrapedSingleQuotes.length === localSingleQuotes.length && scrapedSingleQuotes.length > 0) {
                let singleQuoteIndex = 0;
                sanitized = sanitized.replace(/['‘’]/g, () => localSingleQuotes[singleQuoteIndex++]);
            }
        }
    }

    return sanitized;
}

async function scrapeVersion(sigla) {
    const VERSION = sigla.toLowerCase();
    const TARGET_FILE = `src/data/${sigla}.json`;
    const PROGRESS_FILE = `scripts/scrapper_progress_${VERSION}.json`;

    if (!fs.existsSync(TARGET_FILE)) {
        console.log(`\n[!] Arquivo ${TARGET_FILE} não encontrado. Pulando versão ${sigla}...`);
        return true;
    }

    console.log(`\n======================================================`);
    console.log(` Iniciando scrap para a versão: ${sigla}`);
    console.log(`======================================================`);

    const bibleStruct = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf8'));

    let changedCount = 0;

    let startBookIndex = 0;
    let startChapterIndex = 0;

    if (fs.existsSync(PROGRESS_FILE)) {
        const prog = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
        if (prog.completed) {
            console.log(`Versão ${sigla} já foi concluída anteriormente. Pulando...`);
            return true;
        }
        startBookIndex = prog.bookIndex || 0;
        startChapterIndex = prog.chapterIndex || 0;
        console.log(`Retomando scrap de ${sigla} a partir do Livro Index ${startBookIndex}, Capítulo ${startChapterIndex + 1}...`);
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
                console.log(`\n[!] Processo abortado na versão ${sigla}. Muitas falhas em ${url}.`);
                console.log(`O progresso foi salvo. Rode o script novamente para continuar de onde parou.\n`);
                return false;
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
                let rawScrapedVerse = versesMap[i] ? versesMap[i].join(' ') : '';
                let localVerse = book.chapters[c][i - 1] || '';

                newChapter[i - 1] = sanitizeVerse(rawScrapedVerse, localVerse);
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
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ completed: true }, null, 2));
    console.log(`\nScrap da versão ${sigla} concluído! ${changedCount} capítulos precisaram de ajuste nos versículos.`);
    return true;
}

async function main() {
    console.log(`Carregando lista de versões de ${VERSIONS_FILE}...`);
    const versions = JSON.parse(fs.readFileSync(VERSIONS_FILE, 'utf8'));

    for (const v of versions) {
        if (!v.sigla) continue;
        const success = await scrapeVersion(v.sigla);
        if (!success) {
            console.log(`\n[!] Interrompendo o lote devido a um erro na versão ${v.sigla}.`);
            return;
        }
    }

    console.log(`\n🎉 Atualização de todas as versões finalizada!`);
}

main();
