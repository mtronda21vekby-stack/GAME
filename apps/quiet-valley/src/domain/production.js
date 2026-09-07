/* Pure production commands. Inputs are reserved once; completed jobs are claimed once.
 * This remains a local game. A future server must own the same command invariants. */
'use strict';
import {surplus,nextFarmGoal} from './journey.js';
export function createProduction(FarmSim, ValleyGameplay, clock) {
  const S=FarmSim;
  const base = { fresh:S.fresh, validate:S.validate, tick:S.tick, act:S.act };
  const own = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
  const integer = (value,max=1e6) => Math.max(0,Math.min(max,Math.floor(Number(value)||0)));
  const GOODS = Object.freeze({
    flour:{name:'Мука',icon:'🌾',price:14},
    bread:{name:'Деревенский хлеб',icon:'🥖',price:55},
    jam:{name:'Яблочный конфитюр',icon:'🍯',price:68},
    cloth:{name:'Тёплая ткань',icon:'🧵',price:96},
  });
  const STATIONS = Object.freeze({
    mill:{name:'Мельница',icon:'⚙',cost:{coins:80,wood:4,stone:2},at:[-10,-3.65]},
    bakery:{name:'Пекарня',icon:'🥖',cost:{coins:160,wood:5,stone:3},requires:'mill',at:[-1.15,-7.85]},
    kitchen:{name:'Садовая кухня',icon:'🍎',cost:{coins:180,wood:5,stone:3},requires:'bakery',at:[-5.2,7.1]},
    loom:{name:'Мастерская Леи',icon:'🧵',cost:{coins:140,wood:4,stone:2},requires:'mill',at:[-8.5,6.7]},
  });
  const RECIPES = Object.freeze({
    flour:{station:'mill',inputs:{wheat:3},output:'flour',amount:2,seconds:25},
    bread:{station:'bakery',inputs:{flour:2,milk:1,egg:1},output:'bread',amount:2,seconds:45},
    jam:{station:'kitchen',inputs:{apple:4,honey:1},output:'jam',amount:2,seconds:55},
    cloth:{station:'loom',inputs:{wool:3},output:'cloth',amount:1,seconds:40},
  });
  const FESTIVAL = Object.freeze({bread:4,jam:2,cloth:1});
  Object.assign(S.PRODUCTS,GOODS);
  function defaults(){return {version:1,stations:{},jobs:[],nextJobId:1,crafted:{},festivalDelivered:false,festivalCount:0};}
  function ensure(state){
    if(!state.production)state.production=defaults();
    for(const key of Object.keys(GOODS))if(!Number.isFinite(state.inventory[key]))state.inventory[key]=0;
    return state.production;
  }
  S.fresh=function(now=clock.now()){const state=base.fresh(now);ensure(state);return state;};
  S.validate=function(raw,now=clock.now()){
    // Existing v1-v4 farm schema stays compatible; extension has its own version.
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Некорректное сохранение');
    const state=base.validate(S.clone(raw),now);const p=ensure(state),source=raw.production;
    for(const key of Object.keys(GOODS))state.inventory[key]=integer(raw.inventory?.[key]);
    if(source?.version===1){
      for(const key of Object.keys(STATIONS))p.stations[key]=source.stations?.[key]===true;
      const seen=new Set();const perStation={};
      p.jobs=(Array.isArray(source.jobs)?source.jobs:[]).slice(0,12).filter(job=>{
        if(!job||!own(RECIPES,job.recipe)||!Number.isSafeInteger(job.id)||job.id<1||seen.has(job.id))return false;
        const station=RECIPES[job.recipe].station;
        if(!p.stations[station]||(perStation[station]||0)>=3)return false;
        seen.add(job.id);perStation[station]=(perStation[station]||0)+1;return true;
      }).map(job=>{
        const duration=RECIPES[job.recipe].seconds*1000;
        const start=Math.max(0,Math.min(now+3*60000,Number(job.startedAt)||now));
        const end=Math.max(start,Math.min(now+3*60000,Number(job.readyAt)||start+duration));
        return {id:job.id,recipe:job.recipe,startedAt:start,readyAt:end};
      });
      p.nextJobId=Math.max(1,integer(source.nextJobId,1e9),...p.jobs.map(job=>job.id+1));
      for(const key of Object.keys(GOODS))p.crafted[key]=integer(source.crafted?.[key]);
      p.festivalDelivered=source.festivalDelivered===true;p.festivalCount=integer(source.festivalCount,9999);
    }
    return state;
  };
  S.tick=function(state,now=clock.now()){ensure(state);return base.tick(state,now);};
  function ingredients(state,items){return Object.entries(items).every(([key,amount])=>(state.inventory[key]||0)>=amount);}
  function missing(state,items){return Object.entries(items).filter(([key,n])=>(state.inventory[key]||0)<n).map(([key,n])=>`${S.PRODUCTS[key].name}: ${n-(state.inventory[key]||0)}`).join(', ');}
  function buildError(state,key){
    if(!own(STATIONS,key))return 'Неизвестная мастерская';
    const station=STATIONS[key],p=ensure(state);
    if(p.stations[key])return 'Уже открыта';
    if(station.requires&&!p.stations[station.requires])return 'Сначала откройте: '+STATIONS[station.requires].name;
    const c=station.cost;
    if(state.coins<c.coins||state.world.materials.wood<c.wood||state.world.materials.stone<c.stone)return `Нужно ${c.coins} монет, ${c.wood} дерева и ${c.stone} камня`;
    return '';
  }
  function craftError(state,key){
    if(!own(RECIPES,key))return 'Неизвестный рецепт';
    const recipe=RECIPES[key],p=ensure(state);
    if(!p.stations[recipe.station])return 'Откройте: '+STATIONS[recipe.station].name;
    if(p.jobs.filter(job=>RECIPES[job.recipe].station===recipe.station).length>=3)return 'Очередь заполнена. Заберите готовую продукцию.';
    return ingredients(state,recipe.inputs)?'':'Не хватает: '+missing(state,recipe.inputs);
  }
  const done=(message,effect='craft')=>({ok:true,message,effect});
  const fail=message=>({ok:false,message});
  S.act=function(state,action,now=clock.now()){
    if(!action||typeof action!=='object')return fail('Некорректное действие');
    const p=ensure(state);
    switch(action.type){
      case 'sellSurplus':{
        const available=surplus(state,S.PRODUCTS);
        if(!available.total)return fail('Запасы нужны заказчикам и животным. Пока нет излишков.');
        for(const [key,amount] of Object.entries(available.items))state.inventory[key]-=amount;
        state.coins+=available.total;state.stats.sales++;state.xp+=8;
        return done(`Излишки проданы: +${available.total} монет. Заказы и корм сохранены.`,'coins');
      }
      case 'buildWorkshop':{
        const error=buildError(state,action.key);if(error)return fail(error);
        const station=STATIONS[action.key];
        state.coins-=station.cost.coins;state.world.materials.wood-=station.cost.wood;state.world.materials.stone-=station.cost.stone;
        p.stations[action.key]=true;state.xp+=25;
        return done(station.name+' открыта. Поставьте первый заказ в работу!','construction');
      }
      case 'craft':{
        const error=craftError(state,action.key);if(error)return fail(error);
        const recipe=RECIPES[action.key];
        for(const [key,amount] of Object.entries(recipe.inputs))state.inventory[key]-=amount;
        const tail=p.jobs.filter(job=>RECIPES[job.recipe].station===recipe.station).reduce((latest,job)=>Math.max(latest,job.readyAt),now);
        p.jobs.push({id:p.nextJobId++,recipe:action.key,startedAt:tail,readyAt:tail+recipe.seconds*1000});
        return done(S.PRODUCTS[recipe.output].name+' в работе. Ингредиенты зарезервированы.');
      }
      case 'collectCraft':{
        const index=p.jobs.findIndex(job=>job.id===action.id);if(index<0)return fail('Этот заказ уже забран');
        const job=p.jobs[index];if(now<job.readyAt)return fail('Ещё готовится');
        const recipe=RECIPES[job.recipe];state.inventory[recipe.output]+=recipe.amount;
        p.crafted[recipe.output]=(p.crafted[recipe.output]||0)+recipe.amount;p.jobs.splice(index,1);state.xp+=15;
        return done(`+${recipe.amount} ${S.PRODUCTS[recipe.output].name.toLowerCase()} · +15 опыта`,'harvest');
      }
      case 'deliverFestival':{
        if(p.festivalDelivered)return fail('Поставка на этот праздник уже выполнена');
        if(!ingredients(state,FESTIVAL))return fail('Для праздника не хватает: '+missing(state,FESTIVAL));
        for(const [key,amount] of Object.entries(FESTIVAL))state.inventory[key]-=amount;
        p.festivalDelivered=true;p.festivalCount++;state.coins+=420;state.xp+=90;state.game.reputation+=8;
        state.game.relationships.elena=Math.min(5,state.game.relationships.elena+1);
        return done('Долина готова к празднику! +420 монет · +8 репутации · дружба с Еленой','festival');
      }
      default:return base.act(state,action,now);
    }
  };
  function nextGoal(state){
    const p=ensure(state);
    if(!p.stations.mill)return {title:'Верните мельницу к жизни',detail:'Урожай → мука → ваш первый хлеб',step:1,total:5};
    if(!(p.crafted.flour>0))return {title:'Смелите первую муку',detail:'3 пшеницы → 2 муки · 25 секунд',step:2,total:5};
    if(!p.stations.bakery)return {title:'Откройте пекарню',detail:'Мия поможет приготовить хлеб для долины',step:3,total:5};
    if(!(p.crafted.bread>0))return {title:'Испеките деревенский хлеб',detail:'Мука + молоко + яйцо → 2 хлеба',step:4,total:5};
    return {title:p.festivalDelivered?'Праздник урожая состоялся':'Соберите корзину к празднику',detail:p.festivalDelivered?'Продолжайте историю и развивайте четыре участка':'4 хлеба · 2 конфитюра · 1 ткань',step:5,total:5};
  }
  return {GOODS,STATIONS,RECIPES,FESTIVAL,ensure,ingredients,missing,buildError,craftError,nextGoal:state=>nextFarmGoal(state,nextGoal(state)),surplus:state=>surplus(state,S.PRODUCTS)};
}
