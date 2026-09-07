import type { ExperienceTransition } from "./types";

export const GateToOceanTransition: ExperienceTransition = {
  id: "gate-to-ocean",
  evaluate(amount, from, to, reducedMotion) {
    const travelScale = reducedMotion ? 0.28 : 1;
    from.root.position.z = amount * 5.1 * travelScale;
    from.root.position.y += amount * 0.55 * travelScale;
    from.root.scale.setScalar(1 + amount * 0.42 * travelScale);
    from.root.rotation.z += amount * 0.045 * travelScale;

    // The ocean rises from below while the gate clears the camera, creating one
    // continuous spatial transition instead of a background crossfade.
    to.root.position.z = -(1 - amount) * 5.8 * travelScale;
    to.root.position.y = -(1 - amount) * 2.35 * travelScale;
    to.root.position.x = (1 - amount) * 0.42 * travelScale;
    to.root.scale.setScalar(0.68 + amount * 0.32);
  },
};
