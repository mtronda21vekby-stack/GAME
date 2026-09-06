/* HTML presentation only. Mutations go through FarmSim.act, never through UI balances. */
'use strict';
const ValleyUI=(()=>{
 const X=FarmExpansion;
 const cost=c=>`${c.coins} 🪙${c.wood?' · '+c.wood+' 🪵':''}${c.stone?' · '+c.stone+' 🪨':''}`;
 function mini(region){
  const tree=(x,y,c='#81a16f',size=1)=>`<g transform="translate(${x} ${y}) scale(${size})"><path d="M0 1v24" stroke="#927d55" stroke-width="5"/><ellipse cx="0" cy="-4" rx="15" ry="21" fill="${c}"/><ellipse cx="-8" cy="-9" rx="12" ry="15" fill="#9cb583"/></g>`;
  const house=(x,y,c='#859d8c')=>`<g transform="translate(${x} ${y})"><path d="M-25 0L0 12 25 0v-26L0-39-25-26Z" fill="#e8d9b6"/><path d="M-32-25 0-51 32-25 0-10Z" fill="${c}"/><path d="M2 10V-5L12-10V5" fill="#759486"/></g>`;
  let art='';
  if(region==='farm'){art=house(78,76)+house(145,48,'#c6ac87');for(let i=0;i<6;i++){const x=123+i%3*22,y=86+Math.floor(i/3)*13;art+=`<path d="M${x} ${y}l16-8 16 8-16 8Z" fill="#a8895c"/><path d="M${x+14} ${y-1}v-9" stroke="#7ca065" stroke-width="6"/>`;}art+=tree(205,52)+tree(45,60);}
  if(region==='orchard'){art=house(60,68,'#b99286');for(let i=0;i<6;i++){let x=96+(i%3)*40,y=67+Math.floor(i/3)*28;art+=tree(x,y,'#95b374',.85)+`<circle cx="${x+8}" cy="${y-5}" r="4" fill="#d08063"/><circle cx="${x-7}" cy="${y+1}" r="3" fill="#d08063"/>`;}}
  if(region==='river'){art='<path d="M173 15Q117 57 137 90T99 147" fill="none" stroke="#7faeac" stroke-width="24"/>'+house(68,69);art+=`<path d="M97 87l62-34" stroke="#af966c" stroke-width="15"/><path d="M97 79l62-34M97 89l62-34" stroke="#e6d8b5" stroke-width="3"/>`;for(let i=0;i<4;i++)art+=`<path d="M167 ${74+i*11}l31-15 15 7-31 16Z" fill="#ac9066"/>`;art+=tree(208,44);}
  if(region==='forest'){for(let i=0;i<8;i++)art+=tree(48+i*23,48+(i%2)*9,'#73977e',.95);art+=house(90,94);for(let i=0;i<3;i++)art+=`<path d="M${150+i*20} 89v-16l12-6 12 6v16l-12 6Z" fill="#d1b977"/>`;art+=tree(204,98,'#789776',.85);}
  return `<svg class="region-mini" viewBox="0 0 270 158" aria-hidden="true"><ellipse cx="135" cy="126" rx="108" ry="19" fill="#68765f" opacity=".10"/><path d="M26 87 135 28 245 88v16l-110 44L26 105Z" fill="#b6a787"/><path d="M26 87 135 28 245 88 135 133Z" fill="${X.regions[region].color}"/><path d="M46 94 135 46 223 91" fill="none" stroke="#e7dabe" stroke-width="8" opacity=".6"/>${art}</svg>`;
 }
 function nav(kind){return `<nav class="valley-tabs" aria-label="Разделы долины"><button data-valley-tab="map" class="${kind==='map'?'active':''}">Карта долины</button><button data-valley-tab="land" class="${kind==='land'?'active':''}">Улучшения</button><button data-valley-tab="decor" class="${kind==='decor'?'active':''}">Украшения</button></nav>`;}
 function header(s,kind){const area=X.regions[s.world.region];return `<button class="close" data-close-modal aria-label="Закрыть окно">×</button><div class="eyebrow">ТИХАЯ ДОЛИНА · НОВЫЕ ГОРИЗОНТЫ</div><h2 id="modal-title">${kind==='map'?'Ваша маленькая вселенная':kind==='land'?'Пусть здесь будет уютно':'Создайте своё место'}</h2><p>${kind==='map'?'Четыре уголка одной долины. Исследуйте бесплатно; урожай и продукция не останавливаются, пока вы в пути.':area.name+' · стройте за игровые ресурсы. Никаких реальных покупок.'}</p>${nav(kind)}`;}
 function summary(s){return `<div class="supply-strip"><span><b>${s.coins}</b> 🪙 монет</span><span><b>${s.world.materials.wood}</b> 🪵 древесины</span><span><b>${s.world.materials.stone}</b> 🪨 камня</span></div>`;}
 function modal(kind,s){let html=header(s,kind);const region=s.world.region;
  if(kind==='map'){
   html+='<div class="region-grid">';for(const [key,r] of Object.entries(X.regions)){
    const defs=Object.entries(X.projects).filter(([,p])=>p.region===key),done=defs.filter(([k,p])=>X.level(s,k)>=p.max).length;
    html+=`<article class="region-card ${region===key?'here':''}"><div class="region-picture" data-theme="${key}">${mini(key)}<span class="region-stamp">${key==='farm'?'ДОМ':key==='orchard'?'ЯБЛОКИ':key==='river'?'+8 ГРЯДОК':'МЁД И РЕСУРСЫ'}</span></div><div class="region-copy"><small>${r.tag}</small><h3>${r.name}</h3><p>${r.description}</p><div class="region-card-bottom"><span>${done} / ${defs.length} проектов</span><button class="primary" data-travel="${key}">${region===key?'Вы здесь · открыть':'Отправиться →'}</button></div></div></article>`;
   }html+='</div><div class="fineprint">Прогресс каждой локации сохраняется вместе с фермой. Все покупки — только за заработанные игровые монеты.</div>';
  } else if(kind==='land'){
   html+=summary(s)+`<div class="land-region-title">${X.regions[region].icon} ${X.regions[region].name}<button data-valley-tab="map">Сменить участок ↗</button></div><div class="project-list">`;
   for(const [key,p] of Object.entries(X.projects).filter(([,p])=>p.region===region)){
    const lv=X.level(s,key),complete=lv>=p.max,error=X.projectError(s,key),c=X.projectCost(s,key);
    html+=`<article class="project-card ${complete?'built':''}" id="project-${key}"><span class="project-icon">${p.icon}</span><div class="project-copy"><h3>${p.name}${p.max>1?' <small>'+lv+'/'+p.max+'</small>':''}</h3><p>${p.desc}</p><div class="project-meta">${complete?'✓ Построено':cost(c)}</div>${!complete&&error?`<small class="project-blocker">${error}</small>`:''}</div><button class="primary" data-action="upgrade" data-key="${key}" ${error?'disabled':''}>${complete?'Готово ✓':lv?'Улучшить':'Построить'}</button></article>`;
   }
   html+='</div><div class="supplies"><b>Не хватает строительных материалов?</b><p>Убирайте пни и камни в локациях — это бесплатно. Либо закажите небольшую поставку за игровые монеты.</p><div><button class="secondary" data-action="buyMaterial" data-key="wood" data-qty="5" '+(s.coins<15?'disabled':'')+'>5 🪵 за 15 🪙</button><button class="secondary" data-action="buyMaterial" data-key="stone" data-qty="5" '+(s.coins<20?'disabled':'')+'>5 🪨 за 20 🪙</button></div></div>';
  }else{
   html+=summary(s)+`<div class="notice">Выберите предмет, затем нажмите на свободную <b>подсвеченную клетку</b> в 3D-мире. Можно вращать предмет до установки. Украшения не заменяют постройки и не перекрывают грядки.</div><div class="decoration-grid">`;
   for(const [key,d] of Object.entries(X.decor))html+=`<button class="decoration-card" data-place="${key}" ${s.coins<d.price?'disabled':''}><span>${d.icon}</span><b>${d.name}</b><small>${d.price} 🪙</small></button>`;
   html+=`</div><div class="modal-button-row"><button class="secondary" data-place="remove">Разобрать украшения · вернуть 50%</button></div><div class="fineprint">На этом участке: ${s.world.decor.filter(d=>d.region===region).length} / 24 украшения. Постройки и природные деревья не разбираются этим инструментом.</div>`;
  }
  return html;
 }
 function detail(f,s){let html='<button class="close" data-close-details aria-label="Закрыть">×</button>';
  if(f.kind==='tree'){
   const t=s.world.trees[f.id],ready=t.waterAt&&Date.now()>=t.readyAt,left=Math.max(0,Math.ceil((t.readyAt-Date.now())/1000));
   html+=`<div class="eyebrow">ЯБЛОНЕВЫЙ САД · ДЕРЕВО ${f.id+1} / 6</div><div class="detail-icon">🍎</div><h2 class="detail-title">${t.planted?'Ваша яблоня':'Новый саженец'}</h2>`;
   if(!t.planted)html+='<p class="detail-desc">Одна посадка — много урожаев. После каждого сбора дерево нужно полить снова.</p><button class="primary" data-action="plantTree" data-id="'+f.id+'" '+(s.coins<15?'disabled':'')+'>Посадить яблоню · 15 🪙</button>';
   else if(ready)html+='<p class="detail-desc">Три спелых яблока. Можно продать за 36 монет в амбаре.</p><button class="primary" data-action="harvestTree" data-id="'+f.id+'">Собрать 3 яблока</button>';
   else if(!t.waterAt)html+='<p class="detail-desc">Немного воды — и начнётся новый цикл. Полив бесплатный.</p><button class="primary" data-action="waterTree" data-id="'+f.id+'">Полить яблоню 💧</button>';
   else html+='<p class="detail-desc">Яблоня цветёт. До следующего урожая: <b data-tree-remaining>'+left+' сек.</b></p><div class="soil-status">💧 '+(X.irrigated(s,'orchard')?'Капельный полив работает':'Земля влажная')+'</div>';
  } else if(f.kind==='honey'){
   const n=s.world.apiaryStock,cap=X.level(s,'forest_cabin')?6:3,left=Math.max(1,45-Math.floor((Date.now()-s.world.apiaryAt)/1000));
   html+=`<div class="eyebrow">ЛЕСНАЯ ПОЛЯНА · ПАСЕКА</div><div class="detail-icon">🍯</div><h2 class="detail-title">Лесной мёд</h2><p class="detail-desc">В запасе: <b>${n} / ${cap}</b> баночек. ${n<cap?'Следующая примерно через '+left+' сек.':'Хранилище заполнено.'}</p><button class="primary" data-action="collectHoney" ${n?'':'disabled'}>Забрать мёд · ${n} шт.</button><div class="fineprint">Цена продажи: 26 монет за баночку. Домик пасечника увеличивает вместимость.</div>`;
  }
  return html;
 }
 return {modal,detail,cost};
})();
