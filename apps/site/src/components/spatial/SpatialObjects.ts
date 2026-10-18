import * as THREE from "three";
import { CanvasTexture } from "three/src/textures/CanvasTexture.js";
import { ORBIT_CARD_HEIGHT, ORBIT_CARD_WIDTH } from "./spatialState";

/** Two original swept metal ribbons; no external textures or copied reference assets. */
export function createRibbons() {
  const group = new THREE.Group();
  const material = new THREE.MeshPhysicalMaterial({ color: 0xabbfc1, metalness: 0.95, roughness: 0.24, iridescence: 0.85, iridescenceIOR: 1.45, iridescenceThicknessRange: [140, 430], side: THREE.DoubleSide });
  for (let ribbon = 0; ribbon < 2; ribbon++) {
    const positions: number[] = [], indices: number[] = [];
    const steps = 120;
    for (let step = 0; step <= steps; step++) {
      const t = step / steps;
      const theta = t * Math.PI * 2 + ribbon * Math.PI;
      for (const side of [-1, 1]) {
        const radius = 2.1 + side * 0.065;
        positions.push(Math.sin(theta) * radius, (t - 0.5) * 8, Math.cos(theta) * 1.05 + side * 0.04 * Math.sin(theta * 3));
      }
      if (step < steps) { const a = step * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    group.add(new THREE.Mesh(geometry, material));
  }
  return group;
}

export function createSpine(compact: boolean) {
  const material = new THREE.MeshPhysicalMaterial({ color: 0x718e9b, metalness: 0.82, roughness: 0.19, iridescence: 1, iridescenceIOR: 1.4, iridescenceThicknessRange: [180, 470], clearcoat: 1, clearcoatRoughness: 0.18 });
  const count = compact ? 52 : 96;
  const mesh = new THREE.InstancedMesh(new THREE.TorusGeometry(0.65, 0.17, 6, compact ? 14 : 20), material, count);
  const dummy = new THREE.Object3D();
  for (let index = 0; index < count; index++) {
    const t = index / (count - 1), angle = t * Math.PI * 9;
    dummy.position.set(Math.sin(angle) * 0.22, (t - 0.5) * 15, Math.cos(angle) * 0.16);
    dummy.rotation.set(Math.PI / 2 + Math.sin(angle) * 0.25, Math.cos(angle) * 0.3, angle);
    dummy.scale.set(1 + Math.sin(angle * 2) * 0.32, 0.75, 0.42);
    dummy.updateMatrix(); mesh.setMatrixAt(index, dummy.matrix);
  }
  mesh.frustumCulled = false;
  return mesh;
}

export function createWave(compact: boolean) {
  const columns = compact ? 18 : 28, rows = compact ? 20 : 30;
  const material = new THREE.MeshPhysicalMaterial({ color: 0x8eaaa9, metalness: 0.95, roughness: 0.26, iridescence: 0.7, iridescenceThicknessRange: [100, 390] });
  const mesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.105, 0.105, 0.045, 6), material, columns * rows);
  mesh.frustumCulled = false;
  return { mesh, columns, rows };
}

const particleVertex = `
  uniform float uTime;
  uniform float uDpr;
  uniform float uSpread;
  attribute float aSeed;
  attribute vec3 aTint;
  varying vec3 vTint;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * .13 + aSeed * 6.28) * .5;
    p.y += sin(uTime * .17 + aSeed * 14.) * .6;
    p.xy *= 1. + uSpread * .35;
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp((28. + aSeed * 54.) * uDpr / max(1., -mv.z), 1., 12.);
    vTint = aTint;
  }
`;
const particleFragment = `
  varying vec3 vTint;
  void main() {
    float r = length(gl_PointCoord - .5) * 2.;
    if (r > 1.) discard;
    float alpha = pow(1. - r, 1.7) * .65;
    gl_FragColor = vec4(vTint, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createParticles(compact: boolean) {
  const count = compact ? 100 : 280;
  const positions: number[] = [], seeds: number[] = [], colors: number[] = [];
  // Stable sequence keeps the scene reproducible across resize and fallback checks.
  const random = (index: number) => { const value = Math.sin(index * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); };
  for (let index = 0; index < count; index++) {
    positions.push((random(index * 4) - 0.5) * 22, (random(index * 4 + 1) - 0.5) * 22, (random(index * 4 + 2) - 0.5) * 14);
    seeds.push(random(index * 4 + 3));
    const tint = new THREE.Color(index % 6 === 0 ? 0xc76c39 : index % 3 === 0 ? 0x7474a6 : 0x79bfc0);
    colors.push(tint.r, tint.g, tint.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
  geometry.setAttribute("aTint", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uDpr: { value: 1 }, uSpread: { value: 0 } }, vertexShader: particleVertex, fragmentShader: particleFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

export function createOrbitCard(title: string, index: number) {
  const group = new THREE.Group();
  const frameMaterial = new THREE.MeshPhysicalMaterial({ color: 0x5c7983, metalness: 0.84, roughness: 0.22, clearcoat: 0.8 });
  group.add(new THREE.Mesh(new THREE.BoxGeometry(ORBIT_CARD_WIDTH + 0.08, ORBIT_CARD_HEIGHT + 0.08, 0.055), frameMaterial));
  const artwork = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const image = new THREE.Mesh(new THREE.PlaneGeometry(ORBIT_CARD_WIDTH, ORBIT_CARD_HEIGHT), artwork);
  image.position.z = 0.032; group.add(image);
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 128;
  const context = canvas.getContext("2d");
  if (context) {
    const shade = context.createLinearGradient(0, 0, 0, 128);
    shade.addColorStop(0, "rgba(3,9,14,0)"); shade.addColorStop(1, "rgba(3,9,14,.96)");
    context.fillStyle = shade; context.fillRect(0, 0, 1024, 128);
    context.fillStyle = "#edf2f1"; context.font = "400 28px monospace";
    context.fillText(`${String(index + 1).padStart(2, "0")} / ${title.toUpperCase()}`, 32, 91);
    const texture = new CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Mesh(new THREE.PlaneGeometry(ORBIT_CARD_WIDTH, ORBIT_CARD_WIDTH / 8), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }));
    label.position.set(0, -(ORBIT_CARD_HEIGHT - ORBIT_CARD_WIDTH / 8) / 2, 0.038); group.add(label);
  }
  return { group, artwork, image };
}
