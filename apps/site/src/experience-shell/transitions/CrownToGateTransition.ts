import type { ExperienceTransition } from "./types";

export const CrownToGateTransition: ExperienceTransition = {
  id: "crown-to-gate",
  evaluate(amount, from, to, reducedMotion) {
    const travel = reducedMotion ? 0.45 : 2.8;
    from.root.position.z = -amount * travel;
    from.root.scale.setScalar(1 + amount * (reducedMotion ? 0.03 : 0.34));
    to.root.position.z = -(1 - amount) * (reducedMotion ? 0.6 : 5.5);
    to.root.scale.setScalar(0.68 + amount * 0.32);
    to.root.rotation.z = (1 - amount) * -0.18;
  },
};

