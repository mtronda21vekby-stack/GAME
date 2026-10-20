# BLACKCROWN corrective sculpt and depth stage

The published source meshes, images and poster remain unchanged in
`apps/site/public/experience/blackcrown-skull/`. The runtime selects the separate
`sculpt-v3/` asset set. The approved `sculpt-v2/` set is also preserved byte for
byte; restoring the `7a2e430` frontend returns to that published version.

`sculpt-v2.py` imports the SHA-verified original GLB in Blender 5.1, deepens the
orbital floors in the face and cranium, refines the cheek and dental contours,
and gives the long spine a small fixed S-curve. It adds no mesh, bone or
subdivision. Original split normals are transported with the deformation's
inverse-transpose Jacobian; every sampled determinant must stay positive.
The unchanged crown geometry is retained.

The optional `depth-stage-v3.json` profile increases only the existing spine's
lateral/depth bend and width variation. The output folder is separate and the
original orbital, cheek and dental corrections stay the same. No side bones
or other objects are added. Current measured counts are 80,310 desktop and
27,193 mobile triangles.

Run with Blender's automatic script execution disabled:

```
Blender --background --factory-startup --disable-autoexec --python-exit-code 1 \
  --python art-source/blackcrown-skull/sculpt-v2.py -- /absolute/repo /absolute/work
```

For the stronger v3 curve, append
`art-source/blackcrown-skull/depth-stage-v3.json` as the third script argument.

The work folder receives an editable desktop `.blend` and temporary mobile
textures. Exports and their measured manifests go into the versioned public
asset folder. Desktop retains 80,310 triangles; mobile stays at or below the
original 27,200-triangle budget, with six embedded textures capped at 512 px.

The native `COLOR_0` cavity field darkens the orbital interiors and increases
their runtime roughness. Original PBR maps remain embedded. The static studio
reflection map is built once, at a lower resolution on mobile; it adds no
visible geometry or per-frame texture updates. New assets are warmed before
the existing scroll journey reveals them.

The v3 loading poster is a direct capture from the actual production Three
renderer. Its camera is the initial entrance camera cropped to the native
brand slot, so loading does not switch from a tight head crop to a distant
view. Dimensions and hash are recorded in the manifest. Atmosphere and DOM
interface are omitted; the background is the existing `#090d11`.

The runtime keeps exposure at 1.02. Two unshadowed local spotlights make the
jaw and moving spine visible; the jaw light transfers to the existing metal
sheet during the exit. The camera approaches along Z before descending,
retreats at the tip, then approaches the unfolding sheet. Particle positions
and sheet unfolding are shader uniforms driven by the same reversible scroll
clock. Reduced motion leaves the sheet open and uses a flat native gallery.
Live HTML game surfaces are projected through the scene camera at separate
depths; native scroll, links, buttons and React ownership remain intact.
