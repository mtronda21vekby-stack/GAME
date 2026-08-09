# BlackCrown Crown source policy

The deterministic source for Candidate A is the Blender Python toolchain under
`tools/blender/blackcrown-crown/`. This repository does not currently have Git
LFS, so the generated `.blend` and uncompressed procedural texture sources stay
under `/tmp/blackcrown-production-crown-candidate-a/`.

`candidate-a/source-manifest.json` records the exact Blender version, source
path, size and SHA-256 used for the checked-in GLB candidates. Re-run the
generator and validator rather than editing the generated binary by hand.
