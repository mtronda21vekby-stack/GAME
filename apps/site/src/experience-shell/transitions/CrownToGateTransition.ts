import type { ExperienceTransition } from "./types";

export const CrownToGateTransition: ExperienceTransition = {
  id: "crown-to-gate",
  evaluate(amount, from, to, reducedMotion) {
    const travelScale = reducedMotion ? 0.28 : 1;
    from.root.position.y += amount * 1.15 * travelScale;
    from.root.position.z = -amount * 3.2 * travelScale;
    from.root.scale.setScalar(1 + amount * 0.22 * travelScale);
    from.root.rotation.z -= amount * 0.055 * travelScale;

    to.root.position.z = -(1 - amount) * 6.2 * travelScale;
    to.root.position.y += (1 - amount) * 0.42 * travelScale;
    to.root.scale.setScalar(0.62 + amount * 0.38);
    to.root.rotation.z = (1 - amount) * -0.22 * travelScale;
  },
};
