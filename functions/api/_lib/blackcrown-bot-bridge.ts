import { readCookie, type Env } from "./auth";

const DEFAULT_BOT_BRIDGE_URL = "https://ggbf6-warzon-bot.onrender.com";
const EXPECTED_BOT_HOST = "ggbf6-warzon-bot.onrender.com";
const REQUEST_TIMEOUT_MS = 15_000;

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

export async function callBlackCrownBotBridge(
  request: Request,
  env: Env,
  path: BotBridgePath,
  siteUserId: string,
  body?: Record<string, unknown>,
): Promise<BotBridgeResult> {
  const token = sessionToken(request);
  if (!token) return { ok: false, status: 401, payload: { ok: false, reason: "auth_required" } };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl(env)}/integrations/site/telegram/${path}`, {
      method: path === "status" ? "GET" : "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-bc-session-token": token,
        "x-bc-site-user": siteUserId,
        "user-agent": "BlackCrown-Pages/account-bridge-v15",
      },
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
