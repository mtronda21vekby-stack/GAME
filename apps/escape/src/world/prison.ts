import * as THREE from "three";

export type Collider = {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  dynamic?: "service-gate";
};

export type Zone = {
  id: "cell" | "corridor" | "mess" | "yard" | "maintenance" | "service";
  label: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export const ZONES: readonly Zone[] = [
  { id: "cell", label: "CELL BLOCK A", minX: -20, maxX: -11.4, minZ: -13, maxZ: -4.4 },
  { id: "corridor", label: "MAIN CORRIDOR", minX: -11.4, maxX: 5, minZ: -13, maxZ: 2 },
  { id: "yard", label: "YARD", minX: -10, maxX: 7, minZ: 3, maxZ: 14 },
  { id: "mess", label: "MESS HALL", minX: 7.5, maxX: 20, minZ: 3, maxZ: 14 },
  { id: "maintenance", label: "MAINTENANCE", minX: 5.5, maxX: 17.5, minZ: -13, maxZ: -2 },
  { id: "service", label: "SERVICE CORRIDOR", minX: 17.5, maxX: 21.5, minZ: -13, maxZ: -2 },
];

export const SCREWDRIVER_POINT = new THREE.Vector3(12.2, 0.55, -8.1);
export const POWER_PANEL_POINT = new THREE.Vector3(16.7, 1.0, -6.0);
export const EXIT_POINT = new THREE.Vector3(21.0, 0.2, -6.0);

const wallSpecs = [
  [0, -15.2, 44, 0.5],
  [0, 15.2, 44, 0.5],
  [-22.2, 0, 0.5, 30],
  [22.2, 0, 0.5, 30],
  [-11.2, -10.0, 0.45, 6.0],
  [-11.2, -4.0, 0.45, 2.0],
  [-11.2, 0.5, 0.45, 3.0],
  [-20.0, -4.2, 9.0, 0.45],
  [-17.0, -9.8, 0.35, 6.0],
  [5.2, -12.0, 0.45, 6.0],
  [5.2, -4.0, 0.45, 4.0],
  [17.5, -11.5, 0.45, 3.0],
  [17.5, -3.5, 0.45, 3.0],
  [5.2, -1.8, 12.5, 0.45],
  [17.7, -1.8, 8.5, 0.45],
  [7.3, 8.7, 0.45, 13.0],
  [7.3, 2.8, 0.45, 2.0],
] as const;

export const STATIC_COLLIDERS: readonly Collider[] = wallSpecs.map(([x, z, w, d], index) => ({
  id: `wall-${index}`,
  minX: x - w / 2,
  maxX: x + w / 2,
  minZ: z - d / 2,
  maxZ: z + d / 2,
}));

export const SERVICE_GATE_COLLIDER: Collider = {
  id: "service-gate",
  minX: 17.25,
  maxX: 17.75,
  minZ: -10.0,
  maxZ: -5.0,
  dynamic: "service-gate",
};

function box(
  width: number,
  height: number,
  depth: number,
  color: number,
  x: number,
  y: number,
  z: number,
  roughness = 0.82,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.12 }),
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addLabel(scene: THREE.Scene, text: string, x: number, z: number): void {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "700 28px system-ui";
  ctx.fillStyle = "rgba(220,235,242,.8)";
  ctx.textAlign = "center";
  ctx.fillText(text, 256, 56);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.72 });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(x, 0.06, z);
  sprite.scale.set(5.6, 1.05, 1);
  sprite.rotation.x = -Math.PI / 2;
  scene.add(sprite);
}

export function buildPrison(scene: THREE.Scene): {
  occluders: THREE.Object3D[];
  serviceGate: THREE.Mesh;
  screwdriver: THREE.Group;
  powerPanel: THREE.Mesh;
} {
  const floor = box(44, 0.35, 30, 0x222a2f, 0, -0.22, 0, 0.96);
  scene.add(floor);

  const yard = box(17, 0.06, 11, 0x2d3b33, -1.4, 0.0, 8.8, 1);
  yard.receiveShadow = true;
  scene.add(yard);

  const maintenance = box(12, 0.07, 11, 0x352f2a, 11.5, 0.0, -7.5, 0.96);
  scene.add(maintenance);

  const service = box(4.5, 0.08, 11, 0x301e22, 19.5, 0.01, -7.5, 0.96);
  scene.add(service);

  const walls: THREE.Object3D[] = [];
  for (const [x, z, w, d] of wallSpecs) {
    const wall = box(w, 3.2, d, 0x555e62, x, 1.6, z);
    scene.add(wall);
    walls.push(wall);
  }

  // Cell furniture and environmental read.
  scene.add(box(3.3, 0.45, 1.55, 0x6b7376, -18.1, 0.25, -11.8));
  scene.add(box(2.4, 0.7, 1.2, 0x3b4347, -13.0, 0.35, -11.4));
  scene.add(box(0.8, 1.1, 0.8, 0x7c8588, -19.0, 0.55, -6.1));

  // Mess hall tables.
  for (const z of [5.2, 8.3, 11.4]) {
    scene.add(box(5.2, 0.72, 1.0, 0x5a5148, 13.2, 0.36, z));
  }

  // Yard exercise fixtures.
  for (const x of [-7.0, -3.4, 0.2]) {
    const postA = box(0.12, 2.2, 0.12, 0x88969d, x, 1.1, 9.0);
    const postB = box(0.12, 2.2, 0.12, 0x88969d, x + 1.5, 1.1, 9.0);
    const bar = box(1.62, 0.1, 0.1, 0x9ba8ad, x + 0.75, 2.1, 9.0);
    scene.add(postA, postB, bar);
  }

  // Maintenance benches.
  scene.add(box(5.2, 0.9, 1.4, 0x4d4a45, 11.8, 0.45, -8.2));
  scene.add(box(3.8, 1.05, 0.75, 0x444c50, 8.1, 0.52, -4.0));

  const screwdriver = new THREE.Group();
  const handle = box(0.18, 0.18, 0.8, 0xb51d2b, 0, 0, 0);
  const shaft = box(0.06, 0.06, 0.85, 0xc8d2d8, 0, 0, 0.76, 0.28);
  screwdriver.add(handle, shaft);
  screwdriver.rotation.y = Math.PI / 6;
  screwdriver.position.copy(SCREWDRIVER_POINT);
  scene.add(screwdriver);

  const powerPanel = box(0.32, 1.5, 1.35, 0x252d31, POWER_PANEL_POINT.x, POWER_PANEL_POINT.y, POWER_PANEL_POINT.z, 0.35);
  const led = new THREE.PointLight(0xff334b, 1.8, 3.5, 2.4);
  led.position.set(POWER_PANEL_POINT.x - 0.4, 1.35, POWER_PANEL_POINT.z);
  scene.add(powerPanel, led);
  powerPanel.userData.led = led;

  const serviceGate = box(0.28, 2.7, 5.0, 0x6b7378, 17.5, 1.35, -7.5, 0.38);
  const bars = new THREE.Group();
  for (let z = -9.8; z <= -5.2; z += 0.55) {
    const bar = box(0.14, 2.7, 0.14, 0x89969a, 17.28, 1.35, z, 0.3);
    bars.add(bar);
  }
  scene.add(serviceGate, bars);
  serviceGate.userData.bars = bars;

  const perimeterLampPositions = [
    [-16, -2], [-8, -2], [1, -2], [9, -2], [17, -2], [-10, 13], [1, 13], [12, 13],
  ] as const;
  for (const [x, z] of perimeterLampPositions) {
    const light = new THREE.PointLight(0xb9d8e8, 1.15, 8, 2.1);
    light.position.set(x, 2.65, z);
    scene.add(light);
  }

  for (const zone of ZONES) {
    addLabel(scene, zone.label, (zone.minX + zone.maxX) / 2, (zone.minZ + zone.maxZ) / 2);
  }

  return { occluders: walls, serviceGate, screwdriver, powerPanel };
}

export function pointZone(x: number, z: number): Zone | undefined {
  return ZONES.find((zone) => x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ);
}

export function collides(x: number, z: number, radius: number, gateOpen: boolean): boolean {
  const colliders = gateOpen ? STATIC_COLLIDERS : [...STATIC_COLLIDERS, SERVICE_GATE_COLLIDER];
  return colliders.some((c) =>
    x + radius > c.minX && x - radius < c.maxX && z + radius > c.minZ && z - radius < c.maxZ,
  );
}
