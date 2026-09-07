import type {KeyValueStore,SaveRepository,FarmState,SaveResult} from '../ports/contracts.js';
export const SAVE_KEY='bc.world.quiet-valley.v1';
export const LEGACY_KEYS=['quiet-valley.v4','quiet-valley.v3','quiet-valley.v2','quiet-valley.v1'];
export const BACKUP_KEY=SAVE_KEY+'.backup-before-restored';
/** Preserve raw v1-v4 farm format for rollback. Corrupt saves never get overwritten automatically. */
export function createSaveRepository(storage:KeyValueStore):SaveRepository {
 let baseline:string|null=null,blocked=false,available=true;
 const backup=(raw:string|null)=>{if(raw!==null&&storage.getItem(BACKUP_KEY)===null)storage.setItem(BACKUP_KEY,raw);};
 function write(state:FarmState,replace=false):SaveResult{
  if(blocked&&!replace)return {ok:false,message:'Сохранение защищено. Экспортируйте текущую ферму.'};
  try{const current=storage.getItem(SAVE_KEY);
   if(!replace&&current!==baseline)return {ok:false,conflict:true,message:'Другая вкладка изменила ферму. Экспортируйте копию перед обновлением.'};
   backup(current);const encoded=JSON.stringify(state);storage.setItem(SAVE_KEY,encoded);baseline=encoded;available=true;blocked=false;return {ok:true,message:'Сохранено на устройстве'};
  }catch{available=false;return {ok:false,message:'Экспортируйте копию: хранилище недоступно'};}
 }
 return {
  load(domain,now){let raw:string|null=null;
   try{raw=storage.getItem(SAVE_KEY);baseline=raw;if(raw===null)for(const key of LEGACY_KEYS){raw=storage.getItem(key);if(raw!==null)break;}
    const state=raw===null?domain.fresh(now):domain.validate(JSON.parse(raw),now);backup(raw);return {state,warning:''};
   }catch{available=false;blocked=raw!==null;return {state:domain.fresh(now),warning:blocked?'Сохранение оставлено нетронутым. Текущая ферма временная — восстановите исправную копию.':'Сохранение недоступно. Экспортируйте копию фермы.'};}
  },save:state=>write(state),replace:state=>write(state,true),inspect:()=>({available:available&&!blocked,blocked,key:SAVE_KEY})
 };
}
