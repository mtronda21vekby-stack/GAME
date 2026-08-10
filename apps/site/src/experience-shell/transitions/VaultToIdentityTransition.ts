import type { ExperienceTransition } from "./types";

export const VaultToIdentityTransition: ExperienceTransition = {
  id: "vault-to-identity",
  evaluate(amount, from, to, reducedMotion) {
    from.root.position.z = amount * (reducedMotion ? 0.3 : 2.8);
    from.root.scale.setScalar(1 + amount * 0.18);
    to.root.position.z = -(1 - amount) * (reducedMotion ? 0.45 : 4.8);
    to.root.scale.setScalar(0.7 + amount * 0.3);
    to.root.rotation.z = (1 - amount) * -0.08;
  },
};

