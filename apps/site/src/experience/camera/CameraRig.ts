import * as THREE from "three";
import type { PointerState } from "../input/PointerParallax";
import type { ScrollSnapshot } from "../types";
import { clamp, smoothstep } from "../core/math";
import { CAMERA_KEYFRAMES } from "./CameraKeyframes";
import { EXPERIENCE_PHASE_RANGES } from "../../experience-shell/experienceShellConfig";

const FINAL_CROWN_FOCUS_LOCK = EXPERIENCE_PHASE_RANGES.finalCrownPass[0]
  + (EXPERIENCE_PHASE_RANGES.finalCrownPass[1] - EXPERIENCE_PHASE_RANGES.finalCrownPass[0]) * 0.375;

export class CameraRig {
  private readonly directedPosition = new THREE.Vector3();
  private readonly directedTarget = new THREE.Vector3();
  private readonly fromPosition = new THREE.Vector3();
  private readonly toPosition = new THREE.Vector3();
  private readonly fromTarget = new THREE.Vector3();
  private readonly toTarget = new THREE.Vector3();
  private readonly finalTarget = new THREE.Vector3();

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  update(snapshot: ScrollSnapshot, pointer: PointerState, elapsedSeconds: number, finalCoreTarget?: THREE.Vector3) {
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

    if (snapshot.reducedMotion) {
      this.directedPosition.x *= 0.3;
      this.directedPosition.y = 0.08 + this.directedPosition.y * 0.18;
      this.directedPosition.z = 9.6 - progress * 0.6;
      this.directedTarget.set(0.5 + progress * 0.16, 0.48, -progress * 0.12);
    }

    const mobileViewport = snapshot.viewportWidth <= 820 || snapshot.viewportHeight <= 520;
    const finalFocus = snapshot.reducedMotion ? 0 : smoothstep(clamp(
      (progress - EXPERIENCE_PHASE_RANGES.finalCrownPass[0])
      / (FINAL_CROWN_FOCUS_LOCK - EXPERIENCE_PHASE_RANGES.finalCrownPass[0]),
    ));
    const mobileScale = mobileViewport ? 0.25 : 1;
    const pointerX = pointer.x * 0.62 * mobileScale * (1 - finalFocus);
    const pointerY = pointer.y * 0.35 * mobileScale * (1 - finalFocus);
    const idleY = snapshot.reducedMotion ? 0 : Math.sin(elapsedSeconds * 0.22) * 0.035 * (1 - finalFocus);

    this.camera.position.copy(this.directedPosition);
    if (mobileViewport) {
      // Keep the wider mobile composition until the final pass, then converge on
      // the same core-crossing trajectory as desktop instead of stopping outside it.
      const finalPass = smoothstep(clamp(
        (progress - EXPERIENCE_PHASE_RANGES.finalCrownPass[0])
        / ((EXPERIENCE_PHASE_RANGES.finalCrownPass[1] - EXPERIENCE_PHASE_RANGES.finalCrownPass[0]) * 0.95),
      ));
      this.camera.position.z += (snapshot.viewportHeight <= 520 ? 0.9 : 1.8) * (1 - finalPass);
    }
    this.camera.position.x += pointerX;
    this.camera.position.y += pointerY + idleY;
    this.finalTarget.copy(this.directedTarget);
    this.finalTarget.x += pointerX * 0.18;
    this.finalTarget.y -= pointerY * 0.12;
    if (finalCoreTarget && finalFocus > 0) {
      // Lock the last approach to the live world-space core for every Crown LOD
      // and viewport. Matching camera/core X/Y makes the ray cross the core,
      // while aiming beyond it prevents a 180° flip after the crossing plane.
      this.camera.position.x += (finalCoreTarget.x - this.camera.position.x) * finalFocus;
      this.camera.position.y += (finalCoreTarget.y - this.camera.position.y) * finalFocus;
      this.toTarget.set(finalCoreTarget.x, finalCoreTarget.y, finalCoreTarget.z - 6);
      this.finalTarget.lerp(this.toTarget, finalFocus);
    }
    this.camera.fov = left.fov + (right.fov - left.fov) * amount;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.finalTarget);
  }
}
