/** The authoritative server is a future adapter, not part of this local release. */
export type Json = null | string | boolean | number | Json[] | {[key:string]:Json};
export type FarmState = {version:number;coins:number;xp:number;[key:string]:Json};
export interface Clock {now():number;}
export interface Command {type:string;id?:number;key?:string;crop?:string;species?:string;region?:string;qty?:number;x?:number;z?:number;rotation?:number;}
export interface Result {ok:boolean;message:string;effect?:string;changed?:boolean;code?:string;}
export interface DomainPort {fresh(now:number):FarmState;validate(value:unknown,now:number):FarmState;tick(state:FarmState,now:number):FarmState;act(state:FarmState,command:Command,now:number):Result;resume(state:FarmState,now:number):FarmState;}
export interface KeyValueStore {getItem(key:string):string|null;setItem(key:string,value:string):void;}
export interface SaveResult {ok:boolean;message:string;conflict?:boolean;}
export interface SaveRepository {
 load(domain:DomainPort,now:number):{state:FarmState;warning:string};
 save(state:FarmState):SaveResult;
 replace(state:FarmState):SaveResult;
 inspect():{available:boolean;blocked:boolean;key:string};
}
