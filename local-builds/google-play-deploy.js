const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function publish() {
  const [packageName, keyFilePath, aabPath, track = 'internal'] = process.argv.slice(2);

  const auth = new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  const androidPublisher = google.androidpublisher({ version: 'v3', auth });

  try {
    const edit = await androidPublisher.edits.insert({ packageName });
    const editId = edit.data.id;

    const fileSize = fs.statSync(aabPath).size;
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

    process.stdout.write(`\nEnviando ${path.basename(aabPath)} (${fileSizeMB} MB) para ${track.toUpperCase()}...\n`);

    let lastPercent = -1;
    const res = await androidPublisher.edits.bundles.upload({
      editId,
      packageName,
      media: {
        mimeType: 'application/octet-stream',
        body: fs.createReadStream(aabPath),
      },
    }, {
      onUploadProgress: evt => {
        const percent = Math.floor((evt.bytesRead / fileSize) * 100);
        if (percent !== lastPercent) {
          lastPercent = percent;
          const filled = Math.floor(percent / 2);
          const bar = '█'.repeat(filled) + '░'.repeat(50 - filled);
          process.stdout.write(`\r  [${bar}] ${percent}%`);
        }
      },
    });

    process.stdout.write('\r  ' + '█'.repeat(50) + ' 100%\n');

    const versionCode = res.data.versionCode;

    await androidPublisher.edits.tracks.update({
      editId,
      packageName,
      track,
      requestBody: {
        releases: [{ versionCodes: [versionCode.toString()], status: 'completed' }],
      },
    });

    await androidPublisher.edits.commit({ editId, packageName });

    console.log(`\n✅ Publicado! Version Code: ${versionCode}\n`);
  } catch (error) {
    const msg = error?.response?.data?.error?.message || error.message;
    console.error(`\n❌ Erro: ${msg}\n`);
    process.exit(1);
  }
}

publish();
