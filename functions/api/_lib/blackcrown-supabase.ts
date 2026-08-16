import type { Env } from "./auth";

const DEFAULT_URL = "https://wqriwhciqvrbhkkiuhxb.supabase.co";
const DEFAULT_PUBLISHABLE_KEY = "sb_publishable_ncAkKMk3JAVk9zVIYU16lA_ydBHiQfo";
const EXPECTED_HOST = "wqriwhciqvrbhkkiuhxb.supabase.co";
const REQUEST_TIMEOUT_MS = 5_000;

export type BlackCrownPublicRpcName =
  | "blackcrown_complete_telegram_link"
  | "blackcrown_get_site_telegram_status";

export type BlackCrownRpcResult = {
  ok: boolean;
  status: number;
  payload: Record<string, unknown>;
};

function safePublicKey(value: unknown) {
  const key = String(value ?? "").trim();
  if (!key) return "";
  if (/sb_secret_|service[_-]?role/i.test(key)) return "";
  if (key.startsWith("sb_publishable_")) return key;
  return "";
}

function config(env: Env) {
  const urlText = String(
    env.BLACKCROWN_SUPABASE_URL ||
      env.VITE_BLACKCROWN_SUPABASE_URL ||
      DEFAULT_URL,
  ).trim();
  const key = safePublicKey(
    env.BLACKCROWN_SUPABASE_PUBLISHABLE_KEY ||
      env.VITE_BLACKCROWN_SUPABASE_PUBLISHABLE_KEY ||
      DEFAULT_PUBLISHABLE_KEY,
  );

  let url: URL;
  try {
    url = new URL(urlText);
  } catch {
    throw new Error("supabase_public_config_invalid");
  }

  if (url.protocol !== "https:" || url.hostname !== EXPECTED_HOST || !key) {
    throw new Error("supabase_public_config_invalid");
  }

  return { baseUrl: url.origin, key };
}

export async function callBlackCrownPublicRpc(
  env: Env,
  name: BlackCrownPublicRpcName,
  body: Record<string, unknown>,
): Promise<BlackCrownRpcResult> {
  const { baseUrl, key } = config(env);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        accept: "application/json",
        apikey: key,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
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
