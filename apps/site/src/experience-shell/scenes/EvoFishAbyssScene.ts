import * as THREE from "three";
import { clamp, createSeededRandom, smootherstep } from "../../experience/core/math";
import type { QualityTier } from "../../experience/types";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import type { AssetSlotRegistry } from "../core/AssetSlotRegistry";
import { createCinematicArtPlane, setCinematicArtTexture } from "./CinematicArtPlane";
import { ForegroundOcclusionSystem } from "./ForegroundOcclusionSystem";
import { SpatialSceneBase, energyMaterial, metalMaterial } from "./SpatialSceneBase";
import { EXPERIENCE_PHASE_RANGES } from "../experienceShellConfig";

const OCEAN_CYAN = new THREE.Color(0x4ab7cc);
const TRANSITION_WHITE = new THREE.Color(0xe4efef);

export class EvoFishAbyssScene extends SpatialSceneBase {
  private readonly abyssPlate = createCinematicArtPlane(16.4, 9.2);
  private readonly subjectMaterial: THREE.ShaderMaterial;
  private readonly subject: THREE.Mesh;
  private readonly caustics = new THREE.Group();
  private readonly causticMaterial: THREE.MeshBasicMaterial;
  private readonly bubbles: THREE.InstancedMesh;
  private readonly silhouettes = new THREE.Group();
  private readonly silhouetteBases: Array<{ position: THREE.Vector3; scale: THREE.Vector3; rotationZ: number }> = [];
  private currentQuality: QualityTier = "low";
  private readonly foreground = new ForegroundOcclusionSystem([
    { position: [-5.4, -0.5, 2.4], scale: [1.3, 5.8, 0.3], rotation: [0.08, 0.22, -0.32], travel: [0.8, 0.45, 0.7] },
    { position: [5.25, -0.9, 2.2], scale: [1.05, 5.2, 0.28], rotation: [-0.06, -0.18, 0.28], travel: [-0.68, 0.3, 0.62] },
    { position: [-2.8, 3.8, 1.45], scale: [3.7, 0.5, 0.24], rotation: [0.12, 0.16, 0.18], travel: [0.45, -0.8, 0.5] },
    { position: [3.25, -3.6, 1.5], scale: [3.2, 0.42, 0.22], rotation: [-0.1, -0.12, -0.2], travel: [-0.35, 0.72, 0.55] },
  ], 0x02090e, 0x06212a);

  constructor(private readonly assets: AssetSlotRegistry) {
    super("evofish-abyss");
    this.subjectMaterial = this.material(new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMap: { value: null },
        uHasTexture: { value: 0 },
        uOpacity: { value: 0.82 },
        uReveal: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D uMap;
        uniform float uHasTexture;
        uniform float uOpacity;
        uniform float uReveal;
        void main() {
          vec4 source = texture2D(uMap, vUv);
          vec3 fallback = vec3(0.025, 0.19, 0.25);
          vec3 color = mix(fallback, source.rgb, uHasTexture);
          float darkLift = 1.0 - smoothstep(0.045, 0.2, length(color));
          color += vec3(0.012, 0.055, 0.07) * darkLift * uHasTexture;
          float edge = smoothstep(0.0, 0.2, vUv.x) * smoothstep(0.0, 0.2, 1.0 - vUv.x)
            * smoothstep(0.0, 0.18, vUv.y) * smoothstep(0.0, 0.18, 1.0 - vUv.y);
          float depthFade = 0.34 + smoothstep(0.015, 0.22, length(color)) * 0.66;
          float headFocus = smoothstep(0.42, 0.72, vUv.x);
          float revealMask = mix(headFocus, 1.0, uReveal);
          float detail = smoothstep(0.13, 0.48, length(color));
          vec3 silhouette = color * vec3(0.22, 0.42, 0.48) + vec3(0.0, 0.018, 0.026);
          color = mix(silhouette + detail * headFocus * vec3(0.01, 0.08, 0.1), color, uReveal);
          gl_FragColor = vec4(color, edge * mix(0.72, source.a, uHasTexture) * depthFade * revealMask * uOpacity);
        }
      `,
    }), 0.82);
    this.subject = new THREE.Mesh(new THREE.PlaneGeometry(6.7, 4.4), this.subjectMaterial);
    this.subject.position.set(1.25, 0.55, -1.2);

    const waterVolume = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 8.5),
      this.material(new THREE.MeshBasicMaterial({ color: 0x032331, transparent: true, opacity: 0.42, depthWrite: false }), 0.42),
    );
    waterVolume.position.z = -4.2;
    this.abyssPlate.mesh.position.set(-0.45, 0.2, -6.8);
    this.root.add(this.abyssPlate.mesh, waterVolume);

    this.causticMaterial = this.material(energyMaterial(0x4ab7cc, 0.14), 0.14);
    [-3.7, -1.45, 0.9, 3.35].forEach((x, index) => {
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.12 + index * 0.025, 8.4), this.causticMaterial);
      sheet.position.set(x, 0.8 - index * 0.2, -2.65 - index * 0.38);
      sheet.rotation.z = -0.42 + index * 0.19;
      this.caustics.add(sheet);
    });

    const silhouetteMaterial = this.solid(metalMaterial(0x020b10, 0x031016));
    [
      [[-4.2, -1.7, 0.65], [1.35, 3.6, 0.6], -0.34],
      [[4.5, -1.35, 0.5], [1.1, 3.2, 0.55], 0.29],
      [[-1.1, 3.25, -0.4], [2.8, 0.55, 0.45], 0.18],
    ].forEach(([position, scale, rotation]) => {
      const silhouette = new THREE.Mesh(new THREE.DodecahedronGeometry(0.72, 0), silhouetteMaterial);
      silhouette.position.fromArray(position as number[]);
      silhouette.scale.fromArray(scale as number[]);
      silhouette.rotation.z = rotation as number;
      this.silhouettes.add(silhouette);
      this.silhouetteBases.push({
        position: silhouette.position.clone(),
        scale: silhouette.scale.clone(),
        rotationZ: silhouette.rotation.z,
      });
    });

    const random = createSeededRandom(0xe70f2026);
    this.bubbles = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.055, 8, 6),
      this.material(energyMaterial(0x76ddea, 0.24), 0.24),
      18,
    );
    const marker = new THREE.Object3D();
    for (let index = 0; index < 18; index += 1) {
      marker.position.set((random() - 0.5) * 8.4, (random() - 0.5) * 5.2, -0.8 - random() * 3.1);
      marker.scale.setScalar(0.45 + random() * 1.2);
      marker.updateMatrix();
      this.bubbles.setMatrixAt(index, marker.matrix);
    }
    this.bubbles.instanceMatrix.needsUpdate = true;
    this.root.add(this.subject, this.caustics, this.silhouettes, this.bubbles, this.foreground.root);
  }

  override setQuality(tier: QualityTier) {
    this.currentQuality = tier;
    this.bubbles.count = tier === "low" ? 7 : tier === "medium" ? 12 : 18;
    super.setQuality(tier);
  }

  async preload() {
    let [subjectTexture, backdropTexture] = await Promise.all([
      this.assets.loadTexture("evofish-subject", this.currentQuality),
      this.assets.loadTexture("evofish-backdrop", this.currentQuality),
    ]);
    subjectTexture ??= await this.assets.loadTexture("evofish-legacy-subject", this.currentQuality);
    setCinematicArtTexture(this.abyssPlate, backdropTexture);
    if (subjectTexture) {
      this.subjectMaterial.uniforms.uMap.value = subjectTexture;
      this.subjectMaterial.uniforms.uHasTexture.value = 1;
      this.subjectMaterial.needsUpdate = true;
    }
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    const dominant = snapshot.weight > 0.5;
    const oceanExit = snapshot.globalProgress <= EXPERIENCE_PHASE_RANGES.oceanToVault[0]
      ? 0
      : smootherstep(clamp(
        (snapshot.globalProgress - EXPERIENCE_PHASE_RANGES.oceanToVault[0])
        / (EXPERIENCE_PHASE_RANGES.oceanToVault[1] - EXPERIENCE_PHASE_RANGES.oceanToVault[0]),
      ));
    this.caustics.visible = snapshot.weight > 0.05;
    this.silhouettes.visible = snapshot.weight > 0.05;
    this.bubbles.visible = dominant;
    this.foreground.root.visible = snapshot.weight > 0.65;
    this.root.position.set(snapshot.reducedMotion ? 0 : -0.2 + snapshot.localProgress * 0.42, 0, 0);
    const compact = snapshot.quality === "low";
    const reveal = snapshot.reducedMotion ? 1 : smootherstep(clamp((snapshot.localProgress - 0.08) / 0.72));
    const earlyX = compact ? -0.5 : -0.72;
    const fullX = compact ? 0 : 1.25;
    this.subject.position.x = earlyX + (fullX - earlyX) * reveal;
    this.subject.position.y = compact ? 0.9 + reveal * 0.22 : 0.46 + reveal * 0.09;
    const earlyScale = compact ? 1.24 : 1.42;
    const fullScale = compact ? 0.86 : 1.08;
    this.subject.scale.setScalar(earlyScale + (fullScale - earlyScale) * reveal);
    this.subject.position.z = -0.72 - reveal * 0.84;
    this.subject.rotation.y = snapshot.reducedMotion ? 0 : (reveal - 0.5) * -0.075;
    this.subjectMaterial.uniforms.uReveal.value = reveal;
    this.subjectMaterial.uniforms.uOpacity.value = (0.56 + reveal * 0.34)
      * snapshot.weight
      * (1 - oceanExit * 0.88);
    this.abyssPlate.mesh.position.set(
      compact ? -0.15 : -0.45 + snapshot.localProgress * 0.22,
      0.22 - reveal * 0.16,
      -6.8 + reveal * 0.24,
    );
    this.abyssPlate.mesh.scale.setScalar(compact ? 1.18 : 1.04 + reveal * 0.04);
    this.abyssPlate.material.opacity = (0.72 + reveal * 0.2)
      * snapshot.weight
      * (1 - oceanExit * 0.86);
    this.caustics.position.x = snapshot.localProgress * 0.35 * (1 - oceanExit);
    this.caustics.rotation.z = snapshot.reducedMotion ? 0 : Math.sin(snapshot.elapsedSeconds * 0.12) * 0.025 * (1 - oceanExit);
    this.causticMaterial.color.lerpColors(OCEAN_CYAN, TRANSITION_WHITE, oceanExit);
    this.caustics.children.forEach((sheet, index) => {
      const baseRotation = -0.42 + index * 0.19;
      sheet.rotation.z = baseRotation + (Math.PI * 0.5 - baseRotation) * oceanExit;
      sheet.position.y = 0.8 - index * 0.2 + (index - 1.5) * 0.72 * oceanExit;
      sheet.scale.set(1 + oceanExit * 1.8, 1 - oceanExit * 0.42, 1);
    });
    this.bubbles.position.y = snapshot.reducedMotion ? 0 : (snapshot.elapsedSeconds * 0.045) % 0.8;
    this.silhouettes.position.x = -reveal * 0.28 * (1 - oceanExit);
    this.silhouettes.children.forEach((silhouette, index) => {
      const base = this.silhouetteBases[index];
      const side = index % 2 ? 1 : -1;
      silhouette.position.set(
        base.position.x + side * oceanExit * 1.1,
        base.position.y * (1 - oceanExit * 0.38),
        base.position.z + oceanExit * 0.85,
      );
      silhouette.scale.set(
        base.scale.x + (0.46 - base.scale.x) * oceanExit,
        base.scale.y + (5.6 - base.scale.y) * oceanExit,
        base.scale.z + (0.34 - base.scale.z) * oceanExit,
      );
      silhouette.rotation.z = base.rotationZ * (1 - oceanExit);
    });
    if (this.foreground.root.visible) this.foreground.evaluate(snapshot.localProgress, snapshot.quality, snapshot.reducedMotion);
  }

  override dispose() {
    this.subjectMaterial.uniforms.uMap.value = null;
    this.abyssPlate.material.map = null;
    super.dispose();
  }
}
