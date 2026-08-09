import { damp } from "../core/math";

export type PointerState = { x: number; y: number };

export class PointerParallax {
  private targetX = 0;
  private targetY = 0;
  private currentX = 0;
  private currentY = 0;
  private readonly enabled: boolean;
  private readonly state: PointerState = { x: 0, y: 0 };

  constructor(reducedMotion: boolean) {
    this.enabled = !reducedMotion && !window.matchMedia("(pointer: coarse)").matches;
    if (this.enabled) window.addEventListener("pointermove", this.handlePointer, { passive: true });
  }

  private handlePointer = (event: PointerEvent) => {
    if (event.isPrimary === false) return;
    this.targetX = event.clientX / Math.max(1, window.innerWidth) - 0.5;
    this.targetY = event.clientY / Math.max(1, window.innerHeight) - 0.5;
  };

  update(deltaSeconds: number) {
    this.currentX = damp(this.currentX, this.targetX, 7, deltaSeconds);
    this.currentY = damp(this.currentY, this.targetY, 7, deltaSeconds);
    this.state.x = this.currentX;
    this.state.y = this.currentY;
    return this.state;
  }

  dispose() {
    if (this.enabled) window.removeEventListener("pointermove", this.handlePointer);
  }
}
