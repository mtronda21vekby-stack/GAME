export type CameraKeyframe = {
  progress: number;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
  fov: number;
};

export const CAMERA_KEYFRAMES: readonly CameraKeyframe[] = [
  { progress: 0, position: [0, -0.42, 10.7], target: [0.55, 0.3, 0], fov: 38 },
  { progress: 0.05, position: [-0.18, -0.26, 9.9], target: [0.7, 0.42, 0], fov: 37 },
  { progress: 0.18, position: [0.1, 0.08, 8.35], target: [0.82, 0.55, 0], fov: 34 },
  { progress: 0.23, position: [0.04, 0.14, 6.4], target: [0.68, 0.48, -0.35], fov: 33 },
  { progress: 0.36, position: [0, 0.08, 7.9], target: [0.35, 0.2, -1.4], fov: 37 },
  { progress: 0.52, position: [-0.22, -0.08, 8.2], target: [-0.15, 0.15, -0.8], fov: 39 },
  { progress: 0.68, position: [0.14, 0.05, 7.7], target: [0.48, 0.32, -0.6], fov: 35 },
  { progress: 0.81, position: [-0.18, 0.22, 9.3], target: [0.45, 0.3, -0.8], fov: 38 },
  { progress: 0.92, position: [0.08, 0.14, 8.5], target: [0.52, 0.36, -0.5], fov: 36 },
  { progress: 1, position: [0, 0.1, 7.7], target: [0.65, 0.42, -0.6], fov: 34 },
];
