import * as THREE from "three";
import { clamp, smootherstep } from "../../experience/core/math";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import type { AssetSlotRegistry } from "../core/AssetSlotRegistry";
import { EXPERIENCE_PHASE_RANGES } from "../experienceShellConfig";
import { createCinematicArtPlane, setCinematicArtTexture } from "./CinematicArtPlane";
import { ForegroundOcclusionSystem } from "./ForegroundOcclusionSystem";
import { SpatialSceneBase, energyMaterial } from "./SpatialSceneBase";

export const NETWORK_WORLD_SPECS = [
  { id: "EVOFISH", kind: "abyss-creature", position: [-3.15, 1.55, -0.55], compactPosition: [-1.45, 1.65, -0.45], accent: 0x4fe6f1 },
  { id: "CROWN//FRONT", kind: "armored-vault", position: [0.15, 2.45, -1.05], compactPosition: [0, 2.45, -0.85], accent: 0xff7a38 },
  { id: "STORE", kind: "collection-plinth", position: [2.65, 0.55, -1.7], compactPosition: [1.35, 1.2, -1.2], accent: 0xe8c87a },
  { id: "LOBBY", kind: "social-ring", position: [0.05, -1.65, -0.7], compactPosition: [0.72, -0.12, -0.65], accent: 0x83f4ee },
  { id: "ACCOUNT", kind: "identity-spine", position: [-3.05, -1.65, -1.55], compactPosition: [-0.92, 0.05, -1.15], accent: 0x9bb4ff },
] as const;

type NetworkWorldSpec = (typeof NETWORK_WORLD_SPECS)[number];

export class NetworkCoreScene extends SpatialSceneBase {
  private authored: THREE.Group | null = null;
  private readonly networkPlate = createCinematicArtPlane(16.4, 9.2);
  private readonly commandCore = new THREE.Group();
  private readonly nodes: THREE.Group[] = [];
  private readonly dataPaths: THREE.LineSegments;
  private readonly city: THREE.InstancedMesh;
  private readonly foreground = new ForegroundOcclusionSystem([
    { position: [-5.2, 0.4, 1.85], scale: [0.28, 6.8, 0.3], rotation: [0.04, 0.1, -0.2], travel: [0.85, 0.1, 0.6] },
    { position: [5.35, -0.3, 2.0], scale: [0.25, 6.2, 0.3], rotation: [-0.04, -0.08, 0.18], travel: [-0.72, 0.15, 0.65] },
    { position: [1.8, 3.65, 1.3], scale: [4.2, 0.22, 0.3], rotation: [0.05, 0.09, -0.08], travel: [-0.5, -0.65, 0.55] },
    { position: [-2.2, -3.5, 1.35], scale: [3.6, 0.2, 0.28], rotation: [-0.04, -0.07, 0.1], travel: [0.45, 0.6, 0.55] },
  ], 0x071319, 0x0a3840);

  constructor(private readonly assets: AssetSlotRegistry) {
    super("network-core");
    const housingMaterial = this.solid(new THREE.MeshStandardMaterial({
      color: 0x24464f,
      emissive: 0x0c5964,
      emissiveIntensity: 0.46,
      metalness: 0.78,
      roughness: 0.34,
    }));
    const innerMaterial = this.solid(new THREE.MeshStandardMaterial({
      color: 0x10242a,
      emissive: 0x0a414a,
      emissiveIntensity: 0.38,
      metalness: 0.74,
      roughness: 0.46,
    }));
    const cyan = this.material(energyMaterial(0x62e4ec, 0.46), 0.46);

    const coreHousing = new THREE.Mesh(new THREE.DodecahedronGeometry(0.78, 0), housingMaterial);
    const coreEnergy = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 1), cyan);
    coreEnergy.position.z = 0.72;
    this.commandCore.position.set(-1.65, 0.2, 0.35);
    this.commandCore.add(coreHousing, coreEnergy);
    [[-1.05, 0], [1.05, 0], [0, -1.05], [0, 1.05]].forEach(([x, y], index) => {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(index > 1 ? 0.9 : 0.18, index > 1 ? 0.18 : 0.9, 0.22), innerMaterial);
      bracket.position.set(x, y, -0.08);
      bracket.rotation.z = index * 0.06;
      this.commandCore.add(bracket);
    });

    NETWORK_WORLD_SPECS.forEach((spec) => {
      const node = this.createWorldHousing(spec, housingMaterial, innerMaterial);
      node.position.fromArray(spec.position);
      this.nodes.push(node);
      this.root.add(node);
    });

    const pathPositions: number[] = [];
    NETWORK_WORLD_SPECS.forEach(({ position: [x, y, z] }) => {
      pathPositions.push(-1.55, 0.15, 0, x, y, z - 0.2);
    });
    const paths = new THREE.BufferGeometry();
    paths.setAttribute("position", new THREE.Float32BufferAttribute(pathPositions, 3));
    this.dataPaths = new THREE.LineSegments(paths, this.material(new THREE.LineBasicMaterial({ color: 0x67dbe6, transparent: true, opacity: 0.38 }), 0.38));

    this.city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), innerMaterial, 18);
    const marker = new THREE.Object3D();
    for (let index = 0; index < 18; index += 1) {
      const lane = index % 9;
      const side = index < 9 ? -1 : 1;
      marker.position.set(-4.8 + lane * 1.18, side * 3.2, -3.6 - (lane % 3) * 0.4);
      marker.scale.set(0.09 + (lane % 2) * 0.05, 0.35 + (lane % 4) * 0.22, 0.16);
      marker.updateMatrix();
      this.city.setMatrixAt(index, marker.matrix);
    }
    this.city.instanceMatrix.needsUpdate = true;
    this.networkPlate.mesh.position.set(-0.2, 0.05, -8.2);
    this.root.add(this.networkPlate.mesh, this.commandCore, this.dataPaths, this.city, this.foreground.root);
  }

  private createWorldHousing(
    spec: NetworkWorldSpec,
    housingMaterial: THREE.MeshStandardMaterial,
    innerMaterial: THREE.MeshStandardMaterial,
  ) {
    const node = new THREE.Group();
    node.name = `NetworkWorld:${spec.id}:${spec.kind}`;
    const accent = this.material(energyMaterial(spec.accent, spec.id === "CROWN//FRONT" ? 0.54 : 0.42), spec.id === "CROWN//FRONT" ? 0.54 : 0.42);

    if (spec.kind === "abyss-creature") {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 7), housingMaterial);
      body.scale.set(1.55, 0.62, 0.52);
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.3, 0.7, 4), innerMaterial);
      tail.position.x = -0.62;
      tail.rotation.z = Math.PI / 2;
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 5), accent);
      eye.position.set(0.34, 0.08, 0.3);
      node.add(body, tail, eye);
    } else if (spec.kind === "armored-vault") {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.54, 0.42), housingMaterial);
      const corridor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.58), accent);
      corridor.position.z = 0.24;
      node.add(body, corridor);
      [-0.52, 0.52].forEach((x) => {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.92, 0.24), innerMaterial);
        rib.position.x = x;
        node.add(rib);
      });
    } else if (spec.kind === "collection-plinth") {
      const vault = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), housingMaterial);
      const display = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), accent);
      display.position.z = 0.42;
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.68, 0.18, 6), innerMaterial);
      plinth.rotation.x = Math.PI / 2;
      plinth.position.z = -0.3;
      node.add(vault, display, plinth);
    } else if (spec.kind === "social-ring") {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.105, 6, 24), housingMaterial);
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), accent);
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.035, 5, 24), innerMaterial);
      orbit.rotation.set(0.7, 0.35, 0.2);
      node.add(ring, core, orbit);
    } else {
      const spine = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), housingMaterial);
      spine.scale.set(0.72, 1.48, 0.65);
      const identityCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), accent);
      identityCore.position.z = 0.38;
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.42, 0.14), innerMaterial);
      rail.position.x = -0.48;
      node.add(spine, identityCore, rail);
    }

    return node;
  }

  async preload() {
    const [model, backdropTexture] = await Promise.all([
      this.assets.loadModel("network-environment", this.quality),
      this.assets.loadTexture("network-collection-backdrop", this.quality),
    ]);
    setCinematicArtTexture(this.networkPlate, backdropTexture);
    if (model && !this.authored) {
      this.authored = model;
      model.position.set(0.0, 0.2, -0.9);
      model.scale.setScalar(0.9);
      this.root.add(model);
    }
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    const dominant = snapshot.weight > 0.5;
    const authored = Boolean(this.authored && snapshot.quality !== "low");
    const networkReveal = smootherstep(clamp(
      (snapshot.globalProgress - EXPERIENCE_PHASE_RANGES.vaultToNetwork[0])
      / (EXPERIENCE_PHASE_RANGES.vaultToNetwork[1] - EXPERIENCE_PHASE_RANGES.vaultToNetwork[0]),
    ));
    if (this.authored) this.authored.visible = authored;
    this.root.position.set(0.2, 0.2, 0);
    this.networkPlate.mesh.position.set(
      -0.2 - (1 - networkReveal) * 0.28,
      0.05 + (1 - networkReveal) * 0.16,
      -8.2 + networkReveal * 0.36,
    );
    this.networkPlate.mesh.scale.setScalar(1.12 - networkReveal * 0.06);
    this.networkPlate.material.opacity = (0.1 + networkReveal * 0.86)
      * Math.min(1, snapshot.weight * 1.75);
    const idle = snapshot.reducedMotion ? 0 : snapshot.elapsedSeconds;
    // Authored geometry supplies depth architecture; these five semantic
    // housings stay visible so every world keeps its own silhouette language.
    this.commandCore.visible = true;
    this.commandCore.rotation.set(idle * 0.012, -idle * 0.018, snapshot.localProgress * 0.08);
    this.commandCore.scale.setScalar(0.82 + snapshot.localProgress * 0.16);
    const visibleNodes = dominant ? this.nodes.length : 3;
    this.nodes.forEach((node, index) => {
      node.visible = index < visibleNodes;
      const position = snapshot.quality === "low"
        ? NETWORK_WORLD_SPECS[index].compactPosition
        : NETWORK_WORLD_SPECS[index].position;
      node.position.fromArray(position);
      node.rotation.y = snapshot.reducedMotion ? 0 : idle * (index % 2 ? -0.018 : 0.014);
      const reveal = Math.min(1, Math.max(0, snapshot.localProgress * 1.4 - index * 0.055));
      node.scale.setScalar(reveal);
    });
    this.dataPaths.position.z = -0.3 + snapshot.localProgress * 0.22;
    this.city.visible = dominant && !authored;
    if (this.authored?.visible) {
      const reveal = Math.min(1, snapshot.localProgress * 1.5);
      this.authored.scale.setScalar(0.82 + reveal * 0.08);
      this.authored.position.z = -1.25 + reveal * 0.35;
    }
    this.foreground.root.visible = snapshot.weight > 0.65;
    this.city.position.y = (1 - snapshot.localProgress) * 0.24;
    if (this.foreground.root.visible) this.foreground.evaluate(snapshot.localProgress, snapshot.quality, snapshot.reducedMotion);
  }

  override dispose() {
    this.networkPlate.material.map = null;
    super.dispose();
  }
}
