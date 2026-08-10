import * as THREE from "three";
import { createSeededRandom } from "../../experience/core/math";
import type { QualityTier } from "../../experience/types";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import type { AssetSlotRegistry } from "../core/AssetSlotRegistry";
import { ForegroundOcclusionSystem } from "./ForegroundOcclusionSystem";
import { SpatialSceneBase, energyMaterial, metalMaterial } from "./SpatialSceneBase";

export class EvoFishAbyssScene extends SpatialSceneBase {
  private readonly subjectMaterial: THREE.ShaderMaterial;
  private readonly subject: THREE.Mesh;
  private readonly caustics = new THREE.Group();
  private readonly bubbles: THREE.InstancedMesh;
  private readonly silhouettes = new THREE.Group();
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
        void main() {
          vec4 source = texture2D(uMap, vUv);
          vec3 fallback = vec3(0.025, 0.19, 0.25);
          vec3 color = mix(fallback, source.rgb, uHasTexture);
          float edge = smoothstep(0.0, 0.2, vUv.x) * smoothstep(0.0, 0.2, 1.0 - vUv.x)
            * smoothstep(0.0, 0.18, vUv.y) * smoothstep(0.0, 0.18, 1.0 - vUv.y);
          float depthFade = 0.34 + smoothstep(0.015, 0.22, length(color)) * 0.66;
          gl_FragColor = vec4(color, edge * mix(0.72, source.a, uHasTexture) * depthFade * uOpacity);
        }
      `,
    }), 0.82);
    this.subject = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4), this.subjectMaterial);
    this.subject.position.set(1.25, 0.55, -1.2);

    const waterVolume = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 8.5),
      this.material(new THREE.MeshBasicMaterial({ color: 0x032331, transparent: true, opacity: 0.42, depthWrite: false }), 0.42),
    );
    waterVolume.position.z = -4.2;
    this.root.add(waterVolume);

    const causticMaterial = this.material(energyMaterial(0x4ab7cc, 0.14), 0.14);
    [-3.7, -1.45, 0.9, 3.35].forEach((x, index) => {
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.12 + index * 0.025, 8.4), causticMaterial);
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
    const texture = await this.assets.loadTexture("evofish-subject", this.currentQuality);
    if (texture) {
      this.subjectMaterial.uniforms.uMap.value = texture;
      this.subjectMaterial.uniforms.uHasTexture.value = 1;
      this.subjectMaterial.needsUpdate = true;
    }
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    const dominant = snapshot.weight > 0.5;
    this.caustics.visible = dominant;
    this.silhouettes.visible = dominant;
    this.bubbles.visible = dominant;
    this.foreground.root.visible = snapshot.weight > 0.65;
    this.root.position.set(snapshot.reducedMotion ? 0 : -0.2 + snapshot.localProgress * 0.42, 0, 0);
    const compact = snapshot.quality === "low";
    this.subject.position.x = compact ? 0 : 1.25;
    this.subject.position.y = compact ? 1.12 : 0.55;
    this.subject.scale.setScalar(compact ? 0.9 : 1);
    this.subject.position.z = -1.55 + snapshot.localProgress * 0.58;
    this.subject.rotation.y = snapshot.reducedMotion ? 0 : (snapshot.localProgress - 0.5) * -0.075;
    this.subjectMaterial.uniforms.uOpacity.value = (0.72 + snapshot.localProgress * 0.18) * snapshot.weight;
    this.caustics.position.x = snapshot.localProgress * 0.35;
    this.caustics.rotation.z = snapshot.reducedMotion ? 0 : Math.sin(snapshot.elapsedSeconds * 0.12) * 0.025;
    this.bubbles.position.y = snapshot.reducedMotion ? 0 : (snapshot.elapsedSeconds * 0.045) % 0.8;
    this.silhouettes.position.x = -snapshot.localProgress * 0.28;
    if (this.foreground.root.visible) this.foreground.evaluate(snapshot.localProgress, snapshot.quality, snapshot.reducedMotion);
  }

  override dispose() {
    this.subjectMaterial.uniforms.uMap.value = null;
    super.dispose();
  }
}
