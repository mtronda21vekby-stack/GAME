import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCrownAssetAtPath } from "./lib/crown-asset-validator.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(scriptDir, "..");
const manifestPath = path.join(siteDir, "public/experience/crown/crown.manifest.json");
const result = await validateCrownAssetAtPath({ manifestPath, siteDir });
for (const message of result.messages) console.log(message);
if (!result.ok) process.exitCode = 1;
