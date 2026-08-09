import * as THREE from "three";
import { clamp, smoothstep } from "../core/math";
import { disposeObject3D } from "../core/Lifecycle";

const CYAN = new THREE.Color(0x4ed9e9);
const ORANGE = new THREE.Color(0xff6d2f);

export class PortalField {
  readonly root = new THREE.Group();
  private readonly containmentMaterial = new THREE.MeshStandardMaterial({ color: 0x111920, metalness: 0.74, roughness: 0.42 });
  private readonly cyanMaterial = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  private readonly orangeMaterial = new THREE.MeshBasicMaterial({ color: ORANGE, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  private readonly volumeMaterial: THREE.ShaderMaterial;
  private readonly tunnelRings = new THREE.Group();
  private readonly aperture = new THREE.Group();
  private readonly foreground = new THREE.Group();
  private readonly spokes = new THREE.Group();

  constructor(radialSegments: number) {
    this.root.name = "CrownFrontPortalField";

    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.82, 0.13, 8, radialSegments), this.containmentMaterial);
    outerRing.position.z = -0.8;
    const containmentInner = new THREE.Mesh(new THREE.TorusGeometry(1.53, 0.045, 6, radialSegments), this.containmentMaterial);
    containmentInner.position.z = -0.62;
    this.root.add(outerRing, containmentInner);

    for (let index = 0; index < 5; index += 1) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.42 - index * 0.12, 0.012 + index * 0.002, 5, radialSegments),
        index % 2 ? this.orangeMaterial : this.cyanMaterial,
      );
      ring.position.z = -1.05 - index * 0.42;
      ring.rotation.z = index * 0.22;
      this.tunnelRings.add(ring);
    }

    const shutterGeometry = new THREE.BoxGeometry(0.09, 0.42, 0.09);
    for (let index = 0; index < 10; index += 1) {
      const angle = (index / 10) * Math.PI * 2;
      const pivot = new THREE.Group();
      const shutter = new THREE.Mesh(shutterGeometry, this.containmentMaterial);
      shutter.position.y = 1.16;
      shutter.rotation.z = index % 2 ? 0.08 : -0.08;
      pivot.rotation.z = angle;
      pivot.position.z = -0.48;
      pivot.add(shutter);
      this.aperture.add(pivot);
    }

    const spokeGeometry = new THREE.BoxGeometry(0.018, 1.05, 0.016);
    for (let index = 0; index < 8; index += 1) {
      const spoke = new THREE.Mesh(spokeGeometry, this.orangeMaterial);
      spoke.position.y = 0.48;
      spoke.position.z = -1.5;
      spoke.rotation.z = (index / 8) * Math.PI * 2;
      this.spokes.add(spoke);
    }

    const fragmentGeometry = new THREE.BoxGeometry(0.16, 0.62, 0.18);
    for (let index = 0; index < 4; index += 1) {
      const pivot = new THREE.Group();
      const fragment = new THREE.Mesh(fragmentGeometry, this.containmentMaterial);
      fragment.position.y = 1.86;
      fragment.rotation.x = index % 2 ? 0.12 : -0.12;
      pivot.rotation.z = Math.PI * 0.25 + index * Math.PI * 0.5;
      pivot.position.z = 0.42;
      pivot.add(fragment);
      this.foreground.add(pivot);
    }

    this.volumeMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uProgress: { value: 0 },
        uOrange: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uProgress;
        uniform float uOrange;
        uniform float uTime;
        void main() {
          vec2 point = vUv * 2.0 - 1.0;
          float radius = length(point);
          float angle = atan(point.y, point.x);
          float bands = sin(radius * 42.0 - uTime * 0.65 + sin(angle * 8.0) * 0.9) * 0.5 + 0.5;
          float aperture = smoothstep(1.0, 0.08, radius) * smoothstep(0.0, 0.22, radius);
          float nucleus = smoothstep(0.24, 0.0, radius);
          vec3 cyan = vec3(0.10, 0.62, 0.72);
          vec3 orange = vec3(1.0, 0.14, 0.012);
          vec3 color = mix(cyan, orange, uOrange * (0.52 + radius * 0.34));
          float alpha = (aperture * (0.11 + bands * 0.18) + nucleus * 0.24) * uProgress;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
    const volume = new THREE.Mesh(new THREE.CircleGeometry(1.38, radialSegments), this.volumeMaterial);
    volume.position.z = 0.08;

    this.root.add(this.tunnelRings, volume, this.spokes, this.aperture, this.foreground);
    this.root.visible = false;
  }

  update(elapsedSeconds: number, portal: number, orange: number, enter: number, reducedMotion: boolean) {
    const reveal = smoothstep(clamp(portal));
    this.root.visible = reveal > 0.001;
    this.root.scale.setScalar(0.72 + reveal * 0.28 + enter * 0.16);
    this.containmentMaterial.emissive.setHex(orange > 0.25 ? 0x351207 : 0x061b20);
    this.containmentMaterial.emissiveIntensity = 0.08 + reveal * 0.22;
    this.cyanMaterial.opacity = reveal * (0.13 - orange * 0.07);
    this.orangeMaterial.opacity = reveal * orange * 0.42;
    this.volumeMaterial.uniforms.uProgress.value = reveal;
    this.volumeMaterial.uniforms.uOrange.value = orange;
    this.volumeMaterial.uniforms.uTime.value = reducedMotion ? 0 : elapsedSeconds;

    this.tunnelRings.children.forEach((ring, index) => {
      ring.rotation.z = index * 0.22 + (reducedMotion ? 0 : elapsedSeconds * (index % 2 ? -0.035 : 0.026));
      const depthPulse = 1 + reveal * index * 0.026;
      ring.scale.setScalar(depthPulse);
    });
    this.aperture.children.forEach((pivot, index) => {
      const openAngle = reveal * (0.14 + (index % 2) * 0.035);
      pivot.rotation.z = (index / 10) * Math.PI * 2 + openAngle;
      pivot.scale.y = 1 - reveal * 0.34;
    });
    this.foreground.children.forEach((pivot, index) => {
      const side = index % 2 ? 1 : -1;
      pivot.rotation.z = Math.PI * 0.25 + index * Math.PI * 0.5 + side * reveal * 0.13;
      pivot.scale.y = 1 - reveal * 0.48;
      pivot.position.z = 0.42 + enter * 0.5;
    });
    this.spokes.rotation.z = reducedMotion ? 0 : elapsedSeconds * -0.045;
    this.spokes.scale.setScalar(0.72 + reveal * 0.28);
  }

  dispose() { disposeObject3D(this.root); }
}
