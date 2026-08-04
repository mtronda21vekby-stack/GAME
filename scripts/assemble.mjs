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
  if (!fs.existsSync(p)) throw new Error(`${label} not found: ${p}. Run builds first.`);
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

// Root shared assets referenced as "/icons/..."
const siteIcons = path.join(SITE, "icons");
if (fs.existsSync(siteIcons)) copyDir(siteIcons, path.join(OUT, "icons"));

// Root shared assets referenced as "/pwa/..."
const sitePwa = path.join(SITE, "pwa");
if (fs.existsSync(sitePwa)) copyDir(sitePwa, path.join(OUT, "pwa"));

// Redirects for SPA routing (site + nested apps)
const redirects = [
  "/game/*   /game/index.html   200",
  "/lobby/*  /lobby/index.html  200",
  "/*        /index.html        200"
].join("\n") + "\n";
fs.writeFileSync(path.join(OUT, "_redirects"), redirects, "utf-8");

// Headers: site can cache shell normally, game must be NO-CACHE (no-store)
const headers = [
  "/*",
  "  X-Content-Type-Options: nosniff",
  "  Referrer-Policy: no-referrer",
  "  Permissions-Policy: interest-cohort=()",
  "",
  "/",
  "  Cache-Control: no-cache",
  "",
  "/index.html",
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
  "",
  "/lobby/*",
  "  Cache-Control: no-cache",
  "",
  "/games/crown-front/index.html",
  "  Cache-Control: no-cache",
  "  Content-Type: text/html; charset=utf-8",
  "",
  "/games/crown-front/TemplateData/*",
  "  Cache-Control: public, max-age=3600",
  "",
  "/games/crown-front/Build/CloudWebGL.loader.js",
  "  Cache-Control: no-cache",
  "  Content-Type: application/javascript; charset=utf-8",
  "",
  "/games/crown-front/Build/CloudWebGL.data.unityweb",
  "  Cache-Control: no-cache",
  "  Content-Type: application/octet-stream",
  "",
  "/games/crown-front/Build/CloudWebGL.framework.js.unityweb",
  "  Cache-Control: no-cache",
  "  Content-Type: application/javascript",
  "",
  "/games/crown-front/Build/CloudWebGL.wasm.unityweb",
  "  Cache-Control: no-cache",
  "  Content-Type: application/wasm",
  ""
].join("\n");
fs.writeFileSync(path.join(OUT, "_headers"), headers, "utf-8");

console.log("OK: dist/ assembled for single-domain deployment.");
console.log("Routes:");
console.log("  /        -> site");
console.log("  /game/   -> game");
console.log("  /lobby/  -> lobby");
console.log("  /games/crown-front/ -> CROWN//FRONT WebGL alpha");
