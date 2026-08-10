import type { ExperienceScene } from "./SceneRegistry";
import type { SceneLifecycleSnapshot } from "./SceneLifecycle";
import { CrownToGateTransition } from "../transitions/CrownToGateTransition";
import { GateToOceanTransition } from "../transitions/GateToOceanTransition";
import { OceanToReactorTransition } from "../transitions/OceanToReactorTransition";
import { ReactorToNetworkTransition } from "../transitions/ReactorToNetworkTransition";
import { NetworkToVaultTransition } from "../transitions/NetworkToVaultTransition";
import { VaultToIdentityTransition } from "../transitions/VaultToIdentityTransition";

const TRANSITIONS = new Map([
  CrownToGateTransition,
  GateToOceanTransition,
  OceanToReactorTransition,
  ReactorToNetworkTransition,
  NetworkToVaultTransition,
  VaultToIdentityTransition,
].map((transition) => [transition.id, transition]));

export class TransitionDirector {
  evaluate(lifecycle: SceneLifecycleSnapshot, scenes: ReadonlyMap<string, ExperienceScene>, reducedMotion: boolean) {
    const state = lifecycle.transition;
    if (!state) return;
    const transition = TRANSITIONS.get(state.id);
    const from = scenes.get(state.from);
    const to = scenes.get(state.to);
    if (!transition || !from || !to) return;
    transition.evaluate(state.amount, from, to, reducedMotion);
  }
}

