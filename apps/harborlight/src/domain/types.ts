export type V2={x:number;z:number};
export type Kind='cargo'|'fishing'|'ferry';
export type Phase='playing'|'upgrade'|'won'|'lost';
export interface Island extends V2 { r:number; rz:number; type:'village'|'forest'|'lighthouse'|'rock'; }
export interface Port extends V2 {id:Kind; name:string; label:string; color:string; island:number;}
export interface MapDef {id:number; name:string; subtitle:string; islands:Island[]; ports:Port[]; entries:V2[];}
export interface Ship extends V2 {id:number; kind:Kind; heading:number; path:V2[]; age:number; patience:number; hold:number; rescued:boolean; docking:number; hitCooldown:number;}
export interface Rescue extends V2 {id:number;remaining:number;}
export interface Upgrades { speed:number; patience:number; value:number; focus:number; }
export interface GameState {version:1;seed:number;rng:number;mapId:number;mode:'voyage'|'endless';phase:Phase;stage:number;time:number;stageTime:number;score:number;coins:number;delivered:number;rescued:number;strikes:number;maxStrikes:number;combo:number;bestCombo:number;lastDelivery:number;ships:Ship[];spawned:number;spawnClock:number;nextId:number;rescue:Rescue|null;rescueClock:number;focusLeft:number;focusCooldown:number;upgrades:Upgrades;events:GameEvent[];}
export interface GameEvent {id:number;type:'spawn'|'delivery'|'collision'|'miss'|'rescue'|'stage'|'route'|'focus';text:string;at:V2|null;}
export type Command={type:'route';id:number;path:V2[]}|{type:'hold';id:number}|{type:'focus'}|{type:'upgrade';key:keyof Upgrades|'repair'};
export interface Result {ok:boolean;message:string;}
