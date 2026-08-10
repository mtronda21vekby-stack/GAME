import type { ExperienceTransition } from "./types";

export const GateToOceanTransition: ExperienceTransition = {
  id: "gate-to-ocean",
  evaluate(amount, from, to, reducedMotion) {
    const travel = reducedMotion ? 0.45 : 4.2;
    from.root.position.z = amount * travel;
    from.root.scale.setScalar(1 + amount * (reducedMotion ? 0.04 : 0.52));
    to.root.position.z = -(1 - amount) * (reducedMotion ? 0.5 : 4.8);
    to.root.position.y = -(1 - amount) * 0.7;
    to.root.scale.setScalar(0.76 + amount * 0.24);
  },
};

