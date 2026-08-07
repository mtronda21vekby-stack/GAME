import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const audioDir = path.resolve(here, "../public/audio");
const outputPath = path.join(audioDir, "blackcrown-long.mp3");
const parts = [
  "blackcrown-long-v4-part-00.txt",
  "blackcrown-long-v4-part-01.txt",
  "blackcrown-long-v4-part-02.txt",
  "blackcrown-long-v4-part-03.txt",
  "blackcrown-long-v4-part-04.txt",
];

const encodedParts = await Promise.all(
  parts.map(async (file) => (await readFile(path.join(audioDir, file), "utf8")).trim()),
);

const encoded = encodedParts.join("");
if (!encoded || !/^[A-Za-z0-9+/=]+$/.test(encoded)) {
  throw new Error("BlackCrown music source is not valid base64");
}

const audio = Buffer.from(encoded, "base64");
if (audio.length < 100_000) {
  throw new Error(`BlackCrown music asset is incomplete: ${audio.length} bytes`);
}

const isId3 = audio[0] === 0x49 && audio[1] === 0x44 && audio[2] === 0x33;
const isMpegFrame = audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0;
if (!isId3 && !isMpegFrame) {
  throw new Error("BlackCrown music source does not decode to an MP3 stream");
}

await mkdir(audioDir, { recursive: true });
await writeFile(outputPath, audio);
console.log(`BlackCrown music: wrote ${audio.length} bytes to ${outputPath}`);
