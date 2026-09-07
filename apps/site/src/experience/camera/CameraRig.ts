import * as THREE from "three";
import type { PointerState } from "../input/PointerParallax";
import type { ScrollSnapshot } from "../types";
import { clamp, smoothstep } from "../core/math";
import { CAMERA_KEYFRAMES, type CameraKeyframe } from "./CameraKeyframes";
import { EXPERIENCE_PHASE_RANGES } from "../../experience-shell/experienceShellConfig";

const FINAL_CROWN_FOCUS_LOCK = EXPERIENCE_PHASE_RANGES.finalCrownPass[0]
  + (EXPERIENCE_PHASE_RANGES.finalCrownPass[1] - EXPERIENCE_PHASE_RANGES.finalCrownPass[0]) * 0.375;

function rangeEnvelope(progress: number, start: number, end: number, feather = 0.025) {
  const enter = smoothstep(clamp((progress - (start - feather)) / feather));
  const exit = 1 - smoothstep(clamp((progress - end) / feather));
  return enter * exit;
}

export function getMobileCameraPullback(progress: number, landscape: boolean) {
  const p = clamp(progress);
  const base = landscape ? 0.65 : 1.4;
  const directed = Math.max(
    rangeEnvelope(p, ...EXPERIENCE_PHASE_RANGES.blackcrownHero) * (landscape ? 1.2 : 5.0),
    rangeEnvelope(p, ...EXPERIENCE_PHASE_RANGES.evofishReveal) * (landscape ? 1.8 : 7.0),
    rangeEnvelope(p, ...EXPERIENCE_PHASE_RANGES.crownFrontVault) * (landscape ? 0.8 : 2.6),
    rangeEnvelope(p, ...EXPERIENCE_PHASE_RANGES.vaultToNetwork) * (landscape ? 1.4 : 5.5),
    rangeEnvelope(p, ...EXPERIENCE_PHASE_RANGES.networkCollection) * (landscape ? 1.1 : 4.2),
  );
  const finalFade = 1 - smoothstep(clamp(
    (p - EXPERIENCE_PHASE_RANGES.finalCrownPass[0])
    / (EXPERIENCE_PHASE_RANGES.finalCrownPass[1] - EXPERIENCE_PHASE_RANGES.finalCrownPass[0]),
  ));
  return (base + directed) * finalFade;
}

function setKeyframeTangent(
  output: THREE.Vector3,
  frames: readonly CameraKeyframe[],
  index: number,
  key: "position" | "target",
) {
  const before = frames[Math.max(0, index - 1)];
  const after = frames[Math.min(frames.length - 1, index + 1)];
  const span = Math.max(0.0001, after.progress - before.progress);
  output.set(
    (after[key][0] - before[key][0]) / span,
    (after[key][1] - before[key][1]) / span,
    (after[key][2] - before[key][2]) / span,
  );
}

function hermiteVector(
  output: THREE.Vector3,
  start: THREE.Vector3,
  end: THREE.Vector3,
  startTangent: THREE.Vector3,
  endTangent: THREE.Vector3,
  amount: number,
  span: number,
) {
  const t2 = amount * amount;
  const t3 = t2 * amount;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + amount;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  output.set(
    start.x * h00 + startTangent.x * span * h10 + end.x * h01 + endTangent.x * span * h11,
    start.y * h00 + startTangent.y * span * h10 + end.y * h01 + endTangent.y * span * h11,
    start.z * h00 + startTangent.z * span * h10 + end.z * h01 + endTangent.z * span * h11,
  );
}

function keyframeScalarTangent(frames: readonly CameraKeyframe[], index: number) {
  const before = frames[Math.max(0, index - 1)];
  const after = frames[Math.min(frames.length - 1, index + 1)];
  return (after.fov - before.fov) / Math.max(0.0001, after.progress - before.progress);
}

function hermiteScalar(start: number, end: number, startTangent: number, endTangent: number, amount: number, span: number) {
  const t2 = amount * amount;
  const t3 = t2 * amount;
  return start * (2 * t3 - 3 * t2 + 1)
    + startTangent * span * (t3 - 2 * t2 + amount)
    + end * (-2 * t3 + 3 * t2)
    + endTangent * span * (t3 - t2);
}

export class CameraRig {
  private readonly directedPosition = new THREE.Vector3();
  private readonly directedTarget = new THREE.Vector3();
  private readonly fromPosition = new THREE.Vector3();
  private readonly toPosition = new THREE.Vector3();
  private readonly fromTarget = new THREE.Vector3();
  private readonly toTarget = new THREE.Vector3();
  private readonly fromPositionTangent = new THREE.Vector3();
  private readonly toPositionTangent = new THREE.Vector3();
  private readonly fromTargetTangent = new THREE.Vector3();
  private readonly toTargetTangent = new THREE.Vector3();
  private readonly finalTarget = new THREE.Vector3();

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  update(snapshot: ScrollSnapshot, pointer: PointerState, elapsedSeconds: number, finalCoreTarget?: THREE.Vector3) {
    const progress = snapshot.progress;
    let left = CAMERA_KEYFRAMES[0];
    let right = CAMERA_KEYFRAMES[CAMERA_KEYFRAMES.length - 1];
    let leftIndex = 0;
    for (let index = 0; index < CAMERA_KEYFRAMES.length - 1; index += 1) {
      const candidate = CAMERA_KEYFRAMES[index + 1];
      if (progress <= candidate.progress) {
        left = CAMERA_KEYFRAMES[index];
        right = candidate;
        leftIndex = index;
        break;
      }
    }

    const span = Math.max(0.0001, right.progress - left.progress);
    const amount = clamp((progress - left.progress) / span);
    this.fromPosition.fromArray(left.position);
    this.toPosition.fromArray(right.position);
    setKeyframeTangent(this.fromPositionTangent, CAMERA_KEYFRAMES, leftIndex, "position");
    setKeyframeTangent(this.toPositionTangent, CAMERA_KEYFRAMES, leftIndex + 1, "position");
    hermiteVector(
      this.directedPosition,
      this.fromPosition,
      this.toPosition,
      this.fromPositionTangent,
      this.toPositionTangent,
      amount,
      span,
    );
    this.fromTarget.fromArray(left.target);
    this.toTarget.fromArray(right.target);
    setKeyframeTangent(this.fromTargetTangent, CAMERA_KEYFRAMES, leftIndex, "target");
    setKeyframeTangent(this.toTargetTangent, CAMERA_KEYFRAMES, leftIndex + 1, "target");
    hermiteVector(
      this.directedTarget,
      this.fromTarget,
      this.toTarget,
      this.fromTargetTangent,
      this.toTargetTangent,
      amount,
      span,
    );

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
    const mobileScale = mobileViewport ? 0.08 : 1;
    const pointerX = pointer.x * 0.62 * mobileScale * (1 - finalFocus);
    const pointerY = pointer.y * 0.35 * mobileScale * (1 - finalFocus);
    const idleY = snapshot.reducedMotion ? 0 : Math.sin(elapsedSeconds * 0.22) * 0.035 * (1 - finalFocus);

    this.camera.position.copy(this.directedPosition);
    if (mobileViewport) {
      // Portrait needs a phase-aware optical fit: the clean Crown, full fish and
      // network must remain readable rather than being cropped by a global offset.
      this.camera.position.z += getMobileCameraPullback(progress, snapshot.viewportHeight <= 520);
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
    this.camera.fov = clamp(hermiteScalar(
      left.fov,
      right.fov,
      keyframeScalarTangent(CAMERA_KEYFRAMES, leftIndex),
      keyframeScalarTangent(CAMERA_KEYFRAMES, leftIndex + 1),
      amount,
      span,
    ), 30, 50);
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(this.finalTarget);
  }
}
