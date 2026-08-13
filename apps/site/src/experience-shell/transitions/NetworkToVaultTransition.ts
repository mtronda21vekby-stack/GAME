import type { ExperienceTransition } from "./types";

export const NetworkToVaultTransition: ExperienceTransition = {
  id: "network-to-vault",
  evaluate(amount, from, to, reducedMotion) {
    const travelScale = reducedMotion ? 0.34 : 1;
    // Network lanes compress into physical vault rails; the collection arrives
    // as an editorial object space rather than a new full-screen section.
    from.root.scale.setScalar(1 + amount * 0.08 * travelScale);
    from.root.position.z = amount * 2.7 * travelScale;
    from.root.position.x = -amount * 0.5 * travelScale;

    to.root.position.z = -(1 - amount) * 4.8 * travelScale;
    to.root.position.x = (1 - amount) * 0.64 * travelScale;
    to.root.position.y = (1 - amount) * 0.36 * travelScale;
    to.root.scale.setScalar(0.7 + amount * 0.3);
    to.root.rotation.y = (1 - amount) * -0.08 * travelScale;
  },
};
