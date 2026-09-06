import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const requireText = (path, needles) => {
  const source = read(path);
  for (const needle of needles) {
    if (!source.includes(needle)) {
      throw new Error(`${path}: missing required trust marker: ${needle}`);
    }
  }
  return source;
};
const forbidText = (path, needles) => {
  const source = read(path);
  for (const needle of needles) {
    if (source.includes(needle)) {
      throw new Error(`${path}: forbidden trust pattern present: ${needle}`);
    }
  }
};

requireText("functions/api/_lib/user-session.ts", [
  "bc_session",
  "HMAC",
  "blackcrown:user-session:",
  "verifyUserSession",
]);

// Guest recovery changed in v43 from a random server-side user id to a
// deterministic SHA-256 derivation from a cryptographically random clientId.
// The clientId is the recovery credential; authorization still requires the
// server-signed HttpOnly bc_session cookie.
requireText("functions/api/auth/guest.ts", [
  "verifyUserSession",
  "setUserSessionCookie",
  "weak_clientId",
  "crypto.subtle.digest",
  "blackcrown:guest:",
]);
forbidText("functions/api/auth/guest.ts", ["getUserIdCookie", "setUserIdCookie", "Math.random"]);

requireText("packages/core/src/clientIdentity.ts", [
  'const CLIENT_ID_KEY = "bc.clientId.v1"',
  "randomUUID",
  "getRandomValues",
  "client_",
  "value.startsWith(\"c_\")",
  "/api/auth/guest",
]);
forbidText("packages/core/src/clientIdentity.ts", ["Math.random"]);

requireText("apps/site/src/App.tsx", ["ensureGuestSession"]);
forbidText("apps/site/src/App.tsx", ["Math.random", "function safeId"]);
requireText("apps/lobby/src/routes/App.tsx", ["ensureGuestSession"]);

requireText("functions/api/me.ts", ["verifyUserSession", "setUserSessionCookie"]);
forbidText("functions/api/me.ts", ["getUserIdCookie", "setUserIdCookie"]);

requireText("functions/api/commerce/checkout.ts", [
  "verifyUserSession",
  "BC_COMMERCE_MOCK_ENABLED",
  "payment_provider_unavailable",
]);
forbidText("functions/api/commerce/checkout.ts", ["getUserIdCookie"]);

for (const path of [
  "functions/api/commerce/entitlements.ts",
  "functions/api/commerce/orders/[id].ts",
]) {
  requireText(path, ["verifyUserSession"]);
  forbidText(path, ["getUserIdCookie"]);
}

requireText("apps/site/src/lib/commerce.ts", [
  "secure_random_unavailable",
  "randomUUID",
  "getRandomValues",
]);
forbidText("apps/site/src/lib/commerce.ts", ["Math.random"]);

const envExample = read("apps/site/.env.example");
if (!envExample.includes("https://wqriwhciqvrbhkkiuhxb.supabase.co")) {
  throw new Error("apps/site/.env.example must point to shared Supabase GAME project");
}
if (!envExample.includes("VITE_BLACKCROWN_SUPABASE_PUBLISHABLE_KEY=sb_publishable_")) {
  throw new Error("apps/site/.env.example must use a browser publishable key");
}
if (/SERVICE_ROLE|sb_secret_/i.test(envExample)) {
  throw new Error("apps/site/.env.example must never contain a privileged Supabase credential");
}

requireText("apps/site/src/lib/blackcrownWorldStatus.ts", [
  "https://wqriwhciqvrbhkkiuhxb.supabase.co",
  "sb_publishable_",
  'const STATUS_TABLE = "blackcrown_world_status"',
  'const CACHE_KEY = "bc.world-status.game.v1"',
]);
forbidText("apps/site/src/lib/blackcrownWorldStatus.ts", [
  "nmgotvxisujvpfoxivoq",
  "sb_publishable_B2dxtgWZBYfC8iRkV02k0Q_FDJ01QNR",
  "SERVICE_ROLE",
  "sb_secret_",
]);

if (fs.existsSync("functions/api/_lib/blackcrown-supabase.ts")) {
  throw new Error("Direct public Supabase account-link client must not exist");
}
requireText("functions/api/_lib/blackcrown-bot-bridge.ts", [
  "https://ggbf6-warzon-bot.onrender.com",
  "EXPECTED_BOT_HOST",
  'readCookie(request, "bc_session")',
  '"x-bc-session-token"',
  '"x-bc-site-user"',
]);
forbidText("functions/api/_lib/blackcrown-bot-bridge.ts", [
  "SUPABASE_SERVICE_ROLE_KEY",
  "sb_secret_",
  "sb_publishable_",
  "wqriwhciqvrbhkkiuhxb.supabase.co",
]);

for (const path of [
  "functions/api/integrations/telegram/link.ts",
  "functions/api/integrations/telegram/status.ts",
]) {
  requireText(path, ["verifyUserSession", "callBlackCrownBotBridge", "cache-control", "no-store"]);
  forbidText(path, [
    "getUserIdCookie",
    "bc_uid",
    "SUPABASE_SERVICE_ROLE_KEY",
    "callBlackCrownPublicRpc",
    "/rest/v1/rpc/",
  ]);
}

requireText("functions/api/integrations/telegram/link.ts", [
  "session.userId",
  'callBlackCrownBotBridge(request, env, "link", session.userId',
]);

requireText("apps/site/src/lib/telegramLink.ts", [
  "ensureGuestSession",
  "sanitizeTelegramLinkCode",
  "/api/integrations/telegram/link",
  "/api/integrations/telegram/status",
]);

requireText("apps/site/src/routes/pages/TelegramLink.tsx", [
  "Привязка не выдаёт Premium",
  "bco_premium",
  "telegramLinkCodeFromLocation",
]);

const linkMigration = requireText(
  "supabase/migrations/20260816211500_create_blackcrown_telegram_premium_link.sql",
  [
    "blackcrown_telegram_link_challenges",
    "blackcrown_account_links",
    "blackcrown_entitlements",
    "enable row level security",
    "blackcrown_complete_telegram_link",
    "blackcrown_get_telegram_entitlement_status",
    "to service_role",
  ],
);
if (linkMigration.includes("insert into public.blackcrown_entitlements")) {
  throw new Error("Account-link migration must not mint Premium entitlements");
}

requireText("supabase/migrations/20260816213000_harden_blackcrown_telegram_link_rls.sql", [
  "for all",
  "using (false)",
  "with check (false)",
]);

requireText("supabase/migrations/20260816214500_make_blackcrown_link_rpcs_server_only.sql", [
  "revoke execute on function public.blackcrown_complete_telegram_link",
  "revoke execute on function public.blackcrown_get_site_telegram_status",
  "from public, anon, authenticated",
  "to service_role",
]);

console.log("Commerce, cryptographic guest identity, Supabase GAME, and server-verified Telegram Premium link boundaries: OK");
