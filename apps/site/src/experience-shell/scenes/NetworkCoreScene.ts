import * as THREE from "three";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import type { AssetSlotRegistry } from "../core/AssetSlotRegistry";
import { ForegroundOcclusionSystem } from "./ForegroundOcclusionSystem";
import { SpatialSceneBase, energyMaterial } from "./SpatialSceneBase";

const NODE_POSITIONS = [
  [0.2, 2.35, -0.2], [2.45, 1.35, -0.75], [2.9, -1.2, -0.4], [-0.1, -2.35, -1.2], [-3.15, 1.65, -1.1],
  [4.0, 2.6, -2.1], [4.25, -2.35, -2.4], [-2.2, 3.15, -2.65], [-4.45, -1.55, -2.3],
] as const;
const COMPACT_NODE_POSITIONS = [
  [0, 2.35, -0.2], [1.35, 1.45, -0.75], [1.45, 0.05, -0.4], [-0.15, 0.45, -1.2], [-1.45, 1.25, -1.1],
] as const;

export class NetworkCoreScene extends SpatialSceneBase {
  private authored: THREE.Group | null = null;
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
      color: 0x17323a,
      emissive: 0x0d3b44,
      emissiveIntensity: 0.28,
      metalness: 0.7,
      roughness: 0.46,
    }));
    const innerMaterial = this.solid(new THREE.MeshStandardMaterial({
      color: 0x0b171c,
      emissive: 0x082b32,
      emissiveIntensity: 0.22,
      metalness: 0.66,
      roughness: 0.58,
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

    NODE_POSITIONS.forEach((position, index) => {
      const node = new THREE.Group();
      const geometry = index % 3 === 0
        ? new THREE.OctahedronGeometry(index < 5 ? 0.3 : 0.22, 0)
        : index % 3 === 1
          ? new THREE.BoxGeometry(index < 5 ? 0.48 : 0.34, index < 5 ? 0.34 : 0.26, 0.28)
          : new THREE.DodecahedronGeometry(index < 5 ? 0.28 : 0.2, 0);
      const body = new THREE.Mesh(geometry, housingMaterial);
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(index < 5 ? 0.11 : 0.075, 0), cyan);
      core.position.z = index < 5 ? 0.28 : 0.2;
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(index % 2 ? 0.78 : 0.16, index % 2 ? 0.13 : 0.72, 0.12), innerMaterial);
      node.position.fromArray(position);
      node.add(body, core, bracket);
      this.nodes.push(node);
      this.root.add(node);
    });

    const pathPositions: number[] = [];
    NODE_POSITIONS.forEach(([x, y, z]) => {
      pathPositions.push(-1.55, 0.15, 0, x, y, z - 0.2);
    });
    const paths = new THREE.BufferGeometry();
    paths.setAttribute("position", new THREE.Float32BufferAttribute(pathPositions, 3));
    this.dataPaths = new THREE.LineSegments(paths, this.material(new THREE.LineBasicMaterial({ color: 0x4fadb8, transparent: true, opacity: 0.24 }), 0.24));

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
    this.root.add(this.commandCore, this.dataPaths, this.city, this.foreground.root);
  }

  async preload() {
    const model = await this.assets.loadModel("network-environment", this.quality);
    if (!model || this.authored) return;
    this.authored = model;
    model.position.set(0.0, 0.2, -0.9);
    model.scale.setScalar(0.9);
    this.root.add(model);
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    const dominant = snapshot.weight > 0.5;
    const authored = Boolean(this.authored && snapshot.quality !== "low");
    if (this.authored) this.authored.visible = authored;
    this.root.position.set(0.2, 0.2, 0);
    const idle = snapshot.reducedMotion ? 0 : snapshot.elapsedSeconds;
    this.commandCore.visible = !authored;
    this.commandCore.rotation.set(idle * 0.012, -idle * 0.018, snapshot.localProgress * 0.08);
    this.commandCore.scale.setScalar(0.82 + snapshot.localProgress * 0.16);
    const visibleNodes = dominant ? (snapshot.quality === "low" ? 5 : this.nodes.length) : 3;
    this.nodes.forEach((node, index) => {
      node.visible = !authored && index < visibleNodes;
      const position = snapshot.quality === "low" && index < COMPACT_NODE_POSITIONS.length
        ? COMPACT_NODE_POSITIONS[index]
        : NODE_POSITIONS[index];
      node.position.fromArray(position);
      node.rotation.y = snapshot.reducedMotion ? 0 : idle * (index % 2 ? -0.018 : 0.014);
      const reveal = Math.min(1, Math.max(0, snapshot.localProgress * 1.4 - index * 0.055));
      node.scale.setScalar(reveal * (index < 5 ? 1 : 0.82));
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
}
