import * as THREE from "three";
import { ORBIT_CARD_WIDTH } from "./spatialState";
import { OrganicStructure } from "./OrganicStructure";

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
  return new OrganicStructure(compact);
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
  uniform float uJourney;
  uniform float uDetail;
  attribute float aSeed;
  attribute float aKind;
  attribute vec3 aTint;
  varying vec3 vTint;
  varying float vSeed;
  varying float vOpacity;
  void main() {
    vec3 p = position;
    if(aKind < .5) {
      float angle=position.z+uTime*.075+position.y*.33;
      float radius=position.x+sin(position.y*.8+uTime*.15)*.23;
      p=vec3(cos(angle)*radius,position.y,sin(angle)*radius*.8-1.2);
      p.x += sin(position.y*.65)*.3 + (1.-uJourney)*2.2;
      p.y += sin(uTime*.17+aSeed*14.)*.3;
      p.xz *= 1.+uDetail*.26;
    } else {
      p.x += sin(uTime*.09+aSeed*6.28)*.6;
      p.y += cos(uTime*.1+aSeed*14.)*.4;
    }
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp((aKind<.5?12.+aSeed*66.:7.+aSeed*22.) * uDpr / max(1., -mv.z), 1., 12.);
    vTint = aTint;
    vSeed = aSeed;
    vOpacity = mix(.3, 1., uJourney);
  }
`;
const particleFragment = `
  varying vec3 vTint;
  varying float vSeed;
  varying float vOpacity;
  void main() {
    vec2 q=gl_PointCoord-.5;
    float a=vSeed*6.28;
    q=mat2(cos(a),-sin(a),sin(a),cos(a))*q;
    float edge=max(abs(q.x)*.85+abs(q.y)*.55,abs(q.y)*.95+abs(q.x)*.3);
    if(edge>.46) discard;
    float alpha=(1.-smoothstep(.31,.46,edge))*(.28+vSeed*.4)*vOpacity;
    gl_FragColor=vec4(vTint*(.55+q.y*.6),alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createParticles(compact: boolean) {
  const count = compact ? 750 : 1800;
  const positions: number[] = [], seeds: number[] = [], colors: number[] = [], kinds: number[] = [];
  // Stable sequence keeps the scene reproducible across resize and fallback checks.
  const random = (index: number) => { const value = Math.sin(index * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); };
  for (let index = 0; index < count; index++) {
    const ambient = index % 5 === 0;
    if (ambient) positions.push((random(index * 4) - .5) * 26, (random(index * 4 + 1) - .5) * 24, (random(index * 4 + 2) - .5) * 20);
    else positions.push(.8 + Math.pow(random(index * 4),1.6) * 3.4, (random(index * 4 + 1) - .5) * 19, random(index * 4 + 2) * Math.PI * 2);
    kinds.push(ambient ? 1 : 0);
    seeds.push(random(index * 4 + 3));
    const tint = new THREE.Color(index % 17 === 0 ? 0xb28b77 : index % 4 === 0 ? 0x8784b8 : index % 3 === 0 ? 0x81becb : 0xb6d2d9);
    colors.push(tint.r, tint.g, tint.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(seeds, 1));
  geometry.setAttribute("aTint", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute("aKind", new THREE.Float32BufferAttribute(kinds, 1));
  const material = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uDpr: { value: 1 }, uJourney: { value: 0 }, uDetail: { value: 0 } }, vertexShader: particleVertex, fragmentShader: particleFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

export function createOrbitCard() {
  const group = new THREE.Group();
  const material = new THREE.MeshPhysicalMaterial({ color: 0x466a73, metalness: 0.75, roughness: 0.3, clearcoat: 0.8, transparent: true, opacity: 0.16, depthWrite: false });
  const backing = new THREE.Mesh(new THREE.BoxGeometry(ORBIT_CARD_WIDTH, 1, 0.045), material);
  group.add(backing);
  return { group, backing, focus: 0 };
}
