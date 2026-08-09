import * as THREE from "three";
import type { PointerState } from "../input/PointerParallax";
import type { ScrollSnapshot } from "../types";
import { clamp, smoothstep } from "../core/math";
import { CAMERA_KEYFRAMES } from "./CameraKeyframes";

export class CameraRig {
  private readonly directedPosition = new THREE.Vector3();
  private readonly directedTarget = new THREE.Vector3();
  private readonly fromPosition = new THREE.Vector3();
  private readonly toPosition = new THREE.Vector3();
  private readonly fromTarget = new THREE.Vector3();
  private readonly toTarget = new THREE.Vector3();
  private readonly finalTarget = new THREE.Vector3();

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  update(snapshot: ScrollSnapshot, pointer: PointerState, elapsedSeconds: number) {
    const progress = snapshot.progress;
    let left = CAMERA_KEYFRAMES[0];
    let right = CAMERA_KEYFRAMES[CAMERA_KEYFRAMES.length - 1];
    for (let index = 0; index < CAMERA_KEYFRAMES.length - 1; index += 1) {
      const candidate = CAMERA_KEYFRAMES[index + 1];
      if (progress <= candidate.progress) {
        left = CAMERA_KEYFRAMES[index];
        right = candidate;
        break;
      }
    }

    const span = Math.max(0.0001, right.progress - left.progress);
    const amount = smoothstep(clamp((progress - left.progress) / span));
    this.fromPosition.fromArray(left.position);
    this.toPosition.fromArray(right.position);
    this.directedPosition.lerpVectors(this.fromPosition, this.toPosition, amount);
    this.fromTarget.fromArray(left.target);
    this.toTarget.fromArray(right.target);
    this.directedTarget.lerpVectors(this.fromTarget, this.toTarget, amount);

    const mobileScale = snapshot.viewportWidth <= 820 ? 0.35 : 1;
    const pointerX = pointer.x * 0.62 * mobileScale;
    const pointerY = pointer.y * 0.35 * mobileScale;
    const idleY = snapshot.reducedMotion ? 0 : Math.sin(elapsedSeconds * 0.22) * 0.035;

    this.camera.position.copy(this.directedPosition);
    this.camera.position.x += pointerX;
    this.camera.position.y += pointerY + idleY;
    this.finalTarget.copy(this.directedTarget);
    this.finalTarget.x += pointerX * 0.18;
    this.finalTarget.y -= pointerY * 0.12;
    this.camera.fov = left.fov + (right.fov - left.fov) * amount;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.finalTarget);
  }
}
