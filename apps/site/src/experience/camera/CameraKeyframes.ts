export type CameraKeyframe = {
  progress: number;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
  fov: number;
};

export const CAMERA_KEYFRAMES: readonly CameraKeyframe[] = [
  { progress: 0, position: [0, -0.65, 10.8], target: [0, 0.25, 0], fov: 37 },
  { progress: 0.12, position: [-0.5, -0.35, 9.4], target: [0, 0.35, 0], fov: 36 },
  { progress: 0.3, position: [0.7, 0.15, 7.3], target: [0, 0.65, 0], fov: 34 },
  { progress: 0.45, position: [0.25, 0.2, 6.8], target: [0, 0.7, 0], fov: 33 },
  { progress: 0.62, position: [0, -0.1, 5.5], target: [0, 0.55, -0.2], fov: 32 },
  { progress: 0.78, position: [0, 0.05, 4.7], target: [0, 0.45, -0.7], fov: 31 },
  { progress: 0.9, position: [-0.5, 0.4, 8.4], target: [0, 0.55, 0], fov: 36 },
  { progress: 1, position: [0, 0.1, 5.2], target: [0, 0.5, -0.8], fov: 31 },
];
