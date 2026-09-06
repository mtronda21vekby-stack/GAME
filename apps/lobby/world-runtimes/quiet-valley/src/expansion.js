/* Valley expansion: deterministic economy, save migration, terrain projects and placement.
 * All amounts are fictional game resources. Client-side saves are not secure online balances.
 */
'use strict';
const FarmExpansion = ((S) => {
  const regions = {
    farm: {name:'Домашняя ферма',short:'Ферма',icon:'🏡',tag:'ЗДЕСЬ ВСЁ НАЧАЛОСЬ',description:'Уютный дом, огород и ваши животные. Проведите полив и обустройте двор.',color:'#b6c98c'},
    orchard: {name:'Яблоневый сад',short:'Сад',icon:'🍎',tag:'ВРЕМЯ ПУСКАТЬ КОРНИ',description:'Расчистите старый сад. Посадите шесть яблонь, поливайте их и собирайте яблоки.',color:'#d8ba98'},
    river: {name:'Речной берег',short:'Река',icon:'🌊',tag:'НА ДРУГОМ БЕРЕГУ',description:'Почините мост и обустройте восемь новых грядок. Водяное колесо обеспечит автополив.',color:'#99c1bb'},
    forest: {name:'Лесная поляна',short:'Лес',icon:'🌲',tag:'СЛУШАЙТЕ, КАК ЖИВЁТ ЛЕС',description:'Собирайте древесину и камень. Постройте пасеку и забирайте свежий мёд.',color:'#92aa8c'}
  };
  const projects = {
    farm_paths:{region:'farm',name:'Каменные дорожки',icon:'🪨',desc:'Вместо грунтовой тропы — мощёная дорожка и фонари у дома.',coins:25,wood:0,stone:3,max:1},
    farm_soil:{region:'farm',name:'Компостер и плодородие',icon:'🌱',desc:'Новые посадки растут на 15% быстрее за уровень. Два уровня, до −30% времени.',coins:40,wood:4,stone:0,max:2},
    farm_water:{region:'farm',name:'Система автополива',icon:'💧',desc:'Резервуар и дождеватели. Поливают сухие посадки и все будущие семена автоматически.',coins:80,wood:5,stone:4,max:1,requires:'farm_paths'},
    orchard_clear:{region:'orchard',name:'Расчистить старый сад',icon:'🪓',desc:'Убирает заросли и открывает шесть мест для яблонь. Каждая посадка — 15 монет.',coins:30,wood:0,stone:0,max:1},
    orchard_soil:{region:'orchard',name:'Плодородная земля',icon:'🌱',desc:'Новые циклы яблонь на 15% быстрее за уровень. Максимум −30%.',coins:40,wood:3,stone:0,max:2,requires:'orchard_clear'},
    orchard_water:{region:'orchard',name:'Капельное орошение',icon:'💧',desc:'После посадки и сбора яблок следующий цикл начинается автоматически.',coins:70,wood:4,stone:3,max:1,requires:'orchard_clear'},
    orchard_arbor:{region:'orchard',name:'Пергола для отдыха',icon:'🌸',desc:'Деревянная пергола, скамейки и цветущая изгородь. Визуальное благоустройство сада.',coins:45,wood:5,stone:1,max:1,requires:'orchard_clear'},
    river_bridge:{region:'river',name:'Восстановить мост',icon:'🌉',desc:'Полноценный деревянный мост вместо обломков. Открывает строительство на правом берегу.',coins:40,wood:6,stone:3,max:1},
    river_fields:{region:'river',name:'Обустроить террасы',icon:'🥕',desc:'Расчистка правого берега, каменные подпорные стенки и восемь новых грядок.',coins:45,wood:2,stone:5,max:1,requires:'river_bridge'},
    river_water:{region:'river',name:'Водяное колесо',icon:'⚙️',desc:'Колесо вращается в реке и снабжает новые грядки автоматическим поливом.',coins:85,wood:6,stone:4,max:1,requires:'river_fields'},
    river_soil:{region:'river',name:'Обогатить почву',icon:'🌱',desc:'Новые посадки на террасах растут на 15% быстрее за уровень, до −30%.',coins:40,wood:3,stone:0,max:2,requires:'river_fields'},
    forest_paths:{region:'forest',name:'Лесная тропа',icon:'🪨',desc:'Мощение, указатели и тёплые фонари. Поляна становится обжитой.',coins:25,wood:0,stone:3,max:1},
    forest_apiary:{region:'forest',name:'Построить пасеку',icon:'🐝',desc:'Три улья. 1 баночка мёда каждые 45 секунд, вместимость пасеки — 3.',coins:60,wood:8,stone:3,max:1},
    forest_cabin:{region:'forest',name:'Домик пасечника',icon:'🏠',desc:'Домик с навесом и хранилищем. Увеличивает запас мёда с 3 до 6 баночек.',coins:65,wood:7,stone:4,max:1,requires:'forest_apiary'}
  };
  const decor = {
    path:{name:'Плитка дорожки',icon:'🪨',price:4},flowers:{name:'Цветник',icon:'🌷',price:10},
    bench:{name:'Скамейка',icon:'🪑',price:18},lamp:{name:'Фонарь',icon:'🏮',price:16},
    tree:{name:'Декоративное дерево',icon:'🌳',price:20},fence:{name:'Изгородь',icon:'🪵',price:8}
  };
  const fruitSites = Array.from({length:6},(_,id)=>({id,x:-4+(id%3)*3.8,z:-3+Math.floor(id/3)*4.0}));
  const resourceNodes = [
    ...[[-10,5],[-10,-.7],[10,6]].map(([x,z],i)=>({key:'farm'+i,region:'farm',x,z,type:i===1?'stone':'wood',amount:4})),
    ...[[-8,3],[8,1],[6,-7]].map(([x,z],i)=>({key:'orchard'+i,region:'orchard',x,z,type:i===1?'stone':'wood',amount:5})),
    ...[[-7,4],[-8,-3],[6,6],[7,-6]].map(([x,z],i)=>({key:'river'+i,region:'river',x,z,type:i%2?'wood':'stone',amount:5})),
    ...[[-6,-4],[-4,-7],[.2,-6],[6,-5],[8,1],[7,5],[-8,1],[-7,5]].map(([x,z],i)=>({key:'forest'+i,region:'forest',x,z,type:i%3===1?'stone':'wood',amount:6}))
  ];
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const finite=(n,d=0)=>Number.isFinite(n)?n:d;
  const bound=(n,a,b)=>Math.max(a,Math.min(b,finite(n)));
  const integer=(n,a,b)=>Math.floor(bound(n,a,b));
  const level=(s,key)=>s.world?.projects?.[key]||0;
  const plotRegion=id=>id<16?'farm':'river';
  const irrigated=(s,region)=>level(s,region+'_water')>0;
  const duration=(s,region,seconds)=>Math.round(seconds*1000*(1-.15*level(s,region+'_soil')));
  const defaults=(now)=>({region:'farm',materials:{wood:8,stone:6},projects:{},cleared:[],decor:[],nextDecorId:1,
    trees:fruitSites.map(p=>({id:p.id,planted:false,waterAt:0,readyAt:0})),apiaryAt:now,apiaryStock:0});
  const base={fresh:S.fresh,validate:S.validate,tick:S.tick,act:S.act};
  S.PRODUCTS.apple={name:'Яблоки',icon:'🍎',price:12};
  S.PRODUCTS.honey={name:'Мёд',icon:'🍯',price:26};
  const newPlot=id=>({id,unlocked:false,crop:null,plantedAt:0,waterAt:0,readyAt:0});
  S.fresh=function(now=Date.now()) {
    const s=base.fresh(now);s.version=2;s.world=defaults(now);s.inventory.apple=0;s.inventory.honey=0;
    for(let id=16;id<24;id++)s.plots.push(newPlot(id));return s;
  };
  // Placement grid is deliberately bounded, outside buildings, crops, waterways and work sites.
  function allowedCell(region,x,z) {
    if(!own(regions,region)||!Number.isInteger(x)||!Number.isInteger(z)||x%2||z%2)return false;
    const reserved={farm:[[-10,-3.65,1.6],[-11,-6,1.4],[-11.8,-3,1.4],[-12,1,1.4],[-10,4.1,1.3],[-8.8,-3.1,1.2],[4.8,-8.9,1.1]],orchard:[[-6.8,-6.25,2.2],[5.5,5,2.4],[-7.6,-2.8,1.0],[-9,-5,1.2],[9,3,1.2]],river:[[-8,6,1.25],[-10,0,1.25]],forest:[[-3,-.5,2.2],[5,8,1.3],[-10,2,1.2]]};
    if(reserved[region].some(([rx,rz,r])=>Math.hypot(x-rx,z-rz)<r))return false;
    if(region==='farm')return x*x/170+z*z/100<.92 && ((x<=-10&&z<=4)||(z>=6&&x>=-2&&x<=0)||(z<=-8&&x>=2&&x<=6));
    if(x*x/115+z*z/85>.9)return false;
    if(region==='orchard')return (z>=4&&x<=4)||(x<=-8&&z<=2)||(x>=6&&z>=-2&&z<=4);
    if(region==='river')return x<=-4 && z>=-2 && z<=6;
    return (x<=-2&&z>=0&&z<=4)||(z>=6&&x>=-2&&x<=4);
  }
  function placementCheck(s,region,x,z,ignoreId=null) {
    if(!allowedCell(region,x,z))return 'Здесь нельзя строить: выберите свободную подсвеченную клетку.';
    if(s.world.decor.some(d=>d.region===region&&d.x===x&&d.z===z&&d.id!==ignoreId))return 'Эта клетка уже занята. Сначала уберите украшение.';
    if(resourceNodes.some(n=>n.region===region&&!s.world.cleared.includes(n.key)&&Math.hypot(n.x-x,n.z-z)<1.55))return 'Сначала уберите пень или камни рядом с этой клеткой.';
    return '';
  }
  S.validate=function(raw,now=Date.now()) {
    if(!raw||![1,2].includes(raw.version)||!Array.isArray(raw.plots)||![16,24].includes(raw.plots.length))throw new Error('Неизвестная версия фермы');
    const s=base.validate({...raw,version:1,plots:raw.plots.slice(0,16)},now);
    s.version=2;s.inventory.apple=integer(raw.inventory?.apple,0,1e6);s.inventory.honey=integer(raw.inventory?.honey,0,1e6);
    const w=raw.version===2&&raw.world&&typeof raw.world==='object'?raw.world:null;
    s.world=defaults(now);const out=s.world;
    if(w){
      out.region=own(regions,w.region)?w.region:'farm';
      out.materials={wood:integer(w.materials?.wood,0,1e5),stone:integer(w.materials?.stone,0,1e5)};
      for(const [key,p] of Object.entries(projects))if(!p.requires||out.projects[p.requires]){const n=integer(w.projects?.[key],0,p.max);if(n)out.projects[key]=n;}
      out.cleared=resourceNodes.filter(n=>Array.isArray(w.cleared)&&w.cleared.includes(n.key)).map(n=>n.key);
      out.trees=fruitSites.map(p=>{const t=w.trees?.[p.id];const planted=!!level(s,'orchard_clear')&&t?.planted===true;
        return {id:p.id,planted,waterAt:planted?bound(t?.waterAt,0,now):0,readyAt:planted?bound(t?.readyAt,0,now+86400000):0};});
      out.apiaryStock=level(s,'forest_apiary')?integer(w.apiaryStock,0,level(s,'forest_cabin')?6:3):0;
      out.apiaryAt=Math.min(now,Math.max(1,finite(w.apiaryAt,now)));
      const ids=new Set();for(const d of (Array.isArray(w.decor)?w.decor:[]).slice(0,96)){
        if(!d||!Number.isSafeInteger(d.id)||d.id<1||ids.has(d.id)||!own(decor,d.type)||placementCheck(s,d.region,d.x,d.z))continue;
        if(out.decor.filter(a=>a.region===d.region).length>=24)continue;ids.add(d.id);
        out.decor.push({id:d.id,type:d.type,region:d.region,x:d.x,z:d.z,rotation:integer(d.rotation,0,3)});
      }
      out.nextDecorId=Math.max(1,...out.decor.map(d=>d.id+1));
    }
    for(let id=16;id<24;id++){
      const p=raw.version===2?raw.plots[id]:null;const unlocked=level(s,'river_fields')>0;
      const crop=unlocked&&p&&own(S.CROPS,p.crop)?p.crop:null;
      s.plots.push({...newPlot(id),unlocked,crop,plantedAt:crop?bound(p?.plantedAt,0,now):0,
        waterAt:unlocked?bound(p?.waterAt,0,now):0,readyAt:crop?bound(p?.readyAt,0,now+86400000):0});
    }
    return s;
  };
  function waterTree(s,t,now){t.waterAt=now;t.readyAt=now+duration(s,'orchard',70);}
  function applyWater(s,region,now){
    for(const p of s.plots)if(plotRegion(p.id)===region&&p.unlocked&&p.crop&&!p.waterAt){p.waterAt=now;p.readyAt=now+duration(s,region,S.CROPS[p.crop].seconds);}
    if(region==='orchard')for(const t of s.world.trees)if(t.planted&&!t.waterAt)waterTree(s,t,now);
  }
  S.tick=function(s,now=Date.now()){
    base.tick(s,now);if(!s.world)return s;
    for(const region of ['farm','river','orchard'])if(irrigated(s,region))applyWater(s,region,now);
    const w=s.world,cap=level(s,'forest_cabin')?6:3;
    if(level(s,'forest_apiary')){
      const made=Math.floor(Math.max(0,Math.min(8*3600000,now-w.apiaryAt))/45000);
      if(made){w.apiaryStock=Math.min(cap,w.apiaryStock+made);w.apiaryAt+=made*45000;}
      if(w.apiaryStock>=cap)w.apiaryAt=now; // a full store cannot bank additional cycles
    }else w.apiaryAt=now;
    return s;
  };
  function projectCost(s,key){const p=projects[key];if(!p)return null;const mult=level(s,key)+1;return {coins:p.coins*mult,wood:p.wood*mult,stone:p.stone*mult};}
  function projectError(s,key){
    if(!own(projects,key))return 'Неизвестный проект';const p=projects[key];
    if(level(s,key)>=p.max)return 'Уже построено';
    if(p.requires&&!level(s,p.requires))return 'Сначала: '+projects[p.requires].name;
    const c=projectCost(s,key),short=[];
    if(s.coins<c.coins)short.push((c.coins-s.coins)+' монет');
    if(s.world.materials.wood<c.wood)short.push((c.wood-s.world.materials.wood)+' древесины');
    if(s.world.materials.stone<c.stone)short.push((c.stone-s.world.materials.stone)+' камня');
    return short.length?'Не хватает '+short.join(', '):'';
  }
  S.act=function(s,a,now=Date.now()){
    if(!a||typeof a!=='object')return {ok:false,message:'Некорректное действие'};
    S.tick(s,now);const fail=message=>({ok:false,message}),done=(message,effect='build')=>({ok:true,message,effect});const w=s.world;
    switch(a.type){
      case 'travel':if(!own(regions,a.region))return fail('Неизвестная локация');w.region=a.region;return done(regions[a.region].name,'travel');
      case 'upgrade':{
        const error=projectError(s,a.key);if(error)return fail(error);const p=projects[a.key];
        if(w.region!==p.region)return fail('Сначала перейдите на этот участок');
        const c=projectCost(s,a.key);s.coins-=c.coins;w.materials.wood-=c.wood;w.materials.stone-=c.stone;
        w.projects[a.key]=level(s,a.key)+1;s.xp+=20;
        if(a.key==='river_fields')for(const p of s.plots.slice(16))p.unlocked=true;
        if(a.key.endsWith('_water'))applyWater(s,p.region,now);
        if(a.key==='forest_apiary')w.apiaryAt=now;
        return done(p.name+' · готово! +20 опыта');
      }
      case 'clear':{
        const n=resourceNodes.find(n=>n.key===a.key);if(!n||n.region!==w.region)return fail('Выберите ресурс на этом участке');
        if(w.cleared.includes(n.key))return fail('Место уже расчищено');
        w.cleared.push(n.key);w.materials[n.type]+=n.amount;s.xp+=6;
        return done('Расчищено! +'+n.amount+(n.type==='wood'?' древесины':' камня'),'clear');
      }
      case 'plantTree':{
        const t=Number.isInteger(a.id)&&a.id>=0&&a.id<6?w.trees[a.id]:null;if(w.region!=='orchard'||!level(s,'orchard_clear'))return fail('Сначала расчистите яблоневый сад');
        if(!t||t.planted)return fail('Выберите свободное место для яблони');if(s.coins<15)return fail('Саженец стоит 15 монет');
        s.coins-=15;t.planted=true;t.waterAt=0;t.readyAt=0;if(irrigated(s,'orchard'))waterTree(s,t,now);
        return done('Яблоня посажена.'+(t.waterAt?' Орошение включено.':' Полейте саженец.'),'seed');
      }
      case 'waterTree':{
        const t=Number.isInteger(a.id)&&a.id>=0&&a.id<6?w.trees[a.id]:null;if(w.region!=='orchard'||!t?.planted)return fail('Сначала посадите яблоню');
        if(t.waterAt)return done('Яблоня уже полита. Таймер не изменился.','waterTree');waterTree(s,t,now);return done('Яблоня полита. Скоро будут яблоки!','waterTree');
      }
      case 'harvestTree':{
        const t=Number.isInteger(a.id)&&a.id>=0&&a.id<6?w.trees[a.id]:null;if(w.region!=='orchard'||!t?.planted||!t.waterAt||now<t.readyAt)return fail('Яблоки ещё не созрели');
        s.inventory.apple+=3;s.xp+=12;s.stats.harvests++;t.waterAt=0;t.readyAt=0;
        if(irrigated(s,'orchard'))waterTree(s,t,now);return done('+3 яблока · +12 опыта. '+(t.waterAt?'Новый цикл уже начался.':'Полейте дерево для следующего урожая.'),'harvest');
      }
      case 'collectHoney':{
        if(w.region!=='forest'||!level(s,'forest_apiary')||!w.apiaryStock)return fail('Мёд ещё не готов');
        const n=w.apiaryStock;w.apiaryStock=0;s.inventory.honey+=n;s.xp+=8;return done('Собрано мёда: '+n+' · +8 опыта','harvest');
      }
      case 'placeDecor':{
        if(!own(decor,a.key)||a.region!==w.region)return fail('Выберите украшение для текущего участка');
        if(w.decor.filter(d=>d.region===a.region).length>=24)return fail('На участке уже 24 украшения');
        const error=placementCheck(s,a.region,a.x,a.z);if(error)return fail(error);
        if(s.coins<decor[a.key].price)return fail('Недостаточно монет');s.coins-=decor[a.key].price;
        w.decor.push({id:w.nextDecorId++,type:a.key,region:a.region,x:a.x,z:a.z,rotation:integer(a.rotation,0,3)});
        return done('Размещено: '+decor[a.key].name+'. Можно поставить ещё.');
      }
      case 'removeDecor':{
        const index=w.decor.findIndex(d=>d.id===a.id&&d.region===w.region);if(index<0)return fail('Выберите своё украшение');
        const item=w.decor.splice(index,1)[0],refund=Math.floor(decor[item.type].price/2);s.coins+=refund;return done('Убрано · возвращено '+refund+' монет','coins');
      }
      case 'buyMaterial':{
        if(!['wood','stone'].includes(a.key)||!Number.isInteger(a.qty)||a.qty<1||a.qty>20)return fail('Некорректная поставка');
        const cost=a.qty*(a.key==='wood'?3:4);if(s.coins<cost)return fail('Не хватает '+(cost-s.coins)+' монет');
        s.coins-=cost;w.materials[a.key]+=a.qty;return done('Доставка: +'+a.qty+(a.key==='wood'?' древесины':' камня'),'clear');
      }
    }
    if(['plant','water','harvest','unlock'].includes(a.type)){
      if(!Number.isInteger(a.id)||!s.plots[a.id])return fail('Грядка не найдена');
      if(plotRegion(a.id)!==w.region)return fail('Эта грядка находится на другом участке');
      if(a.id>=16&&!level(s,'river_fields'))return fail('Сначала обустройте речные террасы');
    }
    if(['pet','feed','collect','buyAnimal'].includes(a.type)&&w.region!=='farm')return fail('Вернитесь к животным на домашнюю ферму');
    const p=s.plots[a.id],wasWatered=p?.waterAt;const result=base.act(s,a,now);
    if(result.ok&&p&&p.crop&&((a.type==='plant')||(a.type==='water'&&!wasWatered))){
      const region=plotRegion(p.id);if(irrigated(s,region)&&!p.waterAt)p.waterAt=now;
      if(p.waterAt)p.readyAt=now+duration(s,region,S.CROPS[p.crop].seconds);
      if(a.type==='plant'&&irrigated(s,region))result.message=S.CROPS[p.crop].name+' посажена · автополив включён.';
    }
    return result;
  };
  return {sim:S,regions,projects,decor,fruitSites,resourceNodes,level,plotRegion,irrigated,duration,projectCost,projectError,allowedCell,placementCheck};
})(typeof module!=='undefined'&&module.exports?require('./simulation.js'):FarmSim);
if(typeof module!=='undefined')module.exports=FarmExpansion;
