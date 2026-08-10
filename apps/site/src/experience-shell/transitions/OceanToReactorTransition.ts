import type { ExperienceTransition } from "./types";

export const OceanToReactorTransition: ExperienceTransition = {
  id: "ocean-to-reactor",
  evaluate(amount, from, to, reducedMotion) {
    const travel = reducedMotion ? 0.35 : 2.6;
    from.root.position.y = amount * 1.3;
    from.root.position.z = amount * travel;
    from.root.rotation.z = amount * 0.04;
    to.root.position.z = -(1 - amount) * (reducedMotion ? 0.55 : 4.2);
    to.root.position.y = (1 - amount) * -0.9;
    to.root.scale.setScalar(0.74 + amount * 0.26);
  },
};

