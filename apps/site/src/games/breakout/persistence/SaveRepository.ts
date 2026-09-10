import type { GameSnapshot } from "../simulation/model";
import { createInitialSnapshot } from "../simulation/state";
export interface SaveRepository{load():GameSnapshot;save(snapshot:GameSnapshot):void;clear():void}
export const BREAKOUT_SAVE_NAMESPACE="bc.world.breakout.v1";
function isSnapshot(v:unknown):v is GameSnapshot{if(!v||typeof v!=="object")return false;const c=v as Partial<GameSnapshot>;return c.version===1&&typeof c.day==="number"&&typeof c.minuteOfDay==="number"&&Array.isArray(c.inventory)&&Array.isArray(c.objectives);}
export class LocalSaveRepository implements SaveRepository{load(){try{const raw=localStorage.getItem(BREAKOUT_SAVE_NAMESPACE);if(!raw)return createInitialSnapshot();const parsed:unknown=JSON.parse(raw);return isSnapshot(parsed)?parsed:createInitialSnapshot();}catch{return createInitialSnapshot();}}save(snapshot:GameSnapshot){try{localStorage.setItem(BREAKOUT_SAVE_NAMESPACE,JSON.stringify(snapshot));}catch{/* restricted storage must not break play */}}clear(){try{localStorage.removeItem(BREAKOUT_SAVE_NAMESPACE);}catch{/* no-op */}}}
