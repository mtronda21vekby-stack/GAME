import type { ExperienceTransition } from "./types";

export const OceanToReactorTransition: ExperienceTransition = {
  id: "ocean-to-reactor",
  evaluate(amount, from, to, reducedMotion) {
    const travelScale = reducedMotion ? 0.3 : 1;

    // Water volume clears upward/forward while its silhouettes become the near
    // mechanical framing for the vault. The long range makes the transformation
    // itself a hero moment instead of a short scene swap.
    from.root.position.y = amount * 2.65 * travelScale;
    from.root.position.z = amount * 4.4 * travelScale;
    from.root.position.x = -amount * 0.4 * travelScale;
    from.root.rotation.z = amount * 0.065 * travelScale;
    from.root.scale.setScalar(1 + amount * 0.16 * travelScale);

    to.root.position.z = -(1 - amount) * 6.4 * travelScale;
    to.root.position.y = (1 - amount) * -1.55 * travelScale;
    to.root.position.x = (1 - amount) * 0.5 * travelScale;
    to.root.scale.setScalar(0.64 + amount * 0.36);
    to.root.rotation.z = (1 - amount) * -0.035 * travelScale;
  },
};
