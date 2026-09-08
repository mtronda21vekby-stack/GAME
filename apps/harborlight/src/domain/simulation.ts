import {MAPS,SHIPS,STAGES,KINDS} from './catalog.js';
import {clearPoint,distance,finitePoint,validPath,nearestApproach} from './navigation.js';
import type {GameState,Ship,V2,Command,Result,GameEvent,Upgrades} from './types.js';
export const stepLimit=1/20;
export function random(s:GameState):number{s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
export function createGame(mapId=0,seed=74023,mode:'voyage'|'endless'='voyage'):GameState{
 if(!MAPS[mapId])throw new Error('Unknown map');
 const s:GameState={version:1,seed,rng:seed>>>0,mapId,mode,phase:'playing',stage:0,time:0,stageTime:0,score:0,coins:0,delivered:0,rescued:0,strikes:0,maxStrikes:3,combo:0,bestCombo:0,lastDelivery:-999,ships:[],spawned:0,spawnClock:8,nextId:1,rescue:null,rescueClock:32,focusLeft:0,focusCooldown:0,upgrades:{speed:0,patience:0,value:0,focus:0},events:[]};
 spawn(s);return s;
}
function emit(s:GameState,type:GameEvent['type'],text:string,at:V2|null=null){s.events.push({id:s.nextId++,type,text,at});s.events=s.events.slice(-10);}
export function stage(s:GameState){return STAGES[Math.min(s.stage,2)]!;}
export function storm(s:GameState):{x:number;z:number;radius:number;active:boolean}{return {x:Math.sin(s.stageTime*.035)*5,z:Math.cos(s.stageTime*.026)*4,radius:3.4,active:s.stage>=2};}
function spawn(s:GameState){
 const map=MAPS[s.mapId]!,entryIndex=(s.spawned+s.stage*2)%map.entries.length,entry=map.entries[entryIndex]!;
 // Never spawn into an occupied entry. Defer instead of generating an unavoidable collision.
 if(s.ships.some(b=>distance(b,entry)<3))return false;
 const kind=s.stage===0?KINDS[s.spawned%3]!:KINDS[Math.floor(random(s)*3)]!,info=SHIPS[kind];
 const aim={x:entry.x*.77,z:entry.z*.77};
 const ship:Ship={id:s.nextId++,kind,...entry,heading:Math.atan2(aim.x-entry.x,aim.z-entry.z),path:clearPoint(aim,map)?[aim]:[],age:0,patience:info.patience*(1+s.upgrades.patience*.2),hold:0,rescued:false,docking:0,hitCooldown:0};
 s.ships.push(ship);s.spawned++;emit(s,'spawn',`${info.name} входит в бухту`,{...entry});return true;
}
function miss(s:GameState,ids:Set<number>,ship:Ship,message:string){ids.add(ship.id);s.strikes++;s.combo=0;emit(s,'miss',message,{x:ship.x,z:ship.z});}
function deliver(s:GameState,ship:Ship){
 s.combo=s.time-s.lastDelivery<22?Math.min(6,s.combo+1):1;s.bestCombo=Math.max(s.bestCombo,s.combo);s.lastDelivery=s.time;
 const value=Math.round(SHIPS[ship.kind].reward*(1+(s.combo-1)*.18)*(1+s.upgrades.value*.25)+(ship.rescued?75:0));
 s.score+=value;s.coins+=3;s.delivered++;emit(s,'delivery',`+${value} · судно принято${s.combo>1?' · серия ×'+s.combo:''}`,{x:ship.x,z:ship.z});
}
export function command(s:GameState,c:Command):Result{
 if(c.type==='upgrade'){
  if(s.phase!=='upgrade')return {ok:false,message:'Улучшения доступны между вахтами'};
  if(!['speed','patience','value','focus','repair'].includes(c.key))return {ok:false,message:'Неизвестное улучшение'};
  if(c.key==='repair')s.strikes=Math.max(0,s.strikes-1);else s.upgrades[c.key]++;
  s.phase='playing';s.stage++;s.stageTime=0;s.spawned=0;s.spawnClock=4;s.rescue=null;s.rescueClock=25;s.focusLeft=0;s.focusCooldown=0;spawn(s);
  return {ok:true,message:'Новая вахта началась'};
 }
 if(s.phase!=='playing')return {ok:false,message:'Вахта приостановлена'};
 if(c.type==='focus'){
  if(s.focusCooldown>0||s.focusLeft>0)return {ok:false,message:'Радар восстанавливается'};
  s.focusLeft=6;s.focusCooldown=Math.max(15,40-s.upgrades.focus*7);emit(s,'focus','Фокус: время замедлено. Перестройте маршруты.');return {ok:true,message:'Фокус включён'};
 }
 const ship=s.ships.find(b=>b.id===c.id);if(!ship||ship.docking>0)return {ok:false,message:'Выберите судно в море'};
 if(c.type==='hold'){ship.hold=ship.hold>0?0:8;return {ok:true,message:ship.hold?'Двигатели остановлены на 8 секунд':'Движение продолжено'};}
 if(c.type==='route'){
  if(!validPath(ship,c.path,MAPS[s.mapId]!))return {ok:false,message:'Маршрут пересекает сушу или скалы'};
  const end=c.path[c.path.length-1]!,port=MAPS[s.mapId]!.ports.find(p=>distance(p,end)<1.05);
  if(port&&port.id!==ship.kind)return {ok:false,message:`Нужен причал ${MAPS[s.mapId]!.ports.find(p=>p.id===ship.kind)!.label}`};
  ship.path=c.path.map(p=>({...p}));ship.hold=0;emit(s,'route','Маршрут принят');return {ok:true,message:port?'Курс на причал проложен':'Курс изменён'};
 }
 return {ok:false,message:'Неизвестная команда'};
}
/** Fixed small simulation steps prevent tunnelling and make outcomes frame-rate independent. */
export function step(s:GameState,realDt:number):void{
 if(s.phase!=='playing'||!Number.isFinite(realDt)||realDt<=0)return;
 const real=Math.min(stepLimit,realDt);const dt=real*(s.focusLeft>0?.25:1);
 s.focusLeft=Math.max(0,s.focusLeft-real);s.focusCooldown=Math.max(0,s.focusCooldown-real);
 s.time+=dt;s.stageTime+=dt;
 const spec=stage(s),total=s.mode==='endless'?10+s.stage*2:spec.ships;
 if(s.spawned<total){s.spawnClock=Math.max(0,s.spawnClock-dt);if(s.spawnClock<=0&&s.ships.length<9){if(spawn(s))s.spawnClock=Math.max(4.5,spec.interval-s.mapId*.7+(random(s)-.5)*2);else s.spawnClock=.8;}}
 const gone=new Set<number>(),before=new Map<number,V2>();const zone=storm(s);
 for(const b of s.ships){
  before.set(b.id,{x:b.x,z:b.z});
  if(b.docking>0){b.docking-=dt;if(b.docking<=0){deliver(s,b);gone.add(b.id);}continue;}
  b.age+=dt;b.hitCooldown=Math.max(0,b.hitCooldown-dt);
  if(b.age>b.patience){miss(s,gone,b,'Судно ушло: истекло время ожидания');continue;}
  if(b.hold>0){b.hold=Math.max(0,b.hold-dt);continue;}
  let travel=SHIPS[b.kind].speed*(1+s.upgrades.speed*.12)*dt;
  if(zone.active&&distance(b,zone)<zone.radius)travel*=.62;
  for(let k=0;k<4&&b.path.length&&travel>0;k++){
   const p=b.path[0]!,d=distance(b,p);if(d<.01){b.path.shift();continue;}
   b.heading=Math.atan2(p.x-b.x,p.z-b.z);const t=Math.min(d,travel)/d;b.x+=(p.x-b.x)*t;b.z+=(p.z-b.z)*t;travel-=d*t;if(t>=1)b.path.shift();
  }
  if(s.rescue&&distance(b,s.rescue)<1.3){s.rescued++;b.rescued=true;s.score+=160;b.patience+=15;emit(s,'rescue','Экипаж спасён! +160 очков',{x:b.x,z:b.z});s.rescue=null;}
  const dock=MAPS[s.mapId]!.ports.find(p=>p.id===b.kind)!;
  if(distance(b,dock)<.65&&!b.path.length){
   if(!s.ships.some(other=>other!==b&&other.kind===b.kind&&other.docking>0))b.docking=2.2;
  }
 }
 for(let i=0;i<s.ships.length;i++)for(let j=i+1;j<s.ships.length;j++){
  const a=s.ships[i]!,b=s.ships[j]!;
  if(gone.has(a.id)||gone.has(b.id)||a.docking>0||b.docking>0||a.hitCooldown>0||b.hitCooldown>0)continue;
  if(nearestApproach(before.get(a.id)!,a,before.get(b.id)!,b)<(SHIPS[a.kind].radius+SHIPS[b.kind].radius)*.86){
   gone.add(a.id);gone.add(b.id);s.strikes++;s.combo=0;emit(s,'collision','Столкновение! Разводите курсы или остановите судно.',{x:(a.x+b.x)/2,z:(a.z+b.z)/2});
  }
 }
 s.ships=s.ships.filter(b=>!gone.has(b.id));
 s.rescueClock-=dt;
 if(s.rescue){s.rescue.remaining-=dt;if(s.rescue.remaining<=0){emit(s,'miss','Другой спасатель забрал экипаж. Бонус упущен.');s.rescue=null;}}
 else if(s.rescueClock<=0){const candidates=[{x:0,z:7},{x:-6,z:4},{x:3,z:-1}];const p=candidates[Math.floor(random(s)*candidates.length)]!;if(clearPoint(p,MAPS[s.mapId]!)){s.rescue={id:s.nextId++,...p,remaining:27};emit(s,'rescue','SOS! Проведите любое судно рядом со шлюпкой.',p);}s.rescueClock=48;}
 if(s.strikes>=s.maxStrikes){s.phase='lost';return;}
 if(s.spawned>=total&&s.ships.length===0){
  s.score+=spec.bonus;
  if(s.stage===2&&s.mode==='voyage')s.phase='won';else s.phase='upgrade';
  emit(s,'stage',s.phase==='won'?'Экспедиция завершена!':'Вахта завершена. Выберите улучшение.');
 }
}
export function advance(s:GameState,seconds:number){let remaining=Math.min(Math.max(0,seconds),3600);while(remaining>1e-8&&s.phase==='playing'){const dt=Math.min(stepLimit,remaining);step(s,dt);remaining-=dt;}return s;}
/** Persistence validates every mutable navigation field; corrupt/future saves are never executed. */
export function restore(raw:unknown):GameState{
 if(!raw||typeof raw!=='object')throw Error('Сохранение повреждено');const s=structuredClone(raw) as GameState;
 if(s.version!==1||!MAPS[s.mapId]||!['playing','upgrade','won','lost'].includes(s.phase)||!['voyage','endless'].includes(s.mode))throw Error('Неизвестная версия рейса');
 for(const k of ['seed','rng','stage','time','stageTime','score','coins','delivered','rescued','strikes','maxStrikes','combo','bestCombo','spawned','spawnClock','nextId','rescueClock','focusLeft','focusCooldown'] as const)if(!Number.isFinite(s[k])||s[k]<0||s[k]>1e10)throw Error('Повреждённые числовые данные');
 if(!Number.isFinite(s.lastDelivery)||s.stage>200||s.strikes>10||s.maxStrikes!==3)throw Error('Некорректный рейс');
 for(const k of ['speed','patience','value','focus'] as (keyof Upgrades)[])if(!s.upgrades||!Number.isSafeInteger(s.upgrades[k])||s.upgrades[k]<0||s.upgrades[k]>200)throw Error('Некорректные улучшения');
 if(!Array.isArray(s.ships)||s.ships.length>9)throw Error('Некорректный флот');const ids=new Set<number>();
 for(const b of s.ships){
  if(!Number.isSafeInteger(b.id)||ids.has(b.id)||!KINDS.includes(b.kind)||!finitePoint(b)||!Array.isArray(b.path)||b.path.length>160||b.path.some(p=>!finitePoint(p)))throw Error('Повреждённый маршрут');
  ids.add(b.id);for(const k of ['heading','age','patience','hold','docking','hitCooldown'] as const)if(!Number.isFinite(b[k]))throw Error('Повреждённое судно');
  if(b.age<0||b.patience<=0||b.hold<0||b.docking<0)throw Error('Некорректное состояние судна');
  if(b.path.length&&!validPath(b,b.path,MAPS[s.mapId]!))throw Error('Маршрут проходит через сушу');
 }
 if(s.rescue&&(!finitePoint(s.rescue)||!Number.isFinite(s.rescue.remaining)||s.rescue.remaining<=0))throw Error('Некорректный сигнал SOS');
 s.events=[];return s;
}
