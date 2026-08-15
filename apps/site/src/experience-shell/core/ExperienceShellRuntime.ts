import * as THREE from "three";
import type { CrownVisual } from "../../experience/assets/CrownAssetAdapter";
import type { EcosystemNodes } from "../../experience/scene/EcosystemNodes";
import type { ParticleField } from "../../experience/scene/ParticleField";
import type { PortalField } from "../../experience/scene/PortalField";
import type { QualityTier } from "../../experience/types";
import { AssetSlotRegistry } from "./AssetSlotRegistry";
import { EnvironmentDirector } from "./EnvironmentDirector";
import { SceneRegistry } from "./SceneRegistry";
import { CrownChamberScene } from "../scenes/CrownChamberScene";
import { WorldGateScene } from "../scenes/WorldGateScene";
import { EvoFishAbyssScene } from "../scenes/EvoFishAbyssScene";
import { CrownFrontReactorScene } from "../scenes/CrownFrontReactorScene";
import { NetworkCoreScene } from "../scenes/NetworkCoreScene";
import { CollectionVaultScene } from "../scenes/CollectionVaultScene";
import { IdentityScene } from "../scenes/IdentityScene";
import { EXPERIENCE_PHASE_RANGES } from "../experienceShellConfig";

type ExperienceShellRuntimeOptions = {
  parent: THREE.Group;
  scene: THREE.Scene;
  signal: AbortSignal;
  requestFrame: () => void;
};

export class ExperienceShellRuntime {
  private readonly assets: AssetSlotRegistry;
  private readonly registry: SceneRegistry;
  private readonly environment: EnvironmentDirector;

  constructor(options: ExperienceShellRuntimeOptions) {
    this.assets = new AssetSlotRegistry(options.signal);
    this.registry = new SceneRegistry(options.parent, options.requestFrame);
    this.environment = new EnvironmentDirector(options.scene);
    this.registry.register(new CrownChamberScene(this.assets));
    this.registry.register(new WorldGateScene(this.assets));
    this.registry.register(new EvoFishAbyssScene(this.assets));
    this.registry.register(new CrownFrontReactorScene(this.assets));
    this.registry.register(new NetworkCoreScene(this.assets));
    this.registry.register(new CollectionVaultScene(this.assets));
    this.registry.register(new IdentityScene(this.assets));
  }

  update(
    progress: number,
    elapsedSeconds: number,
    reducedMotion: boolean,
    quality: QualityTier,
    crown: CrownVisual,
    particles: ParticleField,
    portal: PortalField,
    ecosystem: EcosystemNodes,
  ) {
    const lifecycle = this.registry.evaluate(progress, elapsedSeconds, reducedMotion, quality);
    const environment = this.environment.update(progress, lifecycle, quality, reducedMotion, crown, particles, portal, ecosystem);
    const finalScene = this.registry.get("identity");
    if (finalScene && progress >= EXPERIENCE_PHASE_RANGES.finalCrownPass[0]) {
      // Keep the approach plate locked to the live Crown anchor. It dissolves
      // before core crossing, leaving Candidate B as the actual pass-through.
      finalScene.root.position.copy(crown.root.position);
      finalScene.root.scale.copy(crown.root.scale);
      finalScene.root.rotation.set(0, 0, 0);
    }
    const crownChamber = this.registry.get("crown-chamber");
    const heroPlateMask = progress >= EXPERIENCE_PHASE_RANGES.blackcrownHero[0]
      && progress < EXPERIENCE_PHASE_RANGES.crownToOcean[0] + 0.04
      && Number(crownChamber?.root.userData.bcHeroPlateOpacity ?? 0) > 0.12;
    const worldGate = this.registry.get("world-gate");
    const crownOceanPlateMask = progress >= EXPERIENCE_PHASE_RANGES.crownToOcean[0]
      && progress < EXPERIENCE_PHASE_RANGES.crownToOcean[1]
      && Number(worldGate?.root.userData.bcCrownOceanBridgeOpacity ?? 0) > 0.34;
    const finalCrownPlateMask = progress >= EXPERIENCE_PHASE_RANGES.finalCrownPass[0]
      && Number(finalScene?.root.userData.bcFinalCrownPlateOpacity ?? 0) > 0.08;
    return { ...lifecycle, ...environment, heroPlateMask, crownOceanPlateMask, finalCrownPlateMask };
  }

  get activeSceneCount() { return this.registry.activeSceneCount; }
  get activeSceneIds() { return this.registry.activeSceneIds; }
  get textureCount() { return this.assets.textureCount; }
  get authoredModelCount() { return this.assets.modelCount; }
  get evofishAssetStatus() { return this.assets.getStatus("evofish-subject").status; }
  get lightingProfile() { return this.environment.lightingProfile; }

  dispose() {
    this.registry.dispose();
    this.assets.dispose();
  }
}
