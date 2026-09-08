import type { Env } from "./auth";

const DEFAULT_SUPABASE_URL = "https://wqriwhciqvrbhkkiuhxb.supabase.co";
const REQUEST_TIMEOUT_MS = 6500;
const FUNCTION_NAME_RE = /^[a-z0-9_]{1,120}$/;

export type SupabaseServerConfig = {
  url: string;
  key: string;
  legacyJwt: boolean;
};

export type SupabaseRpcSuccess<T> = {
  ok: true;
  data: T;
};

export type SupabaseRpcFailure = {
  ok: false;
  status: number;
  reason: string;
};

export type SupabaseRpcResult<T> = SupabaseRpcSuccess<T> | SupabaseRpcFailure;

function decodeBase64UrlJson(value: string): Record<string, unknown> | null {
  try {
    const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
    const base64 = (value + pad).replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isLegacyServiceRoleJwt(key: string) {
  const parts = key.split(".");
  if (parts.length !== 3) return false;
  const payload = decodeBase64UrlJson(parts[1]);
  return payload?.role === "service_role";
}

function normalizeUrl(value: unknown) {
  const raw = String(value ?? "").trim().replace(/\/+$/, "");
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return "";
    if (url.hostname !== "wqriwhciqvrbhkkiuhxb.supabase.co") return "";
    return url.origin;
  } catch {
    return "";
  }
}

function getSecretKey(env: Env) {
  return String(
    env.BLACKCROWN_SUPABASE_SECRET_KEY ||
      env.SUPABASE_SECRET_KEY ||
      env.SUPABASE_SERVICE_ROLE_KEY ||
      "",
  ).trim();
}

export function getSupabaseServerConfig(env: Env): SupabaseServerConfig | null {
  const url =
    normalizeUrl(env.BLACKCROWN_SUPABASE_URL || env.SUPABASE_URL) ||
    DEFAULT_SUPABASE_URL;
  const key = getSecretKey(env);

  // Browser keys must never cross this server ownership boundary.
  if (!key || key.startsWith("sb_publishable_") || key.startsWith("anon")) return null;
  if (key.startsWith("sb_secret_")) return { url, key, legacyJwt: false };
  if (isLegacyServiceRoleJwt(key)) return { url, key, legacyJwt: true };
  return null;
}

export function supabaseServerConfigured(env: Env) {
  return getSupabaseServerConfig(env) !== null;
}

function safeReason(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as Record<string, unknown>;
  const candidates = [record.message, record.code, record.hint, record.details];
  const known = new Set([
    "link_rate_limited",
    "invalid_site_user_id",
    "invalid_link_code_hash",
    "invalid_link_expiry",
    "invalid_or_expired_link_code",
    "private_chat_required",
    "telegram_already_linked",
    "account_already_linked",
    "invalid_entitlement_key",
    "invalid_entitlement_source",
    "invalid_entitlement_expiry",
    "invalid_entitlement_metadata",
  ]);
  for (const value of candidates) {
    const text = String(value ?? "").trim();
    for (const reason of known) {
      if (text.includes(reason)) return reason;
    }
  }
  return fallback;
}

export async function callSupabaseRpc<T>(
  env: Env,
  functionName: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<SupabaseRpcResult<T>> {
  const config = getSupabaseServerConfig(env);
  if (!config) {
    return { ok: false, status: 503, reason: "identity_storage_unavailable" };
  }
  if (!FUNCTION_NAME_RE.test(functionName)) {
    return { ok: false, status: 500, reason: "identity_rpc_invalid" };
  }

  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeoutId = globalThis.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
    apikey: config.key,
  };
  if (config.legacyJwt) headers.authorization = `Bearer ${config.key}`;

  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: controller.signal,
    });

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status >= 400 && response.status < 600 ? response.status : 502,
        reason: safeReason(payload, "identity_storage_error"),
      };
    }

    return { ok: true, data: payload as T };
  } catch (error) {
    const reason = error instanceof DOMException && error.name === "AbortError"
      ? "identity_storage_timeout"
      : "identity_storage_error";
    return { ok: false, status: 503, reason };
  } finally {
    globalThis.clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}
