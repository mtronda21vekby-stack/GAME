import type { ExperienceTransition } from "./types";

export const NetworkToVaultTransition: ExperienceTransition = {
  id: "network-to-vault",
  evaluate(amount, from, to, reducedMotion) {
    from.root.scale.setScalar(1 + amount * 0.12);
    from.root.position.z = amount * (reducedMotion ? 0.25 : 2.1);
    to.root.position.z = -(1 - amount) * (reducedMotion ? 0.4 : 4.4);
    to.root.scale.setScalar(0.66 + amount * 0.34);
  },
};

