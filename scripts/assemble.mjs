import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "dist");

const SITE = path.join(ROOT, "apps/site/dist");
const GAME = path.join(ROOT, "apps/game/dist");
const LOBBY = path.join(ROOT, "apps/lobby/dist");
const QUIET_VALLEY_RUNTIME = path.join(LOBBY, "runtime/quiet-valley");
const QUIET_VALLEY_META = path.join(LOBBY, "worlds/quiet-valley");

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
ensureExists(QUIET_VALLEY_RUNTIME, "Quiet Valley runtime");
ensureExists(QUIET_VALLEY_META, "Quiet Valley metadata");

rm(OUT);
mkdir(OUT);

// 1) site -> /
copyDir(SITE, OUT);

// 2) game -> /game
copyDir(GAME, path.join(OUT, "game"));

// 3) EvoFish lobby -> /lobby
copyDir(LOBBY, path.join(OUT, "lobby"));

// 4) Quiet Valley is a standalone BLACKCROWN game, not an EvoFish lobby world.
// Re-home the generated runtime plus its preview/manifest under /games/quiet-valley.
copyDir(QUIET_VALLEY_META, path.join(OUT, "games/quiet-valley"));
copyDir(QUIET_VALLEY_RUNTIME, path.join(OUT, "games/quiet-valley"));

// Root shared assets referenced as "/icons/..."
const siteIcons = path.join(SITE, "icons");
if (fs.existsSync(siteIcons)) copyDir(siteIcons, path.join(OUT, "icons"));

// Root shared assets referenced as "/pwa/..."
const sitePwa = path.join(SITE, "pwa");
if (fs.existsSync(sitePwa)) copyDir(sitePwa, path.join(OUT, "pwa"));

// Redirects for SPA routing (site + nested apps + standalone games).
// Exact slash and no-slash entries keep mobile Safari/Cloudflare directory handling deterministic.
const redirects = [
  "/game/*   /game/index.html   200",
  "/lobby/*  /lobby/index.html  200",
  "/games    /games/index.html  200",
  "/games/   /games/index.html  200",
  "/games/quiet-valley    /games/quiet-valley/index.html  200",
  "/games/quiet-valley/   /games/quiet-valley/index.html  200",
  "/games/quiet-valley/*  /games/quiet-valley/index.html  200",
  "/*        /index.html        200"
].join("\n") + "\n";
fs.writeFileSync(path.join(OUT, "_redirects"), redirects, "utf-8");

// Headers: site can cache shell normally, interactive games should not retain stale shells.
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
  "/games/index.html",
  "  Cache-Control: no-cache",
  "  Content-Type: text/html; charset=utf-8",
  "",
  "/games/quiet-valley/index.html",
  "  Cache-Control: no-store",
  "  Content-Type: text/html; charset=utf-8",
  "",
  "/games/quiet-valley/*",
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
console.log("  /game/   -> EvoFish game");
console.log("  /lobby/  -> EvoFish lobby");
console.log("  /games/  -> BLACKCROWN game catalog");
console.log("  /games/quiet-valley/ -> Quiet Valley standalone WebGL game");
console.log("  /games/crown-front/ -> CROWN//FRONT WebGL alpha");
