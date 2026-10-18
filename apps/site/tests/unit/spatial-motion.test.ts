import { describe, expect, it } from "vitest";
import { PerspectiveCamera } from "three";
import { DampedScalar, SurfaceMotion } from "../../src/components/spatial/spatialMotion";
import { DESKTOP_SPATIAL_CAMERA, MOBILE_SPATIAL_CAMERA } from "../../src/components/spatial/spatialState";
import { CameraRig } from "../../src/experience/camera/CameraRig";
import { INITIAL_SCROLL_SNAPSHOT } from "../../src/experience/types";

describe("Interruptible spatial motion", () => {
  it("starts and finishes a surface at rest, including every transform channel", () => {
    const motion = new SurfaceMotion([30,80,.5,.5,.25]);
    const end = [0,0,1,1,1];
    motion.moveTo(end,1280,100);
    motion.sample(100);
    expect(motion.value).toEqual([30,80,.5,.5,.25]);
    expect(motion.velocity).toEqual([0,0,0,0,0]);
    motion.sample(740);
    expect(motion.value[2]).toBeCloseTo(.75);
    motion.sample(1380);
    expect(motion.value).toEqual(end);
    expect(motion.velocity).toEqual([0,0,0,0,0]);
    expect(motion.active).toBe(false);
  });

  it("retains position and velocity when open/close is reversed mid-flight", () => {
    const motion = new SurfaceMotion([0]);
    motion.moveTo([1],1280,0);
    motion.sample(500);
    const position = motion.value[0], velocity = motion.velocity[0];
    expect(velocity).toBeGreaterThan(0);
    motion.moveTo([0],1040,500);
    motion.sample(500);
    expect(motion.value[0]).toBe(position);
    expect(motion.velocity[0]).toBeCloseTo(velocity,12);
    motion.sample(500.01);
    expect(motion.velocity[0]).toBeCloseTo(velocity,6);
    motion.sample(1540);
    expect(motion.value[0]).toBe(0);
    expect(motion.velocity[0]).toBe(0);
  });

  it("excludes paused time and keeps a reduced-motion rebase stable", () => {
    const motion = new SurfaceMotion([0]);
    motion.moveTo([1],1280,0);
    motion.sample(400);
    const before = motion.value[0];
    motion.delay(5000);
    motion.sample(5400);
    expect(motion.value[0]).toBeCloseTo(before,12);
    motion.rebase([0]);
    motion.finish();
    motion.sample(10000);
    expect(motion.value).toEqual([0]);
  });

  it("keeps a spring continuous on a new selection and independent of frame subdivision", () => {
    const whole = new DampedScalar(0,1120), split = new DampedScalar(0,1120);
    whole.update(1,100);
    for (let i=0;i<10;i++) split.update(1,10);
    expect(split.value).toBeCloseTo(whole.value,12);
    expect(split.velocity).toBeCloseTo(whole.velocity,12);
    const position = whole.value, velocity = whole.velocity;
    whole.update(-1,0);
    expect(whole.value).toBeCloseTo(position,12);
    expect(whole.velocity).toBeCloseTo(velocity,12);
    whole.update(-1,.01);
    expect(whole.value).toBeCloseTo(position,4);
    for (let i=0;i<180;i++) whole.update(-1,16.67);
    expect(whole.value).toBeCloseTo(-1,4);
  });
});

describe.each([{label:"desktop",frames:DESKTOP_SPATIAL_CAMERA},{label:"mobile",frames:MOBILE_SPATIAL_CAMERA}])("Continuous $label camera path", ({frames}) => {
  const camera = new PerspectiveCamera();
  const rig = new CameraRig(camera,frames,true);
  const sample = (progress: number) => {
    rig.update({...INITIAL_SCROLL_SNAPSHOT,progress,viewportWidth:1440,viewportHeight:900,reducedMotion:true},{x:0,y:0},0);
    return [...camera.position.toArray(),camera.fov];
  };

  it("keeps velocity continuous through travel keyframes", () => {
    const epsilon = .000001;
    for (const progress of [.16,.3,.45,.72]) {
      const left = sample(progress-epsilon), at = sample(progress), right = sample(progress+epsilon);
      at.forEach((value,axis) => {
        expect((value-left[axis])/epsilon).toBeCloseTo((right[axis]-value)/epsilon,2);
      });
    }
  });

  it("holds the gallery camera still across its reading interval", () => {
    const first = sample(.45);
    for (const progress of [.5,.6,.72]) sample(progress).forEach((value,axis) => expect(value).toBeCloseTo(first[axis],10));
  });
});
