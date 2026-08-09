import * as THREE from "three";

export type CrownCoreVisual = {
  group: THREE.Group;
  coreMaterial: THREE.MeshStandardMaterial;
  energyMaterial: THREE.MeshBasicMaterial;
};

export function createCrownCore(radialSegments: number): CrownCoreVisual {
  const group = new THREE.Group();
  group.name = "CrownCore";
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x02080c,
    emissive: 0x087e98,
    emissiveIntensity: 0.32,
    metalness: 0.72,
    roughness: 0.18,
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.56, radialSegments >= 42 ? 3 : 2), coreMaterial);
  const cage = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.7, 1),
    new THREE.MeshBasicMaterial({ color: 0x6fe9ff, wireframe: true, transparent: true, opacity: 0.32 }),
  );
  const energyMaterial = new THREE.MeshBasicMaterial({
    color: 0x38bfd7,
    transparent: true,
    opacity: 0.1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.38, radialSegments, Math.max(16, radialSegments / 2)), energyMaterial);
  group.add(core, cage, halo);
  return { group, coreMaterial, energyMaterial };
}
