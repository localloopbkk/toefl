import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(projectRoot, "audio");
const audioExtensions = new Set([".mp3", ".ogg", ".wav", ".m4a"]);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (audioExtensions.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

function clean(text) {
  return text
    .replace(/\.(mp3|ogg|wav|m4a)$/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(text) {
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const files = (await walk(root)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const tracks = files.map((file, index) => {
  const relative = path.relative(projectRoot, file).split(path.sep).join("/");
  const parts = relative.split("/");
  const testKey = parts[1];
  const audience = testKey.startsWith("teacher") ? "Teacher" : "Student";
  const testNumber = Number(testKey.match(/\d+/)?.[0] || 0);
  const lowerParts = parts.map((part) => part.toLowerCase());
  const section = lowerParts.some((part) => part.includes("speaking")) ? "Speaking" : "Listening";
  const categoryPart = parts.slice(2, -1).reverse().find((part) => !/audio files?|listening|speaking/i.test(part));
  const filename = parts.at(-1);
  const category = titleCase(clean(categoryPart || section));
  const title = clean(filename)
    .replace(/\bListening(\d)/i, "Listening $1 ·")
    .replace(/\bSpeaking\b/i, "Speaking ·")
    .replace(/\bQuestion\s*(\d+)/i, "Question $1")
    .replace(/\s+-\s+/g, " · ");
  return {
    id: `track-${index + 1}`,
    title,
    audience,
    test: testNumber,
    testLabel: `${audience} Practice Test ${testNumber}`,
    section,
    category,
    src: encodeURI(relative),
    format: path.extname(filename).slice(1).toUpperCase()
  };
});

await writeFile(new URL("./tracks.js", import.meta.url), `window.TOEFL_TRACKS = ${JSON.stringify(tracks, null, 2)};\n`);
console.log(`Generated tracks.js with ${tracks.length} tracks.`);
