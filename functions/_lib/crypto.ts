function toBase64Url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  const b64 = btoa(s);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromUtf8(s: string) {
  return new TextEncoder().encode(s);
}

export async function hmacSha256Base64Url(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    fromUtf8(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, fromUtf8(payload));
  return toBase64Url(new Uint8Array(sig));
}

export function timingSafeEqual(a: string, b: string): boolean {
  // constant-time-ish compare
  const aa = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  const n = Math.max(aa.length, bb.length);
  let out = 0;
  for (let i = 0; i < n; i++) {
    out |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return out === 0 && aa.length === bb.length;
}

export function safeFileName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}
