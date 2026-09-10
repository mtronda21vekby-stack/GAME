export type MoveVector = { x: number; z: number };

export class InputController {
  private readonly keys = new Set<string>();
  private virtual: MoveVector = { x: 0, z: 0 };
  private interactQueued = false;

  private readonly onKeyDown = (event: KeyboardEvent) => {
    this.keys.add(event.code);
    if (event.code === "KeyE" || event.code === "Space") {
      event.preventDefault();
      this.interactQueued = true;
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code);
  };

  attach(): void {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  detach(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.keys.clear();
    this.virtual = { x: 0, z: 0 };
    this.interactQueued = false;
  }

  movement(): MoveVector {
    const left = this.keys.has("KeyA") || this.keys.has("ArrowLeft") ? 1 : 0;
    const right = this.keys.has("KeyD") || this.keys.has("ArrowRight") ? 1 : 0;
    const up = this.keys.has("KeyW") || this.keys.has("ArrowUp") ? 1 : 0;
    const down = this.keys.has("KeyS") || this.keys.has("ArrowDown") ? 1 : 0;
    const x = right - left + this.virtual.x;
    const z = down - up + this.virtual.z;
    const length = Math.hypot(x, z);
    return length > 1 ? { x: x / length, z: z / length } : { x, z };
  }

  setVirtual(vector: MoveVector): void {
    const length = Math.hypot(vector.x, vector.z);
    this.virtual = length > 1 ? { x: vector.x / length, z: vector.z / length } : vector;
  }

  queueInteract(): void {
    this.interactQueued = true;
  }

  consumeInteract(): boolean {
    const queued = this.interactQueued;
    this.interactQueued = false;
    return queued;
  }
}
