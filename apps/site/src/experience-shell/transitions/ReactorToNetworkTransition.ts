import type { ExperienceTransition } from "./types";

export const ReactorToNetworkTransition: ExperienceTransition = {
  id: "reactor-to-network",
  evaluate(amount, from, to, reducedMotion) {
    from.root.scale.setScalar(1 - amount * 0.22);
    from.root.position.z = amount * (reducedMotion ? 0.35 : 2.2);
    to.root.position.z = -(1 - amount) * (reducedMotion ? 0.45 : 4.8);
    to.root.scale.setScalar(0.58 + amount * 0.42);
    to.root.rotation.y = (1 - amount) * 0.2;
  },
};

