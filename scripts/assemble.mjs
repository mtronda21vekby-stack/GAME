import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "dist");

const SITE = path.join(ROOT, "apps/site/dist");
const GAME = path.join(ROOT, "apps/game/dist");
const LOBBY = path.join(ROOT, "apps/lobby/dist");

function rm(p) {
  fs.rmSync(p, { recursive: true, force: true });
}
function mkdir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function copyDir(src, dst) {
  mkdir(dst);
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function ensureExists(p, label) {
  if (!fs.existsSync(p)) {
    throw new Error(`${label} not found: ${p}. Run builds first.`);
  }
}

ensureExists(SITE, "site dist");
ensureExists(GAME, "game dist");
ensureExists(LOBBY, "lobby dist");

rm(OUT);
mkdir(OUT);

// 1) site -> /
copyDir(SITE, OUT);

// 2) game -> /game
copyDir(GAME, path.join(OUT, "game"));

// 3) lobby -> /lobby
copyDir(LOBBY, path.join(OUT, "lobby"));

// ---- Shared static paths (IMPORTANT) ----
// Our UI icons are referenced as absolute "/icons/...". When apps are nested under /game and /lobby,
// we still want icons to resolve from root "/icons".
// We copy icons from site build to root.
const siteIcons = path.join(SITE, "icons");
if (fs.existsSync(siteIcons)) {
  copyDir(siteIcons, path.join(OUT, "icons"));
}

// PWA icons referenced as "/pwa/icons/..."
const sitePwa = path.join(SITE, "pwa");
if (fs.existsSync(sitePwa)) {
  copyDir(sitePwa, path.join(OUT, "pwa"));
}

// ---- Combined SPA redirects ----
// site routes: /about /support /privacy /terms etc
// game routes: /game and /game/*
// lobby routes: /lobby and /lobby/*
const redirects = [
  "/game/*   /game/index.html   200",
  "/lobby/*  /lobby/index.html  200",
  "/*        /index.html        200"
].join("\n") + "\n";

fs.writeFileSync(path.join(OUT, "_redirects"), redirects, "utf-8");

// ---- Headers ----
// Site offline caching is OK, but game must be NO-CACHE.
// On Pages, _headers is path-matched; we enforce /game as no-store.
const headers = [
  "/*",
  "  X-Content-Type-Options: nosniff",
  "  Referrer-Policy: no-referrer",
  "  Permissions-Policy: interest-cohort=()",
  "  Cache-Control: no-cache",
  "",
  "/assets/*",
  "  Cache-Control: public, max-age=31536000, immutable",
  "",
  "/pwa/*",
  "  Cache-Control: public, max-age=31536000, immutable",
  "",
  "/sw.js",
  "  Cache-Control: no-cache",
  "",
  "/game/*",
  "  Cache-Control: no-store",
  ""
].join("\n");

fs.writeFileSync(path.join(OUT, "_headers"), headers, "utf-8");

console.log("Assembled dist/ for single-domain deployment:");
console.log(" - /        -> site");
console.log(" - /game/   -> game");
console.log(" - /lobby/  -> lobby");
