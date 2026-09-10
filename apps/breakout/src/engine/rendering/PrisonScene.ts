import * as THREE from "three";
import type { MoveVector } from "../input/InputController";
import type { PlayerZone } from "../../simulation/model";

export type InteractableId = "locker" | "workshop-bin" | "service-hatch";

export type SceneFrame = {
  playerZone: PlayerZone;
  guardCanSeePlayer: boolean;
  nearestInteractable: InteractableId | null;
  guardDistance: number;
};

type Collider = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  enabled: boolean;
};

type Interactable = {
  id: InteractableId;
  position: THREE.Vector3;
  marker: THREE.Mesh;
};

const PLAYER_RADIUS = 0.42;
const PLAYER_SPEED = 4.2;

function flatMaterial(color: number, roughness = 0.9, metalness = 0.02): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function makeCharacter(bodyColor: number, trimColor: number): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.72, 4, 8), flatMaterial(bodyColor, 0.8));
  body.position.y = 1.05;
  body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), flatMaterial(0xcaa985, 0.92));
  head.position.y = 1.82;
  head.castShadow = true;
  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.15, 0.4), flatMaterial(trimColor, 0.72));
  trim.position.set(0, 1.18, -0.16);
  trim.castShadow = true;
  group.add(body, head, trim);
  return group;
}

export class PrisonScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.OrthographicCamera;
  readonly player = makeCharacter(0xc56432, 0x2a1710);
  readonly guard = makeCharacter(0x243947, 0x8eb7c8);

  private readonly container: HTMLElement;
  private readonly colliders: Collider[] = [];
  private readonly interactables: Interactable[] = [];
  private readonly clock = new THREE.Clock();
  private readonly guardPatrol = [
    new THREE.Vector3(-0.5, 0, 6.7),
    new THREE.Vector3(5.7, 0, 6.7),
    new THREE.Vector3(5.7, 0, 1.4),
    new THREE.Vector3(0.4, 0, 1.4),
    new THREE.Vector3(0.4, 0, -2.7),
  ];
  private readonly prisonerGroups: THREE.Group[] = [];
  private guardPatrolIndex = 0;
  private serviceHatchCollider: Collider | null = null;
  private disposed = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.className = "breakoutCanvas";
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color(0x10171b);
    this.scene.fog = new THREE.FogExp2(0x10171b, 0.027);

    this.camera = new THREE.OrthographicCamera(-9, 9, 6, -6, 0.1, 80);
    this.camera.position.set(11, 14, 14);
    this.camera.lookAt(0, 0, 2);

    this.buildLighting();
    this.buildPrison();
    this.buildActors();
    this.resize();
    window.addEventListener("resize", this.resize);
  }

  private buildLighting(): void {
    const hemi = new THREE.HemisphereLight(0x9cb7c9, 0x161a1d, 2.2);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xf2e0c4, 4.6);
    sun.position.set(-7, 15, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -18;
    sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 18;
    sun.shadow.camera.bottom = -18;
    sun.shadow.bias = -0.0002;
    this.scene.add(sun);

    const corridorLight = new THREE.PointLight(0xa9d4e6, 24, 11, 2.2);
    corridorLight.position.set(2.8, 4.2, 4.5);
    this.scene.add(corridorLight);
  }

  private addFloor(x: number, z: number, width: number, depth: number, color: number): void {
    const floor = new THREE.Mesh(new THREE.BoxGeometry(width, 0.22, depth), flatMaterial(color, 0.98));
    floor.position.set(x, -0.11, z);
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  private addWall(x: number, z: number, width: number, depth: number, height = 2.8, collider = true): Collider | null {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), flatMaterial(0x586168, 0.94));
    wall.position.set(x, height / 2, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);
    if (!collider) return null;
    const c: Collider = {
      minX: x - width / 2,
      maxX: x + width / 2,
      minZ: z - depth / 2,
      maxZ: z + depth / 2,
      enabled: true,
    };
    this.colliders.push(c);
    return c;
  }

  private addLabel(text: string, x: number, z: number, color: number): void {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 512, 128);
    ctx.font = "700 42px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,.88)";
    ctx.fillText(text, 256, 76);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, color, transparent: true, depthWrite: false }));
    sprite.position.set(x, 0.04, z);
    sprite.scale.set(3.8, 0.95, 1);
    sprite.rotation.x = -Math.PI / 2;
    this.scene.add(sprite);
  }

  private addPropBox(x: number, z: number, width: number, depth: number, height: number, color: number): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), flatMaterial(color, 0.86));
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    return mesh;
  }

  private addInteractable(id: InteractableId, x: number, z: number, color: number): void {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.52, 0.65, 28),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.58, side: THREE.DoubleSide, depthWrite: false }),
    );
    ring.position.set(x, 0.04, z);
    ring.rotation.x = -Math.PI / 2;
    this.scene.add(ring);
    this.interactables.push({ id, position: new THREE.Vector3(x, 0, z), marker: ring });
  }

  private buildPrison(): void {
    // Distinct floor tones make schedule zones readable without a minimap.
    this.addFloor(1.5, 2.5, 23, 17, 0x252c30);
    this.addFloor(-5.5, 6.1, 5.3, 4.8, 0x30383d); // cell
    this.addFloor(-5.5, -2.4, 5.3, 4.3, 0x363536); // canteen
    this.addFloor(-5.4, 2.1, 5.4, 3.4, 0x2d3336); // workshop
    this.addFloor(3.2, -2.7, 7.8, 4.2, 0x313a38); // roll-call yard
    this.addFloor(10.0, 4.4, 4.0, 6.4, 0x1f292a); // maintenance

    // Outer shell.
    this.addWall(1.5, 10.9, 23.4, 0.35, 3.2);
    this.addWall(1.5, -6.0, 23.4, 0.35, 3.2);
    this.addWall(-10.2, 2.45, 0.35, 17.25, 3.2);
    this.addWall(13.2, 2.45, 0.35, 17.25, 3.2);

    // Cell enclosure with a deliberate doorway gap toward the corridor.
    this.addWall(-8.2, 3.7, 0.25, 5.0);
    this.addWall(-5.5, 8.5, 5.65, 0.25);
    this.addWall(-2.8, 6.9, 0.25, 3.25);
    this.addWall(-2.8, 4.05, 0.25, 1.25);
    this.addWall(-5.5, 3.7, 5.65, 0.25);

    // West utility rooms.
    this.addWall(-5.5, 0.35, 5.65, 0.25);
    this.addWall(-5.5, -4.65, 5.65, 0.25);
    this.addWall(-2.8, -2.4, 0.25, 4.75);
    this.addWall(-8.2, -2.4, 0.25, 4.75);
    this.addWall(-5.5, 3.85, 5.65, 0.25);

    // Maintenance barrier. The central gate collider is removed after crafting.
    this.addWall(8.05, 8.0, 0.25, 5.7);
    this.addWall(8.05, 0.55, 0.25, 4.1);
    this.serviceHatchCollider = this.addWall(8.05, 4.75, 0.25, 1.45, 2.4);

    // Cell props.
    this.addPropBox(-6.65, 6.65, 2.15, 0.9, 0.45, 0x747d82);
    this.addPropBox(-4.0, 7.35, 0.9, 0.55, 1.9, 0x485057);
    this.addPropBox(-5.1, 4.45, 1.2, 0.7, 0.78, 0x50595e);
    this.addInteractable("locker", -4.0, 7.35, 0xe4a95e);

    // Workshop props.
    this.addPropBox(-5.6, 2.15, 3.6, 0.9, 0.8, 0x4c5558);
    this.addPropBox(-7.3, 1.15, 0.9, 0.9, 0.8, 0x6b5a43);
    this.addInteractable("workshop-bin", -7.3, 1.15, 0xf0cc77);

    // Canteen tables.
    for (const x of [-6.6, -4.2]) this.addPropBox(x, -2.4, 1.45, 0.7, 0.72, 0x5c554b);

    // Roll-call markings.
    for (let i = 0; i < 4; i += 1) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 2.6), flatMaterial(0xb8c6bd));
      line.position.set(0.9 + i * 1.5, 0.025, -2.8);
      this.scene.add(line);
    }

    // Maintenance machinery.
    this.addPropBox(10.55, 6.45, 2.0, 1.1, 1.55, 0x394647);
    this.addPropBox(11.0, 2.15, 1.1, 1.1, 2.0, 0x334244);
    this.addInteractable("service-hatch", 7.55, 4.75, 0x65d4d8);

    this.addLabel("CELL", -5.5, 5.2, 0xa8c0c7);
    this.addLabel("WORK", -5.4, 2.8, 0xa8c0c7);
    this.addLabel("CANTEEN", -5.5, -1.0, 0xb5ae9b);
    this.addLabel("ROLL CALL", 3.2, -4.2, 0x9db7ad);
    this.addLabel("MAINTENANCE", 10.0, 7.1, 0x6fbfc1);

    // Ceiling strip lights.
    for (let i = -1; i <= 3; i += 1) {
      const fixture = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.06, 2.0),
        new THREE.MeshStandardMaterial({ color: 0xb8dbe2, emissive: 0x78aeba, emissiveIntensity: 2.2 }),
      );
      fixture.position.set(i * 2.2 + 1.2, 2.85, 6.7);
      this.scene.add(fixture);
    }
  }

  private buildActors(): void {
    this.player.position.set(-5.45, 0, 5.25);
    this.player.rotation.y = Math.PI;
    this.scene.add(this.player);

    this.guard.position.copy(this.guardPatrol[0]);
    this.scene.add(this.guard);

    const prisonerSpawns = [
      new THREE.Vector3(2.0, 0, -2.4),
      new THREE.Vector3(3.7, 0, -3.0),
      new THREE.Vector3(5.2, 0, -2.2),
    ];
    prisonerSpawns.forEach((position, index) => {
      const prisoner = makeCharacter(0xb95f33 + index * 0x080300, 0x2f1c14);
      prisoner.position.copy(position);
      prisoner.scale.setScalar(0.93 + index * 0.025);
      this.prisonerGroups.push(prisoner);
      this.scene.add(prisoner);
    });
  }

  private intersectsCollider(x: number, z: number): boolean {
    return this.colliders.some(
      (collider) =>
        collider.enabled &&
        x + PLAYER_RADIUS > collider.minX &&
        x - PLAYER_RADIUS < collider.maxX &&
        z + PLAYER_RADIUS > collider.minZ &&
        z - PLAYER_RADIUS < collider.maxZ,
    );
  }

  private movePlayer(move: MoveVector, dt: number): void {
    const dx = move.x * PLAYER_SPEED * dt;
    const dz = move.z * PLAYER_SPEED * dt;
    if (Math.abs(dx) + Math.abs(dz) < 0.0001) return;

    const nextX = THREE.MathUtils.clamp(this.player.position.x + dx, -9.45, 12.45);
    if (!this.intersectsCollider(nextX, this.player.position.z)) this.player.position.x = nextX;
    const nextZ = THREE.MathUtils.clamp(this.player.position.z + dz, -5.25, 10.15);
    if (!this.intersectsCollider(this.player.position.x, nextZ)) this.player.position.z = nextZ;

    this.player.rotation.y = Math.atan2(move.x, move.z);
    const bob = Math.sin(performance.now() * 0.014) * 0.035;
    this.player.position.y = Math.abs(move.x) + Math.abs(move.z) > 0.1 ? bob : 0;
  }

  private updateGuard(dt: number): void {
    const target = this.guardPatrol[this.guardPatrolIndex];
    const direction = target.clone().sub(this.guard.position);
    direction.y = 0;
    if (direction.lengthSq() < 0.12) {
      this.guardPatrolIndex = (this.guardPatrolIndex + 1) % this.guardPatrol.length;
      return;
    }
    direction.normalize();
    this.guard.position.addScaledVector(direction, dt * 1.75);
    this.guard.rotation.y = Math.atan2(direction.x, direction.z);
  }

  private updatePrisoners(elapsed: number): void {
    this.prisonerGroups.forEach((prisoner, index) => {
      const radius = 0.42 + index * 0.08;
      prisoner.position.x += Math.sin(elapsed * 0.36 + index * 2.1) * radius * 0.003;
      prisoner.position.z += Math.cos(elapsed * 0.31 + index * 1.4) * radius * 0.003;
      prisoner.rotation.y = Math.sin(elapsed * 0.2 + index) * 0.7;
    });
  }

  private guardSeesPlayer(): { visible: boolean; distance: number } {
    const toPlayer = this.player.position.clone().sub(this.guard.position);
    toPlayer.y = 0;
    const distance = toPlayer.length();
    if (distance > 6.4) return { visible: false, distance };
    const guardForward = new THREE.Vector3(Math.sin(this.guard.rotation.y), 0, Math.cos(this.guard.rotation.y));
    const facing = guardForward.dot(toPlayer.normalize());
    return { visible: facing > 0.12, distance };
  }

  getPlayerZone(): PlayerZone {
    const { x, z } = this.player.position;
    if (x > 8.1) return "maintenance";
    if (x < -2.8 && z > 3.7) return "cell";
    if (x < -2.8 && z < 0.35) return "canteen";
    if (x < -2.8 && z >= 0.35 && z <= 3.85) return "workshop";
    if (x >= -0.5 && x <= 7.2 && z < 0) return "roll-call";
    return "corridor";
  }

  private nearestInteractable(): InteractableId | null {
    let best: { id: InteractableId; distance: number } | null = null;
    for (const interactable of this.interactables) {
      const distance = interactable.position.distanceTo(this.player.position);
      interactable.marker.material.opacity = distance < 1.65 ? 0.95 : 0.48;
      interactable.marker.scale.setScalar(distance < 1.65 ? 1.15 : 1);
      if (distance <= 1.65 && (!best || distance < best.distance)) best = { id: interactable.id, distance };
    }
    return best?.id ?? null;
  }

  setServiceHatchUnlocked(unlocked: boolean): void {
    if (this.serviceHatchCollider) this.serviceHatchCollider.enabled = !unlocked;
    const marker = this.interactables.find((item) => item.id === "service-hatch")?.marker;
    if (marker) {
      const material = marker.material as THREE.MeshBasicMaterial;
      material.color.set(unlocked ? 0x6ddf93 : 0x65d4d8);
    }
  }

  resetPlayerToCell(): void {
    this.player.position.set(-5.45, 0, 5.25);
  }

  update(move: MoveVector): SceneFrame {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const elapsed = this.clock.elapsedTime;
    this.movePlayer(move, dt);
    this.updateGuard(dt);
    this.updatePrisoners(elapsed);

    const seen = this.guardSeesPlayer();
    const cameraTarget = this.player.position.clone().lerp(new THREE.Vector3(1.5, 0, 2.6), 0.45);
    const offset = new THREE.Vector3(11, 14, 14);
    this.camera.position.copy(cameraTarget).add(offset);
    this.camera.lookAt(cameraTarget.x, 0.2, cameraTarget.z);

    this.renderer.render(this.scene, this.camera);
    return {
      playerZone: this.getPlayerZone(),
      guardCanSeePlayer: seen.visible,
      nearestInteractable: this.nearestInteractable(),
      guardDistance: seen.distance,
    };
  }

  private resize = (): void => {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    const aspect = width / height;
    const vertical = 7.4;
    this.camera.left = -vertical * aspect;
    this.camera.right = vertical * aspect;
    this.camera.top = vertical;
    this.camera.bottom = -vertical;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  dispose(): void {
    this.disposed = true;
    window.removeEventListener("resize", this.resize);
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
