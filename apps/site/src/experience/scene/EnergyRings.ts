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
  const radii = [0.72, 0.96, 1.22];
  radii.forEach((radius, index) => {
    const material = new THREE.MeshBasicMaterial({
      color: index === 1 ? 0x7568c8 : 0x55cbd9,
      transparent: true,
      opacity: 0.2 - index * 0.028,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.012 + index * 0.005, 6, radialSegments), material);
    ring.rotation.set(index * 0.25, index * 0.18, index * 0.62);
    group.add(ring);
    rings.push(ring);
    materials.push(material);
  });
  return { group, rings, materials };
}
