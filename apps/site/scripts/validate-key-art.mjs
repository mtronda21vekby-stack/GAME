import fs from "node:fs";
import path from "node:path";

const files = [
  "public/art/hero-crown.webp",
  "public/art/evofish-world.webp",
];

function text(buffer, start, length) {
  return buffer.subarray(start, start + length).toString("ascii");
}

function dimensions(buffer) {
  if (buffer.length < 30 || text(buffer, 0, 4) !== "RIFF" || text(buffer, 8, 4) !== "WEBP") {
    throw new Error("invalid WebP container");
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunk = text(buffer, offset, 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;

    if (chunk === "VP8X" && size >= 10) {
      return [1 + buffer.readUIntLE(data + 4, 3), 1 + buffer.readUIntLE(data + 7, 3)];
    }

    if (chunk === "VP8 " && size >= 10) {
      if (buffer[data + 3] !== 0x9d || buffer[data + 4] !== 0x01 || buffer[data + 5] !== 0x2a) {
        throw new Error("invalid VP8 frame header");
      }
      return [buffer.readUInt16LE(data + 6) & 0x3fff, buffer.readUInt16LE(data + 8) & 0x3fff];
    }

    if (chunk === "VP8L" && size >= 5) {
      const bits = buffer.readUInt32LE(data + 1);
      return [(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1];
    }

    offset = data + size + (size % 2);
  }

  throw new Error("dimensions not found");
}

for (const relative of files) {
  const absolute = path.resolve(process.cwd(), relative);
  if (!fs.existsSync(absolute)) throw new Error(`missing key art: ${relative}`);
  const buffer = fs.readFileSync(absolute);
  if (buffer.length < 1024) throw new Error(`key art too small: ${relative}`);
  const [width, height] = dimensions(buffer);
  if (width <= 0 || height <= 0) throw new Error(`invalid dimensions: ${relative}`);
  console.log(`OK ${relative}: ${width}x${height}`);
}
