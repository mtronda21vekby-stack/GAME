import {createGame,step,command,restore} from '../domain/simulation.js';
import {findRoute,validPath,distance,finitePoint} from '../domain/navigation.js';
import {MAPS,SHIPS,VERSION} from '../domain/catalog.js';
import {HarborView} from '../rendering/view.js';
import {HUD} from '../ui/hud.js';
import {SaveStore} from '../infrastructure/storage.js';
import {AudioBus} from '../infrastructure/audio.js';

const canvas=document.getElementById('world'),loading=document.getElementById('loading');
let state=createGame(),view,hud,raf,mode='menu',paused=false,selected=null,accumulator=0,lastFrame=0,lastSave=0,draft=null,disposed=false,initReady=false;
const store=new SaveStore({getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)}),audio=new AudioBus();
function error(e){paused=true;loading.hidden=true;const el=document.getElementById('error');el.hidden=false;el.querySelector('p').textContent=String(e?.message||e);store.save(mode==='play'?state:store.saved);console.error(e);}
window.addEventListener('error',e=>error(e.error||e.message));window.addEventListener('unhandledrejection',e=>error(e.reason));
function save(){if(mode==='play')store.save(state);}
function dispatch(c){const candidate=structuredClone(state);const result=command(candidate,c);if(result.ok){state=candidate;save();}else hud.toast(result.message,true);return result;}
function select(id){selected=id;}
function routeTo(p){const ship=state.ships.find(b=>b.id===selected);if(!ship)return hud.toast('Сначала выберите судно');const path=findRoute(ship,p,MAPS[state.mapId]);if(path.length)dispatch({type:'route',id:ship.id,path});else hud.toast('Здесь нет безопасного прохода',true);}
function stopDraft(){draft=null;view?.setDraft([]);}
function pointerStart(e,id){
 if(mode!=='play'||paused||state.phase!=='playing')return;e.preventDefault();selected=id;
 const rect=canvas.getBoundingClientRect();draft={id,start:{x:e.clientX,y:e.clientY},points:[],pointerId:e.pointerId,moved:false};
 const target=e.currentTarget;try{target.setPointerCapture(e.pointerId);}catch{}
}
function pointerMove(e){if(!draft||e.pointerId!==draft.pointerId)return;const rect=canvas.getBoundingClientRect();const p=view.ground(e.clientX-rect.left,e.clientY-rect.top);
 if(Math.hypot(e.clientX-draft.start.x,e.clientY-draft.start.y)>8)draft.moved=true;
 if(!draft.moved||!finitePoint(p))return;
 if(!draft.points.length||distance(p,draft.points.at(-1))>.28)draft.points.push(p);
 if(draft.points.length>150)draft.points.shift();
 const ship=state.ships.find(b=>b.id===draft.id);if(ship)view.setDraft([ship,...draft.points],validPath(ship,draft.points,MAPS[state.mapId]));
}
function pointerEnd(e){if(!draft||e.pointerId!==draft.pointerId)return;const ship=state.ships.find(b=>b.id===draft.id);
 if(draft.moved&&ship&&draft.points.length){const p=draft.points.at(-1),port=MAPS[state.mapId].ports.find(d=>distance(d,p)<2);if(port)draft.points.push({x:port.x,z:port.z});dispatch({type:'route',id:ship.id,path:draft.points});}
 stopDraft();
}
const actions={state:()=>state,
 async preview(map){if(!initReady)return;state=demo(map);await view.setMap(map);},
 async start(map){if(!initReady)return;save();state=createGame(map,(Date.now()>>>0));mode='play';paused=false;selected=null;lastFrame=performance.now();accumulator=0;hud.lastEvent=0;view.lastEvents=0;hud.phase='';hud.showMenu(false);hud.setPorts(map);await view.setMap(map);view.resetCamera();save();if(store.warning)hud.toast(store.warning,true);},
 async resume(){if(!store.saved)return;state=restore(store.saved);mode='play';paused=false;selected=null;lastFrame=performance.now();accumulator=0;hud.lastEvent=0;hud.phase='';hud.showMenu(false);hud.setPorts(state.mapId);await view.setMap(state.mapId);},
 pause(value){if(mode!=='play')return;paused=typeof value==='boolean'?value:!paused;stopDraft();hud.paused(paused);save();},
 async menu(){save();mode='menu';paused=false;selected=null;stopDraft();hud.showMenu(true);state=demo(hud.selectedMap);await view.setMap(state.mapId);},
 focus(){if(!paused)dispatch({type:'focus'});},hold(){if(selected!==null&&!paused)dispatch({type:'hold',id:selected});},
 port(id){if(paused||mode!=='play')return;const p=MAPS[state.mapId].ports.find(p=>p.id===id);routeTo(p);},
 rescue(){if(state.rescue&&!paused)routeTo(state.rescue);},
 upgrade(key){dispatch({type:'upgrade',key});},shipPointer:pointerStart,
 zoom(f){view.zoomBy(f);},resetCamera(){view.resetCamera();},
 quality(q){if(!['low','balanced','high'].includes(q))return;view.setQuality(q);store.profile.quality=q;save();},
 audio(){audio.enable(!audio.enabled);hud.audio(audio.enabled);store.profile.audio=audio.enabled;save();},event(t){audio.event(t);}
};
function demo(map=0){const s=createGame(map,8721);s.events=[];s.ships=[];for(let i=0;i<4;i++)s.ships.push({id:300+i,kind:['cargo','fishing','ferry','fishing'][i],x:[-6,0,7,-12][i],z:[2,-2,1,3][i],heading:[1.1,.7,2.8,-.2][i],path:[],age:0,patience:60,hold:0,rescued:false,docking:0,hitCooldown:0});return s;}
function frame(now){if(disposed)return;const dt=Math.max(0,Math.min(.20,(now-lastFrame)/1000||.016));lastFrame=now;
 if(mode==='play'&&!paused&&state.phase==='playing'){
  accumulator+=dt;while(accumulator>=1/30){step(state,1/30);accumulator-=1/30;}
  if(['won','lost'].includes(state.phase))store.complete(state);
  if(now-lastSave>2000){save();lastSave=now;}
 }
 try{view.update(state,dt,selected,mode==='menu');if(mode==='play')hud.update(state,view,selected,paused);}catch(e){error(e);return;}
 raf=requestAnimationFrame(frame);
}
try{
 view=new HarborView(canvas,error);hud=new HUD(actions,store);state=demo();
 view.setQuality(store.profile.quality);await view.setMap(0);view.update(state,.016,null,true);
 loading.hidden=true;initReady=true;document.getElementById('start').disabled=false;hud.showMenu(true);hud.audio(false);lastFrame=performance.now();raf=requestAnimationFrame(frame);
}catch(e){error(e);}
canvas.addEventListener('pointerdown',e=>{
 if(mode!=='play'||paused)return;const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
 const closest=state.ships.filter(b=>b.docking<=0).map(b=>({id:b.id,d:Math.hypot(view.project(b,.7).x-x,view.project(b,.7).y-y)})).sort((a,b)=>a.d-b.d)[0];
 if(closest&&closest.d<32){pointerStart(e,closest.id);return;}
 const p=view.ground(x,y);if(selected!==null&&finitePoint(p))routeTo(p);
});
window.addEventListener('pointermove',pointerMove);window.addEventListener('pointerup',pointerEnd);window.addEventListener('pointercancel',stopDraft);
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;if(e.code==='Space'){e.preventDefault();actions.pause();}if(e.code==='KeyF')actions.focus();if(e.key==='Escape'){stopDraft();actions.pause();}});
canvas.addEventListener('wheel',e=>{e.preventDefault();view.zoomBy(e.deltaY<0?1.08:1/1.08);},{passive:false});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(mode==='play'&&state.phase==='playing'){paused=true;hud.paused(true);}save();}lastFrame=performance.now();});
window.addEventListener('pagehide',save);
// Read-only diagnostics; all gameplay actions still use validated commands.
window.Harborlight=Object.freeze({version:VERSION,inspect:()=>({state:structuredClone(state),mode,paused,selected,render:view?.diagnostics(),ready:initReady}),project:p=>view?.project(p),dispose(){save();disposed=true;cancelAnimationFrame(raf);view?.dispose();audio.dispose();}});
