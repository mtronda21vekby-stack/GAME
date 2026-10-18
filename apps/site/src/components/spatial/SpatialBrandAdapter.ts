import * as THREE from "three";

/** Accepts either a wide crown or a tall skull/crown/spine GLB; no node names or rig required. */
export function adaptSpatialBrand(model: THREE.Object3D, fitSpan: number) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3());
  const portrait = size.y > Math.max(size.x, size.z, .001) * 1.65;
  model.position.sub(box.getCenter(new THREE.Vector3()));
  const group = new THREE.Group();
  group.add(model);
  group.scale.setScalar((portrait ? 4.2 : fitSpan) / Math.max(size.x, size.y, size.z, .001));
  return { group, portrait };
}
