import * as THREE from "three";
import type { NpcDefinition } from "../domain";
import { DOORS, INTERACTIONS, NPCS, ROOMS, WALLS } from "../world/blueprint";

export function gameMaterial(color: number) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.84, metalness: 0.02 });
}

export function gameBox(w: number, h: number, d: number, color: number) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), gameMaterial(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function makePerson(color: number, guard = false) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.95, 10), gameMaterial(color));
  body.position.y = 0.82;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), gameMaterial(0xc69a76));
  head.position.y = 1.52;
  head.castShadow = true;
  group.add(head);

  for (const x of [-0.38, 0.38]) {
    const arm = gameBox(0.12, 0.62, 0.12, color);
    arm.position.set(x, 0.92, 0);
    group.add(arm);
  }

  if (guard) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.09, 12), gameMaterial(0x17212b));
    cap.position.y = 1.75;
    group.add(cap);
  }
  return group;
}

export type BuiltPrison = {
  player: THREE.Group;
  npcs: Map<string, THREE.Group>;
  doors: Map<string, THREE.Mesh>;
  highlight: THREE.Mesh;
  ambient: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
};

export function buildPrison(scene: THREE.Scene, npcStart: (npc: NpcDefinition) => { x: number; z: number }): BuiltPrison {
  scene.background = new THREE.Color(0x10171c);
  scene.fog = new THREE.FogExp2(0x10171c, 0.017);

  const ambient = new THREE.HemisphereLight(0xb8d0d6, 0x131717, 1.25);
  const sun = new THREE.DirectionalLight(0xeaf1ea, 2);
  sun.position.set(-9, 19, 11);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  scene.add(ambient, sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(36, 28), gameMaterial(0x252c2f));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.userData.ground = true;
  scene.add(ground);

  for (const room of ROOMS) {
    const floor = gameBox(room.w, 0.08, room.d, room.floor);
    floor.position.set(room.x, 0.02, room.z);
    floor.userData.ground = true;
    scene.add(floor);
  }

  for (const wall of WALLS) {
    const height = wall.h ?? 1.65;
    const mesh = gameBox(wall.w, height, wall.d, 0x657076);
    mesh.position.set(wall.x, height / 2, wall.z);
    scene.add(mesh);
  }

  const doors = new Map<string, THREE.Mesh>();
  for (const door of DOORS) {
    const mesh = gameBox(door.w, 1.55, door.d, door.requirement === "none" ? 0x7a858a : 0x985549);
    mesh.position.set(door.x, 0.78, door.z);
    mesh.userData.interactionId = door.id;
    scene.add(mesh);
    doors.set(door.id, mesh);
  }

  for (const interaction of INTERACTIONS) {
    if (interaction.kind === "door") continue;
    const color = interaction.kind === "escape" ? 0xbe6d54 : interaction.kind === "activity" ? 0xc49f58 : 0x7b8b8d;
    const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.12, 10), gameMaterial(color));
    marker.position.set(interaction.x, 0.12, interaction.z);
    marker.userData.interactionId = interaction.id;
    scene.add(marker);
  }

  for (const [x, z] of [[-13.7, 7.9], [-10.8, 7.9], [-7.9, 7.9], [-13.7, 4.6], [-10.8, 4.6], [-7.9, 4.6]] as [number, number][]) {
    const bed = gameBox(1.6, 0.25, 0.72, 0x4a5051);
    bed.position.set(x, 0.25, z);
    scene.add(bed);
  }
  for (const [x, z] of [[7.1, 5], [10.2, 5], [7.1, 7.2], [10.2, 7.2]] as [number, number][]) {
    const table = gameBox(2.2, 0.16, 0.85, 0x756650);
    table.position.set(x, 0.66, z);
    scene.add(table);
  }
  for (let i = 0; i < 3; i += 1) {
    const machine = gameBox(1.05, 1.1, 1, 0x737f80);
    machine.position.set(12.8, 0.57, -5.5 + i * 1.65);
    scene.add(machine);
  }

  const highlight = new THREE.Mesh(
    new THREE.RingGeometry(0.38, 0.53, 24),
    new THREE.MeshBasicMaterial({ color: 0xf0c36a, transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
  );
  highlight.rotation.x = -Math.PI / 2;
  highlight.position.y = 0.055;
  highlight.visible = false;
  scene.add(highlight);

  const player = makePerson(0xe0a44f);
  player.position.set(-11.4, 0, 5.5);
  scene.add(player);

  const npcs = new Map<string, THREE.Group>();
  for (const npc of NPCS) {
    const mesh = makePerson(npc.color, npc.role === "guard" || npc.role === "warden");
    mesh.traverse((object) => { object.userData.npcId = npc.id; });
    const start = npcStart(npc);
    mesh.position.set(start.x, 0, start.z);
    scene.add(mesh);
    npcs.set(npc.id, mesh);
  }

  return { player, npcs, doors, highlight, ambient, sun };
}
