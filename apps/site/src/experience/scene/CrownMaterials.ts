import * as THREE from "three";

export type CrownMaterialSystem = {
  shell: THREE.MeshStandardMaterial;
  inner: THREE.MeshStandardMaterial;
  energy: THREE.MeshStandardMaterial;
  containment: THREE.MeshStandardMaterial;
};

export function createCrownMaterials(highQuality: boolean): CrownMaterialSystem {
  const shell = highQuality
    ? new THREE.MeshPhysicalMaterial({
        color: 0x1b2831,
        metalness: 0.72,
        roughness: 0.34,
        clearcoat: 0.22,
        clearcoatRoughness: 0.48,
      })
    : new THREE.MeshStandardMaterial({ color: 0x18242c, metalness: 0.7, roughness: 0.38 });

  return {
    shell,
    inner: new THREE.MeshStandardMaterial({ color: 0x080e13, metalness: 0.38, roughness: 0.72 }),
    energy: new THREE.MeshStandardMaterial({
      color: 0x07161c,
      emissive: 0x27c7df,
      emissiveIntensity: 0.56,
      metalness: 0.24,
      roughness: 0.38,
    }),
    containment: new THREE.MeshStandardMaterial({ color: 0x111c23, metalness: 0.78, roughness: 0.44 }),
  };
}
