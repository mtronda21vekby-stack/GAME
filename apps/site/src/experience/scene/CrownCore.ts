import * as THREE from "three";

export type CrownCoreVisual = {
  group: THREE.Group;
  coreMaterial: THREE.MeshStandardMaterial;
  energyMaterial: THREE.MeshBasicMaterial;
  containment: THREE.Mesh;
  energyVolume: THREE.Mesh;
  nucleus: THREE.Mesh;
  cage: THREE.Mesh;
  coreLight: THREE.PointLight;
};

export function createCrownCore(radialSegments: number): CrownCoreVisual {
  const group = new THREE.Group();
  group.name = "CrownCore";
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0x071118,
    emissive: 0x07596a,
    emissiveIntensity: 0.16,
    metalness: 0.7,
    roughness: 0.32,
    transparent: true,
  });
  const containment = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, radialSegments >= 42 ? 2 : 1), coreMaterial);
  const cage = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.58, 1),
    new THREE.MeshBasicMaterial({ color: 0x78deea, wireframe: true, transparent: true, opacity: 0.17 }),
  );
  const energyMaterial = new THREE.MeshBasicMaterial({
    color: 0x2ab9cf,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const energyVolume = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.32, radialSegments >= 42 ? 2 : 1),
    energyMaterial,
  );
  const nucleus = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.16, 1),
    new THREE.MeshBasicMaterial({ color: 0xc6fbff, transparent: true, opacity: 0.9 }),
  );
  const coreLight = new THREE.PointLight(0x49d9ed, 0.5, 5.5, 2);
  group.add(containment, energyVolume, nucleus, cage, coreLight);
  return { group, coreMaterial, energyMaterial, containment, energyVolume, nucleus, cage, coreLight };
}
