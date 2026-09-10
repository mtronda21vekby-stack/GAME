import * as THREE from "three";
import type { GameSnapshot, NpcDefinition, ZoneId } from "../domain";
import type { BreakoutStore } from "../simulation/BreakoutStore";
import { DOORS, INTERACTIONS, NPCS, WALLS, WORLD_BOUNDS, ZONE_CENTERS, zoneAt } from "../world/blueprint";
import { buildPrison } from "./worldBuilder";

const PLAYER_RADIUS = 0.34;
const INTERACT_DISTANCE = 1.7;

function inside(x: number, z: number, rect: { x: number; z: number; w: number; d: number }, padding = 0) {
  return Math.abs(x - rect.x) <= rect.w / 2 + padding && Math.abs(z - rect.z) <= rect.d / 2 + padding;
}

function stableOffset(id: string) {
  let hash = 7;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return { x: ((hash & 7) - 3) * 0.48, z: (((hash >> 3) & 7) - 3) * 0.42 };
}

export class PrisonScene {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-10, 10, 7, -7, 0.1, 100);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly keys = new Set<string>();
  private readonly virtualKeys = new Set<string>();
  private readonly clock = new THREE.Clock();
  private readonly cameraTarget = new THREE.Vector3(-11.4, 0, 5.5);
  private readonly player: THREE.Group;
  private readonly npcs: Map<string, THREE.Group>;
  private readonly doors: Map<string, THREE.Mesh>;
  private readonly highlight: THREE.Mesh;
  private readonly ambient: THREE.HemisphereLight;
  private readonly sun: THREE.DirectionalLight;
  private clickTarget: THREE.Vector3 | null = null;
  private pending: { id: string; npc: boolean } | null = null;
  private nearestInteraction: string | null = null;
  private nearestNpc: string | null = null;
  private observationSeconds = 0;
  private lastTeleportRevision = -1;
  private raf = 0;
  private destroyed = false;

  constructor(
    private readonly mount: HTMLElement,
    private readonly store: BreakoutStore,
    private readonly onNearestChanged: (label: string | null) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = "bcBreakout__canvas";
    this.renderer.domElement.setAttribute("aria-label", "Изометрический комплекс BLACKCROWN Breakout");
    this.mount.appendChild(this.renderer.domElement);

    const built = buildPrison(this.scene, (npc) => this.npcTarget(npc, this.store.getSnapshot(), 0));
    this.player = built.player;
    this.npcs = built.npcs;
    this.doors = built.doors;
    this.highlight = built.highlight;
    this.ambient = built.ambient;
    this.sun = built.sun;

    this.resize();
    window.addEventListener("resize", this.resize);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.addEventListener("contextmenu", this.preventContextMenu);
    this.raf = requestAnimationFrame(this.frame);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.removeEventListener("contextmenu", this.preventContextMenu);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  setVirtualKey(key: string, active: boolean) {
    if (active) this.virtualKeys.add(key);
    else this.virtualKeys.delete(key);
    if (active) this.clickTarget = null;
  }

  interactNearest = () => {
    if (this.nearestNpc) this.store.talkTo(this.nearestNpc);
    else if (this.nearestInteraction) this.store.interact(this.nearestInteraction);
    else this.store.setMessage("Рядом нет доступного действия.");
  };

  private preventContextMenu = (event: Event) => event.preventDefault();

  private onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", "shift"].includes(key)) {
      this.keys.add(key);
      this.clickTarget = null;
      event.preventDefault();
    }
    if (key === "e") {
      this.interactNearest();
      event.preventDefault();
    }
    if (key === "escape") this.store.talkTo(null);
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.key.toLowerCase());
  };

  private npcTarget(npc: NpcDefinition, snapshot: GameSnapshot, elapsed: number) {
    let zone: ZoneId = "cellblock";
    if (npc.role === "doctor") zone = "medical";
    else if (npc.role === "warden") zone = "corridor";
    else if (npc.role === "guard") {
      const patrol: ZoneId[] = ["cellblock", "yard", "laundry", "corridor", "maintenance"];
      zone = patrol[(Math.floor(elapsed / 12) + Math.abs(npc.id.charCodeAt(0))) % patrol.length];
    } else if (snapshot.schedule === "breakfast" || snapshot.schedule === "dinner") zone = "canteen";
    else if (snapshot.schedule === "work") zone = npc.id === "nico" ? "laundry" : "cellblock";
    else if (snapshot.schedule === "yard") zone = "yard";
    else if (snapshot.schedule === "free") zone = npc.id === "rook" ? "gym" : "yard";

    const center = ZONE_CENTERS[zone];
    const offset = stableOffset(npc.id);
    return {
      x: center.x + offset.x + Math.sin(elapsed * 0.22 + offset.z) * 0.3,
      z: center.z + offset.z + Math.cos(elapsed * 0.19 + offset.x) * 0.3,
    };
  }

  private resize = () => {
    const width = Math.max(1, this.mount.clientWidth);
    const height = Math.max(1, this.mount.clientHeight);
    const aspect = width / height;
    const view = width < 700 ? 7.7 : 9.5;
    this.renderer.setSize(width, height, false);
    this.camera.left = -view * aspect;
    this.camera.right = view * aspect;
    this.camera.top = view;
    this.camera.bottom = -view;
    this.camera.updateProjectionMatrix();
  };

  private onPointerDown = (event: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    const interactive = hits.find((hit) => hit.object.userData.interactionId || hit.object.userData.npcId);
    if (interactive) {
      const npcId = interactive.object.userData.npcId as string | undefined;
      const interactionId = interactive.object.userData.interactionId as string | undefined;
      this.clickTarget = interactive.point.clone().setY(0);
      this.pending = { id: npcId ?? interactionId!, npc: Boolean(npcId) };
      return;
    }
    const ground = hits.find((hit) => hit.object.userData.ground);
    if (ground) {
      this.clickTarget = ground.point.clone().setY(0);
      this.pending = null;
    }
  };

  private blocked(x: number, z: number, snapshot: GameSnapshot) {
    if (Math.abs(x) > WORLD_BOUNDS.w / 2 - 0.4 || Math.abs(z) > WORLD_BOUNDS.d / 2 - 0.4) return true;
    if (WALLS.some((wall) => inside(x, z, wall, PLAYER_RADIUS))) return true;
    return DOORS.some((door) => !snapshot.openedDoors.includes(door.id) && inside(x, z, door, PLAYER_RADIUS));
  }

  private movePlayer(dt: number, snapshot: GameSnapshot) {
    if (this.pending?.npc) {
      const npc = this.npcs.get(this.pending.id);
      if (npc) this.clickTarget = npc.position.clone().setY(0);
    }
    const down = (key: string) => this.keys.has(key) || this.virtualKeys.has(key);
    const input = new THREE.Vector2(
      Number(down("d") || down("arrowright")) - Number(down("a") || down("arrowleft")),
      Number(down("s") || down("arrowdown")) - Number(down("w") || down("arrowup")),
    );
    let moving = input.lengthSq() > 0;
    let sprinting = (down("shift") || down("sprint")) && snapshot.stamina > 2;
    const direction = new THREE.Vector3();

    if (moving) {
      input.normalize();
      direction.set(input.x + input.y * 0.72, 0, input.y - input.x * 0.72).normalize();
    } else if (this.clickTarget) {
      direction.copy(this.clickTarget).sub(this.player.position).setY(0);
      if (direction.length() < 0.28) {
        this.clickTarget = null;
        moving = false;
      } else {
        direction.normalize();
        moving = true;
        sprinting = false;
      }
    }

    if (moving) {
      const step = direction.multiplyScalar(3.25 * (sprinting ? 1.55 : 1) * dt);
      const nextX = this.player.position.x + step.x;
      const nextZ = this.player.position.z + step.z;
      if (!this.blocked(nextX, this.player.position.z, snapshot)) this.player.position.x = nextX;
      if (!this.blocked(this.player.position.x, nextZ, snapshot)) this.player.position.z = nextZ;
      this.player.rotation.y = Math.atan2(step.x, step.z);
    }

    if (this.pending) {
      const target = this.pending.npc
        ? this.npcs.get(this.pending.id)?.position
        : INTERACTIONS.find((interaction) => interaction.id === this.pending?.id);
      if (target && Math.hypot(this.player.position.x - target.x, this.player.position.z - target.z) <= INTERACT_DISTANCE) {
        if (this.pending.npc) this.store.talkTo(this.pending.id);
        else this.store.interact(this.pending.id);
        this.pending = null;
        this.clickTarget = null;
      }
    }
    return { moving, sprinting };
  }

  private updateNpcs(snapshot: GameSnapshot, dt: number, elapsed: number) {
    let nearestGuard = Number.POSITIVE_INFINITY;
    for (const npc of NPCS) {
      const mesh = this.npcs.get(npc.id)!;
      const target = this.npcTarget(npc, snapshot, elapsed);
      const delta = new THREE.Vector3(target.x - mesh.position.x, 0, target.z - mesh.position.z);
      const distance = delta.length();
      if (distance > 0.04) {
        delta.normalize();
        mesh.position.addScaledVector(delta, Math.min(distance, (npc.role === "guard" ? 1.65 : 1.18) * dt));
        mesh.rotation.y = Math.atan2(delta.x, delta.z);
      }
      if (npc.role === "guard" || npc.role === "warden") {
        nearestGuard = Math.min(nearestGuard, mesh.position.distanceTo(this.player.position));
      }
    }
    return nearestGuard;
  }

  private updateNearest(snapshot: GameSnapshot) {
    let object: { id: string; distance: number; label: string } | null = null;
    let person: { id: string; distance: number; label: string } | null = null;
    for (const interaction of INTERACTIONS) {
      if (interaction.id === "tunnel-dig" && snapshot.tunnelDigs >= 3) continue;
      if (interaction.id === "tunnel-exit" && snapshot.tunnelDigs < 3) continue;
      const distance = Math.hypot(this.player.position.x - interaction.x, this.player.position.z - interaction.z);
      if (distance <= INTERACT_DISTANCE && (!object || distance < object.distance)) object = { id: interaction.id, distance, label: interaction.label };
    }
    for (const npc of NPCS) {
      const mesh = this.npcs.get(npc.id)!;
      const distance = mesh.position.distanceTo(this.player.position);
      if (distance <= INTERACT_DISTANCE && (!person || distance < person.distance)) person = { id: npc.id, distance, label: npc.name };
    }
    const chosen = person && (!object || person.distance <= object.distance) ? person : object;
    this.nearestInteraction = chosen === object ? object?.id ?? null : null;
    this.nearestNpc = chosen === person ? person?.id ?? null : null;
    if (!chosen) {
      this.highlight.visible = false;
      this.onNearestChanged(null);
      return;
    }
    const position = this.nearestNpc ? this.npcs.get(chosen.id)?.position : INTERACTIONS.find((item) => item.id === chosen.id);
    if (position) this.highlight.position.set(position.x, 0.055, position.z);
    this.highlight.visible = true;
    this.onNearestChanged(`${chosen.label} · E / Взаимодействовать`);
  }

  private frame = () => {
    if (this.destroyed) return;
    const dt = Math.min(0.05, this.clock.getDelta());
    const elapsed = this.clock.elapsedTime;
    let snapshot = this.store.getSnapshot();

    if (snapshot.teleportRevision !== this.lastTeleportRevision) {
      this.lastTeleportRevision = snapshot.teleportRevision;
      this.player.position.set(snapshot.playerPosition.x, 0, snapshot.playerPosition.z);
      this.clickTarget = null;
      this.pending = null;
    }

    const movement = this.movePlayer(dt, snapshot);
    const nearestGuard = this.updateNpcs(snapshot, dt, elapsed);
    for (const [id, mesh] of this.doors) mesh.visible = !snapshot.openedDoors.includes(id);
    this.updateNearest(snapshot);

    this.observationSeconds += dt;
    if (this.observationSeconds >= 0.12) {
      this.store.observePlayer({
        x: this.player.position.x,
        z: this.player.position.z,
        zone: zoneAt(this.player.position.x, this.player.position.z),
        dt: this.observationSeconds,
        moving: movement.moving,
        sprinting: movement.sprinting,
        nearestGuard,
      });
      this.observationSeconds = 0;
    }
    this.store.tick(dt);
    snapshot = this.store.getSnapshot();

    const daylight = Math.sin(((snapshot.minute - 360) / 1440) * Math.PI * 2) * 0.5 + 0.5;
    this.ambient.intensity = 0.7 + daylight * 0.8;
    this.sun.intensity = 0.55 + daylight * 1.75;
    if (this.scene.background instanceof THREE.Color) this.scene.background.setHex(snapshot.schedule === "lightsout" ? 0x080d12 : 0x11191e);

    this.cameraTarget.lerp(new THREE.Vector3(this.player.position.x, 0, this.player.position.z), 1 - Math.pow(0.002, dt));
    this.camera.position.copy(this.cameraTarget).add(this.mount.clientWidth < 700 ? new THREE.Vector3(10, 14, 14) : new THREE.Vector3(13, 17, 18));
    this.camera.lookAt(this.cameraTarget.x, 0.1, this.cameraTarget.z);
    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.frame);
  };
}
