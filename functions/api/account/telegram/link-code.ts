import type { Env } from "../../_lib/auth";
import { callSupabaseRpc } from "../../_lib/supabase-server";
import {
  createTelegramLinkCode,
  hashTelegramLinkCode,
  telegramLinkPayload,
} from "../../_lib/telegram-link";
import { verifyUserSession } from "../../_lib/user-session";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function botUsername(env: Env) {
  const value = String(env.TELEGRAM_BOT_USERNAME || env.BOT_USERNAME || "GGBF6_WARZON_BOT")
    .trim()
    .replace(/^@/, "");
  return /^[A-Za-z0-9_]{5,64}$/.test(value) ? value : "GGBF6_WARZON_BOT";
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const session = await verifyUserSession(request, env);
  if (!session?.userId) return json({ ok: false, reason: "auth_required" }, 401);

  let link;
  try {
    link = createTelegramLinkCode();
  } catch {
    return json({ ok: false, reason: "secure_random_unavailable" }, 503);
  }

  const codeHash = await hashTelegramLinkCode(link.compact);
  if (!codeHash) return json({ ok: false, reason: "link_code_generation_failed" }, 503);

  const result = await callSupabaseRpc<Array<{ expires_at?: string }>>(
    env,
    "blackcrown_issue_telegram_link_code",
    {
      p_site_user_id: session.userId,
      p_code_hash: codeHash,
      p_expires_at: link.expiresAt,
    },
    request.signal,
  );

  if (!result.ok) {
    const status = result.reason === "link_rate_limited" ? 429 : result.status;
    return json({ ok: false, reason: result.reason }, status);
  }

  const username = botUsername(env);
  const payload = telegramLinkPayload(link.compact);
  return json({
    ok: true,
    code: link.display,
    expiresAt: link.expiresAt,
    botUsername: username,
    telegramUrl: `https://t.me/${username}?start=${encodeURIComponent(payload)}`,
  });
};
