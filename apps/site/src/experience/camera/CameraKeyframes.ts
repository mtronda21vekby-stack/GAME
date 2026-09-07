import { EXPERIENCE_PHASE_RANGES } from "../../experience-shell/experienceShellConfig";

export type CameraKeyframe = {
  progress: number;
  position: readonly [number, number, number];
  target: readonly [number, number, number];
  fov: number;
};

export const CAMERA_KEYFRAMES: readonly CameraKeyframe[] = [
  // Core awakening: hold the Crown as a distant silhouette before scroll wakes it.
  { progress: 0, position: [0, -0.44, 10.9], target: [0.92, 0.26, -0.15], fov: 38 },
  { progress: EXPERIENCE_PHASE_RANGES.nanoAssembly[0], position: [-0.16, -0.28, 10.15], target: [1.02, 0.36, -0.28], fov: 37 },

  // Assembly: move off-axis, then into the machinery before the magnetic lock.
  { progress: 0.10, position: [-0.62, -0.12, 9.05], target: [1.08, 0.42, -0.52], fov: 36 },
  { progress: 0.14, position: [-0.46, 0.02, 8.15], target: [1.12, 0.48, -0.72], fov: 35 },
  { progress: 0.18, position: [0.52, 0.14, 6.85], target: [1.18, 0.5, -0.94], fov: 33 },
  { progress: EXPERIENCE_PHASE_RANGES.nanoAssembly[1], position: [0.28, 0.16, 5.95], target: [1.18, 0.46, -1.08], fov: 32 },

  // Candidate B luxury hero: a deliberate pull-back and a nearly still inspection.
  { progress: 0.26, position: [0.08, 0.1, 7.15], target: [0.98, 0.42, -0.42], fov: 33 },
  { progress: EXPERIENCE_PHASE_RANGES.blackcrownHero[1], position: [0.02, 0.08, 7.45], target: [0.92, 0.4, -0.52], fov: 34 },

  // Crown to ocean: pass below the lower shell instead of cutting between tableaux.
  { progress: 0.335, position: [0.26, -0.18, 6.35], target: [0.78, -0.08, -1.85], fov: 35 },
  { progress: 0.375, position: [0.42, -0.82, 4.9], target: [0.62, -0.42, -3.1], fov: 37 },
  { progress: 0.405, position: [-0.28, -0.68, 6.15], target: [0.28, -0.12, -2.65], fov: 38 },
  { progress: EXPERIENCE_PHASE_RANGES.crownToOcean[1], position: [-0.18, -0.2, 7.7], target: [0.18, 0.12, -2.1], fov: 39 },

  // EvoFish: begin on partial detail, then retreat far enough to reveal the body.
  { progress: 0.48, position: [0.42, 0.28, 6.2], target: [1.32, 0.72, -1.52], fov: 34 },
  { progress: 0.54, position: [-0.28, 0.02, 8.0], target: [0.82, 0.44, -1.55], fov: 38 },
  { progress: EXPERIENCE_PHASE_RANGES.evofishReveal[1], position: [-0.06, -0.04, 8.65], target: [0.54, 0.32, -1.72], fov: 39 },

  // Ocean to vault: squeeze through shutters, then let the architecture dwarf us.
  { progress: 0.60, position: [0.2, 0.1, 7.35], target: [0.46, 0.26, -2.75], fov: 37 },
  { progress: 0.64, position: [0.38, 0.08, 5.75], target: [0.52, 0.22, -3.65], fov: 34 },
  { progress: 0.675, position: [-0.34, 0.02, 4.85], target: [0.42, 0.2, -4.55], fov: 33 },
  { progress: EXPERIENCE_PHASE_RANGES.oceanToVault[1], position: [-0.18, 0.04, 9.55], target: [0.44, 0.26, -3.15], fov: 40 },
  { progress: 0.76, position: [0.18, 0.12, 7.25], target: [0.52, 0.28, -4.65], fov: 35 },
  { progress: EXPERIENCE_PHASE_RANGES.crownFrontVault[1], position: [-0.1, 0.2, 8.45], target: [0.46, 0.34, -3.75], fov: 37 },

  // Network and collection: expand the volume, then resolve it into a gallery.
  { progress: 0.84, position: [-0.34, 0.26, 9.35], target: [0.38, 0.38, -3.15], fov: 40 },
  { progress: 0.87, position: [-0.58, 0.32, 10.35], target: [0.3, 0.4, -2.6], fov: 42 },
  { progress: 0.895, position: [0.18, 0.24, 11.2], target: [0.4, 0.36, -2.35], fov: 43 },
  { progress: EXPERIENCE_PHASE_RANGES.vaultToNetwork[1], position: [0.22, 0.18, 9.35], target: [0.48, 0.34, -2.2], fov: 38 },
  { progress: 0.935, position: [0.04, 0.08, 8.25], target: [0.5, 0.32, -1.8], fov: 35 },

  // Final Crown pass: approach, cross the core plane, and leave only the DOM identity.
  { progress: EXPERIENCE_PHASE_RANGES.finalCrownPass[0], position: [0.02, 0.08, 7.6], target: [0.68, 0.48, -0.45], fov: 34 },
  { progress: 0.975, position: [0.32, 0.28, 4.1], target: [0.74, 0.54, -1.1], fov: 36 },
  { progress: 0.985, position: [0.46, 0.38, 3.6], target: [0.7, 0.5, -2.4], fov: 38 },
  { progress: 0.993, position: [0.6, 0.47, 1.1], target: [0.68, 0.49, -5.2], fov: 41 },
  { progress: 0.996, position: [0.65, 0.5, -0.25], target: [0.65, 0.48, -6.8], fov: 44 },
  { progress: EXPERIENCE_PHASE_RANGES.finalCrownPass[1], position: [0.66, 0.5, -2.4], target: [0.62, 0.46, -8], fov: 44 },
];
