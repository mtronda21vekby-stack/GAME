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
    this.registry.register(new CrownChamberScene());
    this.registry.register(new WorldGateScene());
    this.registry.register(new EvoFishAbyssScene(this.assets));
    this.registry.register(new CrownFrontReactorScene());
    this.registry.register(new NetworkCoreScene());
    this.registry.register(new CollectionVaultScene());
    this.registry.register(new IdentityScene());
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
    this.environment.update(progress, lifecycle, quality, reducedMotion, crown, particles, portal, ecosystem);
    return lifecycle;
  }

  get activeSceneCount() { return this.registry.activeSceneCount; }
  get activeSceneIds() { return this.registry.activeSceneIds; }
  get textureCount() { return this.assets.textureCount; }
  get evofishAssetStatus() { return this.assets.getStatus("evofish-subject").status; }
  get lightingProfile() { return this.environment.lightingProfile; }

  dispose() {
    this.registry.dispose();
    this.assets.dispose();
  }
}
