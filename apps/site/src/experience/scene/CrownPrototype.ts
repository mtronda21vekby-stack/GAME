import * as THREE from "three";
import type { CrownVisual, CrownVisualState } from "../assets/CrownAssetAdapter";
import { clamp, smoothstep, smootherstep } from "../core/math";
import { disposeObject3D } from "../core/Lifecycle";
import { createCrownCore } from "./CrownCore";
import { createEnergyRings } from "./EnergyRings";
import { createCrownMaterials } from "./CrownMaterials";

type CrownSegment = {
  group: THREE.Group;
  assembled: THREE.Vector3;
  scattered: THREE.Vector3;
  baseRotation: THREE.Euler;
  scatterRotation: THREE.Euler;
  delay: number;
  normalized: number;
};

const CYAN = new THREE.Color(0x27c7df);
const ORANGE = new THREE.Color(0xff7336);

function createChamferedPanelGeometry(width: number, height: number, depth: number) {
  const polygon = [
    [-width * 0.5, -0.64], [width * 0.5, -0.64], [width * 0.46, 0.12],
    [width * 0.2, height - 0.24], [0, height], [-width * 0.2, height - 0.24], [-width * 0.46, 0.12],
  ] as const;
  const layers = [
    { z: -depth * 0.5, scale: 0.9 },
    { z: -depth * 0.34, scale: 1 },
    { z: depth * 0.34, scale: 1 },
    { z: depth * 0.5, scale: 0.9 },
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  for (const layer of layers) {
    for (const [x, y] of polygon) positions.push(x * layer.scale, y * layer.scale, layer.z);
  }
  const count = polygon.length;
  for (let layer = 0; layer < layers.length - 1; layer += 1) {
    for (let point = 0; point < count; point += 1) {
      const next = (point + 1) % count;
      const a = layer * count + point;
      const b = layer * count + next;
      const c = (layer + 1) * count + next;
      const d = (layer + 1) * count + point;
      indices.push(a, b, c, a, c, d);
    }
  }
  const backCenter = positions.length / 3;
  positions.push(0, height * 0.24, -depth * 0.5);
  const frontCenter = positions.length / 3;
  positions.push(0, height * 0.24, depth * 0.5);
  const frontOffset = (layers.length - 1) * count;
  for (let point = 0; point < count; point += 1) {
    const next = (point + 1) % count;
    indices.push(backCenter, next, point);
    indices.push(frontCenter, frontOffset + point, frontOffset + next);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createArcBandGeometry(depth: number, thickness = 0.34, width = 2.18, segments = 24) {
  const positions: number[] = [];
  const pushQuad = (a: readonly number[], b: readonly number[], c: readonly number[], d: readonly number[]) => {
    positions.push(...a, ...b, ...c, ...a, ...c, ...d);
  };
  const point = (index: number, inner: boolean, z: number) => {
    const amount = index / segments;
    const x = (amount * 2 - 1) * width;
    const curve = 1 - Math.pow(x / width, 2);
    const outerY = -0.92 - curve * 0.34;
    return [x, outerY + (inner ? thickness : 0), z] as const;
  };
  for (let index = 0; index < segments; index += 1) {
    const front = depth * 0.5;
    const back = -front;
    const outerA = point(index, false, front);
    const outerB = point(index + 1, false, front);
    const innerA = point(index, true, front);
    const innerB = point(index + 1, true, front);
    pushQuad(outerA, outerB, innerB, innerA);
    pushQuad(point(index, false, back), point(index, true, back), point(index + 1, true, back), point(index + 1, false, back));
    pushQuad(point(index, false, back), point(index + 1, false, back), outerB, outerA);
    pushQuad(point(index, true, front), innerB, point(index + 1, true, back), point(index, true, back));
  }
  pushQuad(point(0, false, -depth * 0.5), point(0, false, depth * 0.5), point(0, true, depth * 0.5), point(0, true, -depth * 0.5));
  pushQuad(point(segments, false, depth * 0.5), point(segments, false, -depth * 0.5), point(segments, true, -depth * 0.5), point(segments, true, depth * 0.5));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export class CrownPrototype implements CrownVisual {
  readonly root = new THREE.Group();
  readonly shell = new THREE.Group();
  readonly core: THREE.Group;
  readonly rings: THREE.Object3D[];
  private readonly segments: CrownSegment[] = [];
  private readonly coreMaterial: THREE.MeshStandardMaterial;
  private readonly coreEnergyMaterial: THREE.MeshBasicMaterial;
  private readonly coreContainment: THREE.Mesh;
  private readonly coreEnergyVolume: THREE.Mesh;
  private readonly coreNucleus: THREE.Mesh;
  private readonly coreCage: THREE.Mesh;
  private readonly coreLight: THREE.PointLight;
  private readonly energyMaterial: THREE.MeshStandardMaterial;
  private readonly aperture = new THREE.Group();
  private readonly band: THREE.Mesh;
  private readonly innerBand: THREE.Mesh;
  private assemblyProgress = 0;
  private openProgress = 0;
  private coreIntensity = 0;
  private portalProgress = 0;

  constructor(radialSegments = 42) {
    this.root.name = "ProceduralDigitalCrown";
    this.shell.name = "CrownShell";
    const materials = createCrownMaterials(radialSegments >= 56);
    this.energyMaterial = materials.energy;

    const heights = [0.84, 1.14, 1.42, 1.62, 2.18, 1.52, 1.34, 1.2, 0.9];
    const segmentCount = heights.length;
    for (let index = 0; index < segmentCount; index += 1) {
      const normalized = (index - (segmentCount - 1) / 2) / ((segmentCount - 1) / 2);
      const centerBias = 1 - Math.abs(normalized);
      const group = new THREE.Group();
      group.name = `CrownSegment_${String(index).padStart(2, "0")}`;
      const width = index === 4 ? 0.58 : 0.48 + centerBias * 0.025;
      const panelGeometry = createChamferedPanelGeometry(width, heights[index], 0.3);
      const panel = new THREE.Mesh(panelGeometry, materials.shell);
      panel.castShadow = false;
      panel.receiveShadow = false;

      const innerPlate = new THREE.Mesh(panelGeometry.clone(), materials.inner);
      innerPlate.scale.set(0.82, 0.84, 0.72);
      innerPlate.position.z = -0.16;

      const channelHeight = 0.58 + centerBias * 0.42;
      const channel = new THREE.Mesh(new THREE.BoxGeometry(0.026, channelHeight, 0.02), materials.energy);
      channel.position.set(index % 2 ? 0.09 : -0.09, -0.36 + channelHeight * 0.34, 0.185);
      group.add(innerPlate, panel, channel);

      const assembled = new THREE.Vector3(normalized * 2.16, Math.abs(normalized) * 0.08, -Math.abs(normalized) * 0.08);
      const side = normalized === 0 ? 1 : Math.sign(normalized);
      const scattered = assembled.clone().add(new THREE.Vector3(side * (1.7 + Math.abs(normalized) * 1.2), (index % 2 ? 0.7 : -0.55), -2.4 - Math.abs(normalized) * 1.8));
      const baseRotation = new THREE.Euler(0, normalized * -0.1, normalized * -0.045);
      const scatterRotation = new THREE.Euler((index % 2 ? 1 : -1) * 0.18, normalized * 0.42, side * 0.24);
      group.position.copy(scattered);
      group.rotation.copy(scatterRotation);
      this.shell.add(group);
      this.segments.push({
        group,
        assembled,
        scattered,
        baseRotation,
        scatterRotation,
        normalized,
        delay: Math.abs(normalized) * 0.12 + (index % 2) * 0.018,
      });
    }

    this.band = new THREE.Mesh(createArcBandGeometry(0.42), materials.containment);
    this.band.position.z = -0.03;
    this.innerBand = new THREE.Mesh(createArcBandGeometry(0.24), materials.inner);
    this.innerBand.scale.set(0.91, 0.88, 0.9);
    this.innerBand.position.z = -0.24;
    const energyArc = new THREE.Mesh(createArcBandGeometry(0.016, 0.018, 2, Math.max(16, radialSegments / 2)), materials.energy);
    energyArc.position.set(0, 0.3, 0.22);
    this.shell.add(this.innerBand, this.band, energyArc);

    const coreVisual = createCrownCore(radialSegments);
    this.core = coreVisual.group;
    this.core.position.set(0, -0.12, -0.3);
    this.coreMaterial = coreVisual.coreMaterial;
    this.coreEnergyMaterial = coreVisual.energyMaterial;
    this.coreContainment = coreVisual.containment;
    this.coreEnergyVolume = coreVisual.energyVolume;
    this.coreNucleus = coreVisual.nucleus;
    this.coreCage = coreVisual.cage;
    this.coreLight = coreVisual.coreLight;

    const energyRings = createEnergyRings(radialSegments);
    energyRings.group.position.set(0, -0.12, -0.56);
    this.rings = energyRings.rings;

    for (let index = 0; index < 3; index += 1) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.54 + index * 0.18, 0.012, 6, radialSegments),
        new THREE.MeshBasicMaterial({
          color: index === 2 ? 0xff7336 : 0x58d9e8,
          transparent: true,
          opacity: 0.18 - index * 0.035,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      ring.position.z = -0.7 - index * 0.32;
      this.aperture.add(ring);
    }
    this.aperture.position.y = -0.12;
    this.aperture.scale.setScalar(0.001);

    this.root.add(this.shell, this.core, energyRings.group, this.aperture);
  }

  setAssemblyProgress(value: number) { this.assemblyProgress = clamp(value); }
  setOpenProgress(value: number) { this.openProgress = clamp(value); }
  setCoreIntensity(value: number) { this.coreIntensity = Math.max(0, value); }
  setPortalProgress(value: number) { this.portalProgress = clamp(value); }

  update(_deltaTime: number, state: CrownVisualState) {
    const assemblySignal = state.reducedMotion ? 1 : 0.36 + this.assemblyProgress * 0.64;
    for (const segment of this.segments) {
      const local = smootherstep(clamp((assemblySignal - segment.delay) / 0.64));
      segment.group.position.lerpVectors(segment.scattered, segment.assembled, local);
      segment.group.rotation.set(
        segment.scatterRotation.x + (segment.baseRotation.x - segment.scatterRotation.x) * local,
        segment.scatterRotation.y + (segment.baseRotation.y - segment.scatterRotation.y) * local,
        segment.scatterRotation.z + (segment.baseRotation.z - segment.scatterRotation.z) * local,
      );

      const side = segment.normalized === 0 ? 0 : Math.sign(segment.normalized);
      const centerLift = 1 - Math.min(1, Math.abs(segment.normalized) * 2.4);
      segment.group.position.x += side * this.openProgress * (0.3 + Math.abs(segment.normalized) * 0.38);
      segment.group.position.y += centerLift * this.openProgress * 0.92 + this.openProgress * 0.08;
      segment.group.position.z -= this.openProgress * (0.34 + centerLift * 0.28);
      segment.group.rotation.y += side * this.openProgress * 0.24;
      segment.group.rotation.x -= centerLift * this.openProgress * 0.12;
    }

    const idle = state.reducedMotion ? 0 : Math.sin(state.elapsedSeconds * 0.3) * 0.018 * state.idleAmount;
    this.root.rotation.y = -0.07 + state.inspection * 0.13 - state.portal * 0.06 + idle;
    this.root.rotation.x = -0.025 + state.open * 0.025;
    this.root.rotation.z = state.reducedMotion ? 0 : Math.sin(state.elapsedSeconds * 0.18) * 0.006;

    if (!state.reducedMotion) {
      this.coreContainment.rotation.y = state.elapsedSeconds * 0.08;
      this.coreCage.rotation.set(state.elapsedSeconds * -0.09, state.elapsedSeconds * 0.13, state.elapsedSeconds * 0.07);
      this.coreEnergyVolume.rotation.set(state.elapsedSeconds * 0.14, state.elapsedSeconds * -0.19, 0);
      this.coreNucleus.rotation.set(state.elapsedSeconds * -0.24, state.elapsedSeconds * 0.28, state.elapsedSeconds * 0.16);
    }
    const coreScale = 0.72 + this.coreIntensity * 0.16;
    this.core.scale.setScalar(coreScale);
    this.coreMaterial.emissiveIntensity = 0.12 + this.coreIntensity * 0.28;
    this.coreEnergyMaterial.opacity = Math.min(0.28, 0.08 + this.coreIntensity * 0.1);
    (this.coreNucleus.material as THREE.MeshBasicMaterial).opacity = Math.min(1, 0.56 + this.coreIntensity * 0.25);
    this.coreLight.intensity = 0.35 + this.coreIntensity * 2.2;
    this.energyMaterial.emissive.lerpColors(CYAN, ORANGE, state.tacticalOrange * 0.62);
    this.energyMaterial.emissiveIntensity = 0.42 + this.coreIntensity * 0.2;

    this.rings.forEach((ring, index) => {
      if (!state.reducedMotion) ring.rotation.z = state.elapsedSeconds * (index % 2 ? -0.045 : 0.035) + index * 0.62;
      ring.scale.setScalar(0.92 + this.openProgress * (0.12 + index * 0.04));
      const material = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.opacity = 0.1 + this.coreIntensity * 0.045 + this.openProgress * 0.05;
    });

    this.band.position.z = -0.03 - this.openProgress * 0.2;
    this.innerBand.position.z = -0.24 - this.openProgress * 0.12;
    this.aperture.scale.setScalar(Math.max(0.001, this.portalProgress * (0.72 + state.enter * 0.36)));
    this.aperture.rotation.z = state.reducedMotion ? 0 : state.elapsedSeconds * 0.045;
  }

  dispose() { disposeObject3D(this.root); }
}
