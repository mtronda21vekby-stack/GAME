import {MAPS,SHIPS,COLORS,STAGES,UPGRADE_INFO} from '../domain/catalog.js';
import {icon} from './icons.js';
const $=q=>document.querySelector(q);
export class HUD{
 constructor(actions,store){this.actions=actions;this.store=store;this.nodes=new Map();this.toastUntil=0;this.lastEvent=0;this.phase='';this.selectedMap=0;
  document.querySelectorAll('[data-icon]').forEach(n=>n.innerHTML=icon(n.dataset.icon));
  $('#start').onclick=()=>actions.start(this.selectedMap);$('#continue').onclick=()=>actions.resume();$('#pause').onclick=()=>actions.pause();$('#focus').onclick=()=>actions.focus();$('#hold').onclick=()=>actions.hold();
  $('#zoom-in').onclick=()=>actions.zoom(1.18);$('#zoom-out').onclick=()=>actions.zoom(1/1.18);$('#camera-home').onclick=()=>actions.resetCamera();$('#sound').onclick=()=>actions.audio();$('#help').onclick=()=>this.help();
  $('#menu-link').onclick=()=>actions.menu();$('#resume').onclick=()=>actions.pause(false);$('#restart').onclick=()=>actions.start(actions.state().mapId);$('#pause-menu').onclick=()=>actions.menu();
  $('#play-again').onclick=()=>actions.start(this.selectedMap);$('#result-menu').onclick=()=>actions.menu();
  $('#help-close').onclick=()=>{ $('#help-modal').hidden=true;actions.pause(false);};
  $('#quality').onchange=e=>actions.quality(e.target.value);$('#quality').value=store.profile.quality;
  this.updateMenu();
 }
 updateMenu(){
  $('#continue').hidden=!this.store.saved||!['playing','upgrade'].includes(this.store.saved.phase);$('#best-menu').textContent=Math.max(...this.store.profile.best).toLocaleString('ru-RU');
  $('#map-select').innerHTML=MAPS.map(m=>`<button class="map-option ${m.id===this.selectedMap?'active':''}" data-map="${m.id}" ${m.id>this.store.profile.unlocked?'disabled':''}><span>0${m.id+1}</span><strong>${m.name}</strong><small>${m.id>this.store.profile.unlocked?'Пройдите предыдущую бухту':m.subtitle}</small></button>`).join('');
  $('#map-select').querySelectorAll('button').forEach(b=>b.onclick=()=>{this.selectedMap=+b.dataset.map;this.actions.preview(this.selectedMap);this.updateMenu();});
 }
 showMenu(show){$('#main-menu').hidden=!show;$('#game-ui').hidden=show;$('#ports').hidden=show;$('#ship-labels').hidden=show;$('#pause-modal').hidden=true;$('#result-modal').hidden=true;$('#upgrade-modal').hidden=true;if(show){this.updateMenu();this.phase='';}}
 setPorts(mapId){$('#ports').innerHTML=MAPS[mapId].ports.map(p=>`<button class="port" data-port="${p.id}" style="--port:${p.color}" aria-label="К причалу ${p.label}: ${p.name}"><b>${p.label}</b><span>${p.name}</span><i></i></button>`).join('');$('#ports').querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();this.actions.port(b.dataset.port);});}
 paused(value){$('#pause-modal').hidden=!value;$('#pause').setAttribute('aria-label',value?'Продолжить':'Пауза');}
 help(){this.actions.pause(true);$('#pause-modal').hidden=true;$('#help-modal').hidden=false;}
 toast(text,bad=false){$('#toast').textContent=text;$('#toast').classList.toggle('bad',bad);$('#toast').hidden=false;this.toastUntil=performance.now()+3500;}
 audio(value){$('#sound').classList.toggle('enabled',value);$('#sound').setAttribute('aria-label',value?'Выключить звук':'Включить звук');}
 update(s,view,selected,paused){
  $('#score').textContent=s.score.toLocaleString('ru-RU');$('#delivered').textContent=String(s.delivered).padStart(2,'0');
  const spec=STAGES[Math.min(s.stage,2)];$('#stage-title').textContent=spec.name;$('#stage-count').textContent=`ВАХТА ${s.stage+1} / 3`;
  $('#stage-progress').style.width=(s.spawned-s.ships.length)/spec.ships*100+'%';
  $('#weather').textContent=s.stage>=2?'Шторм · течение замедляет суда':s.stage===1?'Закат · плотное движение':'Тихое море · хорошая видимость';
  $('#hearts').innerHTML=Array.from({length:3},(_,i)=>`<i class="${i<s.maxStrikes-s.strikes?'intact':''}"></i>`).join('');
  $('#combo').textContent=s.combo>1?`Серия ×${s.combo}`:'Чистый курс';
  $('#focus').disabled=s.focusCooldown>0;$('#focus .timer').textContent=s.focusLeft>0?'Время ×¼':s.focusCooldown>0?Math.ceil(s.focusCooldown)+' с':'6 секунд';$('#focus').classList.toggle('active',s.focusLeft>0);
  $('#game-ui').classList.toggle('focused',s.focusLeft>0);
  const ship=s.ships.find(b=>b.id===selected);
  $('#selection').hidden=!ship;
  if(ship){const p=MAPS[s.mapId].ports.find(p=>p.id===ship.kind);$('#selection').style.setProperty('--port',p.color);$('#selected-name').textContent=SHIPS[ship.kind].name;$('#selected-time').textContent=Math.max(0,Math.ceil(ship.patience-ship.age))+' с';$('#selected-goal').textContent=`Причал ${p.label} · ${p.name}`;$('#hold').innerHTML=icon(ship.hold>0?'play':'pause')+`<span>${ship.hold>0?'Продолжить':'Остановить'}</span>`;}
  $('#instruction').textContent=ship?'Нажмите свой причал или нарисуйте новый курс':'Выберите судно → нажмите причал того же цвета';
  for(const p of MAPS[s.mapId].ports){const n=$(`[data-port="${p.id}"]`),xy=view.project(p,.45);n.style.left=xy.x+'px';n.style.top=xy.y+'px';n.classList.toggle('target',ship?.kind===p.id);n.classList.toggle('muted',!!ship&&ship.kind!==p.id);}
  const alive=new Set();
  for(const b of s.ships){alive.add(b.id);let n=this.nodes.get(b.id);if(!n){n=document.createElement('button');n.className='ship-label';n.dataset.ship=b.id;n.setAttribute('aria-label',`Судно ${b.id}: ${SHIPS[b.kind].name}`);n.innerHTML=`<b></b><small></small>`;n.style.setProperty('--port',COLORS[b.kind]);$('#ship-labels').append(n);n.onpointerdown=e=>this.actions.shipPointer(e,b.id);this.nodes.set(b.id,n);}
   const p=view.project(b,1.2),remaining=Math.max(0,Math.ceil(b.patience-b.age));n.style.left=Math.max(24,Math.min(view.width-24,p.x))+'px';n.style.top=Math.max(100,Math.min(view.height-130,p.y-10))+'px';n.querySelector('b').textContent=MAPS[s.mapId].ports.find(p=>p.id===b.kind).label;n.querySelector('small').textContent=b.docking>0?'✓':b.hold>0?'Ⅱ':remaining+'с';n.classList.toggle('selected',b.id===selected);n.classList.toggle('urgent',remaining<14);n.hidden=b.docking>0;
  }
  for(const [id,n]of this.nodes)if(!alive.has(id)){n.remove();this.nodes.delete(id);}
  $('#sos').hidden=!s.rescue;
  if(s.rescue){const p=view.project(s.rescue,1.0);$('#sos').style.left=p.x+'px';$('#sos').style.top=p.y+'px';$('#sos').textContent='SOS · '+Math.ceil(s.rescue.remaining)+'с';$('#sos').onclick=()=>this.actions.rescue();}
  if(performance.now()>this.toastUntil)$('#toast').hidden=true;
  for(const e of s.events)if(e.id>this.lastEvent){if(e.type!=='route'&&e.type!=='spawn')this.toast(e.text,e.type==='collision'||e.type==='miss');this.actions.event(e.type);this.lastEvent=Math.max(this.lastEvent,e.id);}
  if(this.phase!==s.phase){this.phase=s.phase;$('#upgrade-modal').hidden=s.phase!=='upgrade';$('#result-modal').hidden=!['won','lost'].includes(s.phase);
   if(s.phase==='upgrade'){
    $('#upgrade-title').textContent='Вахта окончена. Бухта дышит.';$('#upgrade-sub').textContent=`${s.delivered} судов в порту. Выберите одно бесплатное улучшение перед следующей вахтой.`;
    const options=s.strikes>0?[UPGRADE_INFO[4],UPGRADE_INFO[s.stage%3],UPGRADE_INFO[2]]:[UPGRADE_INFO[0],UPGRADE_INFO[1],UPGRADE_INFO[3]];
    $('#upgrades').innerHTML=options.map(u=>`<button data-upgrade="${u.key}"><span>${u.icon}</span><strong>${u.title}</strong><small>${u.desc}</small></button>`).join('');$('#upgrades').querySelectorAll('button').forEach(b=>b.onclick=()=>this.actions.upgrade(b.dataset.upgrade));
   }
   if(['won','lost'].includes(s.phase)){
    $('#result-kicker').textContent=s.phase==='won'?'ЭКСПЕДИЦИЯ ЗАВЕРШЕНА':'ВАХТА ОКОНЧЕНА';$('#result-title').textContent=s.phase==='won'?'Все огни горят.':'Море учит терпению.';
    $('#result-score').textContent=s.score.toLocaleString('ru-RU');$('#result-detail').textContent=`${s.delivered} доставок · ${s.rescued} спасений · лучшая серия ×${s.bestCombo}`;
    $('#result-next').hidden=!(s.phase==='won'&&s.mapId<2);$('#result-next').onclick=()=>this.actions.start(s.mapId+1);
    $('#play-again').onclick=()=>this.actions.start(s.mapId);
   }
  }
 }
}
