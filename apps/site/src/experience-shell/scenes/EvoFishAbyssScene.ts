import * as THREE from "three";
import type { QualityTier } from "../../experience/types";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import type { AssetSlotRegistry } from "../core/AssetSlotRegistry";
import { SpatialSceneBase, energyMaterial, metalMaterial } from "./SpatialSceneBase";

export class EvoFishAbyssScene extends SpatialSceneBase {
  private readonly subjectMaterial = this.material(new THREE.MeshBasicMaterial({ color: 0x1d6574, transparent: true, opacity: 0.68 }), 0.68);
  private readonly subject = new THREE.Mesh(new THREE.BoxGeometry(5.7, 3.55, 0.04), this.subjectMaterial);
  private readonly caustics = new THREE.Group();
  private currentQuality: QualityTier = "low";

  constructor(private readonly assets: AssetSlotRegistry) {
    super("evofish-abyss");
    this.subject.position.set(-0.4, 0.3, -1.2);
    this.root.add(this.subject, this.caustics);
    [2.2, 3.35, 4.5].forEach((radius, index) => {
      const ray = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.025 + index * 0.012, 5, 44, Math.PI * 1.3),
        this.material(energyMaterial(index === 1 ? 0x4bbecf : 0x236579, 0.22), 0.22),
      );
      ray.position.set(0.4, 1.25 - index * 0.5, -2.8 - index * 0.65);
      ray.rotation.z = -1.9 + index * 0.18;
      this.caustics.add(ray);
    });
    const silhouetteGeometry = new THREE.IcosahedronGeometry(0.7, 1);
    [-3.8, 3.6].forEach((x, index) => {
      const silhouette = new THREE.Mesh(silhouetteGeometry, this.material(metalMaterial(0x031015, 0x020708, 0.86), 0.86));
      silhouette.position.set(x, -1.6 + index * 0.25, 1.3);
      silhouette.scale.set(1.2, 2.6, 0.65);
      this.detail.add(silhouette);
    });
  }

  override setQuality(tier: QualityTier) {
    this.currentQuality = tier;
    super.setQuality(tier);
  }

  async preload() {
    const texture = await this.assets.loadTexture("evofish-subject", this.currentQuality);
    if (texture) {
      this.subjectMaterial.map = texture;
      this.subjectMaterial.color.setHex(0xffffff);
      this.subjectMaterial.needsUpdate = true;
    }
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    this.root.position.set(snapshot.reducedMotion ? 0 : -0.3 + snapshot.localProgress * 0.5, 0, 0);
    this.subject.position.z = -1.4 + snapshot.localProgress * 0.65;
    this.subject.rotation.y = (snapshot.localProgress - 0.5) * -0.06;
    if (!snapshot.reducedMotion) this.caustics.rotation.z = snapshot.elapsedSeconds * 0.006 + snapshot.localProgress * 0.08;
  }

  override dispose() {
    this.subjectMaterial.map = null;
    super.dispose();
  }
}
