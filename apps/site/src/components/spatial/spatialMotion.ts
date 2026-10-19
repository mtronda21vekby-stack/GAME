export const SPATIAL_TIMING = { open: 1280, close: 1040, orbit: 1120, focus: 880 } as const;

/** One scroll clock for both the camera and sculpture; it never overshoots its target. */
export class ScrollJourney {
  value = 0;
  snap(target:number) { this.value = Math.max(0,Math.min(1,target)); return this.value; }
  update(target:number,deltaMs:number,options:{paused?:boolean;detailOpen?:boolean;reduced?:boolean}={}) {
    if(options.paused||options.detailOpen)return this.value;
    if(options.reduced)return this.snap(target);
    const destination=Math.max(0,Math.min(1,target));
    const elapsed=Number.isFinite(deltaMs)?Math.max(0,deltaMs):0;
    this.value+=(destination-this.value)*-Math.expm1(-elapsed/130);
    return this.value;
  }
}

/** Critically damped motion retains velocity when its destination changes. */
export class DampedScalar {
  velocity = 0;
  constructor(public value = 0, private readonly settleMs = 1000) {}
  snap(target: number) { this.value = target; this.velocity = 0; return target; }
  update(target: number, deltaMs: number) {
    const dt = Math.min(100, Math.max(0, deltaMs))/1000, omega = 7/(this.settleMs/1000);
    const offset = this.value-target, carry = this.velocity+omega*offset, decay = Math.exp(-omega*dt);
    this.value = target+(offset+carry*dt)*decay;
    this.velocity = (this.velocity-omega*carry*dt)*decay;
    if (Math.abs(this.value-target) < .00001 && Math.abs(this.velocity) < .00001) this.snap(target);
    return this.value;
  }
}

/** Quintic position/velocity continuity for an interruptible shared surface. */
export class SurfaceMotion {
  value: number[];
  velocity: number[];
  active = false;
  private from: number[];
  private initialVelocity: number[];
  private target: number[];
  private started = 0;
  private duration = 1;
  constructor(value: number[]) {
    this.value = [...value]; this.velocity = value.map(() => 0);
    this.from = [...value]; this.target = [...value]; this.initialVelocity = [...this.velocity];
  }
  rebase(value: number[], retainVelocity = false) {
    this.value = [...value]; this.target = [...value];
    if (!retainVelocity) this.velocity.fill(0);
    this.active = false;
  }
  moveTo(target: number[], duration: number, now: number) {
    this.sample(now);
    this.from = [...this.value]; this.initialVelocity = [...this.velocity]; this.target = [...target];
    this.started = now; this.duration = Math.max(1, duration); this.active = true;
  }
  finish() { this.value = [...this.target]; this.velocity.fill(0); this.active = false; }
  delay(milliseconds: number) { if (this.active) this.started += Math.max(0,milliseconds); }
  sample(now: number) {
    if (!this.active) return;
    const t = Math.max(0, Math.min(1, (now-this.started)/this.duration));
    if (t === 1) { this.finish(); return; }
    this.value = this.from.map((start, index) => {
      const distance = this.target[index]-start, v = this.initialVelocity[index]*this.duration;
      const a = 10*distance-6*v, b = -15*distance+8*v, c = 6*distance-3*v;
      this.velocity[index] = (v+3*a*t*t+4*b*t*t*t+5*c*t*t*t*t)/this.duration;
      return start+v*t+a*t*t*t+b*t*t*t*t+c*t*t*t*t*t;
    });
  }
}
