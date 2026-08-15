import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const KEY_ART_ASSETS = [
  { file: "public/art/hero-crown.avif", format: "avif", width: 600, height: 750, minBytes: 8_000 },
  { file: "public/art/hero-crown.webp", format: "webp", width: 600, height: 750, minBytes: 8_000 },
  { file: "public/art/hero-crown.jpg", format: "jpeg", width: 600, height: 750, minBytes: 20_000 },
  { file: "public/art/evofish-world.avif", format: "avif", width: 800, height: 500, minBytes: 8_000 },
  { file: "public/art/evofish-world.webp", format: "webp", width: 800, height: 500, minBytes: 5_000 },
  { file: "public/art/evofish-world.jpg", format: "jpeg", width: 800, height: 500, minBytes: 20_000 },
  { file: "public/art/blackcrown-og.jpg", format: "jpeg", width: 1200, height: 630, minBytes: 20_000 },
  { file: "public/assets/games/crown-front/crown-front-preview.svg", format: "svg", width: 1200, height: 480, minBytes: 2_000 },
  { file: "public/assets/site/neon/network.svg", format: "svg", width: 1200, height: 720, minBytes: 1_000 },
  { file: "public/pwa/icons/apple-touch-icon.png", format: "png", width: 180, height: 180, minBytes: 10_000 },
  { file: "public/pwa/icons/icon-192.png", format: "png", width: 192, height: 192, minBytes: 10_000 },
  { file: "public/pwa/icons/icon-512.png", format: "png", width: 512, height: 512, minBytes: 20_000 },
  { file: "public/pwa/icons/maskable-192.png", format: "png", width: 192, height: 192, minBytes: 10_000 },
  { file: "public/pwa/icons/maskable-512.png", format: "png", width: 512, height: 512, minBytes: 20_000 },
  { file: "public/experience/art/cinematic-v2/blackcrown-hero-high.webp", format: "webp", width: 1536, height: 1024, minBytes: 120_000, maxBytes: 260_000 },
  { file: "public/experience/art/cinematic-v2/blackcrown-hero-medium.webp", format: "webp", width: 1152, height: 768, minBytes: 75_000, maxBytes: 170_000 },
  { file: "public/experience/art/cinematic-v2/blackcrown-hero-low.webp", format: "webp", width: 768, height: 512, minBytes: 35_000, maxBytes: 90_000 },
  { file: "public/experience/art/cinematic-v2/blackcrown-final-open-high.webp", format: "webp", width: 1536, height: 1024, minBytes: 100_000, maxBytes: 240_000 },
  { file: "public/experience/art/cinematic-v2/blackcrown-final-open-medium.webp", format: "webp", width: 1152, height: 768, minBytes: 65_000, maxBytes: 160_000 },
  { file: "public/experience/art/cinematic-v2/blackcrown-final-open-low.webp", format: "webp", width: 768, height: 512, minBytes: 35_000, maxBytes: 90_000 },
  { file: "public/experience/art/cinematic-v2/crown-ocean-bridge-high.webp", format: "webp", width: 1672, height: 941, minBytes: 35_000, maxBytes: 120_000 },
  { file: "public/experience/art/cinematic-v2/crown-ocean-bridge-medium.webp", format: "webp", width: 1280, height: 720, minBytes: 25_000, maxBytes: 90_000 },
  { file: "public/experience/art/cinematic-v2/crown-ocean-bridge-low.webp", format: "webp", width: 960, height: 540, minBytes: 18_000, maxBytes: 60_000 },
  { file: "public/experience/art/cinematic-v2/evofish-abyss-high.webp", format: "webp", width: 1672, height: 941, minBytes: 20_000, maxBytes: 110_000 },
  { file: "public/experience/art/cinematic-v2/evofish-abyss-medium.webp", format: "webp", width: 1280, height: 720, minBytes: 15_000, maxBytes: 80_000 },
  { file: "public/experience/art/cinematic-v2/evofish-abyss-low.webp", format: "webp", width: 960, height: 540, minBytes: 10_000, maxBytes: 55_000 },
  { file: "public/experience/art/cinematic-v2/evofish-subject-high.webp", format: "webp", width: 1200, height: 788, minBytes: 60_000, maxBytes: 180_000 },
  { file: "public/experience/art/cinematic-v2/evofish-subject-medium.webp", format: "webp", width: 900, height: 591, minBytes: 35_000, maxBytes: 120_000 },
  { file: "public/experience/art/cinematic-v2/evofish-subject-low.webp", format: "webp", width: 600, height: 394, minBytes: 20_000, maxBytes: 75_000 },
  { file: "public/experience/art/cinematic-v2/crown-front-vault-high.webp", format: "webp", width: 1672, height: 941, minBytes: 30_000, maxBytes: 120_000 },
  { file: "public/experience/art/cinematic-v2/crown-front-vault-medium.webp", format: "webp", width: 1280, height: 720, minBytes: 20_000, maxBytes: 90_000 },
  { file: "public/experience/art/cinematic-v2/crown-front-vault-low.webp", format: "webp", width: 960, height: 540, minBytes: 15_000, maxBytes: 60_000 },
  { file: "public/experience/art/cinematic-v2/ocean-vault-bridge-high.webp", format: "webp", width: 1672, height: 941, minBytes: 80_000, maxBytes: 190_000 },
  { file: "public/experience/art/cinematic-v2/ocean-vault-bridge-medium.webp", format: "webp", width: 1280, height: 720, minBytes: 50_000, maxBytes: 135_000 },
  { file: "public/experience/art/cinematic-v2/ocean-vault-bridge-low.webp", format: "webp", width: 960, height: 540, minBytes: 30_000, maxBytes: 85_000 },
  { file: "public/experience/art/cinematic-v2/network-collection-high.webp", format: "webp", width: 1672, height: 941, minBytes: 25_000, maxBytes: 110_000 },
  { file: "public/experience/art/cinematic-v2/network-collection-medium.webp", format: "webp", width: 1280, height: 720, minBytes: 20_000, maxBytes: 85_000 },
  { file: "public/experience/art/cinematic-v2/network-collection-low.webp", format: "webp", width: 960, height: 540, minBytes: 12_000, maxBytes: 60_000 },
  { file: "public/experience/art/cinematic-v2/collection-aurora-high.webp", format: "webp", width: 768, height: 768, minBytes: 20_000, maxBytes: 90_000 },
  { file: "public/experience/art/cinematic-v2/collection-aurora-medium.webp", format: "webp", width: 576, height: 576, minBytes: 15_000, maxBytes: 65_000 },
  { file: "public/experience/art/cinematic-v2/collection-aurora-low.webp", format: "webp", width: 384, height: 384, minBytes: 8_000, maxBytes: 40_000 },
  { file: "public/experience/art/cinematic-v2/collection-founder-high.webp", format: "webp", width: 768, height: 768, minBytes: 20_000, maxBytes: 90_000 },
  { file: "public/experience/art/cinematic-v2/collection-founder-medium.webp", format: "webp", width: 576, height: 576, minBytes: 15_000, maxBytes: 65_000 },
  { file: "public/experience/art/cinematic-v2/collection-founder-low.webp", format: "webp", width: 384, height: 384, minBytes: 8_000, maxBytes: 40_000 },
  { file: "public/experience/art/cinematic-v2/collection-starter-high.webp", format: "webp", width: 768, height: 768, minBytes: 20_000, maxBytes: 90_000 },
  { file: "public/experience/art/cinematic-v2/collection-starter-medium.webp", format: "webp", width: 576, height: 576, minBytes: 15_000, maxBytes: 65_000 },
  { file: "public/experience/art/cinematic-v2/collection-starter-low.webp", format: "webp", width: 384, height: 384, minBytes: 8_000, maxBytes: 40_000 },
];

function text(buffer, start, length) {
  return buffer.subarray(start, start + length).toString("ascii");
}

function webpDimensions(buffer) {
  if (buffer.length < 30 || text(buffer, 0, 4) !== "RIFF" || text(buffer, 8, 4) !== "WEBP") {
    throw new Error("invalid WebP container");
  }
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunk = text(buffer, offset, 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (chunk === "VP8X" && size >= 10) return [1 + buffer.readUIntLE(data + 4, 3), 1 + buffer.readUIntLE(data + 7, 3)];
    if (chunk === "VP8 " && size >= 10) {
      if (buffer[data + 3] !== 0x9d || buffer[data + 4] !== 0x01 || buffer[data + 5] !== 0x2a) throw new Error("invalid VP8 frame header");
      return [buffer.readUInt16LE(data + 6) & 0x3fff, buffer.readUInt16LE(data + 8) & 0x3fff];
    }
    if (chunk === "VP8L" && size >= 5) {
      const bits = buffer.readUInt32LE(data + 1);
      return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
    }
    offset = data + size + (size % 2);
  }
  throw new Error("WebP dimensions not found");
}

function jpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) throw new Error("invalid JPEG signature");
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame = (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
    if (isStartOfFrame) return [buffer.readUInt16BE(offset + 7), buffer.readUInt16BE(offset + 5)];
    if (!Number.isFinite(length) || length < 2) throw new Error("invalid JPEG segment");
    offset += 2 + length;
  }
  throw new Error("JPEG dimensions not found");
}

function pngDimensions(buffer) {
  const signature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== signature || text(buffer, 12, 4) !== "IHDR") throw new Error("invalid PNG signature");
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function avifDimensions(buffer) {
  if (text(buffer, 4, 4) !== "ftyp" || !/(?:avif|avis)/.test(text(buffer, 8, Math.min(56, buffer.length - 8)))) {
    throw new Error("invalid AVIF container");
  }
  const marker = buffer.indexOf(Buffer.from("ispe", "ascii"));
  if (marker < 0 || marker + 16 > buffer.length) throw new Error("AVIF ispe dimensions not found");
  return [buffer.readUInt32BE(marker + 8), buffer.readUInt32BE(marker + 12)];
}

function svgDimensions(buffer) {
  const source = buffer.toString("utf8");
  if (!/^\s*<svg\b/i.test(source)) throw new Error("invalid SVG root");
  const viewBox = source.match(/\bviewBox=["']\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*["']/i);
  if (!viewBox) throw new Error("SVG viewBox missing");
  return [Number(viewBox[3]), Number(viewBox[4])];
}

export function getAssetDimensions(buffer, format) {
  if (format === "webp") return webpDimensions(buffer);
  if (format === "jpeg") return jpegDimensions(buffer);
  if (format === "png") return pngDimensions(buffer);
  if (format === "avif") return avifDimensions(buffer);
  if (format === "svg") return svgDimensions(buffer);
  throw new Error(`unsupported format: ${format}`);
}

export function validateKeyArtAsset(asset, root = process.cwd()) {
  const absolute = path.resolve(root, asset.file);
  if (!fs.existsSync(absolute)) throw new Error(`missing key art: ${asset.file}`);
  const buffer = fs.readFileSync(absolute);
  if (buffer.length < asset.minBytes) throw new Error(`key art too small: ${asset.file} (${buffer.length} bytes)`);
  if (asset.maxBytes && buffer.length > asset.maxBytes) throw new Error(`key art too large: ${asset.file} (${buffer.length} bytes)`);
  const [width, height] = getAssetDimensions(buffer, asset.format);
  if (width !== asset.width || height !== asset.height) {
    throw new Error(`invalid dimensions: ${asset.file}; expected ${asset.width}x${asset.height}, got ${width}x${height}`);
  }
  return { ...asset, width, height, bytes: buffer.length };
}

export function runKeyArtValidation(root = process.cwd()) {
  return KEY_ART_ASSETS.map((asset) => validateKeyArtAsset(asset, root));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const asset of runKeyArtValidation()) {
    console.log(`OK ${asset.file}: ${asset.width}x${asset.height} ${asset.format.toUpperCase()}`);
  }
}
