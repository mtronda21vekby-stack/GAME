/* Pure, deterministic local simulation. No client balance is authoritative online. */
'use strict';
const FarmSim=(()=>{
 const CROPS={carrot:{name:'Морковь',icon:'🥕',cost:8,seconds:45,yield:4,price:7},wheat:{name:'Пшеница',icon:'🌾',cost:5,seconds:30,yield:4,price:4},pumpkin:{name:'Тыква',icon:'🎃',cost:18,seconds:75,yield:2,price:25}};
 const PRODUCTS={...CROPS,milk:{name:'Молоко',icon:'🥛',price:18},egg:{name:'Яйца',icon:'🥚',price:9},wool:{name:'Шерсть',icon:'🧶',price:24}};
 const SPECIES={cow:{name:'Корова',icon:'🐄',price:280,product:'milk',seconds:95},sheep:{name:'Овечка',icon:'🐑',price:190,product:'wool',seconds:110},chicken:{name:'Курочка',icon:'🐔',price:90,product:'egg',seconds:65}};
 const EMPTY_WET_MS=10*60*1000;
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const clone=x=>JSON.parse(JSON.stringify(x));const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
 function animal(id,type,name,now){return {id,type,name,hunger:55+id*7%35,mood:68,progress:id%3*.17,stock:0,lastAt:now,petAt:0};}
 function fresh(now=Date.now()){let plots=Array.from({length:16},(_,id)=>({id,unlocked:id<12,crop:null,plantedAt:0,waterAt:0,readyAt:0}));
  for(let i=0;i<7;i++){let crop=['carrot','wheat','pumpkin'][i%3];plots[i]={...plots[i],crop,plantedAt:now-90000,waterAt:i%3===2?0:now-90000,readyAt:i%3===2?0:now+(i<3?-1000:12000+i*2200)};}
  return {version:1,coins:180,xp:0,plots,animals:[animal(1,'cow','Милка',now),animal(2,'sheep','Облачко',now),animal(3,'sheep','Плюша',now),animal(4,'chicken','Рыжик',now),animal(5,'chicken','Кнопка',now)],inventory:{carrot:0,wheat:6,pumpkin:0,milk:0,egg:2,wool:0},stats:{harvests:0,sales:0,feeds:0,waters:0},claimed:[],lastAt:now};}
 function validate(raw,now=Date.now()){
  if(!raw||raw.version!==1||!Array.isArray(raw.plots)||raw.plots.length!==16||!Array.isArray(raw.animals))throw new Error('Неподдерживаемое сохранение');
  let s=fresh(now);s.coins=clamp(Number(raw.coins)||0,0,1e7);s.xp=clamp(Number(raw.xp)||0,0,1e7);
  const time=x=>Number.isFinite(x)?clamp(x,0,now+1e8):0;
  s.plots=raw.plots.map((p,id)=>({id,unlocked:id<12||p.unlocked===true,crop:own(CROPS,p.crop)?p.crop:null,plantedAt:time(p.plantedAt),waterAt:time(p.waterAt),readyAt:time(p.readyAt)}));
  const ids=new Set();s.animals=raw.animals.slice(0,12).filter(a=>a&&own(SPECIES,a.type)&&Number.isSafeInteger(a.id)&&!ids.has(a.id)&&ids.add(a.id)).map(a=>({...animal(a.id,a.type,String(a.name||SPECIES[a.type].name).slice(0,24),now),hunger:clamp(+a.hunger||0,0,100),mood:clamp(+a.mood||0,0,100),progress:clamp(+a.progress||0,0,.999999),stock:clamp(Math.floor(+a.stock||0),0,3),lastAt:Math.min(time(a.lastAt)||now,now),petAt:time(a.petAt)}));
  for(const key in PRODUCTS)s.inventory[key]=clamp(Math.floor(+raw.inventory?.[key]||0),0,1e6);
  for(const key in s.stats)s.stats[key]=clamp(Math.floor(+raw.stats?.[key]||0),0,1e6);
  s.claimed=Array.isArray(raw.claimed)?raw.claimed.filter(x=>['harvests','sales','feeds'].includes(x)):[];s.lastAt=Math.min(time(raw.lastAt)||now,now);return s;
 }
 function tick(s,now=Date.now()){
  for(const a of s.animals){const dt=clamp((now-a.lastAt)/1000,0,8*3600);a.lastAt=now;
   // Only the fed portion of elapsed time can produce resources, even after a long absence.
   const fedSeconds=Math.min(dt,Math.max(0,(a.hunger-15)/.022));
   if(a.stock<3){a.progress+=fedSeconds/SPECIES[a.type].seconds*(.65+a.mood/285);let made=Math.floor(a.progress);a.stock=Math.min(3,a.stock+made);a.progress=a.stock===3?0:a.progress-made;}
   a.hunger=clamp(a.hunger-dt*.022,0,100);a.mood=clamp(a.mood-dt*.006,20,100);
  }s.lastAt=now;return s;
 }
 // Growing crops need one watering per crop cycle. Empty soil holds water for 10 minutes.
 function moisture(p,now=Date.now()){if(!p||!p.unlocked||!p.waterAt)return 0;return p.crop?1:clamp(1-(now-p.waterAt)/EMPTY_WET_MS,0,1);}
 function status(p,now=Date.now()){if(!p.unlocked)return 'locked';if(!p.crop)return 'empty';if(!p.waterAt)return 'dry';return now>=p.readyAt?'ready':'growing';}
 function act(s,action,now=Date.now()){if(!action||typeof action!=='object')return {ok:false,message:'Некорректное действие'};tick(s,now);let p=s.plots[action.id],a=s.animals.find(a=>a.id===action.id);const fail=message=>({ok:false,message});
  switch(action.type){
   case 'plant':{const c=own(CROPS,action.crop)?CROPS[action.crop]:null;if(!p||status(p,now)!=='empty'||!c)return fail('Выберите пустую грядку');if(s.coins<c.cost)return fail('Не хватает монет. Продайте урожай в амбаре.');const prewatered=moisture(p,now)>.05;s.coins-=c.cost;Object.assign(p,{crop:action.crop,plantedAt:now,waterAt:prewatered?now:0,readyAt:prewatered?now+c.seconds*1000:0});return {ok:true,message:c.name+(prewatered?' посажена во влажную почву. Рост уже начался!':' посажена. Теперь полейте грядку.'),effect:'seed'};}
   case 'water':{
    if(!p)return fail('Грядка не найдена');if(!p.unlocked)return fail('Сначала откройте эту грядку');
    if(p.crop&&p.waterAt)return {ok:true,changed:false,message:status(p,now)==='ready'?'Земля влажная. Урожай созрел — можно собирать!':'Земля уже влажная. Таймер роста не изменился.',effect:'water'};
    p.waterAt=now;if(p.crop)p.readyAt=now+CROPS[p.crop].seconds*1000;
    s.stats.waters=(s.stats.waters||0)+1;
    return {ok:true,changed:true,message:p.crop?'Полито! Земля влажная, рост начался.':'Грядка увлажнена на 10 минут. Можно сажать семена.',effect:'water'};
   }
   case 'harvest':if(!p||status(p,now)!=='ready')return fail('Урожай ещё не созрел');{const c=CROPS[p.crop];s.inventory[p.crop]+=c.yield;s.stats.harvests++;s.xp+=12;Object.assign(p,{crop:null,plantedAt:0,waterAt:0,readyAt:0});return {ok:true,message:'+'+c.yield+' '+c.name.toLowerCase()+' · +12 опыта',effect:'harvest'};}
   case 'feed':if(!a)return fail('Животное не найдено');if(a.hunger>85)return fail(a.name+' уже сыта');if(s.inventory.wheat<1)return fail('Нужна пшеница. Вырастите её на грядке.');s.inventory.wheat--;a.hunger=clamp(a.hunger+45,0,100);a.mood=clamp(a.mood+6,0,100);s.stats.feeds++;s.xp+=5;return {ok:true,message:a.name+': спасибо за угощение! 🌾',effect:'heart'};
   case 'pet':if(!a)return fail('Животное не найдено');if(now-a.petAt<20000)return fail('Дайте немного погулять — потом погладьте снова');a.petAt=now;a.mood=clamp(a.mood+22,0,100);s.xp+=2;return {ok:true,message:a.name+' довольна вашим вниманием ♥',effect:'heart'};
   case 'collect':if(!a||a.stock<1)return fail('Продукция ещё не готова');{let q=a.stock,key=SPECIES[a.type].product;s.inventory[key]+=q;a.stock=0;s.xp+=q*6;return {ok:true,message:'+'+q+' '+PRODUCTS[key].name.toLowerCase(),effect:'harvest'};}
   case 'sell':{if(action.key&&!own(PRODUCTS,action.key))return fail('Неизвестный товар');if(action.qty!==undefined&&(!Number.isSafeInteger(action.qty)||action.qty<1))return fail('Некорректное количество');let total=0;for(const key in PRODUCTS){if(action.key&&key!==action.key)continue;let qty=Math.min(s.inventory[key],action.qty??s.inventory[key]);if(!action.key&&key==='wheat')qty=Math.max(0,qty-3);s.inventory[key]-=qty;total+=qty*PRODUCTS[key].price;}if(!total)return fail('Пока нечего продавать. Соберите урожай или продукцию.');s.coins+=total;s.stats.sales++;s.xp+=8;return {ok:true,message:'Продано! +'+total+' монет',effect:'coins'};}
   case 'buyAnimal':{let sp=own(SPECIES,action.species)?SPECIES[action.species]:null;if(!sp)return fail('Неизвестный вид');if(s.animals.length>=12)return fail('Загон заполнен: максимум 12 животных');if(s.coins<sp.price)return fail('Нужно '+sp.price+' монет');let id=Math.max(0,...s.animals.map(a=>a.id))+1;s.coins-=sp.price;const names={cow:['Зорька','Ромашка','Ночка'],sheep:['Снежка','Кудряшка','Зефирка'],chicken:['Пеструшка','Искра','Златка']};s.animals.push(animal(id,action.species,names[action.species][id%3],now));return {ok:true,message:'На ферме новый житель!',effect:'newAnimal'};}
   case 'unlock':if(!p||p.unlocked)return fail('Грядка уже открыта');if(s.coins<55)return fail('Расширение стоит 55 монет');s.coins-=55;p.unlocked=true;return {ok:true,message:'Новая грядка открыта!',effect:'seed'};
   case 'claim':{const targets={harvests:3,sales:1,feeds:2};if(!own(targets,action.key)||s.claimed.includes(action.key)||s.stats[action.key]<targets[action.key])return fail('Задание ещё не выполнено');s.claimed.push(action.key);s.coins+=40;s.xp+=15;return {ok:true,message:'Задание выполнено! +40 монет',effect:'coins'};}
   default:return fail('Неизвестное действие');
  }
 }
 return {CROPS,PRODUCTS,SPECIES,EMPTY_WET_MS,fresh,validate,tick,moisture,status,act,clone};
})();
if(typeof module!=='undefined')module.exports=FarmSim;
