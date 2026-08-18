import { readCookie, type Env } from "./auth";

const DEFAULT_BOT_BRIDGE_URL = "https://ggbf6-warzon-bot.onrender.com";
const EXPECTED_BOT_HOST = "ggbf6-warzon-bot.onrender.com";
const REQUEST_TIMEOUT_MS = 15_000;
const ASSERTION_VERSION = "v1";

export type BotBridgePath = "link" | "status";

export type BotBridgeResult = {
  ok: boolean;
  status: number;
  payload: Record<string, unknown>;
};

function baseUrl(env: Env) {
  const raw = String(env.BLACKCROWN_BOT_BRIDGE_URL || DEFAULT_BOT_BRIDGE_URL).trim();
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("bot_bridge_config_invalid");
  }
  if (url.protocol !== "https:" || url.hostname !== EXPECTED_BOT_HOST) {
    throw new Error("bot_bridge_config_invalid");
  }
  return url.origin;
}

function sessionToken(request: Request) {
  const token = String(readCookie(request, "bc_session") || "").trim();
  if (token.length < 24 || token.length > 4_096) return "";
  if (!/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return "";
  return token;
}

function assertionSecret(env: Env) {
  const secret = String(env.BLACKCROWN_SITE_BRIDGE_SECRET || "").trim();
  return secret.length >= 32 ? secret : "";
}

function randomNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  let binary = "";
  for (const value of bytes) binary += String.fromCharCode(value);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, "0")).join("");
}

async function siteIdentityAssertion(env: Env, method: string, route: string, siteUserId: string) {
  const secret = assertionSecret(env);
  if (!secret) return "";
  const issuedAt = Math.floor(Date.now() / 1000);
  const nonce = randomNonce();
  const payload = `blackcrown:site-bridge:${ASSERTION_VERSION}:${issuedAt}:${nonce}:${method}:${route}:${siteUserId}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${ASSERTION_VERSION}.${issuedAt}.${nonce}.${hex(signature)}`;
}

export async function callBlackCrownBotBridge(
  request: Request,
  env: Env,
  path: BotBridgePath,
  siteUserId: string,
  body?: Record<string, unknown>,
): Promise<BotBridgeResult> {
  const token = sessionToken(request);
  if (!token) return { ok: false, status: 401, payload: { ok: false, reason: "auth_required" } };

  const method = path === "status" ? "GET" : "POST";
  const route = `/integrations/site/telegram/${path}`;
  const assertion = await siteIdentityAssertion(env, method, route, siteUserId);
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
    "x-bc-session-token": token,
    "x-bc-site-user": siteUserId,
    "user-agent": "BlackCrown-Pages/account-bridge-v16",
  };
  if (assertion) headers["x-bc-site-assertion"] = assertion;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl(env)}${route}`, {
      method,
      headers,
      body: path === "status" ? undefined : JSON.stringify(body || {}),
      cache: "no-store",
      signal: controller.signal,
    });

    let payload: Record<string, unknown> = {};
    try {
      const raw = (await response.json()) as unknown;
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        payload = raw as Record<string, unknown>;
      }
    } catch {
      payload = {};
    }
    return { ok: response.ok, status: response.status, payload };
  } finally {
    clearTimeout(timer);
  }
}
