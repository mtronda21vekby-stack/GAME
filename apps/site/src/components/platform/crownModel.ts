import { Mesh, MeshStandardMaterial, Texture } from "three";
import type { Material, Object3D, Skeleton, SkinnedMesh } from "three";

/** Model-owned resources, shared by the compact crown and the full spatial scene. */
export function disposeModel(root: Object3D) {
  const geometries = new Set<Mesh["geometry"]>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  const skeletons = new Set<Skeleton>();
  root.traverse(object => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    geometries.add(mesh.geometry);
    const skinned = mesh as SkinnedMesh;
    if (skinned.isSkinnedMesh) skeletons.add(skinned.skeleton);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const skeleton of skeletons) skeleton.dispose();
  for (const texture of textures) {
    texture.dispose();
    const image = texture.source?.data as { close?: () => void } | undefined;
    image?.close?.();
  }
}

export function finishMetal(root: Object3D) {
  const visited = new Set<Material>();
  root.traverse(object => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    for (const source of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (!(source instanceof MeshStandardMaterial) || visited.has(source)) continue;
      visited.add(source);
      source.envMapIntensity = 1.1;
      if (source.name.includes("SHELL_TITANIUM")) {
        source.color.set(0xd5dee2);
        source.metalness = 0.78;
        source.roughness = 0.34;
      } else if (source.name.includes("INNER_GUNMETAL")) {
        source.color.set(0x253038);
        source.metalness = 0.72;
        source.roughness = 0.4;
      } else if (source.name.includes("ENERGY") || source.name.includes("PORTAL")) {
        source.color.set(0x13353e);
        source.emissive.set(0x4fbed0);
        source.emissiveIntensity = source.name.includes("CORE") ? 0.34 : 0.12;
        source.metalness = 0.38;
        source.roughness = 0.36;
      }
      source.needsUpdate = true;
    }
  });
}
