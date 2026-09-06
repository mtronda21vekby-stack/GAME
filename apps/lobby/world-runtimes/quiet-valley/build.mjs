import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, "src");
const lobbyRoot = path.resolve(here, "../..");
const outDir = path.join(lobbyRoot, "public/runtime/quiet-valley");
const outFile = path.join(outDir, "index.html");

const read = (name) => fs.readFileSync(path.join(src, name), "utf8");

// Each source module executes in a private lexical scope. Only the explicit runtime API
// below is published on globalThis. This prevents helper-name collisions ($, esc, clamp,
// etc.) and gives future modules a deliberate dependency boundary instead of one giant
// shared script scope.
const modules = [
  ["engine.js", "F"],
  ["simulation.js", "FarmSim"],
  ["expansion.js", "FarmExpansion"],
  ["gameplay.js", "ValleyGameplay"],
  ["models.js", "FarmArt"],
  ["world.js", "ValleyWorld"],
  ["valley-ui.js", "ValleyUI"],
  ["gameplay-ui.js", "GameplayUI"],
  ["picking.js", "FarmPick"],
  ["watering.js", "FarmWater"],
  ["main.js", null],
];

const scripts = modules
  .map(([name, exportName]) => {
    const source = read(name);
    const publish = exportName ? `\n;globalThis.${exportName} = ${exportName};` : "";
    return `/* module: ${name} */\n(() => {\n${source}${publish}\n})();`;
  })
  .join("\n\n");

const html = read("index.template.html")
  .replace("/*__CSS__*/", [read("style.css"), read("valley.css"), read("blackcrown.css")].join("\n"))
  .replace("/*__BOOT__*/", read("boot.js"))
  .replace("/*__SCRIPTS__*/", scripts)
  .replace("/*__BRIDGE__*/", read("blackcrown-bridge.js"));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, html, "utf8");
console.log(`quiet-valley runtime: ${path.relative(lobbyRoot, outFile)} (${Buffer.byteLength(html).toLocaleString()} bytes)`);
