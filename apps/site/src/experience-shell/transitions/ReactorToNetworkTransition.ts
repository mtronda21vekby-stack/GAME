import type { ExperienceTransition } from "./types";

export const ReactorToNetworkTransition: ExperienceTransition = {
  id: "reactor-to-network",
  evaluate(amount, from, to, reducedMotion) {
    const travelScale = reducedMotion ? 0.32 : 1;
    // Armored vault pulls apart and falls behind the camera while the distributed
    // network arrives from several depth planes, avoiding another flat orb swap.
    from.root.scale.setScalar(1 - amount * 0.18 * travelScale);
    from.root.position.z = amount * 3.15 * travelScale;
    from.root.position.x = -amount * 0.42 * travelScale;
    from.root.rotation.y = amount * 0.055 * travelScale;

    to.root.position.z = -(1 - amount) * 5.4 * travelScale;
    to.root.position.x = (1 - amount) * 0.72 * travelScale;
    to.root.position.y = (1 - amount) * -0.28 * travelScale;
    to.root.scale.setScalar(0.62 + amount * 0.38);
    to.root.rotation.y = (1 - amount) * 0.16 * travelScale;
  },
};
