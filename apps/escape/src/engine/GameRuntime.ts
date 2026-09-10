import * as THREE from "three";
import { createInitialState, objectiveFor, pushLog, START_POSITION, type GameSnapshot, type GameState, type Vec2 } from "../simulation/model";
import { formatClock, maintenanceAuthorized, phaseAt } from "../simulation/schedule";
import { buildPrison, collides, EXIT_POINT, pointZone, POWER_PANEL_POINT, SCREWDRIVER_POINT } from "../world/prison";

export type RuntimeView = {
  snapshot: GameSnapshot;
  log: string[];
  interaction: string | null;
  alert: "clear" | "watched" | "danger";
};

type GuardVisual = {
  root: THREE.Group;
  cone: THREE.Mesh;
  route: readonly Vec2[];
};

type InmateVisual = {
  root: THREE.Group;
};

const guardRoutes: readonly (readonly Vec2[])[] = [
  [
    { x: -9, z: -2.4 }, { x: 2.5, z: -2.4 }, { x: 2.5, z: -10.5 }, { x: -9, z: -10.5 },
  ],
  [
    { x: 7, z: -3.0 }, { x: 16, z: -3.0 }, { x: 16, z: -11.8 }, { x: 7, z: -11.8 },
  ],
];

const inmateTargets = {
  "roll-call": [{ x: -9, z: -1 }, { x: -7, z: -1 }, { x: -5, z: -1 }, { x: -3, z: -1 }],
  breakfast: [{ x: 11, z: 5 }, { x: 14, z: 5 }, { x: 11, z: 8 }, { x: 14, z: 8 }],
  "work-am": [{ x: -5, z: 8 }, { x: -2, z: 10 }, { x: 1, z: 7 }, { x: 4, z: 10 }],
  "free-noon": [{ x: -7, z: 7 }, { x: -3, z: 11 }, { x: 1, z: 8 }, { x: 4, z: 12 }],
  lunch: [{ x: 11, z: 8 }, { x: 14, z: 8 }, { x: 11, z: 11 }, { x: 14, z: 11 }],
  "work-pm": [{ x: -5, z: 8 }, { x: -2, z: 10 }, { x: 1, z: 7 }, { x: 4, z: 10 }],
  "free-evening": [{ x: -7, z: 10 }, { x: -3, z: 7 }, { x: 2, z: 11 }, { x: 5, z: 8 }],
  dinner: [{ x: 11, z: 5 }, { x: 14, z: 5 }, { x: 11, z: 11 }, { x: 14, z: 11 }],
  lockup: [{ x: -18, z: -8 }, { x: -15, z: -8 }, { x: -18, z: -11 }, { x: -15, z: -11 }],
} as const;

function makePerson(bodyColor: number, headColor: number, badgeColor?: number): THREE.Group {
  const root = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.42, 1.05, 10),
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.7 }),
  );
  body.position.y = 0.82;
  body.castShadow = true;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 10),
    new THREE.MeshStandardMaterial({ color: headColor, roughness: 0.72 }),
  );
  head.position.y = 1.52;
  head.castShadow = true;
  root.add(body, head);
  if (badgeColor !== undefined) {
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.12, 0.04),
      new THREE.MeshBasicMaterial({ color: badgeColor }),
    );
    badge.position.set(0, 1.02, 0.39);
    root.add(badge);
  }
  return root;
}

function distance2D(a: THREE.Vector3 | Vec2, b: THREE.Vector3 | Vec2): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function moveToward(current: Vec2, target: Vec2, speed: number, dt: number): number {
  const dx = target.x - current.x;
  const dz = target.z - current.z;
  const d = Math.hypot(dx, dz);
  if (d < 0.001) return 0;
  const step = Math.min(d, speed * dt);
  current.x += (dx / d) * step;
  current.z += (dz / d) * step;
  return Math.atan2(dx, dz);
}

export class GameRuntime {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-13, 13, 8, -8, 0.1, 120);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly clock = new THREE.Clock();
  private readonly keys = new Set<string>();
  private readonly state: GameState = createInitialState();
  private readonly player = makePerson(0x273039, 0xd2a67d, 0x58e6ff);
  private readonly guardVisuals: GuardVisual[] = [];
  private readonly inmateVisuals: InmateVisual[] = [];
  private readonly raycaster = new THREE.Raycaster();
  private readonly onView: (view: RuntimeView) => void;
  private readonly container: HTMLElement;
  private readonly occluders: THREE.Object3D[];
  private readonly serviceGate: THREE.Mesh;
  private readonly screwdriver: THREE.Group;
  private readonly powerPanel: THREE.Mesh;
  private raf = 0;
  private alive = true;
  private gameMinuteAccumulator = 0;
  private interaction: string | null = null;
  private lastInteractionSignature = "";
  private lastViewAt = 0;
  private previousPhase = this.state.phaseId;

  constructor(container: HTMLElement, onView: (view: RuntimeView) => void) {
    this.container = container;
    this.onView = onView;
    this.scene.background = new THREE.Color(0x05080b);
    this.scene.fog = new THREE.FogExp2(0x05080b, 0.018);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.domElement.setAttribute("aria-label", "BLACKCROWN BREAKOUT 3D prison world");
    container.appendChild(this.renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xbad6e8, 0x12110f, 1.6);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xe9f5ff, 3.0);
    sun.position.set(-13, 22, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -28;
    sun.shadow.camera.right = 28;
    sun.shadow.camera.top = 24;
    sun.shadow.camera.bottom = -24;
    this.scene.add(sun);

    const prison = buildPrison(this.scene);
    this.occluders = prison.occluders;
    this.serviceGate = prison.serviceGate;
    this.screwdriver = prison.screwdriver;
    this.powerPanel = prison.powerPanel;

    this.player.position.set(this.state.player.position.x, 0, this.state.player.position.z);
    this.scene.add(this.player);

    for (let i = 0; i < this.state.guards.length; i += 1) {
      const root = makePerson(0x17202a, 0xd6b08b, 0xff334b);
      const coneMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4058,
        transparent: true,
        opacity: 0.10,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const cone = new THREE.Mesh(new THREE.CircleGeometry(6.8, 32, -Math.PI / 2 - 0.42, 0.84), coneMaterial);
      cone.rotation.x = -Math.PI / 2;
      cone.position.y = 0.035;
      root.add(cone);
      this.scene.add(root);
      this.guardVisuals.push({ root, cone, route: guardRoutes[i] });
    }

    for (const inmate of this.state.inmates) {
      const root = makePerson(0x9d5b2e, 0xc69872);
      root.position.set(inmate.position.x, 0, inmate.position.z);
      this.scene.add(root);
      this.inmateVisuals.push({ root });
    }

    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("resize", this.resize);
    this.resize();
    this.emitView(true);
    this.loop();
  }

  private onKeyDown = (event: KeyboardEvent) => {
    const code = event.code;
    if (["KeyW", "KeyA", "KeyS", "KeyD", "ShiftLeft", "ShiftRight", "KeyE", "KeyR", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(code)) {
      event.preventDefault();
    }
    this.keys.add(code);
    if (code === "KeyE" && !event.repeat) this.tryInteract();
    if (code === "KeyR" && !event.repeat) this.resetRun();
  };

  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  setVirtualInput(code: string, active: boolean): void {
    if (active) this.keys.add(code);
    else this.keys.delete(code);
  }

  interact(): void {
    this.tryInteract();
  }

  resetRun(): void {
    const fresh = createInitialState();
    Object.assign(this.state, fresh);
    this.previousPhase = fresh.phaseId;
    this.gameMinuteAccumulator = 0;
    this.interaction = null;
    this.player.position.set(START_POSITION.x, 0, START_POSITION.z);
    this.screwdriver.visible = true;
    this.setGateOpen(false);
    pushLog(this.state, "RUN RESET — Day 01 restored.");
    this.emitView(true);
  }

  getSnapshot(): GameSnapshot {
    return {
      world: "breakout",
      version: "0.1.0",
      day: this.state.day,
      clock: formatClock(this.state.minuteOfDay),
      phase: this.state.phaseLabel,
      objective: objectiveFor(this.state),
      player: {
        health: Math.round(this.state.player.health),
        stamina: Math.round(this.state.player.stamina),
        suspicion: Math.round(this.state.player.suspicion),
        reputation: this.state.player.reputation,
        money: this.state.player.money,
        hasScrewdriver: this.state.player.hasScrewdriver,
        powerDisabled: this.state.player.powerDisabled,
        escaped: this.state.player.escaped,
        caughtCount: this.state.player.caughtCount,
      },
    };
  }

  private loop = () => {
    if (!this.alive) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private update(dt: number): void {
    if (!this.state.player.escaped) {
      this.updateClock(dt);
      this.updatePlayer(dt);
      this.updateGuards(dt);
      this.updateInmates(dt);
      this.updateSecurity(dt);
      this.updateInteractionHint();
      this.checkEscape();
    }
    this.updateCamera(dt);
    this.emitView(false);
  }

  private updateClock(dt: number): void {
    this.gameMinuteAccumulator += dt * 1.35;
    if (this.gameMinuteAccumulator < 1) return;
    const whole = Math.floor(this.gameMinuteAccumulator);
    this.gameMinuteAccumulator -= whole;
    this.state.minuteOfDay += whole;
    if (this.state.minuteOfDay >= 1440) {
      this.state.minuteOfDay %= 1440;
      this.state.day += 1;
    }
    const phase = phaseAt(this.state.minuteOfDay);
    this.state.phaseId = phase.id;
    this.state.phaseLabel = phase.label;
    this.state.phaseEndsAt = phase.end;
    if (this.previousPhase !== phase.id) {
      pushLog(this.state, `${formatClock(this.state.minuteOfDay)} — ${phase.label} started.`);
      this.previousPhase = phase.id;
    }
  }

  private updatePlayer(dt: number): void {
    let x = 0;
    let z = 0;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) z -= 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) z += 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) x -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) x += 1;
    const len = Math.hypot(x, z);
    const sprinting = (this.keys.has("ShiftLeft") || this.keys.has("ShiftRight")) && len > 0 && this.state.player.stamina > 1;
    const speed = sprinting ? 5.3 : 3.5;
    if (len > 0) {
      x /= len;
      z /= len;
      const nx = this.state.player.position.x + x * speed * dt;
      const nz = this.state.player.position.z + z * speed * dt;
      if (!collides(nx, this.state.player.position.z, 0.38, this.state.player.powerDisabled)) this.state.player.position.x = nx;
      if (!collides(this.state.player.position.x, nz, 0.38, this.state.player.powerDisabled)) this.state.player.position.z = nz;
      this.player.rotation.y = Math.atan2(x, z);
      this.state.player.stamina = THREE.MathUtils.clamp(this.state.player.stamina + (sprinting ? -22 : 9) * dt, 0, 100);
    } else {
      this.state.player.stamina = THREE.MathUtils.clamp(this.state.player.stamina + 12 * dt, 0, 100);
    }
    this.player.position.set(this.state.player.position.x, 0, this.state.player.position.z);
  }

  private updateGuards(dt: number): void {
    this.state.guards.forEach((guard, index) => {
      const visual = this.guardVisuals[index];
      const target = visual.route[guard.routeIndex];
      const d = Math.hypot(target.x - guard.position.x, target.z - guard.position.z);
      if (d < 0.35) guard.routeIndex = (guard.routeIndex + 1) % visual.route.length;
      const next = visual.route[guard.routeIndex];
      guard.heading = moveToward(guard.position, next, 1.75, dt);
      visual.root.position.set(guard.position.x, 0, guard.position.z);
      visual.root.rotation.y = guard.heading;
      (visual.cone.material as THREE.MeshBasicMaterial).opacity = guard.seesPlayer ? 0.22 : 0.09;
    });
  }

  private updateInmates(dt: number): void {
    const targets = inmateTargets[this.state.phaseId];
    this.state.inmates.forEach((inmate, index) => {
      inmate.target = targets[index % targets.length];
      const heading = moveToward(inmate.position, inmate.target, inmate.speed, dt);
      const root = this.inmateVisuals[index].root;
      root.position.set(inmate.position.x, 0, inmate.position.z);
      if (Number.isFinite(heading)) root.rotation.y = heading;
    });
  }

  private updateSecurity(dt: number): void {
    const zone = pointZone(this.state.player.position.x, this.state.player.position.z);
    const unauthorizedMaintenance = zone?.id === "maintenance" && !maintenanceAuthorized(this.state.phaseId);
    const restricted = unauthorizedMaintenance || zone?.id === "service";
    let watched = false;

    for (const guard of this.state.guards) {
      const dx = this.state.player.position.x - guard.position.x;
      const dz = this.state.player.position.z - guard.position.z;
      const distance = Math.hypot(dx, dz);
      const fx = Math.sin(guard.heading);
      const fz = Math.cos(guard.heading);
      const dot = distance > 0 ? (dx * fx + dz * fz) / distance : 1;
      let clear = false;
      if (distance < 7.2 && dot > 0.78) {
        this.raycaster.set(
          new THREE.Vector3(guard.position.x, 1.25, guard.position.z),
          new THREE.Vector3(dx, 0, dz).normalize(),
        );
        const hit = this.raycaster.intersectObjects(this.occluders, false)[0];
        clear = !hit || hit.distance > distance;
      }
      guard.seesPlayer = clear;
      watched ||= clear;
    }

    if (restricted && watched) this.state.player.suspicion += 31 * dt;
    else if (restricted) this.state.player.suspicion += 5.5 * dt;
    else if (watched && this.state.player.suspicion > 60) this.state.player.suspicion -= 2 * dt;
    else this.state.player.suspicion -= 7.5 * dt;

    this.state.player.suspicion = THREE.MathUtils.clamp(this.state.player.suspicion, 0, 100);
    if (this.state.player.suspicion >= 100) this.getCaught();
  }

  private updateInteractionHint(): void {
    let next: string | null = null;
    const p = this.state.player.position;
    if (!this.state.player.hasScrewdriver && distance2D(p, SCREWDRIVER_POINT) < 1.35) next = "E · TAKE SCREWDRIVER";
    else if (!this.state.player.powerDisabled && distance2D(p, POWER_PANEL_POINT) < 1.55) {
      next = this.state.player.hasScrewdriver ? "E · OPEN POWER PANEL" : "POWER PANEL · TOOL REQUIRED";
    }
    this.interaction = next;
  }

  private tryInteract(): void {
    const p = this.state.player.position;
    if (!this.state.player.hasScrewdriver && distance2D(p, SCREWDRIVER_POINT) < 1.35) {
      this.state.player.hasScrewdriver = true;
      this.screwdriver.visible = false;
      pushLog(this.state, `${formatClock(this.state.minuteOfDay)} — Contraband acquired: screwdriver.`);
      this.emitView(true);
      return;
    }
    if (!this.state.player.powerDisabled && distance2D(p, POWER_PANEL_POINT) < 1.55) {
      if (!this.state.player.hasScrewdriver) {
        pushLog(this.state, "Service panel is sealed. A flat tool could force the latch.");
      } else {
        this.state.player.powerDisabled = true;
        this.setGateOpen(true);
        this.state.player.suspicion = Math.max(48, this.state.player.suspicion);
        pushLog(this.state, `${formatClock(this.state.minuteOfDay)} — SERVICE POWER OFF. Magnetic gate released.`);
      }
      this.emitView(true);
    }
  }

  private setGateOpen(open: boolean): void {
    this.serviceGate.visible = !open;
    const bars = this.serviceGate.userData.bars as THREE.Group | undefined;
    if (bars) bars.visible = !open;
    const led = this.powerPanel.userData.led as THREE.PointLight | undefined;
    if (led) led.color.setHex(open ? 0x38ff9c : 0xff334b);
  }

  private checkEscape(): void {
    if (!this.state.player.powerDisabled) return;
    if (distance2D(this.state.player.position, EXIT_POINT) < 1.15 || this.state.player.position.x > 20.5) {
      this.state.player.escaped = true;
      this.state.player.reputation += 8;
      this.state.player.money += 25;
      pushLog(this.state, `${formatClock(this.state.minuteOfDay)} — ESCAPE ROUTE COMPLETE · Maintenance breach.`);
      this.emitView(true);
    }
  }

  private getCaught(): void {
    this.state.player.position = { ...START_POSITION };
    this.player.position.set(START_POSITION.x, 0, START_POSITION.z);
    this.interaction = null;
    this.state.player.suspicion = 28;
    this.state.player.hasScrewdriver = false;
    this.state.player.powerDisabled = false;
    this.state.player.caughtCount += 1;
    this.screwdriver.visible = true;
    this.setGateOpen(false);
    pushLog(this.state, `${formatClock(this.state.minuteOfDay)} — CAUGHT. Contraband confiscated; returned to Cell Block A.`);
  }

  private updateCamera(dt: number): void {
    const target = new THREE.Vector3(this.state.player.position.x + 10.5, 15.5, this.state.player.position.z + 11.5);
    this.camera.position.lerp(target, 1 - Math.pow(0.001, dt));
    this.camera.lookAt(this.state.player.position.x, 0, this.state.player.position.z);
  }

  private emitView(force: boolean): void {
    const now = performance.now();
    const signature = `${this.interaction}|${this.state.phaseId}|${Math.floor(this.state.player.suspicion / 5)}|${this.state.player.hasScrewdriver}|${this.state.player.powerDisabled}|${this.state.player.escaped}|${this.state.log[0] ?? ""}`;
    if (!force && now - this.lastViewAt < 250 && signature === this.lastInteractionSignature) return;
    this.lastViewAt = now;
    this.lastInteractionSignature = signature;
    const suspicion = this.state.player.suspicion;
    this.onView({
      snapshot: this.getSnapshot(),
      log: [...this.state.log],
      interaction: this.interaction,
      alert: suspicion >= 75 ? "danger" : suspicion >= 35 ? "watched" : "clear",
    });
  }

  private resize = () => {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    const aspect = width / height;
    const vertical = width < 760 ? 18 : 15;
    this.camera.top = vertical / 2;
    this.camera.bottom = -vertical / 2;
    this.camera.left = (-vertical * aspect) / 2;
    this.camera.right = (vertical * aspect) / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  dispose(): void {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
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
