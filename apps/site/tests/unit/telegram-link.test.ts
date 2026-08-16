import { afterEach, describe, expect, it, vi } from "vitest";
import { createUserSessionToken } from "../../../../functions/api/_lib/user-session";
import { onRequestPost as linkTelegram } from "../../../../functions/api/integrations/telegram/link";
import { onRequestGet as telegramStatus } from "../../../../functions/api/integrations/telegram/status";
import { sanitizeTelegramLinkCode } from "../../src/lib/telegramLink";

const SESSION_SECRET = "telegram-link-unit-test-session-secret-with-entropy";
const VALID_CODE = "BCO_link_token_1234567890_ABCDEFGH";

async function sessionCookie(userId: string) {
  const token = await createUserSessionToken({ BC_USER_SESSION_SECRET: SESSION_SECRET }, userId);
  if (!token) throw new Error("test_session_failed");
  return `bc_session=${token}`;
}

function context(request: Request) {
  return {
    request,
    env: { BC_USER_SESSION_SECRET: SESSION_SECRET },
  } as never;
}

function rpcResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Telegram account bridge", () => {
  it("rejects an unsigned link request before calling Supabase", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request("https://blackcrown.test/api/integrations/telegram/link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: VALID_CODE }),
    });

    const response = await linkTelegram(context(request));
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a weak code without touching the RPC", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request("https://blackcrown.test/api/integrations/telegram/link", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: await sessionCookie("site-user-a"),
      },
      body: JSON.stringify({ code: "123456" }),
    });

    const response = await linkTelegram(context(request));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses the signed session identity and ignores a browser-supplied user id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      rpcResponse({
        ok: true,
        linked: true,
        premium: false,
        entitlements: [],
        linked_at: "2026-08-16T00:00:00Z",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new Request("https://blackcrown.test/api/integrations/telegram/link", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: await sessionCookie("site-user-authoritative"),
      },
      body: JSON.stringify({
        code: VALID_CODE,
        siteUserId: "attacker-controlled-id",
      }),
    });

    const response = await linkTelegram(context(request));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, linked: true, premium: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(fetchMock.mock.calls[0][0])).toContain("/rpc/blackcrown_complete_telegram_link");
    expect(JSON.parse(String(init.body))).toEqual({
      p_code: VALID_CODE,
      p_site_user_id: "site-user-authoritative",
    });
    expect(String(init.headers && (init.headers as Record<string, string>).apikey)).toMatch(/^sb_publishable_/);
  });

  it("returns only sanitized status for the signed site account", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      rpcResponse({
        ok: true,
        linked: true,
        premium: true,
        entitlements: ["bco_premium"],
        linked_at: "2026-08-16T00:00:00Z",
        telegram_user_id: 123,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new Request("https://blackcrown.test/api/integrations/telegram/status", {
      headers: { cookie: await sessionCookie("site-user-b") },
    });
    const response = await telegramStatus(context(request));
    const payload = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      ok: true,
      linked: true,
      premium: true,
      entitlements: ["bco_premium"],
      linkedAt: "2026-08-16T00:00:00Z",
    });
    expect(payload).not.toHaveProperty("telegram_user_id");
  });

  it("accepts only high-entropy URL-safe link codes", () => {
    expect(sanitizeTelegramLinkCode(VALID_CODE)).toBe(VALID_CODE);
    expect(sanitizeTelegramLinkCode("short")).toBe("");
    expect(sanitizeTelegramLinkCode(`${VALID_CODE}!`)).toBe("");
  });
});
