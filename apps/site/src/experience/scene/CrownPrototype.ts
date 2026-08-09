import * as THREE from "three";
import type { CrownVisual, CrownVisualState } from "../assets/CrownAssetAdapter";
import { clamp, smoothstep } from "../core/math";
import { disposeObject3D } from "../core/Lifecycle";
import { createCrownCore } from "./CrownCore";
import { createEnergyRings } from "./EnergyRings";

type CrownSegment = {
  group: THREE.Group;
  assembled: THREE.Vector3;
  scattered: THREE.Vector3;
  radial: THREE.Vector3;
  baseRotation: THREE.Euler;
  delay: number;
};

export class CrownPrototype implements CrownVisual {
  readonly root = new THREE.Group();
  readonly shell = new THREE.Group();
  readonly core: THREE.Group;
  readonly rings: THREE.Object3D[];
  private readonly segments: CrownSegment[] = [];
  private readonly coreMaterial: THREE.MeshStandardMaterial;
  private readonly coreEnergyMaterial: THREE.MeshBasicMaterial;
  private readonly portal = new THREE.Group();
  private assemblyProgress = 0;
  private openProgress = 0;
  private coreIntensity = 0;
  private portalProgress = 0;

  constructor(radialSegments = 42) {
    this.root.name = "ProceduralDigitalCrown";
    this.shell.name = "CrownShell";

    const titanium = new THREE.MeshStandardMaterial({ color: 0x080d12, metalness: 0.9, roughness: 0.25 });
    const edge = new THREE.MeshStandardMaterial({
      color: 0x10212b,
      emissive: 0x1ba9c7,
      emissiveIntensity: 0.3,
      metalness: 0.75,
      roughness: 0.22,
    });
    const segmentGeometry = new THREE.BoxGeometry(0.42, 0.72, 0.3, 1, 1, 1);
    const spireGeometry = new THREE.ConeGeometry(0.2, 1.24, 4, 1, false, Math.PI / 4);
    const segmentCount = 10;

    for (let index = 0; index < segmentCount; index += 1) {
      const offset = index - (segmentCount - 1) / 2;
      const normalized = offset / ((segmentCount - 1) / 2);
      const group = new THREE.Group();
      const base = new THREE.Mesh(segmentGeometry.clone(), titanium.clone());
      const spire = new THREE.Mesh(spireGeometry.clone(), titanium.clone());
      const channel = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.62, 0.025), edge.clone());
      base.scale.set(0.86, 1 + (1 - Math.abs(normalized)) * 0.28, 0.82);
      spire.position.y = 0.94 + (1 - Math.abs(normalized)) * 0.48 + (index % 2) * 0.12;
      spire.scale.y = 0.74 + (1 - Math.abs(normalized)) * 0.5;
      channel.position.set(index % 2 ? 0.11 : -0.11, 0.02, 0.135);
      group.add(base, spire, channel);

      const assembled = new THREE.Vector3(normalized * 2.05, -0.03 + (1 - Math.abs(normalized)) * 0.18, Math.abs(normalized) * -0.18);
      const radial = new THREE.Vector3(normalized || (index % 2 ? 1 : -1), 0.2, 0.08).normalize();
      const scattered = assembled.clone().add(new THREE.Vector3(normalized * 4.8, (index % 2 ? 1 : -1) * (1.6 + index * 0.04), (index % 3 - 1) * 3.4));
      const baseRotation = new THREE.Euler(0, normalized * 0.12, normalized * -0.2);
      group.position.copy(scattered);
      group.rotation.copy(baseRotation);
      this.shell.add(group);
      this.segments.push({ group, assembled, scattered, radial, baseRotation, delay: index / (segmentCount * 2.6) });
    }

    const baseRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.75, 0.13, 10, radialSegments),
      new THREE.MeshStandardMaterial({ color: 0x05090d, metalness: 0.92, roughness: 0.2 }),
    );
    baseRing.scale.y = 0.52;
    baseRing.position.y = -0.38;
    this.shell.add(baseRing);

    const baseChannel = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.025, 8, radialSegments),
      new THREE.MeshBasicMaterial({ color: 0x55e5ff, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending }),
    );
    baseChannel.scale.y = 0.48;
    baseChannel.position.y = -0.38;
    this.shell.add(baseChannel);

    const coreVisual = createCrownCore(radialSegments);
    this.core = coreVisual.group;
    this.core.position.y = 0.48;
    this.coreMaterial = coreVisual.coreMaterial;
    this.coreEnergyMaterial = coreVisual.energyMaterial;

    const energyRings = createEnergyRings(radialSegments);
    energyRings.group.position.y = 0.48;
    this.rings = energyRings.rings;

    for (let index = 0; index < 4; index += 1) {
      const portalRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.72 + index * 0.22, 0.02, 8, radialSegments),
        new THREE.MeshBasicMaterial({
          color: index % 2 ? 0xff7834 : 0x75eaff,
          transparent: true,
          opacity: 0.38 - index * 0.05,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      portalRing.position.z = -0.18 - index * 0.32;
      this.portal.add(portalRing);
    }
    this.portal.position.y = 0.48;
    this.portal.scale.setScalar(0.001);

    this.root.add(this.shell, this.core, energyRings.group, this.portal);
    this.root.position.y = -0.15;
  }

  setAssemblyProgress(value: number) { this.assemblyProgress = clamp(value); }
  setOpenProgress(value: number) { this.openProgress = clamp(value); }
  setCoreIntensity(value: number) { this.coreIntensity = Math.max(0, value); }
  setPortalProgress(value: number) { this.portalProgress = clamp(value); }

  update(_deltaTime: number, state: CrownVisualState) {
    for (const segment of this.segments) {
      const local = smoothstep(clamp((this.assemblyProgress - segment.delay) / 0.62));
      segment.group.position.lerpVectors(segment.scattered, segment.assembled, local);
      segment.group.position.addScaledVector(segment.radial, this.openProgress * 0.76);
      segment.group.position.y += this.openProgress * 0.16;
      segment.group.rotation.copy(segment.baseRotation);
      segment.group.rotation.z += (1 - local) * 0.42 * (segment.delay > 0.18 ? 1 : -1);
    }

    const idle = state.reducedMotion ? 0 : Math.sin(state.elapsedSeconds * 0.34) * 0.035 * state.idleAmount;
    this.root.rotation.y = -0.2 + state.inspection * 0.18 + state.portal * -0.12 + idle;
    this.root.rotation.x = -0.05 + state.open * 0.04;
    this.core.rotation.y = state.reducedMotion ? 0 : state.elapsedSeconds * 0.2;
    this.core.rotation.x = state.reducedMotion ? 0 : state.elapsedSeconds * 0.12;
    this.core.scale.setScalar(0.72 + this.coreIntensity * 0.2);
    this.coreMaterial.emissiveIntensity = 0.22 + this.coreIntensity * 0.52;
    this.coreEnergyMaterial.opacity = Math.min(0.24, 0.04 + this.coreIntensity * 0.09);

    this.rings.forEach((ring, index) => {
      if (!state.reducedMotion) ring.rotation.z = state.elapsedSeconds * (index % 2 ? -0.08 : 0.06) + index * 0.7;
      ring.scale.setScalar(0.84 + this.openProgress * (0.2 + index * 0.05));
    });
    this.portal.scale.setScalar(Math.max(0.001, this.portalProgress * (0.84 + state.enter * 0.7)));
    this.portal.rotation.z = state.reducedMotion ? 0 : state.elapsedSeconds * 0.09;
  }

  dispose() {
    disposeObject3D(this.root);
  }
}
