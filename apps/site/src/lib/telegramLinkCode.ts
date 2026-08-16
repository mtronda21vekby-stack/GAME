export function sanitizeTelegramLinkCode(value: unknown) {
  const code = String(value ?? "").trim();
  if (code.length < 32 || code.length > 128) return "";
  return /^[A-Za-z0-9_-]+$/.test(code) ? code : "";
}

export function telegramLinkCodeFromLocation() {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const params = new URLSearchParams(hash);
  return sanitizeTelegramLinkCode(params.get("telegram-link"));
}

export function clearTelegramLinkFragment() {
  if (typeof window === "undefined") return;
  const next = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, "", next);
}
