import type { ExperienceTransition } from "./types";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

export const ReactorToNetworkTransition: ExperienceTransition = {
  id: "reactor-to-network",
  evaluate(amount, from, to, reducedMotion) {
    const t = smoothstep(amount);
    const travelScale = reducedMotion ? 0.32 : 1;

    // The military vault does not simply fade out. It opens around the viewer,
    // drops behind the camera and hands its axial energy path to the Network.
    // Every transform is derived from absolute progress, so reverse scroll is exact.
    from.root.position.set(
      -t * 0.58 * travelScale,
      t * 0.18 * travelScale,
      t * 3.6 * travelScale,
    );
    from.root.rotation.set(
      -t * 0.018 * travelScale,
      t * 0.075 * travelScale,
      -t * 0.012 * travelScale,
    );
    from.root.scale.setScalar(1 - t * 0.2 * travelScale);

    // Network enters as a deep command space rather than a flat object swap.
    // Lateral offset and axial travel create a controlled camera-relative reveal.
    const incoming = 1 - t;
    to.root.position.set(
      incoming * 0.9 * travelScale,
      -incoming * 0.36 * travelScale,
      -incoming * 5.9 * travelScale,
    );
    to.root.rotation.set(
      incoming * 0.018 * travelScale,
      incoming * 0.2 * travelScale,
      incoming * -0.018 * travelScale,
    );
    to.root.scale.setScalar(0.58 + t * 0.42);
  },
};
