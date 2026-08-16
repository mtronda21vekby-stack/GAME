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
]);
forbidText("functions/api/auth/guest.ts", ["getUserIdCookie", "setUserIdCookie"]);

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

console.log("Commerce trust boundary: OK");
