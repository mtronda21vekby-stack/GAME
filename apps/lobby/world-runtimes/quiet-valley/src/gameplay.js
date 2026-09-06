/* Quiet Valley 0.5: characters, gentle farm rent, goals, market orders, reputation and weather.
 * Deterministic local prototype logic. Online authority must live on a server later.
 */
'use strict';
const ValleyGameplay=((X)=>{
 const S=X.sim,base={fresh:S.fresh,validate:S.validate,tick:S.tick,act:S.act};
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number.isFinite(+n)?+n:a));
 const int=(n,a,b)=>Math.floor(clamp(n,a,b));
 const WEATHER_MS=90000;
 const DAY_MS=120000; // accelerated prototype day: 2 minutes of active play
 const RENT_BASE=55;
 const CHARACTERS={
  elena:{name:'Елена',icon:'👩‍🌾',role:'хозяйка земли',color:'#8f9f72',bio:'Сдаёт вам старую семейную ферму. Не давит с оплатой и хочет увидеть, оживёт ли это место снова.',perk:'На 3 ♥ аренда снижается на 10 монет.'},
  mia:{name:'Мия',icon:'👩‍🍳',role:'пекарь',color:'#d7a06f',bio:'Открывает пекарню до рассвета и первой начинает покупать ваш урожай.',perk:'Каждое ♥ добавляет 2% к оплате её заказов.'},
  fedor:{name:'Фёдор',icon:'🧔',role:'лавочник',color:'#7fa08a',bio:'Знает всех в долине и умеет найти покупателя почти на любой продукт.',perk:'На 3 ♥ обновление доски заказов дешевеет до 10 монет.'},
  lea:{name:'Лея',icon:'👩‍🎨',role:'мастерица',color:'#a48ca7',bio:'Шьёт, чинит и обустраивает дома. Особенно ценит шерсть и аккуратную работу.',perk:'Каждое ♥ добавляет 2% к оплате её заказов.'}
 };
 const WEATHER=[
  {key:'sun',icon:'☀️',name:'Солнечно',short:'Урожай +1',desc:'Соберите созревший урожай сейчас — солнце даёт +1 продукт.'},
  {key:'rain',icon:'🌧️',name:'Тёплый дождь',short:'Бесплатный полив',desc:'Дождь автоматически увлажняет открытые грядки и яблони.'},
  {key:'breeze',icon:'🍃',name:'Лёгкий ветер',short:'Мёд +1',desc:'Пчёлы активнее. При сборе мёда вы получите дополнительную баночку.'},
  {key:'cloud',icon:'☁️',name:'Облачно',short:'Спокойный день',desc:'Без бонусов. Хорошее время строить, украшать и ухаживать за животными.'}
 ];
 const ORDER_TEMPLATES={
  bakery:{charId:'mia',customer:'Пекарня «У Мии»',icon:'🥖',title:'Завтрак к открытию',items:{wheat:4,egg:2},reward:58,xp:18,rep:1},
  grocer:{charId:'fedor',customer:'Лавка Фёдора',icon:'🧺',title:'Свежие овощи',items:{carrot:4,wheat:4},reward:72,xp:20,rep:1},
  dairy:{charId:'mia',customer:'Кафе у моста',icon:'☕',title:'Молочный завтрак',items:{milk:2,egg:2},reward:82,xp:22,rep:1},
  tailor:{charId:'lea',customer:'Мастерская Леи',icon:'🧵',title:'Тёплая посылка',items:{wool:2,wheat:4},reward:96,xp:24,rep:1,minRep:1},
  supper:{customer:'Семья Ривер',icon:'🍲',title:'Ужин на шестерых',items:{pumpkin:2,milk:1,egg:2},reward:112,xp:28,rep:2,minRep:2},
  picnic:{customer:'Школьный пикник',icon:'🧃',title:'Корзинки для пикника',items:{carrot:4,egg:3,milk:1},reward:105,xp:26,rep:2,minRep:2},
  orchard:{charId:'mia',customer:'Садовое кафе',icon:'🥧',title:'Яблочные пироги',items:{apple:6,wheat:4,egg:2},reward:142,xp:34,rep:2,minRep:4,requires:'apple'},
  cider:{charId:'fedor',customer:'Дом у дороги',icon:'🍎',title:'Осенняя корзина',items:{apple:6,pumpkin:2},reward:132,xp:32,rep:2,minRep:4,requires:'apple'},
  honey:{charId:'lea',customer:'Чайная «Липа»',icon:'🍯',title:'Чайный вечер',items:{honey:2,apple:3},reward:158,xp:38,rep:3,minRep:7,requires:'honey'},
  feast:{customer:'Совет долины',icon:'🎪',title:'Большой фермерский стол',items:{pumpkin:4,milk:2,egg:4,wool:2},reward:238,xp:52,rep:4,minRep:9},
  festival:{customer:'Праздник урожая',icon:'🎉',title:'Праздничная поставка',items:{apple:6,honey:3,milk:2,pumpkin:2},reward:285,xp:64,rep:5,minRep:12,requires:'festival'}
 };
 const ORDER_SEQUENCE=['bakery','grocer','dairy','tailor','supper','picnic','bakery','grocer','orchard','dairy','cider','tailor','honey','supper','feast','orchard','festival','honey'];
 const STORY=[
  {speaker:'mia',title:'Первые покупатели',icon:'🥖',quote:'Если утром будет хлеб, к вечеру вся долина уже узнает о вашей ферме.',text:'Мия даёт вам первый шанс. Выполните заказы и докажите, что ферма снова работает.',reward:{coins:100,wood:3,stone:2,rep:1},req:[['orders',2,'Выполнить 2 заказа'],['harvests',5,'Собрать 5 урожаев']]},
  {speaker:'elena',title:'Вернуть сад к жизни',icon:'🍎',quote:'Мой отец посадил эти яблони. Было бы хорошо снова увидеть здесь свет по вечерам.',text:'Елена просит не расширяться бездумно, а вернуть к жизни старый яблоневый сад.',reward:{coins:120,wood:4,stone:1,rep:2},req:[['project','orchard_clear','Расчистить яблоневый сад'],['trees',3,'Посадить 3 яблони'],['apples',1,'Собрать яблоки хотя бы раз']]},
  {speaker:'fedor',title:'Два берега',icon:'🌉',quote:'Мост починим — покупателей станет вдвое больше. Главное, не стройте дворец раньше амбара.',text:'Фёдор предлагает восстановить старый мост и открыть торговлю с другим берегом.',reward:{coins:150,wood:3,stone:4,rep:2},req:[['project','river_bridge','Восстановить мост'],['project','river_fields','Открыть речные террасы'],['orders',5,'Выполнить 5 заказов']]},
  {speaker:'lea',title:'Медовый вечер',icon:'🐝',quote:'Пчёлы любят порядок не меньше людей. Дайте им тихое место — и они отплатят мёдом.',text:'Лея помогает превратить лесную поляну в спокойную рабочую зону с пасекой.',reward:{coins:180,wood:5,stone:3,rep:3},req:[['project','forest_apiary','Построить пасеку'],['honey',3,'Собрать 3 баночки мёда'],['orders',8,'Выполнить 8 заказов']]},
  {speaker:'elena',title:'Праздник Тихой долины',icon:'🎪',quote:'Похоже, вы здесь уже не временно. Долина привыкла к вам.',text:'Соберите всё хозяйство воедино: участки, животных, заказы и людей, которые теперь на вас рассчитывают.',reward:{coins:300,wood:8,stone:8,rep:5},req:[['projects',8,'Построить 8 улучшений'],['animals',7,'Поселить 7 животных'],['orders',12,'Выполнить 12 заказов']]}
 ];
 function gameDefaults(now){return {reputation:0,ordersCompleted:0,orderCursor:0,nextOrderId:1,orders:[],streak:0,lastOrderAt:0,weatherStartedAt:now,story:0,appleHarvests:0,honeyCollected:0,introSeen:false,relationships:{elena:0,mia:0,fedor:0,lea:0},playedMs:0,lastActiveAt:now,rentPaidThroughWeek:1,rentDebt:0,rentDueWeek:0,rentPayments:0};}
 function relationship(s,id){return int(s.game?.relationships?.[id]||0,0,5);}
 function rentPrice(s){return Math.max(35,RENT_BASE-(relationship(s,'elena')>=3?10:0));}
 function leaseStatus(s){const g=s.game||gameDefaults(Date.now()),day=Math.floor((g.playedMs||0)/DAY_MS)+1,week=Math.floor((day-1)/7)+1,dayInWeek=(day-1)%7+1;return {day,week,dayInWeek,price:rentPrice(s),debt:g.rentDebt||0,free:week===1&&!(g.rentDebt>0),paidThrough:g.rentPaidThroughWeek||1,nextDueDay:week===1?8:(g.rentDebt?day:week*7+1)};}
 function refreshCost(s){return relationship(s,'fedor')>=3?10:15;}
 function characterDialogue(s,id){const c=CHARACTERS[id],h=relationship(s,id),rent=leaseStatus(s);if(!c)return '';if(id==='elena'){if(rent.debt)return 'Аренда подождёт пару дней. Сначала соберите урожай и спокойно закройте долг — я ферму у вас не заберу.';if(h>=4)return 'Теперь это место выглядит больше вашим, чем моим. Я только рада, что земля снова работает.';if(h>=2)return 'Не гонитесь за каждым улучшением сразу. Сначала пусть ферма сама начинает себя кормить.';return 'Первая неделя за мой счёт. Осмотритесь, заработайте первые монеты и решите, хотите ли оставаться.';}if(id==='mia')return h>=4?'Я уже планирую меню под ваш урожай. Если привезёте раньше остальных — на витрине будет ваше имя.':h>=2?'Покупатели спрашивают, откуда яйца и пшеница. Кажется, у фермы появляется репутация.':'Мне нужны простые вещи: пшеница, яйца и чтобы всё было вовремя. Начнём с этого.';if(id==='fedor')return h>=4?'Теперь я оставляю лучшие заявки для вас. Только не продавайте всё в амбар одним нажатием.':h>=2?'Спрос растёт. Держите часть запасов — заказ почти всегда выгоднее обычной продажи.':'Не бойтесь маленьких заказов. Они дают постоянных покупателей, а не разовую выручку.';if(id==='lea')return h>=4?'Когда закончите с хозяйством, займёмся красотой. Уют тоже работает на цену фермы.':h>=2?'Шерсть хорошая. Животные спокойные — сразу видно, что за ними следят.':'Если будете хорошо ухаживать за животными, я всегда найду применение шерсти и мёду.';return '';}
 function characterPerk(s,id){const h=relationship(s,id);if(id==='elena')return h>=3?'Аренда: −10 🪙 за неделю':'На 3 ♥ аренда станет дешевле';if(id==='fedor')return h>=3?'Обновление заказов: 10 🪙':'На 3 ♥ обновление заказов подешевеет';return `Заказы этого жителя: +${h*2}% к оплате`;}
 function weather(s,now=Date.now()){
  const g=s.game||gameDefaults(now),elapsed=Math.max(0,now-g.weatherStartedAt),index=Math.floor(elapsed/WEATHER_MS),w=WEATHER[index%WEATHER.length];
  return {...w,index,remainingMs:WEATHER_MS-(elapsed%WEATHER_MS),next:WEATHER[(index+1)%WEATHER.length]};
 }
 function productUnlocked(s,key){
  if(key==='apple')return !!X.level(s,'orchard_clear')&&s.world.trees.some(t=>t.planted);
  if(key==='honey')return !!X.level(s,'forest_apiary');
  return own(S.PRODUCTS,key);
 }
 function templateAvailable(s,t){if((t.minRep||0)>s.game.reputation)return false;if(t.requires==='apple'&&!productUnlocked(s,'apple'))return false;if(t.requires==='honey'&&!productUnlocked(s,'honey'))return false;if(t.requires==='festival'&&s.game.story<4)return false;return Object.keys(t.items).every(k=>own(S.PRODUCTS,k));}
 function makeOrder(s,key,now){const t=ORDER_TEMPLATES[key];return {id:s.game.nextOrderId++,key,charId:t.charId||null,customer:t.customer,icon:t.icon,title:t.title,items:{...t.items},reward:t.reward,xp:t.xp,rep:t.rep,createdAt:now,bonusUntil:now+120000};}
 function ensureOrders(s,now=Date.now()){
  const g=s.game;if(!g)return s;let guard=0;
  while(g.orders.length<3&&guard++<ORDER_SEQUENCE.length*3){const key=ORDER_SEQUENCE[g.orderCursor++%ORDER_SEQUENCE.length],t=ORDER_TEMPLATES[key];if(templateAvailable(s,t))g.orders.push(makeOrder(s,key,now));}
  return s;
 }
 function canDeliver(s,order){return !!order&&Object.entries(order.items).every(([k,n])=>(s.inventory[k]||0)>=n);}
 function rushActive(order,now=Date.now()){return !!order&&now<=order.bonusUntil;}
 function orderPreview(s,order,now=Date.now()){
  const nextStreak=s.game.lastOrderAt&&now-s.game.lastOrderAt<=120000?Math.min(5,s.game.streak+1):1;
  const friend=order.charId?relationship(s,order.charId):0,mult=(rushActive(order,now)?1.25:1)*(1+.05*(nextStreak-1))*(1+friend*.02);
  return {reward:Math.floor(order.reward*mult),rush:rushActive(order,now),nextStreak,friend};
 }
 function projectsBuilt(s){return Object.entries(X.projects).reduce((n,[k,p])=>n+(X.level(s,k)>=p.max?1:0),0);}
 function reqValue(s,r){const [type,key]=r;
  if(type==='orders')return s.game.ordersCompleted;if(type==='harvests')return s.stats.harvests||0;if(type==='project')return X.level(s,key)>0?1:0;if(type==='trees')return s.world.trees.filter(t=>t.planted).length;if(type==='apples')return s.game.appleHarvests;if(type==='honey')return s.game.honeyCollected;if(type==='projects')return projectsBuilt(s);if(type==='animals')return s.animals.length;return 0;
 }
 function reqTarget(r){return r[0]==='project'?1:Number(r[1])||1;}
 function storyStatus(s){const index=Math.min(s.game.story,STORY.length);if(index>=STORY.length)return {complete:true,index,title:'Долина живёт',icon:'🏆',text:'Главная история прототипа завершена. Продолжайте строить, украшать и выполнять заказы.',requirements:[]};const c=STORY[index],requirements=c.req.map(r=>{const value=reqValue(s,r),target=reqTarget(r);return {text:r[2],value,target,done:value>=target};});return {...c,index,requirements,ready:requirements.every(r=>r.done),complete:false};}
 function sanitizeOrder(o,now){if(!o||!Number.isSafeInteger(o.id)||!own(ORDER_TEMPLATES,o.key))return null;const t=ORDER_TEMPLATES[o.key];return {id:o.id,key:o.key,charId:t.charId||null,customer:t.customer,icon:t.icon,title:t.title,items:{...t.items},reward:t.reward,xp:t.xp,rep:t.rep,createdAt:clamp(o.createdAt,0,now),bonusUntil:clamp(o.bonusUntil,0,now+120000)};}
 S.fresh=function(now=Date.now()){const s=base.fresh(now);s.version=4;s.game=gameDefaults(now);ensureOrders(s,now);return s;};
 S.validate=function(raw,now=Date.now()){
  if(!raw||![1,2,3,4].includes(raw.version))throw new Error('Неизвестная версия фермы');
  const source=raw.version>=3?{...raw,version:2}:raw;const s=base.validate(source,now);s.version=4;s.game=gameDefaults(now);
  if(raw.version>=3&&raw.game&&typeof raw.game==='object'){
   const g=raw.game,o=s.game;g.reputation=int(g.reputation,0,9999);o.reputation=g.reputation;o.ordersCompleted=int(g.ordersCompleted,0,1e6);o.orderCursor=int(g.orderCursor,0,1e9);o.nextOrderId=int(g.nextOrderId,1,1e9);o.streak=int(g.streak,0,5);o.lastOrderAt=clamp(g.lastOrderAt,0,now);o.weatherStartedAt=clamp(g.weatherStartedAt,now-30*86400000,now);o.story=int(g.story,0,STORY.length);o.appleHarvests=int(g.appleHarvests,0,1e6);o.honeyCollected=int(g.honeyCollected,0,1e6);
   if(raw.version===4){o.introSeen=g.introSeen===true;for(const id of Object.keys(CHARACTERS))o.relationships[id]=int(g.relationships?.[id],0,5);o.playedMs=clamp(g.playedMs,0,365*DAY_MS);o.rentPaidThroughWeek=int(g.rentPaidThroughWeek,1,999);o.rentDebt=int(g.rentDebt,0,10000);o.rentDueWeek=int(g.rentDueWeek,0,999);o.rentPayments=int(g.rentPayments,0,999);}
   o.lastActiveAt=now;
   const ids=new Set();o.orders=(Array.isArray(g.orders)?g.orders:[]).slice(0,3).map(v=>sanitizeOrder(v,now)).filter(v=>v&&!ids.has(v.id)&&ids.add(v.id)&&templateAvailable(s,ORDER_TEMPLATES[v.key]));
   o.nextOrderId=Math.max(o.nextOrderId,1,...o.orders.map(v=>v.id+1));
  }
  ensureOrders(s,now);return s;
 };
 function rainWater(s,now){
  for(const p of s.plots){if(!p.unlocked)continue;const region=X.plotRegion(p.id);if(p.crop&&!p.waterAt){p.waterAt=now;p.readyAt=now+X.duration(s,region,S.CROPS[p.crop].seconds);}else if(!p.crop)p.waterAt=now;}
  if(X.level(s,'orchard_clear'))for(const t of s.world.trees)if(t.planted&&!t.waterAt){t.waterAt=now;t.readyAt=now+X.duration(s,'orchard',70);}
 }
 S.tick=function(s,now=Date.now()){base.tick(s,now);if(!s.game)return s;const g=s.game,dt=Math.max(0,Math.min(1500,now-(g.lastActiveAt||now)));g.playedMs=(g.playedMs||0)+dt;g.lastActiveAt=now;const lease=leaseStatus(s);if(lease.week>1&&lease.week>(g.rentPaidThroughWeek||1)&&!g.rentDebt){g.rentDebt=rentPrice(s);g.rentDueWeek=lease.week;}ensureOrders(s,now);if(weather(s,now).key==='rain')rainWater(s,now);return s;};
 S.act=function(s,a,now=Date.now()){
  if(!a||typeof a!=='object')return {ok:false,message:'Некорректное действие'};S.tick(s,now);const g=s.game,fail=message=>({ok:false,message}),done=(message,effect='coins')=>({ok:true,message,effect});
  if(a.type==='markIntroSeen'){g.introSeen=true;return done('Ключи у вас. Первая неделя аренды бесплатная.','build');}
  if(a.type==='talkCharacter'){if(!CHARACTERS[a.key])return fail('Житель не найден');return done(CHARACTERS[a.key].name+': '+characterDialogue(s,a.key),'heart');}
  if(a.type==='payRent'){const lease=leaseStatus(s);if(!g.rentDebt)return fail('Аренда сейчас оплачена');if(s.coins<g.rentDebt)return fail('Для аренды не хватает '+(g.rentDebt-s.coins)+' монет');const paid=g.rentDebt;s.coins-=paid;g.rentDebt=0;g.rentPaidThroughWeek=Math.max(g.rentPaidThroughWeek||1,lease.week);g.rentPayments++;g.relationships.elena=Math.min(5,(g.relationships.elena||0)+1);s.xp+=12;return done('Аренда оплачена: '+paid+' монет. Елена ценит вашу надёжность. +1 ♥','coins');}
  if(a.type==='deliverOrder'){
   const order=g.orders.find(o=>o.id===a.id);if(!order)return fail('Заказ уже обновился');if(!canDeliver(s,order))return fail('В амбаре пока не хватает продуктов для этого заказа');
   for(const [k,n] of Object.entries(order.items))s.inventory[k]-=n;
   const preview=orderPreview(s,order,now);g.streak=preview.nextStreak;g.lastOrderAt=now;g.ordersCompleted++;g.reputation+=order.rep;s.coins+=preview.reward;s.xp+=order.xp;if(order.charId)g.relationships[order.charId]=Math.min(5,(g.relationships[order.charId]||0)+1);g.orders.splice(g.orders.indexOf(order),1);ensureOrders(s,now);
   return done(`${order.customer}: заказ готов! +${preview.reward} монет · +${order.rep} репутации${order.charId?' · +1 ♥':''}${g.streak>1?' · серия ×'+g.streak:''}`,'coins');
  }
  if(a.type==='refreshOrders'){
   const cost=refreshCost(s);if(s.coins<cost)return fail('Для новой доски нужно '+cost+' монет');s.coins-=cost;g.orders=[];g.streak=0;ensureOrders(s,now);return done('Доска заказов обновлена. Серия сброшена.','build');
  }
  if(a.type==='claimStory'){
   const st=storyStatus(s);if(st.complete)return fail('История уже завершена');if(a.id!==st.index||!st.ready)return fail('Сначала выполните все цели главы');const chapter=STORY[st.index],r=chapter.reward;s.coins+=r.coins;s.world.materials.wood+=r.wood;s.world.materials.stone+=r.stone;g.reputation+=r.rep;if(chapter.speaker)g.relationships[chapter.speaker]=Math.min(5,(g.relationships[chapter.speaker]||0)+1);g.story++;s.xp+=35;ensureOrders(s,now);return done(`Глава завершена! +${r.coins} монет · +${r.wood} 🪵 · +${r.stone} 🪨 · +${r.rep} репутации · +1 ♥`,'coins');
  }
  const w=weather(s,now),preCrop=a.type==='harvest'&&Number.isInteger(a.id)?s.plots[a.id]?.crop:null;const preHoney=a.type==='collectHoney'?s.world.apiaryStock:0;
  const result=base.act(s,a,now);if(!result.ok)return result;
  if(a.type==='harvest'&&preCrop&&w.key==='sun'){s.inventory[preCrop]+=1;result.message+=' ☀️ Солнечный бонус: +1.';}
  if(a.type==='harvestTree'){g.appleHarvests++;if(w.key==='sun'){s.inventory.apple+=1;result.message+=' ☀️ Солнечный бонус: +1 яблоко.';}}
  if(a.type==='collectHoney'&&preHoney>0){g.honeyCollected+=preHoney;if(w.key==='breeze'){s.inventory.honey+=1;g.honeyCollected++;result.message+=' 🍃 Ветер помог пчёлам: +1 мёд.';}}
  ensureOrders(s,now);return result;
 };
 return {WEATHER,WEATHER_MS,DAY_MS,RENT_BASE,CHARACTERS,ORDER_TEMPLATES,STORY,weather,ensureOrders,canDeliver,orderPreview,storyStatus,projectsBuilt,relationship,rentPrice,leaseStatus,refreshCost,characterDialogue,characterPerk};
})(typeof module!=='undefined'&&module.exports?require('./expansion.js'):FarmExpansion);
if(typeof module!=='undefined')module.exports=ValleyGameplay;
