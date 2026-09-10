import { InputController, type MoveVector } from "./input/InputController";
import { PrisonScene, type InteractableId } from "./rendering/PrisonScene";
import { LocalSaveRepository, type SaveRepository } from "../persistence/SaveRepository";
import type { GameSnapshot, PlayerZone } from "../simulation/model";
import {
  capturePlayer,
  craftServiceShim,
  reachMaintenance,
  searchLocker,
  searchWorkshopBin,
  tickSimulation,
  unlockServiceHatch,
} from "../simulation/state";

export type RuntimeView = {
  snapshot: GameSnapshot;
  playerZone: PlayerZone;
  nearby: InteractableId | null;
  prompt: string | null;
  message: string | null;
  guardWatching: boolean;
};

type Subscriber = (view: RuntimeView) => void;

const INTERACTION_PROMPTS: Record<InteractableId, string> = {
  locker: "E · Осмотреть шкафчик",
  "workshop-bin": "E · Осмотреть ящик мастерской",
  "service-hatch": "E · Проверить служебный люк",
};

export class GameRuntime {
  readonly input = new InputController();
  private readonly scene: PrisonScene;
  private readonly saves: SaveRepository;
  private readonly subscribers = new Set<Subscriber>();
  private snapshot: GameSnapshot;
  private view: RuntimeView;
  private raf = 0;
  private previousAt = performance.now();
  private lastSavedAt = 0;
  private messageExpiresAt = 0;
  private stopped = false;

  constructor(container: HTMLElement, saves: SaveRepository = new LocalSaveRepository()) {
    this.saves = saves;
    this.snapshot = saves.load();
    this.scene = new PrisonScene(container);
    this.scene.setServiceHatchUnlocked(this.snapshot.flags.serviceHatchUnlocked);
    this.view = {
      snapshot: this.snapshot,
      playerZone: "cell",
      nearby: null,
      prompt: null,
      message: "Первый день. Через несколько минут — перекличка.",
      guardWatching: false,
    };
    this.messageExpiresAt = performance.now() + 4200;
  }

  start(): void {
    this.input.attach();
    this.previousAt = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    cancelAnimationFrame(this.raf);
    this.input.detach();
    this.saves.save(this.snapshot);
    this.scene.dispose();
    this.subscribers.clear();
  }

  subscribe(subscriber: Subscriber): () => void {
    this.subscribers.add(subscriber);
    subscriber(this.view);
    return () => this.subscribers.delete(subscriber);
  }

  setVirtualMovement(vector: MoveVector): void {
    this.input.setVirtual(vector);
  }

  interact(): void {
    this.input.queueInteract();
  }

  craft(): void {
    const result = craftServiceShim(this.snapshot);
    this.applySnapshot(result.snapshot);
    this.showMessage(result.message);
  }

  resetProgress(): void {
    this.saves.clear();
    window.location.reload();
  }

  private applySnapshot(next: GameSnapshot): void {
    this.snapshot = next;
    this.scene.setServiceHatchUnlocked(next.flags.serviceHatchUnlocked);
  }

  private showMessage(message: string, durationMs = 3000): void {
    this.view = { ...this.view, message };
    this.messageExpiresAt = performance.now() + durationMs;
  }

  private runInteraction(id: InteractableId): void {
    if (id === "locker") {
      const result = searchLocker(this.snapshot);
      this.applySnapshot(result.snapshot);
      this.showMessage(result.message);
      return;
    }
    if (id === "workshop-bin") {
      const result = searchWorkshopBin(this.snapshot);
      this.applySnapshot(result.snapshot);
      this.showMessage(result.message);
      return;
    }
    const result = unlockServiceHatch(this.snapshot);
    this.applySnapshot(result.snapshot);
    this.showMessage(result.message);
  }

  private frame = (now: number): void => {
    if (this.stopped) return;
    const elapsed = Math.min((now - this.previousAt) / 1000, 0.1);
    this.previousAt = now;

    const frame = this.scene.update(this.input.movement());
    this.snapshot = tickSimulation(this.snapshot, elapsed, {
      playerZone: frame.playerZone,
      guardCanSeePlayer: frame.guardCanSeePlayer,
    });

    if (this.input.consumeInteract() && frame.nearestInteractable) {
      this.runInteraction(frame.nearestInteractable);
    }

    if (frame.playerZone === "maintenance" && this.snapshot.flags.serviceHatchUnlocked && !this.snapshot.flags.firstRouteComplete) {
      this.snapshot = reachMaintenance(this.snapshot);
      this.showMessage("Маршрут найден. Теперь ты знаешь путь в служебный сектор. +25 монет · +10 репутации", 5200);
    }

    if (this.snapshot.stats.suspicion >= 100 || frame.guardDistance < 0.62) {
      this.snapshot = capturePlayer(this.snapshot);
      this.scene.resetPlayerToCell();
      this.showMessage("Тебя остановила охрана. Обыск окончен — ты снова в камере.", 4200);
    }

    if (this.view.message && now > this.messageExpiresAt) this.view = { ...this.view, message: null };

    const prompt = frame.nearestInteractable ? INTERACTION_PROMPTS[frame.nearestInteractable] : null;
    this.view = {
      ...this.view,
      snapshot: this.snapshot,
      playerZone: frame.playerZone,
      nearby: frame.nearestInteractable,
      prompt,
      guardWatching: frame.guardCanSeePlayer,
    };

    if (now - this.lastSavedAt > 1800) {
      this.saves.save(this.snapshot);
      this.lastSavedAt = now;
    }

    for (const subscriber of this.subscribers) subscriber(this.view);
    this.raf = requestAnimationFrame(this.frame);
  };
}
