import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VOICEBOX_URL = "http://127.0.0.1:17493";
const VERSION = "ARA";
const ABBREV = "Sl";
const PROFILE_NAME = "Ha momentos";
const VOICE_ID = "person1";
const LANGUAGE = "pt";
const ONLY_CHAPTER = null;

function getCheckpointPath(chapter) {
  return path.join(
    os.tmpdir(),
    `voicebox-checkpoint-${VERSION.toLowerCase()}-${ABBREV.toLowerCase()}-${chapter}-${VOICE_ID}.json`,
  );
}

function loadCheckpoint(checkpointPath) {
  if (!existsSync(checkpointPath)) return [];
  try {
    return JSON.parse(readFileSync(checkpointPath, "utf-8"));
  } catch {
    return [];
  }
}

function saveCheckpoint(checkpointPath, generationIds) {
  writeFileSync(checkpointPath, JSON.stringify(generationIds));
}

async function withRetry(fn, { retries = 3, delayMs = 2000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      console.warn(`  retry ${attempt}/${retries} after error: ${err.message}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const r2RelativeDir = path.posix.join(
  VERSION.toLowerCase(),
  "audios",
  VOICE_ID,
);

function getChapterPaths(chapter) {
  const r2FileBase = `${ABBREV.toLowerCase()}-${chapter}`;
  const outDir = path.join(
    repoRoot,
    "local-scripts",
    "bible-voice-output",
    ...r2RelativeDir.split("/"),
  );
  return {
    r2FileBase,
    outDir,
    audioOutPath: path.join(outDir, `${r2FileBase}.wav`),
    manifestOutPath: path.join(outDir, `${r2FileBase}.json`),
  };
}

function loadBook() {
  const versionPath = path.join(
    repoRoot,
    "src",
    "data",
    "bible-version",
    `${VERSION}.json`,
  );
  const books = JSON.parse(readFileSync(versionPath, "utf-8"));
  const book = books.find((b) => b.abbrev === ABBREV);
  if (!book) throw new Error(`Book ${ABBREV} not found in ${VERSION}.json`);
  return book;
}

async function resolveProfileId() {
  const res = await fetch(`${VOICEBOX_URL}/profiles`);
  const profiles = await res.json();
  const profile = profiles.find((p) => p.name === PROFILE_NAME);
  if (!profile) throw new Error(`Voice profile "${PROFILE_NAME}" not found`);
  return profile.id;
}

async function generateVerseAudio(profileId, text, verseNumber) {
  const genRes = await fetch(`${VOICEBOX_URL}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile_id: profileId, text, language: LANGUAGE }),
  });
  const generation = await genRes.json();

  const statusRes = await fetch(
    `${VOICEBOX_URL}/generate/${generation.id}/status`,
  );
  const statusText = await statusRes.text();
  const lastEvent = statusText
    .trim()
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => JSON.parse(line.slice("data:".length)))
    .pop();

  if (!lastEvent || lastEvent.status !== "completed") {
    throw new Error(
      `Verse ${verseNumber} generation failed: ${lastEvent?.error ?? "unknown error"}`,
    );
  }

  console.log(`  verse ${verseNumber}: generated (${lastEvent.duration}s)`);
  return generation.id;
}

async function createStory(name) {
  const res = await fetch(`${VOICEBOX_URL}/stories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const story = await res.json();
  return story.id;
}

async function addStoryItem(storyId, generationId) {
  const res = await fetch(`${VOICEBOX_URL}/stories/${storyId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ generation_id: generationId }),
  });
  return res.json();
}

async function exportStoryAudio(storyId, outPath) {
  const res = await fetch(`${VOICEBOX_URL}/stories/${storyId}/export-audio`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buffer);
}

async function generateChapter(profileId, chapter, verses) {
  const { outDir, audioOutPath, manifestOutPath, r2FileBase } =
    getChapterPaths(chapter);
  mkdirSync(outDir, { recursive: true });

  if (existsSync(audioOutPath) && existsSync(manifestOutPath)) {
    console.log(`${ABBREV} ${chapter}: already generated, skipping`);
    return;
  }

  console.log(`${VERSION} ${ABBREV} ${chapter}: ${verses.length} verses`);

  const checkpointPath = getCheckpointPath(chapter);
  const generationIds = loadCheckpoint(checkpointPath);
  if (generationIds.length > 0) {
    console.log(
      `  resuming from checkpoint: ${generationIds.length} verses already done`,
    );
  }
  for (let i = generationIds.length; i < verses.length; i++) {
    const generationId = await withRetry(() =>
      generateVerseAudio(profileId, verses[i], i + 1),
    );
    generationIds.push(generationId);
    saveCheckpoint(checkpointPath, generationIds);
  }

  const storyId = await createStory(`${VERSION} ${ABBREV} ${chapter}`);

  const verseTimings = [];
  for (let i = 0; i < generationIds.length; i++) {
    const item = await addStoryItem(storyId, generationIds[i]);
    verseTimings.push({ verse: i + 1, start: item.start_time_ms / 1000 });
    console.log(`  verse ${i + 1}: start=${item.start_time_ms}ms`);
  }

  await exportStoryAudio(storyId, audioOutPath);

  const last = verseTimings[verseTimings.length - 1];
  const lastItemDurationMs = (
    await (await fetch(`${VOICEBOX_URL}/stories/${storyId}`)).json()
  ).items.at(-1).duration;
  const duration = last.start + lastItemDurationMs;

  const manifest = {
    version: VERSION,
    abbrev: ABBREV,
    chapter,
    duration,
    verses: verseTimings,
  };
  writeFileSync(manifestOutPath, JSON.stringify(manifest, null, 2));

  console.log(`  saved audio: ${audioOutPath}`);
  console.log(`  saved manifest: ${manifestOutPath}`);
  console.log(`  story id (voicebox): ${storyId}`);
  console.log(
    `  upload to R2 keeping this path: ${r2RelativeDir}/${r2FileBase}.wav and ${r2RelativeDir}/${r2FileBase}.json`,
  );
}

async function main() {
  const book = loadBook();
  const profileId = await resolveProfileId();

  const chapters = ONLY_CHAPTER
    ? [ONLY_CHAPTER]
    : book.chapters.map((_, i) => i + 1);

  const failedChapters = [];
  for (const chapter of chapters) {
    const verses = book.chapters[chapter - 1];
    try {
      await generateChapter(profileId, chapter, verses);
    } catch (err) {
      console.error(`${ABBREV} ${chapter}: failed - ${err.message}`);
      failedChapters.push(chapter);
    }
  }

  console.log(
    `\nDone: ${chapters.length - failedChapters.length}/${chapters.length} chapters generated`,
  );
  if (failedChapters.length > 0) {
    console.log(`Failed chapters: ${failedChapters.join(", ")}`);
    console.log("Re-run the script to retry only the missing chapters.");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
