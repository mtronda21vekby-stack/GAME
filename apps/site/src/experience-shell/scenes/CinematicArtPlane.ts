import * as THREE from "three";

export type CinematicArtPlane = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  material: THREE.MeshBasicMaterial;
};

export function createCinematicArtPlane(width = 16, height = 9): CinematicArtPlane {
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.visible = false;
  mesh.frustumCulled = false;
  mesh.renderOrder = -8;
  return { mesh, material };
}

export function setCinematicArtTexture(plane: CinematicArtPlane, texture: THREE.Texture | null) {
  if (!texture) return;
  plane.material.map = texture;
  plane.material.needsUpdate = true;
  plane.mesh.visible = true;
}
