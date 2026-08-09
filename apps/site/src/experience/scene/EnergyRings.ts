import * as THREE from "three";

export type EnergyRingVisual = {
  group: THREE.Group;
  rings: THREE.Mesh[];
  materials: THREE.MeshBasicMaterial[];
};

export function createEnergyRings(radialSegments: number): EnergyRingVisual {
  const group = new THREE.Group();
  group.name = "EnergyRings";
  const rings: THREE.Mesh[] = [];
  const materials: THREE.MeshBasicMaterial[] = [];
  const radii = [1.24, 1.58, 1.95];
  radii.forEach((radius, index) => {
    const material = new THREE.MeshBasicMaterial({
      color: index === 1 ? 0x826cff : 0x64eaff,
      transparent: true,
      opacity: 0.3 - index * 0.035,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.018 + index * 0.006, 8, radialSegments), material);
    ring.rotation.set(index * 0.42, index * 0.32, index * 0.78);
    group.add(ring);
    rings.push(ring);
    materials.push(material);
  });
  return { group, rings, materials };
}
