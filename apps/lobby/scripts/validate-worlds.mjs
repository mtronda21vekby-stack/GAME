import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = path.dirname(fileURLToPath(import.meta.url));
const lobbyRoot = path.resolve(here, "..");
const worldRoot = path.join(lobbyRoot, "world-runtimes/quiet-valley");
const worldSource = path.join(worldRoot, "src");
const manifestPath = path.join(lobbyRoot, "public/worlds/quiet-valley/manifest.json");
const runtimePath = path.join(lobbyRoot, "public/runtime/quiet-valley/index.html");
const catalogPath = path.join(lobbyRoot, "src/worlds/catalog.ts");
const buildScript = path.join(worldRoot, "build.mjs");

const sourceModules = [
  "engine.js",
  "simulation.js",
  "expansion.js",
  "gameplay.js",
  "models.js",
  "world.js",
  "valley-ui.js",
  "gameplay-ui.js",
  "picking.js",
  "watering.js",
  "main.js",
  "blackcrown-bridge.js",
];

for (const name of sourceModules) {
  const source = fs.readFileSync(path.join(worldSource, name), "utf8");
  try {
    new vm.Script(`(() => {\n${source}\n})();`, { filename: name });
  } catch (error) {
    throw new Error(`World source validation failed in ${name}: ${error.message}`);
  }
}

const build = spawnSync(process.execPath, [buildScript], { cwd: lobbyRoot, encoding: "utf8" });
if (build.status !== 0) {
  process.stderr.write(build.stdout || "");
  process.stderr.write(build.stderr || "");
  process.exit(build.status ?? 1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const runtime = fs.readFileSync(runtimePath, "utf8");
const catalog = fs.readFileSync(catalogPath, "utf8");
const required = [
  [manifest.schemaVersion === 1, "manifest schemaVersion"],
  [manifest.id === "quiet-valley", "manifest world id"],
  [manifest.bridge === "blackcrown.world.v1", "bridge contract"],
  [manifest.saveNamespace === "bc.world.quiet-valley.v1", "save namespace"],
  [runtime.includes("bc.world.quiet-valley.v1"), "runtime save namespace"],
  [runtime.includes("blackcrown.world.v1"), "runtime bridge"],
  [runtime.includes("BLACKCROWN"), "runtime lobby return"],
  [catalog.includes(manifest.runtime), "catalog runtime URL"],
  [catalog.includes(manifest.preview), "catalog preview URL"],
  [!runtime.includes("/*__"), "runtime build placeholders"],
];

for (const [ok, label] of required) {
  if (!ok) throw new Error(`World validation failed: ${label}`);
}

const scripts = [...runtime.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
if (scripts.length !== 3) throw new Error(`World validation failed: expected 3 inline script bundles, got ${scripts.length}`);
for (const [index, source] of scripts.entries()) {
  try {
    new vm.Script(source, { filename: `quiet-valley-inline-${index + 1}.js` });
  } catch (error) {
    throw new Error(`World validation failed: generated runtime JavaScript ${index + 1} does not parse: ${error.message}`);
  }
}

console.log(`world validation: clean · ${manifest.id} · ${manifest.version} · ${sourceModules.length} sources + ${scripts.length} bundles parsed`);
console.log(build.stdout.trim());
