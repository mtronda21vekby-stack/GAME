import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateCrownAssetAtPath } from "./lib/crown-asset-validator.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(scriptDir, "..");
const candidateIndex = process.argv.indexOf("--candidate");
const candidate = candidateIndex >= 0 ? process.argv[candidateIndex + 1] : null;
const manifests = {
  "candidate-a": "public/experience/crown/candidate-a/crown-candidate-a.manifest.json",
};
if (candidate && !manifests[candidate]) {
  console.error(`Unknown Crown candidate: ${candidate}`);
  process.exit(1);
}
const manifestPath = path.join(siteDir, candidate ? manifests[candidate] : "public/experience/crown/crown.manifest.json");
const result = await validateCrownAssetAtPath({ manifestPath, siteDir });
for (const message of result.messages) console.log(message);
if (!result.ok) process.exitCode = 1;
