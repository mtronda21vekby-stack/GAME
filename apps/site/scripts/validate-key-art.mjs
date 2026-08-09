import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const KEY_ART_ASSETS = Object.freeze([
  { file: "public/art/hero-crown.webp", type: "webp", minBytes: 1024 },
  { file: "public/art/evofish-world.webp", type: "webp", minBytes: 1024 },
  { file: "public/assets/games/crown-front/crown-front-preview.svg", type: "svg", minBytes: 200 },
  { file: "public/assets/site/neon/network.svg", type: "svg", minBytes: 200 },
  { file: "public/pwa/icons/apple-touch-icon.png", type: "png", minBytes: 200 },
  { file: "public/pwa/icons/icon-192.png", type: "png", minBytes: 200 },
  { file: "public/pwa/icons/icon-512.png", type: "png", minBytes: 200 },
  { file: "public/pwa/icons/maskable-192.png", type: "png", minBytes: 200 },
  { file: "public/pwa/icons/maskable-512.png", type: "png", minBytes: 200 },
]);

function ascii(buffer, start, length) {
  return buffer.subarray(start, start + length).toString("ascii");
}

function webpDimensions(buffer) {
  if (buffer.length < 30 || ascii(buffer, 0, 4) !== "RIFF" || ascii(buffer, 8, 4) !== "WEBP") {
    throw new Error("invalid WebP container");
  }
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunk = ascii(buffer, offset, 4);
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

function pngDimensions(buffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature) || ascii(buffer, 12, 4) !== "IHDR") {
    throw new Error("invalid PNG signature");
  }
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function svgDimensions(buffer) {
  const source = buffer.toString("utf8");
  if (!/^\s*(?:<\?xml[^>]*>\s*)?<svg\b/i.test(source)) throw new Error("invalid SVG root");
  const root = source.match(/<svg\b[^>]*>/i)?.[0] ?? "";
  const width = Number(root.match(/\bwidth=["']([\d.]+)/i)?.[1]);
  const height = Number(root.match(/\bheight=["']([\d.]+)/i)?.[1]);
  if (width > 0 && height > 0) return [width, height];
  const viewBox = root.match(/\bviewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/i);
  if (!viewBox) throw new Error("SVG dimensions not found");
  return [Number(viewBox[1]), Number(viewBox[2])];
}

export function getAssetDimensions(buffer, type) {
  if (type === "webp") return webpDimensions(buffer);
  if (type === "png") return pngDimensions(buffer);
  if (type === "svg") return svgDimensions(buffer);
  throw new Error(`unsupported image type: ${type}`);
}

export function runKeyArtValidation(siteDir = process.cwd()) {
  return KEY_ART_ASSETS.map((asset) => {
    const absolute = path.resolve(siteDir, asset.file);
    if (!fs.existsSync(absolute)) throw new Error(`missing key art: ${asset.file}`);
    const buffer = fs.readFileSync(absolute);
    if (buffer.length < asset.minBytes) throw new Error(`key art too small: ${asset.file}`);
    const [width, height] = getAssetDimensions(buffer, asset.type);
    if (!(width > 0 && height > 0)) throw new Error(`invalid dimensions: ${asset.file}`);
    return { ...asset, width, height, bytes: buffer.length };
  });
}

function main() {
  for (const asset of runKeyArtValidation()) {
    console.log(`OK ${asset.file}: ${asset.width}x${asset.height}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
