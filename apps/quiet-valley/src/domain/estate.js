/* Island estate growth and staff automation. Composes on top of expansion without weakening save migration. */
'use strict';
export function createEstate(X, clock) {
 const S=X.sim,base={fresh:S.fresh,validate:S.validate,tick:S.tick,act:S.act};
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+n)?+n:a));
 const integer=(n,a,b)=>Math.floor(clamp(n,a,b));
 const estateTiers={
  1:{name:'Семейный остров',area:100,slots:0,buildSlots:0,cost:null,unlocks:['Базовая ферма']},
  2:{name:'Расширенная усадьба',area:125,slots:1,buildSlots:2,cost:{coins:180,wood:10,stone:8},unlocks:['Хозяйственные здания','Первый сотрудник']},
  3:{name:'Большое хозяйство',area:155,slots:2,buildSlots:4,cost:{coins:450,wood:18,stone:14},unlocks:['Дом персонала','Автосбор продукции','Пасечник']},
  4:{name:'Фермерское поместье',area:190,slots:3,buildSlots:6,cost:{coins:900,wood:30,stone:24},unlocks:['Теплица','Прораб','Расширенная команда']}
 };
 const estateBuildings={
  tool_shed:{name:'Инвентарный сарай',icon:'🧰',tier:2,cost:{coins:90,wood:7,stone:2},desc:'Открывает найм садовника и хранит инструменты для автоматического полива.'},
  bunkhouse:{name:'Домик работников',icon:'🏠',tier:2,cost:{coins:120,wood:10,stone:4},desc:'Открывает скотника и добавляет 1 место для персонала.',staffSlots:1},
  staff_house:{name:'Дом персонала',icon:'🏡',tier:3,cost:{coins:240,wood:16,stone:8},desc:'Открывает сборщика и добавляет ещё 2 места для персонала.',staffSlots:2},
  honey_house:{name:'Медовый домик',icon:'🍯',tier:3,cost:{coins:210,wood:12,stone:7},desc:'Открывает пасечника, который переносит готовый мёд в амбар.'},
  greenhouse:{name:'Теплица',icon:'🌿',tier:4,cost:{coins:360,wood:18,stone:12},desc:'Новые посевы растут на 15% быстрее на всей ферме.'},
  works_depot:{name:'Строительный двор',icon:'🏗️',tier:4,cost:{coins:420,wood:20,stone:16},desc:'Открывает прораба: он постепенно пополняет древесину и камень.'}
 };
 const staffRoles={
  gardener:{name:'Садовник',icon:'🧑‍🌾',tier:2,cost:120,requires:'tool_shed',desc:'Автоматически поливает сухие посадки и яблони.'},
  rancher:{name:'Скотник',icon:'🐄',tier:2,cost:150,requires:'bunkhouse',desc:'Кормит животных пшеницей, когда сытость падает ниже 45%.'},
  collector:{name:'Сборщик',icon:'🧺',tier:3,cost:180,requires:'staff_house',desc:'Автоматически переносит готовое молоко, яйца и шерсть в амбар.'},
  beekeeper:{name:'Пасечник',icon:'🐝',tier:3,cost:190,requires:'honey_house',desc:'Забирает готовый мёд с пасеки, когда он появляется.'},
  foreman:{name:'Прораб',icon:'🛠️',tier:4,cost:260,requires:'works_depot',desc:'Каждую рабочую смену добавляет древесину и камень для новых построек.'}
 };
 const freshEstate=now=>({tier:1,buildings:[],staff:[],lastShiftAt:now});
 const estate=s=>s.world.estate||(s.world.estate=freshEstate(clock.now()));
 const hasBuilding=(s,key)=>estate(s).buildings.includes(key);
 const hasStaff=(s,key)=>estate(s).staff.includes(key);
 const staffCapacity=s=>estateTiers[estate(s).tier].slots+estate(s).buildings.reduce((n,key)=>n+(estateBuildings[key]?.staffSlots||0),0);
 const buildingCapacity=s=>estateTiers[estate(s).tier].buildSlots;
 const estateStatus=s=>({tier:estate(s).tier,meta:estateTiers[estate(s).tier],next:estateTiers[estate(s).tier+1]||null,staffCapacity:staffCapacity(s),buildingCapacity:buildingCapacity(s),buildings:estate(s).buildings,staff:estate(s).staff});
 function canAfford(s,c){return s.coins>=c.coins&&s.world.materials.wood>=c.wood&&s.world.materials.stone>=c.stone;}
 function pay(s,c){s.coins-=c.coins;s.world.materials.wood-=c.wood;s.world.materials.stone-=c.stone;}
 function waterByStaff(s,now){
  if(!hasStaff(s,'gardener'))return;
  for(const p of s.plots){
   if(!p.unlocked||!p.crop||p.waterAt)continue;
   const region=X.plotRegion(p.id);p.waterAt=now;p.readyAt=now+X.duration(s,region,S.CROPS[p.crop].seconds);
  }
  if(s.world.trees)for(const t of s.world.trees){if(!t.planted||t.waterAt)continue;t.waterAt=now;t.readyAt=now+X.duration(s,'orchard',70);}
 }
 function ranchByStaff(s){
  if(!hasStaff(s,'rancher'))return;
  for(const a of s.animals){
   if(a.hunger>=45||s.inventory.wheat<1)continue;
   s.inventory.wheat--;a.hunger=clamp(a.hunger+45,0,100);a.mood=clamp(a.mood+4,0,100);s.stats.feeds=(s.stats.feeds||0)+1;
  }
 }
 function collectByStaff(s){
  if(!hasStaff(s,'collector'))return;
  for(const a of s.animals){if(a.stock<1)continue;const key=S.SPECIES[a.type].product;s.inventory[key]+=a.stock;a.stock=0;}
 }
 function honeyByStaff(s){
  if(!hasStaff(s,'beekeeper')||!s.world.apiaryStock)return;
  s.inventory.honey+=s.world.apiaryStock;s.world.apiaryStock=0;
 }
 function foremanShift(s,now){
  const e=estate(s);if(!hasStaff(s,'foreman')){e.lastShiftAt=now;return;}
  const cycles=Math.min(8,Math.floor(Math.max(0,now-e.lastShiftAt)/120000));
  if(!cycles)return;e.lastShiftAt+=cycles*120000;s.world.materials.wood+=cycles;s.world.materials.stone+=cycles;
 }
 S.fresh=function(now=clock.now()){const s=base.fresh(now);s.world.estate=freshEstate(now);return s;};
 S.validate=function(raw,now=clock.now()){
  const s=base.validate(raw,now),r=raw?.world?.estate,e=freshEstate(now);
  if(r&&typeof r==='object'){
   e.tier=integer(r.tier,1,4);
   e.buildings=(Array.isArray(r.buildings)?r.buildings:[]).filter((k,i,a)=>typeof k==='string'&&own(estateBuildings,k)&&estateBuildings[k].tier<=e.tier&&a.indexOf(k)===i).slice(0,estateTiers[e.tier].buildSlots);
   e.staff=(Array.isArray(r.staff)?r.staff:[]).filter((k,i,a)=>typeof k==='string'&&own(staffRoles,k)&&staffRoles[k].tier<=e.tier&&e.buildings.includes(staffRoles[k].requires)&&a.indexOf(k)===i);
   const cap=estateTiers[e.tier].slots+e.buildings.reduce((n,k)=>n+(estateBuildings[k]?.staffSlots||0),0);e.staff=e.staff.slice(0,cap);
   e.lastShiftAt=Math.min(now,Math.max(1,Number.isFinite(r.lastShiftAt)?r.lastShiftAt:now));
  }
  s.world.estate=e;return s;
 };
 S.tick=function(s,now=clock.now()){
  base.tick(s,now);if(!s.world?.estate)s.world.estate=freshEstate(now);
  waterByStaff(s,now);ranchByStaff(s);collectByStaff(s);honeyByStaff(s);foremanShift(s,now);return s;
 };
 S.act=function(s,a,now=clock.now()){
  if(!a||typeof a!=='object')return {ok:false,message:'Некорректное действие'};
  S.tick(s,now);const fail=message=>({ok:false,message}),done=(message,effect='build')=>({ok:true,message,effect}),e=estate(s);
  if(a.type==='expandEstate'){
   if(e.tier>=4)return fail('Остров уже достиг максимального размера');const next=estateTiers[e.tier+1],c=next.cost;
   if(!canAfford(s,c))return fail('Для расширения нужно '+c.coins+' монет, '+c.wood+' древесины и '+c.stone+' камня');
   pay(s,c);e.tier++;s.xp+=35;return done('Остров расширен: '+estateTiers[e.tier].name+' · территория '+estateTiers[e.tier].area+'% · +35 опыта','build');
  }
  if(a.type==='buildEstate'){
   const b=own(estateBuildings,a.key)?estateBuildings[a.key]:null;if(!b)return fail('Неизвестная хозяйственная постройка');
   if(e.tier<b.tier)return fail('Сначала расширьте остров до уровня '+b.tier);if(e.buildings.includes(a.key))return fail('Уже построено');
   if(e.buildings.length>=buildingCapacity(s))return fail('На этом уровне острова закончились места под крупные постройки');
   if(!canAfford(s,b.cost))return fail('Не хватает ресурсов для строительства');pay(s,b.cost);e.buildings.push(a.key);s.xp+=20;return done(b.name+' построен · +20 опыта');
  }
  if(a.type==='hireStaff'){
   const role=own(staffRoles,a.key)?staffRoles[a.key]:null;if(!role)return fail('Неизвестная профессия');if(e.tier<role.tier)return fail('Эта профессия откроется после расширения острова');
   if(!hasBuilding(s,role.requires))return fail('Сначала постройте: '+estateBuildings[role.requires].name);if(e.staff.includes(a.key))return fail('Этот специалист уже работает у вас');
   if(e.staff.length>=staffCapacity(s))return fail('Нет свободного места для персонала — расширьте остров или жильё');if(s.coins<role.cost)return fail('Нужно '+role.cost+' монет на найм');
   s.coins-=role.cost;e.staff.push(a.key);s.xp+=15;return done(role.name+' принят на работу · +15 опыта','heart');
  }
  if(a.type==='dismissStaff'){
   const i=e.staff.indexOf(a.key);if(i<0)return fail('Этот сотрудник у вас не работает');const role=staffRoles[a.key];e.staff.splice(i,1);return done(role.name+' больше не числится в штате','coins');
  }
  const result=base.act(s,a,now);
  if(result.ok&&a.type==='plant'&&hasBuilding(s,'greenhouse')){const p=s.plots[a.id];if(p?.crop&&p.readyAt>now)p.readyAt=now+Math.round((p.readyAt-now)*.85);}
  return result;
 };
 return {...X,sim:S,estateTiers,estateBuildings,staffRoles,estateStatus,hasBuilding,hasStaff,staffCapacity,buildingCapacity};
}
