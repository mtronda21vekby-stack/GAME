/** Versioned local game boundary. These contracts are not an implemented network server. */
export interface Clock { now(): number; }
export interface KeyValueStore { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export interface FarmState { version: number; coins: number; xp: number; [key: string]: Json; }
export interface ActionResult { ok: boolean; message: string; effect?: string; changed?: boolean; code?: string; }
export interface CommandDraft { type: string; id?: number; key?: string; crop?: string; species?: string; region?: string; qty?: number; x?: number; z?: number; rotation?: number; }
export type Command =
 | {type:'plant';id:number;crop:'carrot'|'wheat'|'pumpkin'}
 | {type:'water'|'harvest'|'unlock'|'feed'|'pet'|'collect'|'plantTree'|'waterTree'|'harvestTree'|'removeDecor'|'deliverOrder'|'claimStory'|'collectCraft';id:number}
 | {type:'clear'|'upgrade'|'claim'|'talkCharacter'|'buildWorkshop'|'craft';key:string}
 | {type:'buyMaterial';key:string;qty?:number}
 | {type:'buyAnimal';species:'cow'|'sheep'|'chicken'}
 | {type:'travel';region:'farm'|'orchard'|'river'|'forest'}
 | {type:'sell';key?:string;qty?:number}
 | {type:'placeDecor';key:string;region:'farm'|'orchard'|'river'|'forest';x:number;z:number;rotation:number}
 | {type:'collectHoney'|'refreshOrders'|'payRent'|'markIntroSeen'|'deliverFestival'};
export interface DomainPort {
  fresh(now: number): FarmState;
  validate(raw: unknown, now: number): FarmState;
  tick(state: FarmState, now: number): FarmState;
  resume(state: FarmState, now: number): FarmState;
  act(state: FarmState, command: Command, now: number): ActionResult;
}
export interface Receipt { id: string; command: string; result: ActionResult; }
export interface SavedGame { state: FarmState; revision: number; receipts: Receipt[]; }
export interface LoadResult extends SavedGame { available: boolean; blocked: boolean; warning: string; }
export interface SaveResult { ok: boolean; conflict: boolean; message: string; }
export interface SaveRepository {
  load(domain: DomainPort, now: number): LoadResult;
  write(value: SavedGame, expectedRevision: number, now: number): SaveResult;
  replace(value: SavedGame, now: number): SaveResult;
  inspect(): Readonly<{ blocked: boolean; available: boolean; key: string }>;
}
export interface SessionEvent { kind: 'command' | 'tick' | 'import'; revision: number; result?: ActionResult; }
