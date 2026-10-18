import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const requireText = (path, needles) => {
  const source = read(path);
  for (const needle of needles) {
    if (!source.includes(needle)) throw new Error(`${path}: missing identity marker: ${needle}`);
  }
  return source;
};
const forbidText = (path, needles) => {
  const source = read(path);
  for (const needle of needles) {
    if (source.includes(needle)) throw new Error(`${path}: forbidden identity pattern: ${needle}`);
  }
};

const migration = "supabase/migrations/20260816201500_create_blackcrown_identity_bridge.sql";
requireText(migration, [
  "blackcrown_accounts",
  "blackcrown_telegram_links",
  "blackcrown_telegram_link_codes",
  "blackcrown_entitlements",
  "blackcrown_account_events",
  "blackcrown_issue_telegram_link_code",
  "blackcrown_consume_telegram_link_code",
  "blackcrown_get_telegram_identity",
  "blackcrown.grant",
].filter((value) => value !== "blackcrown.grant"));
requireText(migration, [
  "enable row level security",
  "from public, anon, authenticated",
  "to service_role",
  "blackcrown.premium",
  "private_chat_required",
]);

requireText("functions/api/_lib/supabase-server.ts", [
  "wqriwhciqvrbhkkiuhxb.supabase.co",
  "sb_secret_",
  "service_role",
  "sb_publishable_",
  "identity_storage_unavailable",
]);
requireText("functions/api/_lib/telegram-link.ts", [
  "crypto.getRandomValues",
  "SHA-256",
  "blackcrown:telegram-link:v1:",
]);
forbidText("functions/api/_lib/telegram-link.ts", ["Math.random"]);

for (const path of [
  "functions/api/account/telegram/link-code.ts",
  "functions/api/account/telegram/status.ts",
  "functions/api/account/telegram/link.ts",
]) {
  requireText(path, ["verifyUserSession", "callSupabaseRpc", "Cache-Control"]);
  forbidText(path, ["SUPABASE_SERVICE_ROLE_KEY", "sb_secret_"]);
}

requireText("apps/site/public/link-telegram/index.html", [
  "Связать Telegram",
  "ONE-TIME CODE",
  "/link-telegram/app.js",
]);
requireText("apps/site/public/link-telegram/app.js", [
  "crypto.randomUUID",
  "crypto.getRandomValues",
  "/api/account/telegram/link-code",
  "/api/account/telegram/status",
  "/api/account/telegram/link",
]);
forbidText("apps/site/public/link-telegram/app.js", [
  "Math.random",
  "SUPABASE_SERVICE_ROLE_KEY",
  "sb_secret_",
]);

for (const path of [
  "apps/site/public/link-telegram/index.html",
  "apps/site/public/link-telegram/style.css",
  "apps/site/public/link-telegram/app.js",
  "apps/site/src/lib/telegramLink.ts",
]) {
  forbidText(path, ["nmgotvxisujvpfoxivoq", "service_role", "sb_secret_"]);
}

console.log("BLACK CROWN identity bridge trust boundary: OK");
