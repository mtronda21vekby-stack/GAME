# BlackCrown Blender Site Elements V1

This tool authors the first local Blender environment pack for the BlackCrown
Experience Shell. It does not modify either Crown candidate.

Generated elements:

- `world-gate.glb`
- `crown-front-reactor.glb`
- `network-architecture.glb`
- `collection-vault.glb`
- `identity-frame.glb`

The production default remains procedural. The authored pack is available only
on the local lab route with `?bcenv=blender`.

Generate the master Blender file, GLBs, manifest and preview renders:

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python tools/blender/blackcrown-environments/generate_site_elements.py -- \
  --repo-root "$PWD" \
  --preview-dir /tmp/blackcrown-blender-site-elements-v1
```

The generator is deterministic and uses no downloaded models, textures, HDRs
or linked libraries.
