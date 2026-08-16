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

requireText("functions/api/auth/guest.ts", [
  "verifyUserSession",
  "setUserSessionCookie",
  "weak_clientId",
  "getRandomValues",
]);
forbidText("functions/api/auth/guest.ts", ["getUserIdCookie", "setUserIdCookie", "Math.random"]);

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

requireText("functions/api/_lib/blackcrown-supabase.ts", [
  "wqriwhciqvrbhkkiuhxb.supabase.co",
  "sb_publishable_",
  "EXPECTED_HOST",
  "blackcrown_complete_telegram_link",
  "blackcrown_get_site_telegram_status",
]);
forbidText("functions/api/_lib/blackcrown-supabase.ts", [
  "nmgotvxisujvpfoxivoq",
  "sb_secret_",
  "SUPABASE_SERVICE_ROLE_KEY",
  'Authorization: `Bearer',
]);

for (const path of [
  "functions/api/integrations/telegram/link.ts",
  "functions/api/integrations/telegram/status.ts",
]) {
  requireText(path, ["verifyUserSession", "cache-control", "no-store"]);
  forbidText(path, ["getUserIdCookie", "bc_uid", "SUPABASE_SERVICE_ROLE_KEY"]);
}

requireText("functions/api/integrations/telegram/link.ts", [
  "session.userId",
  "blackcrown_complete_telegram_link",
  "p_site_user_id: session.userId",
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
    "to anon, authenticated",
    "to service_role",
  ],
);
if (linkMigration.includes("insert into public.blackcrown_entitlements")) {
  throw new Error("Account-link migration must not mint Premium entitlements");
}

console.log("Commerce, Supabase GAME, and Telegram Premium link trust boundaries: OK");
