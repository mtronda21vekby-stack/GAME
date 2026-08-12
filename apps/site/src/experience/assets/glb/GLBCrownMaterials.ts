import * as THREE from "three";
import type { QualityTier } from "../../types";

const ALLOWED_MATERIALS = new Set([
  "BC_MAT_SHELL_TITANIUM",
  "BC_MAT_INNER_GUNMETAL",
  "BC_MAT_CARBON",
  "BC_MAT_CORE_GLASS",
  "BC_MAT_CORE_ENERGY",
  "BC_MAT_ENERGY_CYAN",
  "BC_MAT_ENERGY_ORANGE",
  "BC_MAT_PORTAL",
]);

export type GLBCrownMaterialBindings = {
  materials: THREE.Material[];
  textures: THREE.Texture[];
  cyan: THREE.MeshStandardMaterial[];
  orange: THREE.MeshStandardMaterial[];
  coreEnergy: THREE.MeshStandardMaterial[];
  portal: THREE.MeshStandardMaterial[];
  estimatedTextureMemory: number;
  transparentMaterials: number;
  transmissionMaterials: number;
  substitutions: string[];
  dispose: () => void;
};

function setTexturePolicy(texture: THREE.Texture, colorSpace: THREE.ColorSpace, anisotropy: number) {
  texture.colorSpace = colorSpace;
  texture.anisotropy = Math.min(anisotropy, 8);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
}

function copyMaps(source: THREE.Material, target: THREE.MeshStandardMaterial, anisotropy: number, textures: Set<THREE.Texture>) {
  const material = source as THREE.MeshStandardMaterial;
  for (const [key, colorSpace] of [
    ["map", THREE.SRGBColorSpace], ["emissiveMap", THREE.SRGBColorSpace],
    ["normalMap", THREE.NoColorSpace], ["roughnessMap", THREE.NoColorSpace],
    ["metalnessMap", THREE.NoColorSpace], ["aoMap", THREE.NoColorSpace],
  ] as const) {
    const texture = material[key];
    if (!texture) continue;
    target[key] = texture;
    setTexturePolicy(texture, colorSpace, anisotropy);
    textures.add(texture);
  }
}

function estimateTextureMemory(textures: Iterable<THREE.Texture>) {
  let bytes = 0;
  for (const texture of textures) {
    const image = texture.image as { width?: number; height?: number } | undefined;
    if (image?.width && image.height) bytes += Math.ceil(image.width * image.height * 4 * 4 / 3);
  }
  return bytes;
}

function createMappedMaterial(source: THREE.Material, quality: QualityTier, anisotropy: number, textures: Set<THREE.Texture>) {
  if (!ALLOWED_MATERIALS.has(source.name)) throw new Error(`binding_failed:material:${source.name || "unnamed"}`);
  const physicalShell = quality === "high" && source.name === "BC_MAT_SHELL_TITANIUM";
  const target = physicalShell ? new THREE.MeshPhysicalMaterial() : new THREE.MeshStandardMaterial();
  target.name = source.name;
  target.side = THREE.FrontSide;
  target.depthWrite = true;
  target.color.set((source as THREE.MeshStandardMaterial).map ? 0xffffff : 0x25313d);
  target.metalness = 0.54;
  target.roughness = 0.4;
  if (source.name === "BC_MAT_SHELL_TITANIUM") {
    target.emissive.set(0x0b1820);
    target.emissiveIntensity = 0.5;
  }
  if (source.name === "BC_MAT_INNER_GUNMETAL" || source.name === "BC_MAT_CARBON") {
    target.color.set(source.name === "BC_MAT_CARBON"
      ? (source as THREE.MeshStandardMaterial).map ? 0xffffff : 0x0b1016
      : 0x26323e);
    target.metalness = source.name === "BC_MAT_CARBON" ? 0.25 : 0.46;
    target.roughness = source.name === "BC_MAT_CARBON" ? 0.7 : 0.52;
  }
  if (physicalShell && target instanceof THREE.MeshPhysicalMaterial) {
    target.clearcoat = 0.2;
    target.clearcoatRoughness = 0.38;
  }
  if (source.name === "BC_MAT_CORE_GLASS") {
    target.color.set(0x183044);
    target.metalness = 0.08;
    target.roughness = 0.18;
    target.transparent = true;
    target.opacity = quality === "low" ? 0.42 : 0.3;
    target.depthWrite = false;
  }
  if (source.name === "BC_MAT_CORE_ENERGY" || source.name === "BC_MAT_ENERGY_CYAN" || source.name === "BC_MAT_ENERGY_ORANGE" || source.name === "BC_MAT_PORTAL") {
    const orange = source.name === "BC_MAT_ENERGY_ORANGE" || source.name === "BC_MAT_PORTAL";
    target.color.set(orange ? 0x7a2410 : 0x123b48);
    target.emissive.set(orange ? 0xff5f21 : 0x26c9e4);
    target.emissiveIntensity = source.name === "BC_MAT_CORE_ENERGY" ? 1.15 : 0.48;
    target.metalness = 0.16;
    target.roughness = 0.38;
    target.transparent = true;
    target.opacity = source.name === "BC_MAT_PORTAL" ? 0.54 : 0.86;
    target.depthWrite = false;
  }
  copyMaps(source, target, anisotropy, textures);
  return target;
}

export function applyGLBCrownMaterials(scene: THREE.Group, quality: QualityTier, renderer: THREE.WebGLRenderer): GLBCrownMaterialBindings {
  const materialMap = new Map<THREE.Material, THREE.MeshStandardMaterial>();
  const textures = new Set<THREE.Texture>();
  const maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), quality === "high" ? 8 : quality === "medium" ? 4 : 2);
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    const sourceMaterials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const mapped = sourceMaterials.map((source) => {
      let target = materialMap.get(source);
      if (!target) {
        target = createMappedMaterial(source, quality, maxAnisotropy, textures);
        materialMap.set(source, target);
      }
      return target;
    });
    mesh.material = Array.isArray(mesh.material) ? mapped : mapped[0];
    mesh.castShadow = false;
    mesh.receiveShadow = false;
  });
  const materials = [...materialMap.values()];
  const byName = (name: string) => materials.filter((material) => material.name === name);
  const transmissionMaterials = materials.filter((material) => material instanceof THREE.MeshPhysicalMaterial && material.transmission > 0).length;
  return {
    materials,
    textures: [...textures],
    cyan: byName("BC_MAT_ENERGY_CYAN"),
    orange: byName("BC_MAT_ENERGY_ORANGE"),
    coreEnergy: byName("BC_MAT_CORE_ENERGY"),
    portal: byName("BC_MAT_PORTAL"),
    estimatedTextureMemory: estimateTextureMemory(textures),
    transparentMaterials: materials.filter((material) => material.transparent).length,
    transmissionMaterials,
    substitutions: quality === "high" ? ["controlled_clearcoat", "standard_core_glass"] : quality === "medium" ? ["standard_core_glass"] : ["no_transmission", "low_anisotropy"],
    dispose: () => { for (const material of materials) material.dispose(); },
  };
}
