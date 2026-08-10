import * as THREE from "three";
import type { CommerceCatalogItem } from "@blackcrown/commerce";
import type { SceneEvaluationSnapshot } from "../core/SceneLifecycle";
import { getCollectionHousingKind, getFeaturedCollectionItems } from "../featuredCatalog";
import { ForegroundOcclusionSystem } from "./ForegroundOcclusionSystem";
import { SpatialSceneBase, energyMaterial, metalMaterial } from "./SpatialSceneBase";

const RARITY_COLORS = { common: 0xcbd5db, rare: 0x58c9ed, epic: 0xa982f0, legendary: 0xf0b65b } as const;

export class CollectionVaultScene extends SpatialSceneBase {
  private readonly rails: THREE.InstancedMesh;
  private readonly housings: THREE.Group[] = [];
  private readonly featured = getFeaturedCollectionItems(3);
  private readonly foreground = new ForegroundOcclusionSystem([
    { position: [-5.05, 0, 2.1], scale: [0.32, 7.1, 0.34], rotation: [0.02, 0.12, -0.16], travel: [0.8, 0.1, 0.65] },
    { position: [5.25, -0.2, 2.0], scale: [0.3, 6.7, 0.34], rotation: [-0.02, -0.1, 0.14], travel: [-0.72, 0.1, 0.68] },
    { position: [2.1, 3.45, 1.2], scale: [4.0, 0.25, 0.32], rotation: [0.05, 0.08, -0.06], travel: [-0.6, -0.5, 0.5] },
    { position: [-2.5, -3.35, 1.25], scale: [3.5, 0.23, 0.3], rotation: [-0.04, -0.07, 0.08], travel: [0.5, 0.48, 0.52] },
  ], 0x0b1418, 0x14333a);

  constructor() {
    super("collection-vault");
    const railMaterial = this.solid(metalMaterial(0x142128, 0x0c3138));
    this.rails = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), railMaterial, 8);
    const marker = new THREE.Object3D();
    [
      [-4.3, 0, -1.8, 0.1, 7.2, 0.18, -0.06],
      [-3.55, 0.5, -2.35, 0.08, 6.0, 0.15, -0.04],
      [4.4, 0, -1.7, 0.1, 7.0, 0.18, 0.06],
      [3.6, -0.45, -2.3, 0.08, 6.1, 0.15, 0.04],
      [-0.8, 3.25, -2.5, 4.8, 0.1, 0.18, 0.02],
      [1.25, -3.05, -2.2, 4.2, 0.1, 0.18, -0.03],
      [-1.4, 1.75, -3.0, 2.4, 0.08, 0.14, 0.04],
      [2.45, -1.35, -2.8, 2.1, 0.08, 0.14, -0.05],
    ].forEach(([x, y, z, sx, sy, sz, rz], index) => {
      marker.position.set(x, y, z);
      marker.rotation.set(0, 0, rz);
      marker.scale.set(sx, sy, sz);
      marker.updateMatrix();
      this.rails.setMatrixAt(index, marker.matrix);
    });
    this.rails.instanceMatrix.needsUpdate = true;

    this.featured.forEach((item, index) => {
      const housing = this.createHousing(item);
      const positions = [[1.55, 0.55, 0.15], [3.4, -1.1, -1.05], [-1.05, 1.55, -1.5]] as const;
      housing.position.fromArray(positions[index]);
      housing.rotation.y = index === 0 ? -0.12 : index === 1 ? 0.18 : -0.2;
      housing.scale.setScalar(index === 0 ? 1.18 : 0.88);
      this.housings.push(housing);
      this.root.add(housing);
    });
    this.root.add(this.rails, this.foreground.root);
  }

  private createHousing(item: CommerceCatalogItem) {
    const group = new THREE.Group();
    group.name = `CollectionHousing:${item.id}:${getCollectionHousingKind(item.category)}`;
    const shell = this.solid(metalMaterial(0x17252b, 0x0b252c));
    const accent = this.material(energyMaterial(RARITY_COLORS[item.rarity], item.rarity === "legendary" ? 0.5 : 0.34), item.rarity === "legendary" ? 0.5 : 0.34);
    if (item.category === "skins") {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.55, 0.38), shell);
      const display = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), accent);
      display.scale.set(0.74, 1.45, 0.45);
      display.position.z = 0.38;
      const crown = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.18), shell);
      crown.position.y = 1.38;
      group.add(frame, display, crown);
    } else if (item.category === "badges") {
      const medallion = new THREE.Mesh(new THREE.DodecahedronGeometry(0.86, 1), shell);
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 1), accent);
      const bracket = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.1, 6, 28, Math.PI * 1.55), shell);
      bracket.rotation.z = 0.72;
      group.add(medallion, core, bracket);
    } else {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.45, 0.7), shell);
      group.add(base);
      [-0.55, 0, 0.55].forEach((x, index) => {
        const cell = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.92 + index * 0.08, 0.42), index === 1 ? accent : shell);
        cell.position.set(x, 0, 0.52);
        group.add(cell);
      });
    }
    return group;
  }

  evaluate(snapshot: SceneEvaluationSnapshot) {
    this.resetPose();
    const dominant = snapshot.weight > 0.5;
    const compact = snapshot.quality === "low";
    this.root.position.set(compact ? -0.25 : 0.55, compact ? 0.45 : 0.15, 0);
    this.rails.position.x = (1 - snapshot.localProgress) * 0.45;
    this.rails.scale.y = 0.78 + snapshot.localProgress * 0.22;
    const visible = dominant ? (snapshot.quality === "low" ? 2 : this.housings.length) : 1;
    this.housings.forEach((housing, index) => {
      housing.visible = index < visible;
      housing.position.x = compact
        ? (index === 0 ? 0.72 : -1.2)
        : (index === 0 ? 1.55 : index === 1 ? 3.4 : -1.05);
      housing.position.y = compact
        ? (index === 0 ? 1.15 : 1.8)
        : (index === 0 ? 0.55 : index === 1 ? -1.1 : 1.55);
      const reveal = Math.min(1, Math.max(0, snapshot.localProgress * 1.5 - index * 0.16));
      const baseScale = index === 0 ? 1.18 : 0.88;
      housing.scale.setScalar(baseScale * (0.72 + reveal * 0.28));
      housing.position.z = (index === 0 ? 0.15 : index === 1 ? -1.05 : -1.5) - (1 - reveal) * 1.6;
      const baseRotation = index === 0 ? -0.12 : index === 1 ? 0.18 : -0.2;
      housing.rotation.y = baseRotation + (snapshot.reducedMotion ? 0 : Math.sin(snapshot.elapsedSeconds * 0.16 + index) * 0.025);
    });
    this.foreground.root.visible = snapshot.weight > 0.65;
    if (this.foreground.root.visible) this.foreground.evaluate(snapshot.localProgress, snapshot.quality, snapshot.reducedMotion);
  }
}
