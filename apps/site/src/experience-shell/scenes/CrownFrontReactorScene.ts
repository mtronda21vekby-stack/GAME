import * as THREE from "three";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import type { AssetSlotRegistry } from "../core/AssetSlotRegistry";
import { ForegroundOcclusionSystem } from "./ForegroundOcclusionSystem";
import { SpatialSceneBase, energyMaterial, metalMaterial } from "./SpatialSceneBase";
import { EXPERIENCE_PHASE_RANGES } from "../experienceShellConfig";

const RESIDUAL_CYAN = new THREE.Color(0x63dce7);
const TACTICAL_WHITE = new THREE.Color(0xe4efef);
const TACTICAL_ORANGE = new THREE.Color(0xff6f2f);

export class CrownFrontReactorScene extends SpatialSceneBase {
  private authored: THREE.Group | null = null;
  private readonly chamber = new THREE.Group();
  private readonly containment = new THREE.Group();
  private readonly shutters: THREE.InstancedMesh;
  private readonly tacticalLightMaterial: THREE.MeshBasicMaterial;
  private readonly shutterMarker = new THREE.Object3D();
  private readonly nucleus: THREE.Mesh;
  private readonly energyVolume: THREE.Mesh;
  private readonly coreCage: THREE.Mesh;
  private readonly foreground = new ForegroundOcclusionSystem([
    { position: [-5.25, 0.2, 2.3], scale: [0.52, 7.4, 0.5], rotation: [0.04, 0.18, -0.16], travel: [1.25, 0.1, 0.8] },
    { position: [5.4, -0.45, 2.1], scale: [0.44, 6.8, 0.48], rotation: [-0.05, -0.15, 0.2], travel: [-1.1, 0.15, 0.9] },
    { position: [-2.4, 3.65, 1.55], scale: [4.1, 0.42, 0.5], rotation: [0.08, 0.12, 0.12], travel: [0.8, -0.75, 0.7] },
    { position: [2.9, -3.5, 1.7], scale: [3.8, 0.36, 0.46], rotation: [-0.07, -0.1, -0.1], travel: [-0.65, 0.7, 0.76] },
  ], 0x100d0c, 0x401408);

  constructor(private readonly assets: AssetSlotRegistry) {
    super("crown-front-reactor");
    const shellMaterial = this.solid(new THREE.MeshStandardMaterial({
      color: 0x211d1a,
      emissive: 0x40170a,
      emissiveIntensity: 0.3,
      metalness: 0.82,
      roughness: 0.44,
    }));
    const innerMaterial = this.solid(new THREE.MeshStandardMaterial({
      color: 0x111214,
      emissive: 0x2b130c,
      emissiveIntensity: 0.22,
      metalness: 0.78,
      roughness: 0.5,
    }));

    const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
    const walls = new THREE.InstancedMesh(wallGeometry, shellMaterial, 12);
    const marker = new THREE.Object3D();
    for (let index = 0; index < 12; index += 1) {
      const side = index % 2 ? 1 : -1;
      const level = Math.floor(index / 2) - 2.5;
      marker.position.set(side * (4.25 + (index % 3) * 0.34), level * 1.18, -3.3 - (index % 3) * 0.75);
      marker.rotation.set(0, side * -0.08, side * (0.08 + (index % 3) * 0.025));
      marker.scale.set(0.34, 1.02, 1.2);
      marker.updateMatrix();
      walls.setMatrixAt(index, marker.matrix);
    }
    walls.instanceMatrix.needsUpdate = true;

    const ribGeometry = new THREE.BoxGeometry(1, 1, 1);
    const ribs = new THREE.InstancedMesh(ribGeometry, innerMaterial, 10);
    for (let index = 0; index < 10; index += 1) {
      const side = index % 2 ? 1 : -1;
      const level = Math.floor(index / 2) - 2;
      marker.position.set(side * (2.45 + Math.abs(level) * 0.2), level * 1.22, -0.85 - Math.abs(level) * 0.2);
      marker.rotation.set(0.04 * level, side * 0.12, side * (0.18 - Math.abs(level) * 0.018));
      marker.scale.set(0.22, 1.52, 0.35);
      marker.updateMatrix();
      ribs.setMatrixAt(index, marker.matrix);
    }
    ribs.instanceMatrix.needsUpdate = true;

    const bridgeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const bridges = new THREE.InstancedMesh(bridgeGeometry, shellMaterial, 6);
    [
      [-3.25, 2.65, -1.7, 2.3, 0.16, 0.46, -0.08],
      [3.4, 2.35, -2.0, 2.0, 0.15, 0.42, 0.1],
      [-3.5, -2.55, -1.25, 2.5, 0.18, 0.5, 0.06],
      [3.35, -2.8, -1.65, 2.2, 0.16, 0.46, -0.07],
      [-0.45, 3.35, -3.0, 3.3, 0.12, 0.32, 0.02],
      [0.8, -3.25, -2.8, 2.8, 0.12, 0.32, -0.03],
    ].forEach(([x, y, z, sx, sy, sz, rz], index) => {
      marker.position.set(x, y, z);
      marker.rotation.set(0, 0, rz);
      marker.scale.set(sx, sy, sz);
      marker.updateMatrix();
      bridges.setMatrixAt(index, marker.matrix);
    });
    bridges.instanceMatrix.needsUpdate = true;

    this.tacticalLightMaterial = this.material(energyMaterial(0xff6f2f, 0.24), 0.24);
    const tacticalLights = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      this.tacticalLightMaterial,
      10,
    );
    for (let index = 0; index < 10; index += 1) {
      const side = index % 2 ? 1 : -1;
      const level = Math.floor(index / 2) - 2;
      marker.position.set(side * (3.7 + (index % 3) * 0.2), level * 1.1, -2.4 - (index % 3) * 0.5);
      marker.rotation.set(0, side * 0.08, side * 0.08);
      marker.scale.set(0.08, 0.34 + (index % 2) * 0.18, 0.08);
      marker.updateMatrix();
      tacticalLights.setMatrixAt(index, marker.matrix);
    }
    tacticalLights.instanceMatrix.needsUpdate = true;

    [
      [2.15, 1.15, -0.45, -0.2],
      [2.85, 0.86, -1.0, 0.68],
      [3.65, 0.62, -1.85, -0.82],
    ].forEach(([radius, arcRatio, z, rotation], index) => {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.075 + index * 0.018, 7, 52, Math.PI * arcRatio),
        index === 1 ? this.material(energyMaterial(0xff7132, 0.32), 0.32) : shellMaterial,
      );
      arc.position.set(0.72 - index * 0.22, 0.15 + index * 0.08, z);
      arc.rotation.z = rotation;
      this.containment.add(arc);
    });

    const reactorHousing = new THREE.Mesh(
      new THREE.CylinderGeometry(1.28, 1.72, 1.8, 12, 1, true),
      shellMaterial,
    );
    reactorHousing.rotation.x = Math.PI / 2;
    reactorHousing.position.z = -3.45;
    reactorHousing.scale.setScalar(0.68);
    const cageMaterial = this.solid(new THREE.MeshStandardMaterial({
      color: 0x392b24,
      emissive: 0x5b210d,
      emissiveIntensity: 0.44,
      metalness: 0.78,
      roughness: 0.38,
    }));
    this.coreCage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.98, 0), cageMaterial);
    this.coreCage.position.set(0.08, 0.02, -3.35);
    this.coreCage.scale.set(0.68, 0.6, 0.46);
    this.energyVolume = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.78, 1.25, 10, 1, true),
      this.material(energyMaterial(0xff6f2f, 0.34), 0.34),
    );
    this.energyVolume.rotation.x = Math.PI / 2;
    this.energyVolume.position.z = -3.55;
    this.nucleus = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.48, 0),
      this.material(energyMaterial(0xffb06c, 0.52), 0.52),
    );
    this.nucleus.position.z = -3.9;
    this.nucleus.scale.set(0.46, 0.54, 0.46);

    const shutterMaterial = this.solid(new THREE.MeshStandardMaterial({
      color: 0x2a211d,
      emissive: 0x6b260e,
      emissiveIntensity: 0.34,
      metalness: 0.74,
      roughness: 0.42,
    }));
    this.shutters = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), shutterMaterial, 8);
    this.shutters.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.chamber.add(walls, ribs, bridges, tacticalLights);
    this.root.add(this.chamber, this.containment, reactorHousing, this.energyVolume, this.coreCage, this.nucleus, this.shutters, this.foreground.root);
  }

  async preload() {
    const model = await this.assets.loadModel("crown-front-environment", this.quality);
    if (!model || this.authored) return;
    this.authored = model;
    model.position.set(-0.35, 0.0, -1.1);
    model.scale.setScalar(0.92);
    this.root.add(model);
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    const authored = Boolean(this.authored && snapshot.quality !== "low");
    if (this.authored) this.authored.visible = authored;
    this.chamber.visible = snapshot.weight > 0.5 && !authored;
    this.containment.visible = !authored;
    this.foreground.root.visible = snapshot.weight > 0.65;
    this.root.position.set(0.8, 0.18, 0);
    const motion = snapshot.reducedMotion ? 0 : snapshot.elapsedSeconds;
    const vaultReveal = snapshot.globalProgress < EXPERIENCE_PHASE_RANGES.oceanToVault[1]
      ? snapshot.weight
      : 1;
    if (vaultReveal < 0.5) {
      this.tacticalLightMaterial.color.lerpColors(RESIDUAL_CYAN, TACTICAL_WHITE, vaultReveal * 2);
    } else {
      this.tacticalLightMaterial.color.lerpColors(TACTICAL_WHITE, TACTICAL_ORANGE, (vaultReveal - 0.5) * 2);
    }
    this.containment.rotation.z = snapshot.localProgress * 0.08 + motion * 0.008;
    this.energyVolume.rotation.z = snapshot.localProgress * 0.24 - motion * 0.05;
    this.energyVolume.scale.setScalar((0.34 + snapshot.localProgress * 0.05) * (0.45 + vaultReveal * 0.55));
    this.coreCage.rotation.set(0.08, -0.12 + snapshot.localProgress * 0.06, motion * 0.004);
    this.nucleus.rotation.set(motion * 0.08, -motion * 0.11, snapshot.localProgress * 0.18);
    const nucleusScale = (0.38 + snapshot.localProgress * 0.08) * (0.4 + vaultReveal * 0.6);
    this.nucleus.scale.set(nucleusScale, nucleusScale * 1.18, nucleusScale);
    const opening = (snapshot.reducedMotion ? 0.55 : 0.12) + vaultReveal * (snapshot.reducedMotion ? 0.45 : 0.88);
    for (let index = 0; index < 8; index += 1) {
      const side = index % 2 ? 1 : -1;
      const level = Math.floor(index / 2) - 1.5;
      this.shutterMarker.position.set(side * (0.68 + opening * 1.55), level * 1.05, 0.72 - Math.abs(level) * 0.2);
      this.shutterMarker.rotation.set(0.02 * level, side * -0.08, side * 0.035);
      this.shutterMarker.scale.set(0.58, 0.9, 0.34);
      this.shutterMarker.updateMatrix();
      this.shutters.setMatrixAt(index, this.shutterMarker.matrix);
    }
    this.shutters.instanceMatrix.needsUpdate = true;
    this.chamber.position.z = -0.25 - snapshot.localProgress * 0.25;
    if (this.authored?.visible) {
      this.authored.position.z = -1.1 - snapshot.localProgress * 0.2;
      this.authored.rotation.z = snapshot.localProgress * 0.018;
    }
    if (this.foreground.root.visible) this.foreground.evaluate(snapshot.localProgress, snapshot.quality, snapshot.reducedMotion);
  }
}
