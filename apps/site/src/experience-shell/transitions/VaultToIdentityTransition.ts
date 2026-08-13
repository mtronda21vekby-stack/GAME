import type { ExperienceTransition } from "./types";

export const VaultToIdentityTransition: ExperienceTransition = {
  id: "vault-to-identity",
  evaluate(amount, from, to, reducedMotion) {
    const travelScale = reducedMotion ? 0.32 : 1;
    // Collection housings close and fall away; a sparse identity frame appears
    // only briefly before the separate Crown takes over the final pass-through.
    from.root.position.z = amount * 3.45 * travelScale;
    from.root.position.y = amount * 0.62 * travelScale;
    from.root.scale.setScalar(1 + amount * 0.12 * travelScale);

    to.root.position.z = -(1 - amount) * 5.6 * travelScale;
    to.root.position.y = (1 - amount) * -0.52 * travelScale;
    to.root.scale.setScalar(0.68 + amount * 0.32);
    to.root.rotation.z = (1 - amount) * -0.06 * travelScale;
  },
};
