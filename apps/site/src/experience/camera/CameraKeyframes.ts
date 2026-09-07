export type CameraKeyframe = {
  progress: number;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
  fov: number;
};

// Camera choreography for the approved 40–60 second cinematic scroll.
// The camera intentionally moves through the Crown and major transitions instead
// of treating each chapter as a flat section swap.
export const CAMERA_KEYFRAMES: readonly CameraKeyframe[] = [
  { progress: 0.00, position: [0.10, -0.48, 11.15], target: [0.55, 0.30, 0.05], fov: 38 },
  { progress: 0.06, position: [-0.18, -0.28, 10.05], target: [0.68, 0.42, 0.00], fov: 37 },
  { progress: 0.14, position: [-0.38, -0.04, 8.70], target: [0.78, 0.52, -0.08], fov: 35 },
  { progress: 0.22, position: [0.18, 0.12, 7.25], target: [0.76, 0.54, -0.24], fov: 33 },
  { progress: 0.30, position: [0.08, 0.18, 5.95], target: [0.62, 0.48, -0.62], fov: 32 },
  { progress: 0.35, position: [0.12, 0.05, 4.85], target: [0.48, 0.34, -2.40], fov: 34 },
  { progress: 0.43, position: [-0.10, -0.16, 8.85], target: [0.18, 0.05, -1.60], fov: 38 },
  { progress: 0.50, position: [-0.62, -0.26, 7.30], target: [-0.18, 0.05, -1.05], fov: 40 },
  { progress: 0.57, position: [-0.18, -0.08, 8.55], target: [0.05, 0.20, -1.25], fov: 38 },
  { progress: 0.64, position: [0.22, 0.06, 6.55], target: [0.38, 0.30, -2.10], fov: 35 },
  { progress: 0.70, position: [0.30, 0.08, 5.55], target: [0.52, 0.34, -2.75], fov: 33 },
  { progress: 0.82, position: [-0.10, 0.16, 9.55], target: [0.42, 0.34, -1.25], fov: 39 },
  { progress: 0.91, position: [-0.35, 0.20, 8.70], target: [0.50, 0.38, -0.95], fov: 37 },
  { progress: 0.96, position: [0.08, 0.10, 7.15], target: [0.58, 0.42, -0.82], fov: 34 },
  { progress: 0.985, position: [0.02, 0.05, 4.25], target: [0.46, 0.38, -2.20], fov: 31 },
  { progress: 1.00, position: [0.00, 0.02, 2.10], target: [0.30, 0.28, -5.20], fov: 29 },
];
