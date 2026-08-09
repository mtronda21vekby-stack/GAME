# BlackCrown Crown Candidate B Source

Candidate B is a local authored review candidate. Its deterministic source is
generated with Blender 5.1.2 and the scripts under
`tools/blender/blackcrown-crown/`. No external models, textures, HDR files,
shaders or decoders are used.

The generated `.blend` and source PNG files remain outside Git:

```text
/tmp/blackcrown-production-crown-candidate-b/
```

Generate and validate:

```bash
BLENDER=/Applications/Blender.app/Contents/MacOS/Blender

"$BLENDER" --background --python-exit-code 1 \
  --python tools/blender/blackcrown-crown/generate_candidate_b.py -- \
  --config tools/blender/blackcrown-crown/config/candidate-b.json \
  --output-blend /tmp/blackcrown-production-crown-candidate-b/BlackCrown_Crown_Candidate_B.blend

"$BLENDER" --background --python-exit-code 1 \
  /tmp/blackcrown-production-crown-candidate-b/BlackCrown_Crown_Candidate_B.blend \
  --python tools/blender/blackcrown-crown/validate_candidate_b_scene.py -- \
  --config tools/blender/blackcrown-crown/config/candidate-b.json --lod lod0
```

Candidate B must not be copied into the canonical production slot until KTX2
packaging, user visual approval and physical iPhone Safari QA are complete.
