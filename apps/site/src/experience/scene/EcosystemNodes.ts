import * as THREE from "three";
import { disposeObject3D } from "../core/Lifecycle";
import { clamp, smoothstep } from "../core/math";

const NODE_LAYOUT = [
  { id: "GAME", position: [-3.7, 1.25, -0.6], scale: 1.12, primary: true },
  { id: "LOBBY", position: [3.5, 1.45, -1.3], scale: 1.04, primary: true },
  { id: "STORE", position: [-3.15, -1.4, 0.35], scale: 1.02, primary: true },
  { id: "ARSENAL", position: [3.2, -1.35, -0.4], scale: 0.78, primary: false },
  { id: "COSMETICS", position: [-4.8, 0.05, -2.4], scale: 0.72, primary: false },
  { id: "ACCOUNT", position: [4.7, 0.1, -2.7], scale: 0.76, primary: false },
  { id: "ROADMAP", position: [-2.15, 2.45, -4.1], scale: 0.58, primary: false },
  { id: "NETWORK", position: [2.35, 2.55, -4.5], scale: 0.6, primary: false },
] as const;

export class EcosystemNodes {
  readonly root = new THREE.Group();
  private readonly nodes: THREE.Group[] = [];

  constructor(count: number) {
    this.root.name = "EcosystemNodes";
    const layout = count <= 4
      ? [NODE_LAYOUT[0], NODE_LAYOUT[1], NODE_LAYOUT[2], NODE_LAYOUT[5]]
      : NODE_LAYOUT.slice(0, count);
    const shellGeometry = new THREE.CylinderGeometry(0.2, 0.24, 0.22, 8);
    const bracketGeometry = new THREE.BoxGeometry(0.08, 0.42, 0.08);
    const coreGeometry = new THREE.SphereGeometry(0.075, 10, 8);

    layout.forEach((definition, index) => {
      const node = new THREE.Group();
      node.name = `NexusNode_${definition.id}`;
      const shellMaterial = new THREE.MeshStandardMaterial({
        color: 0x101a21,
        emissive: definition.primary ? 0x0b3841 : 0x081f28,
        emissiveIntensity: 0.32,
        metalness: 0.72,
        roughness: 0.4,
      });
      const shell = new THREE.Mesh(shellGeometry, shellMaterial);
      shell.rotation.x = Math.PI * 0.5;
      const energyMaterial = new THREE.MeshBasicMaterial({
        color: definition.id === "ARSENAL" ? 0xff7634 : 0x62dce9,
        transparent: true,
        opacity: definition.primary ? 0.72 : 0.46,
      });
      const core = new THREE.Mesh(coreGeometry, energyMaterial);
      core.position.z = 0.16;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.012, 5, 20), energyMaterial);
      const bracketA = new THREE.Mesh(bracketGeometry, shellMaterial);
      const bracketB = bracketA.clone();
      bracketA.position.x = -0.32;
      bracketB.position.x = 0.32;
      bracketA.rotation.z = 0.22;
      bracketB.rotation.z = -0.22;
      node.position.fromArray(definition.position);
      node.scale.setScalar(definition.scale);
      node.userData.baseScale = definition.scale;
      node.userData.baseZ = definition.position[2];
      node.userData.primary = definition.primary;
      node.userData.depthDelay = Math.max(0, -definition.position[2]) * 0.035 + index * 0.018;
      node.add(shell, core, ring, bracketA, bracketB);
      this.root.add(node);
      this.nodes.push(node);
    });
    this.root.scale.setScalar(0.001);
  }

  update(elapsedSeconds: number, progress: number, enter: number, reducedMotion: boolean) {
    const reveal = smoothstep(clamp(progress));
    const exit = 1 - smoothstep(clamp(enter));
    this.root.scale.setScalar(Math.max(0.001, reveal * (0.72 + exit * 0.28)));
    this.nodes.forEach((node, index) => {
      const delayedReveal = smoothstep(clamp((reveal - node.userData.depthDelay) / 0.76));
      const exitScale = node.userData.primary ? 1 - enter * 0.34 : 1 - enter;
      node.visible = delayedReveal > 0.01 && exitScale > 0.42;
      node.scale.setScalar(node.userData.baseScale * delayedReveal * Math.max(0.001, exitScale));
      node.position.z = node.userData.baseZ - (1 - delayedReveal) * 2.2;
      if (!reducedMotion) {
        node.rotation.y = elapsedSeconds * (0.05 + index * 0.004);
        node.rotation.z = Math.sin(elapsedSeconds * 0.16 + index) * 0.025;
      }
    });
  }

  dispose() { disposeObject3D(this.root); }
}
