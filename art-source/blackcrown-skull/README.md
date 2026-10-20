# BLACKCROWN corrective sculpt v2

The published source meshes, images and poster remain unchanged in
`apps/site/public/experience/blackcrown-skull/`. The runtime selects the separate
`sculpt-v2/` asset set. Revert the model selection and material/lighting commit
to return to the published `25b4265` appearance.

`sculpt-v2.py` imports the SHA-verified original GLB in Blender 5.1, deepens the
orbital floors in the face and cranium, refines the cheek and dental contours,
and gives the long spine a small fixed S-curve. It adds no mesh, bone or
subdivision. Original split normals are transported with the deformation's
inverse-transpose Jacobian; every sampled determinant must stay positive.
The unchanged crown geometry is retained.

Run with Blender's automatic script execution disabled:

```
Blender --background --factory-startup --disable-autoexec --python-exit-code 1 \
  --python art-source/blackcrown-skull/sculpt-v2.py -- /absolute/repo /absolute/work
```

The work folder receives an editable desktop `.blend` and temporary mobile
textures. Exports and their measured manifests go into the versioned public
asset folder. Desktop retains 80,310 triangles; mobile stays at or below the
original 27,200-triangle budget, with six embedded textures capped at 512 px.

The native `COLOR_0` cavity field darkens the orbital interiors and increases
their runtime roughness. Original PBR maps remain embedded. The static studio
reflection map is built once, at a lower resolution on mobile; it adds no
visible geometry or per-frame texture updates. New assets are warmed before
the existing scroll journey reveals them.

The loading poster is a direct 640×760 capture from the actual production
Three renderer, with the atmosphere and DOM interface omitted. It is an
opaque image on the existing `#090d11` stage background, not new artwork.
