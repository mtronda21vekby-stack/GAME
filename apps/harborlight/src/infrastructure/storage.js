import {restore} from '../domain/simulation.js';
const KEY='harborlight.v1';
export class SaveStore{
 constructor(storage){this.storage=storage;this.blocked=false;this.available=true;this.profile={unlocked:0,best:[0,0,0],played:0,audio:false,quality:'balanced'};this.saved=null;this.warning='';
  try{const raw=storage.getItem(KEY);if(raw){const o=JSON.parse(raw);if(o.version!==1)throw Error('Unknown save version');if(o.run)this.saved=restore(o.run);const p=o.profile;if(!p||!Number.isInteger(p.unlocked)||p.unlocked<0||p.unlocked>2||!Array.isArray(p.best)||p.best.length!==3||p.best.some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid profile');this.profile={...this.profile,...p};}}
  catch(e){this.blocked=true;this.available=false;this.warning='Сохранение недоступно или повреждено. Оно не будет перезаписано.';}
 }
 save(run){if(this.blocked)return false;try{this.storage.setItem(KEY,JSON.stringify({version:1,profile:this.profile,run:run&&['playing','upgrade'].includes(run.phase)?run:null}));this.saved=run;return true;}catch{this.available=false;return false;}}
 complete(s){this.profile.best[s.mapId]=Math.max(this.profile.best[s.mapId]||0,s.score);this.profile.played++;if(s.phase==='won')this.profile.unlocked=Math.min(2,Math.max(this.profile.unlocked,s.mapId+1));this.save(null);}
 export(s){return JSON.stringify({version:1,profile:this.profile,run:s},null,2);}
}
