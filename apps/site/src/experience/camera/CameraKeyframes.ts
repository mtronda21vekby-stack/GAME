export type CameraKeyframe = {
  progress: number;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
  fov: number;
};

export const CAMERA_KEYFRAMES: readonly CameraKeyframe[] = [
  { progress: 0, position: [0, -0.45, 10.6], target: [0.3, 0.25, 0], fov: 38 },
  { progress: 0.12, position: [-0.4, -0.25, 9.6], target: [0.4, 0.35, 0], fov: 37 },
  { progress: 0.3, position: [0.2, 0.1, 8.5], target: [0.55, 0.58, 0], fov: 35 },
  { progress: 0.45, position: [0.05, 0.14, 8.1], target: [0.65, 0.58, 0], fov: 34 },
  { progress: 0.62, position: [0, -0.05, 7.4], target: [0.78, 0.46, -0.1], fov: 34 },
  { progress: 0.78, position: [0, 0.05, 7.1], target: [0.84, 0.45, -0.5], fov: 34 },
  { progress: 0.9, position: [-0.3, 0.28, 9.8], target: [0.65, 0.5, 0], fov: 38 },
  { progress: 1, position: [0, 0.1, 8.4], target: [0.8, 0.45, -0.5], fov: 35 },
];
