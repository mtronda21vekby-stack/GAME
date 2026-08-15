import * as THREE from "three";
import { clamp, smootherstep } from "../../experience/core/math";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import type { AssetSlotRegistry } from "../core/AssetSlotRegistry";
import { createCinematicArtPlane, setCinematicArtTexture } from "./CinematicArtPlane";
import { ForegroundOcclusionSystem } from "./ForegroundOcclusionSystem";
import { SpatialSceneBase, energyMaterial } from "./SpatialSceneBase";

export class WorldGateScene extends SpatialSceneBase {
  private authored: THREE.Group | null = null;
  private readonly oceanPlate = createCinematicArtPlane(16.4, 9.2);
  private readonly arcs = new THREE.Group();
  private readonly tunnel = new THREE.Group();
  private readonly ribMesh: THREE.InstancedMesh;
  private readonly streaks: THREE.LineSegments;
  private readonly aperture: THREE.Mesh;
  private readonly depthCore: THREE.Mesh;
  private readonly foreground = new ForegroundOcclusionSystem([
    { position: [-4.8, 0.2, 2.2], scale: [0.62, 5.8, 0.4], rotation: [0.08, 0.14, -0.24], travel: [1.5, 0.15, 0.9] },
    { position: [5.1, -0.35, 2.5], scale: [0.48, 6.4, 0.38], rotation: [-0.06, -0.12, 0.2], travel: [-1.2, -0.1, 1.1] },
    { position: [-2.2, 3.55, 1.45], scale: [3.5, 0.34, 0.35], rotation: [0.06, 0.1, 0.13], travel: [0.55, -0.9, 0.75] },
    { position: [2.7, -3.45, 1.65], scale: [3.1, 0.3, 0.38], rotation: [-0.05, -0.08, -0.1], travel: [-0.45, 0.75, 0.85] },
  ], 0x080d15, 0x22255f);

  constructor(private readonly assets: AssetSlotRegistry) {
    super("world-gate");
    const containment = this.solid(new THREE.MeshStandardMaterial({
      color: 0x111b23,
      emissive: 0x142a3e,
      emissiveIntensity: 0.28,
      metalness: 0.74,
      roughness: 0.42,
    }));
    [
      [1.7, 0.64, -0.7, 0.72, -0.72, 0.2],
      [2.55, 0.48, -1.45, -1.02, 1.02, -0.26],
      [3.45, 0.68, -2.35, 1.28, -1.3, 0.42],
      [4.25, 0.4, -3.25, -1.5, 1.62, -0.52],
    ].forEach(([radius, arcRatio, z, rotation, x, y], index) => {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.07 + index * 0.012, 6, 52, Math.PI * arcRatio),
        index === 1
          ? this.material(energyMaterial(0x725fe0, 0.34), 0.34)
          : containment,
      );
      arc.position.set(x, y, z);
      arc.rotation.set(index * 0.025, index * -0.035, rotation);
      this.arcs.add(arc);
    });

    const tunnelWall = new THREE.Mesh(
      new THREE.CylinderGeometry(1.06, 2.25, 6.4, 12, 1, true),
      this.solid(new THREE.MeshStandardMaterial({
        color: 0x071018,
        emissive: 0x132044,
        emissiveIntensity: 0.22,
        metalness: 0.62,
        roughness: 0.6,
        side: THREE.BackSide,
      })),
    );
    tunnelWall.rotation.x = Math.PI / 2;
    tunnelWall.position.set(0.35, 0.08, -2.8);

    const ribGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.ribMesh = new THREE.InstancedMesh(ribGeometry, containment, 12);
    const marker = new THREE.Object3D();
    for (let index = 0; index < 12; index += 1) {
      const band = Math.floor(index / 4);
      const side = index % 4;
      const angle = side * Math.PI * 0.5 + band * 0.18;
      const radius = 1.55 + band * 0.46;
      marker.position.set(Math.cos(angle) * radius + 0.35, Math.sin(angle) * radius, -0.9 - band * 1.55);
      marker.rotation.set(0.04 * band, 0, angle);
      marker.scale.set(0.12 + band * 0.025, 1.25 + band * 0.34, 0.22);
      marker.updateMatrix();
      this.ribMesh.setMatrixAt(index, marker.matrix);
    }
    this.ribMesh.instanceMatrix.needsUpdate = true;

    this.aperture = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 1.08, 0.52, 8, 1, true),
      this.solid(new THREE.MeshStandardMaterial({
        color: 0x0b1822,
        emissive: 0x35668f,
        emissiveIntensity: 0.5,
        metalness: 0.46,
        roughness: 0.35,
        side: THREE.DoubleSide,
      })),
    );
    this.aperture.position.set(0.35, 0.08, -5.65);
    this.aperture.rotation.x = Math.PI / 2;
    this.aperture.rotation.z = 0.26;
    this.depthCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.24, 0),
      this.material(energyMaterial(0x8177e9, 0.34), 0.34),
    );
    this.depthCore.position.set(0.35, 0.08, -6.45);

    const linePositions: number[] = [];
    for (let index = 0; index < 18; index += 1) {
      const side = index % 2 ? 1 : -1;
      const lane = Math.floor(index / 2) - 4;
      linePositions.push(side * (0.7 + Math.abs(lane) * 0.34), lane * 0.23, -1.4, side * (1.15 + Math.abs(lane) * 0.42), lane * 0.34, -6.2);
    }
    const streakGeometry = new THREE.BufferGeometry();
    streakGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    this.streaks = new THREE.LineSegments(streakGeometry, this.material(new THREE.LineBasicMaterial({ color: 0x4c7bd5, transparent: true, opacity: 0.2 }), 0.2));

    this.tunnel.add(tunnelWall, this.ribMesh, this.aperture, this.depthCore, this.streaks);
    this.oceanPlate.mesh.position.set(-0.4, -4.4, -7.2);
    this.root.add(this.oceanPlate.mesh, this.tunnel, this.arcs, this.foreground.root);
  }

  async preload() {
    const [model, oceanTexture] = await Promise.all([
      this.assets.loadModel("world-gate", this.quality),
      this.assets.loadTexture("crown-ocean-bridge", this.quality),
    ]);
    setCinematicArtTexture(this.oceanPlate, oceanTexture);
    if (model && !this.authored) {
      this.authored = model;
      model.position.set(-0.2, 0.05, -0.65);
      model.scale.setScalar(0.92);
      this.root.add(model);
    }
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    const authored = Boolean(this.authored && snapshot.quality !== "low");
    const cinematicBridge = Boolean(this.oceanPlate.material.map);
    const oceanRise = smootherstep(clamp((snapshot.localProgress + 0.08) / 0.72));
    if (this.authored) this.authored.visible = authored;
    this.tunnel.visible = !authored && !cinematicBridge && snapshot.localProgress < 0.7;
    // This scene is a physical Crown-to-ocean bridge, never a portal tableau.
    this.arcs.visible = false;
    this.ribMesh.visible = !authored && !cinematicBridge && snapshot.localProgress < 0.62;
    this.aperture.visible = false;
    this.depthCore.visible = false;
    this.streaks.visible = !cinematicBridge && snapshot.weight >= 0.4 && snapshot.localProgress < 0.86;
    this.foreground.root.visible = snapshot.weight > 0.55 && snapshot.localProgress < 0.74;
    this.root.position.set(0.4, 0.2, 0);
    const motion = snapshot.reducedMotion ? 0 : snapshot.elapsedSeconds * 0.018;
    this.arcs.children.forEach((arc, index) => {
      arc.rotation.z = (index % 2 ? -1.02 : 0.72) + motion * (index % 2 ? -1 : 1) + snapshot.localProgress * (0.08 + index * 0.025);
    });
    this.tunnel.position.y = snapshot.localProgress * 1.12;
    this.tunnel.position.z = snapshot.localProgress * 0.7;
    this.tunnel.scale.z = 0.86 + snapshot.localProgress * 0.34;
    this.oceanPlate.mesh.position.set(-0.4, -1.42 + oceanRise * 1.34, -7.2 + oceanRise * 0.45);
    this.oceanPlate.mesh.scale.setScalar(snapshot.quality === "low" ? 1.5 : 1.04 + oceanRise * 0.08);
    this.oceanPlate.material.opacity = (0.14 + oceanRise * 0.86) * Math.min(1, snapshot.weight * 1.6);
    this.root.userData.bcCrownOceanBridgeOpacity = this.oceanPlate.material.map
      ? this.oceanPlate.material.opacity
      : 0;
    if (this.authored?.visible) {
      this.authored.position.z = -0.65 + snapshot.localProgress * 0.48;
      this.authored.rotation.z = (snapshot.localProgress - 0.5) * 0.025;
    }
    const apertureScale = 0.82 + snapshot.localProgress * 0.28;
    this.aperture.scale.set(apertureScale * 1.16, apertureScale * 0.84, 1);
    this.depthCore.scale.setScalar(0.72 + snapshot.localProgress * 0.32);
    this.depthCore.rotation.z = snapshot.reducedMotion ? 0 : motion * -4;
    if (this.foreground.root.visible) this.foreground.evaluate(snapshot.localProgress, snapshot.quality, snapshot.reducedMotion);
  }

  override dispose() {
    this.oceanPlate.material.map = null;
    super.dispose();
  }
}
