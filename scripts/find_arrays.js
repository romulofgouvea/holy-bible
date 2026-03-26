const fs = require('fs');

const file = 'src/data/NVT.json';

console.log(`Lendo ${file}...`);
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

let results = [];

data.forEach(book => {
    book.chapters.forEach((chapter, cIndex) => {
        chapter.forEach((verse, vIndex) => {
            if (Array.isArray(verse)) {
                results.push(`Livro: ${book.name} (${book.abbrev}) | Capítulo: ${cIndex + 1} | Versículo ${vIndex + 1} é um ARRAY`);

                // Opcional: checar se há arrays DUPLAMENTE aninhados
                verse.forEach((line, lIndex) => {
                    if (Array.isArray(line)) {
                        results.push(`  -> ALERTA: O Versículo ${vIndex + 1} tem um array DENTRO do array na linha ${lIndex + 1}!`);
                    }
                });
            } else if (typeof verse !== 'string') {
                results.push(`Livro: ${book.name} (${book.abbrev}) | Capítulo: ${cIndex + 1} | Versículo ${vIndex + 1} é do tipo: ${typeof verse}`);
            }
        });
    });
});

if (results.length > 0) {
    console.log(`\nEncontrados ${results.length} ocorrências de arrays retornados no JSON:\n`);
    // Imprime as primeiras 50 para não floodar o terminal
    results.slice(0, 50).forEach(r => console.log(r));
    if (results.length > 50) {
        console.log(`\n...e mais ${results.length - 50} ocorrências ocultas.`);
    }
} else {
    console.log('\nNenhum array dentro de array (ou versículo como array) foi encontrado!');
}
