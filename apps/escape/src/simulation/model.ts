export type Vec2 = { x: number; z: number };

export type SchedulePhaseId =
  | "roll-call"
  | "breakfast"
  | "work-am"
  | "free-noon"
  | "lunch"
  | "work-pm"
  | "free-evening"
  | "dinner"
  | "lockup";

export type GuardState = {
  id: string;
  position: Vec2;
  heading: number;
  routeIndex: number;
  seesPlayer: boolean;
};

export type InmateState = {
  id: string;
  position: Vec2;
  target: Vec2;
  speed: number;
};

export type PlayerState = {
  position: Vec2;
  health: number;
  stamina: number;
  suspicion: number;
  reputation: number;
  money: number;
  hasScrewdriver: boolean;
  powerDisabled: boolean;
  escaped: boolean;
  caughtCount: number;
};

export type GameState = {
  day: number;
  minuteOfDay: number;
  phaseId: SchedulePhaseId;
  phaseLabel: string;
  phaseEndsAt: number;
  player: PlayerState;
  guards: GuardState[];
  inmates: InmateState[];
  log: string[];
};

export type GameSnapshot = {
  world: "breakout";
  version: "0.1.0";
  day: number;
  clock: string;
  phase: string;
  objective: string;
  player: Pick<
    PlayerState,
    | "health"
    | "stamina"
    | "suspicion"
    | "reputation"
    | "money"
    | "hasScrewdriver"
    | "powerDisabled"
    | "escaped"
    | "caughtCount"
  >;
};

export const START_POSITION: Vec2 = { x: -15.5, z: -8.7 };

export function createInitialState(): GameState {
  return {
    day: 1,
    minuteOfDay: 8 * 60 + 24,
    phaseId: "breakfast",
    phaseLabel: "BREAKFAST",
    phaseEndsAt: 8 * 60 + 30,
    player: {
      position: { ...START_POSITION },
      health: 100,
      stamina: 100,
      suspicion: 0,
      reputation: 0,
      money: 12,
      hasScrewdriver: false,
      powerDisabled: false,
      escaped: false,
      caughtCount: 0,
    },
    guards: [
      { id: "G-17", position: { x: -9, z: -2.4 }, heading: 0, routeIndex: 0, seesPlayer: false },
      { id: "G-42", position: { x: 7, z: -3.0 }, heading: Math.PI, routeIndex: 0, seesPlayer: false },
    ],
    inmates: [
      { id: "Rook", position: { x: -9, z: 4 }, target: { x: -9, z: 4 }, speed: 1.45 },
      { id: "Marco", position: { x: -7, z: 7 }, target: { x: -7, z: 7 }, speed: 1.35 },
      { id: "Vale", position: { x: 5, z: 8 }, target: { x: 5, z: 8 }, speed: 1.4 },
      { id: "Nash", position: { x: 8, z: 5 }, target: { x: 8, z: 5 }, speed: 1.3 },
    ],
    log: ["DAY 01 · 08:24 — Breakfast is ending. Maintenance shift begins at 08:30."],
  };
}

export function objectiveFor(state: GameState): string {
  if (state.player.escaped) return "ESCAPED — Maintenance route complete.";
  if (!state.player.hasScrewdriver) {
    return state.phaseId === "work-am" || state.phaseId === "work-pm"
      ? "Maintenance shift active: take the screwdriver from the workbench."
      : "Wait for WORK or risk entering Maintenance off-schedule. Find a screwdriver.";
  }
  if (!state.player.powerDisabled) return "Use the screwdriver on the service power panel to release the magnetic gate.";
  return "POWER OFF — cross the service gate before security reacts.";
}

export function pushLog(state: GameState, message: string): void {
  state.log = [message, ...state.log].slice(0, 5);
}
