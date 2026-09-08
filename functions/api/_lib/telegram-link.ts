const LINK_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LINK_SYMBOLS = 12;
const LINK_PREFIX = "BC";
const LINK_TTL_MS = 10 * 60 * 1000;

function randomBytes(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function normalizeTelegramLinkCode(value: unknown) {
  const compact = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/^BC[-_\s]*/, "")
    .replace(/[^A-Z2-9]/g, "");
  if (compact.length !== LINK_SYMBOLS) return "";
  for (const symbol of compact) {
    if (!LINK_ALPHABET.includes(symbol)) return "";
  }
  return compact;
}

export function formatTelegramLinkCode(compact: string) {
  const normalized = normalizeTelegramLinkCode(compact);
  if (!normalized) return "";
  return `${LINK_PREFIX}-${normalized.slice(0, 4)}-${normalized.slice(4, 8)}-${normalized.slice(8, 12)}`;
}

export function createTelegramLinkCode() {
  const bytes = randomBytes(LINK_SYMBOLS);
  let compact = "";
  for (const byte of bytes) compact += LINK_ALPHABET[byte & 31];
  return {
    compact,
    display: formatTelegramLinkCode(compact),
    expiresAt: new Date(Date.now() + LINK_TTL_MS).toISOString(),
  };
}

export async function hashTelegramLinkCode(value: unknown) {
  const normalized = normalizeTelegramLinkCode(value);
  if (!normalized) return "";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`blackcrown:telegram-link:v1:${normalized}`),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function telegramLinkPayload(value: unknown) {
  const normalized = normalizeTelegramLinkCode(value);
  return normalized ? `link_${normalized}` : "";
}
