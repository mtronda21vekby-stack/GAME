import * as THREE from "three";
import type { CrownAssetManifest } from "../CrownAssetManifest";

export type TransformSnapshot = {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
  visible: boolean;
};

export type GLBCrownBindings = {
  authoredRoot: THREE.Object3D;
  shell: THREE.Object3D;
  core: THREE.Object3D;
  portal: THREE.Object3D;
  rings: [THREE.Object3D, THREE.Object3D, THREE.Object3D];
  segments: THREE.Object3D[];
  spires: THREE.Object3D[];
  energyCyan?: THREE.Object3D;
  energyOrange?: THREE.Object3D;
  baseTransforms: Map<THREE.Object3D, TransformSnapshot>;
};

const REQUIRED_NAMES = [
  "BC_CROWN_ROOT",
  "BC_SHELL_ROOT",
  "BC_CORE_ROOT",
  "BC_PORTAL_ROOT",
  "BC_RING_INNER",
  "BC_RING_MIDDLE",
  "BC_RING_OUTER",
] as const;

function snapshot(object: THREE.Object3D): TransformSnapshot {
  return {
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
    visible: object.visible,
  };
}

export function bindGLBCrown(scene: THREE.Group, manifest: CrownAssetManifest): GLBCrownBindings {
  const byName = new Map<string, THREE.Object3D>();
  const duplicates = new Set<string>();
  scene.traverse((object) => {
    if (!object.name) return;
    if (byName.has(object.name)) duplicates.add(object.name);
    else byName.set(object.name, object);
  });
  if (duplicates.size) throw new Error(`binding_failed:duplicate:${[...duplicates].join(",")}`);
  for (const name of REQUIRED_NAMES) if (!byName.has(name)) throw new Error(`binding_failed:missing:${name}`);

  const authoredRoot = byName.get("BC_CROWN_ROOT")!;
  const shell = byName.get("BC_SHELL_ROOT")!;
  const segments = [...byName.entries()].filter(([name]) => /^BC_SEG_\d{2}$/u.test(name)).sort(([a], [b]) => a.localeCompare(b)).map(([, object]) => object);
  const spires = [...byName.entries()].filter(([name]) => /^BC_SPIRE_\d{2}$/u.test(name)).sort(([a], [b]) => a.localeCompare(b)).map(([, object]) => object);
  if (segments.length !== manifest.segmentCount) throw new Error(`binding_failed:segments:${segments.length}`);
  if (spires.length !== manifest.spires) throw new Error(`binding_failed:spires:${spires.length}`);

  const animated = [authoredRoot, shell, ...segments, ...spires,
    byName.get("BC_CORE_ROOT")!, byName.get("BC_PORTAL_ROOT")!,
    byName.get("BC_RING_INNER")!, byName.get("BC_RING_MIDDLE")!, byName.get("BC_RING_OUTER")!];
  return {
    authoredRoot,
    shell,
    core: byName.get("BC_CORE_ROOT")!,
    portal: byName.get("BC_PORTAL_ROOT")!,
    rings: [byName.get("BC_RING_INNER")!, byName.get("BC_RING_MIDDLE")!, byName.get("BC_RING_OUTER")!],
    segments,
    spires,
    energyCyan: byName.get("BC_ENERGY_CYAN"),
    energyOrange: byName.get("BC_ENERGY_ORANGE"),
    baseTransforms: new Map(animated.map((object) => [object, snapshot(object)])),
  };
}

export function restoreTransform(object: THREE.Object3D, transform: TransformSnapshot) {
  object.position.copy(transform.position);
  object.quaternion.copy(transform.quaternion);
  object.scale.copy(transform.scale);
  object.visible = transform.visible;
}
