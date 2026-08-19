import { ensureGuestSession, getGuestClientId } from "./commerce";
import { sanitizeTelegramLinkCode } from "./telegramLinkCode";

export { clearTelegramLinkFragment, sanitizeTelegramLinkCode, telegramLinkCodeFromLocation } from "./telegramLinkCode";
export type TelegramLinkStatus = { linked: boolean; premium: boolean; entitlements: string[]; linkedAt: string | null };
function normalizeEntitlements(value: unknown) { if (!Array.isArray(value)) return []; return Array.from(new Set(value.map((item) => String(item ?? "").trim()).filter((item) => /^[a-z0-9_.:-]{1,80}$/.test(item)))).slice(0, 100); }
async function readJson(response: Response) { try { const payload = (await response.json()) as unknown; return payload && typeof payload === "object" && !Array.isArray(payload) ? payload as Record<string, unknown> : {}; } catch { return {}; } }
function normalizeStatus(payload: Record<string, unknown>): TelegramLinkStatus { return { linked: payload.linked === true, premium: payload.premium === true, entitlements: normalizeEntitlements(payload.entitlements), linkedAt: typeof payload.linkedAt === "string" ? payload.linkedAt : null }; }
function reason(payload: Record<string, unknown>, fallback: string) { return typeof payload.reason === "string" && payload.reason ? payload.reason : fallback; }

export async function getTelegramLinkStatus(signal?: AbortSignal): Promise<TelegramLinkStatus> {
  await ensureGuestSession(signal);
  const response = await fetch("/api/integrations/telegram/status", { method: "GET", headers: { accept: "application/json" }, credentials: "include", cache: "no-store", signal });
  const payload = await readJson(response); if (!response.ok || payload.ok !== true) throw new Error(reason(payload, "link_status_unavailable")); return normalizeStatus(payload);
}

export async function completeTelegramLink(codeInput: string, signal?: AbortSignal): Promise<TelegramLinkStatus> {
  const code = sanitizeTelegramLinkCode(codeInput); if (!code) throw new Error("invalid_or_expired_code");
  const clientId = getGuestClientId();
  await ensureGuestSession(signal);
  const response = await fetch("/api/integrations/telegram/link", { method: "POST", headers: { "content-type": "application/json", accept: "application/json" }, credentials: "include", cache: "no-store", signal, body: JSON.stringify({ code, clientId }) });
  const payload = await readJson(response); if (!response.ok || payload.ok !== true) throw new Error(reason(payload, "link_failed")); return normalizeStatus(payload);
}
