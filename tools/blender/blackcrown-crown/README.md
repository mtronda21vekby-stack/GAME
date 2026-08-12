# BlackCrown Digital Crown Candidate A

These scripts author Candidate A deterministically in Blender 4.1 or newer. They
do not download models, textures, HDR files or decoders. The generated `.blend`
is intentionally stored outside Git because this repository has no Git LFS
policy.

```bash
BLENDER=/Applications/Blender.app/Contents/MacOS/Blender
OUT=/tmp/blackcrown-production-crown-candidate-a

"$BLENDER" --background --python-exit-code 1 \
  --python tools/blender/blackcrown-crown/generate_candidate_a.py -- \
  --config tools/blender/blackcrown-crown/config/candidate-a.json \
  --output-blend "$OUT/BlackCrown_Crown_Candidate_A.blend"

"$BLENDER" --background --python-exit-code 1 "$OUT/BlackCrown_Crown_Candidate_A.blend" \
  --python tools/blender/blackcrown-crown/validate_blender_scene.py -- \
  --config tools/blender/blackcrown-crown/config/candidate-a.json

"$BLENDER" --background --python-exit-code 1 \
  --python tools/blender/blackcrown-crown/export_candidate_a.py -- \
  --config tools/blender/blackcrown-crown/config/candidate-a.json \
  --output-dir apps/site/public/experience/crown/candidate-a

"$BLENDER" --background --python-exit-code 1 "$OUT/BlackCrown_Crown_Candidate_A.blend" \
  --python tools/blender/blackcrown-crown/render_candidate_a.py -- \
  --output-dir "$OUT"
```

Run the repository validator after export:

```bash
corepack pnpm --filter @blackcrown/site test:crown-asset -- --candidate candidate-a
```

Candidate A remains review-only. The canonical production manifest stays
disabled and the runtime can load this asset only through the allowlisted local
lab override.
