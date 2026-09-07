const CLIENT_ID_KEY = "bc.clientId.v1";

function randomHex(bytesLength: number): string | null {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") return null;

  const bytes = new Uint8Array(bytesLength);
  cryptoApi.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createSecureClientId(): string | null {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi) return null;

  if (typeof cryptoApi.randomUUID === "function") {
    return `client_${cryptoApi.randomUUID()}`;
  }

  const token = randomHex(24);
  return token ? `client_${token}` : null;
}

function isUsableClientId(value: string | null): value is string {
  if (!value || value.length < 20) return false;

  // Older shells could emit weak c_* recovery IDs. Rotate those credentials
  // instead of treating them as high-entropy recovery secrets.
  if (value.startsWith("c_")) return false;

  return true;
}

export function getOrCreateClientId(): string | null {
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (isUsableClientId(existing)) return existing;

    const created = createSecureClientId();
    if (!created) return null;
    localStorage.setItem(CLIENT_ID_KEY, created);
    return created;
  } catch {
    // Storage can be disabled in privacy contexts. A cryptographic ephemeral
    // bootstrap is acceptable; a pseudo-random fallback is not.
    return createSecureClientId();
  }
}

export async function ensureGuestSession(): Promise<boolean> {
  const clientId = getOrCreateClientId();
  if (!clientId) return false;

  try {
    const response = await fetch("/api/auth/guest", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ clientId }),
      credentials: "include",
      cache: "no-store",
      keepalive: true,
    });
    return response.ok;
  } catch {
    return false;
  }
}

export const clientIdentityStorageKey = CLIENT_ID_KEY;
