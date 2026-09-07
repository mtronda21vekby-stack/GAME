import type { DomainPort, FarmState, KeyValueStore, LoadResult, Receipt, SavedGame, SaveRepository, SaveResult } from '../ports/contracts.js';
export const SAVE_KEY='bc.world.quiet-valley.v1';
export const LEGACY_KEYS=['quiet-valley.v4','quiet-valley.v3','quiet-valley.v2','quiet-valley.v1'] as const;
export const BACKUP_KEY=SAVE_KEY+'.backup-before-modules';
const FORMAT='blackcrown.quiet-valley.save';
const object=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function decode(raw:string,domain:DomainPort,now:number):SavedGame{
  const data:unknown=JSON.parse(raw);if(!object(data))throw new Error('Некорректное сохранение');
  if(data.format===FORMAT&&data.schemaVersion!==1)throw new Error('Неизвестная версия сохранения');
  const wrapped=data.format===FORMAT;
  const revision=wrapped&&typeof data.revision==='number'&&Number.isSafeInteger(data.revision)&&data.revision>=0?data.revision:0;
  const receipts:Receipt[]=wrapped&&Array.isArray(data.receipts)?data.receipts.slice(-128).filter((r):r is Receipt=>object(r)&&typeof r.id==='string'&&typeof r.command==='string'&&object(r.result)&&typeof r.result.ok==='boolean'&&typeof r.result.message==='string'):[];
  return {state:domain.validate(wrapped?data.state:data,now),revision,receipts};
}
/** Local only. No renderer objects, no tokens, no silent overwrite of corrupt or newer saves. */
export function createLocalSaveRepository(storage:KeyValueStore):SaveRepository {
  let blocked=false,available=true,baselineRaw:string|null=null;
  const backup=(raw:string|null)=>{if(raw!==null&&!storage.getItem(BACKUP_KEY))storage.setItem(BACKUP_KEY,raw);};
  const encode=(v:SavedGame,now:number)=>JSON.stringify({format:FORMAT,schemaVersion:1,writtenAt:now,revision:v.revision,receipts:v.receipts,state:v.state});
  const failed=(message:string,conflict=false):SaveResult=>({ok:false,conflict,message});
  return {
    load(domain,now):LoadResult{
      let raw:string|null=null;
      try{
        raw=storage.getItem(SAVE_KEY);baselineRaw=raw;let legacy=false;
        if(raw===null)for(const key of LEGACY_KEYS){const found=storage.getItem(key);if(found!==null){raw=found;legacy=true;break;}}
        const saved=raw!==null?decode(raw,domain,now):{state:domain.fresh(now),revision:0,receipts:[]};
        if(raw!==null&&(legacy||!(JSON.parse(raw) as {format?:string}).format))backup(raw);
        return {...saved,available:true,blocked:false,warning:''};
      }catch{
        blocked=raw!==null;available=false;
        return {state:domain.fresh(now),revision:0,receipts:[],available:false,blocked,warning:blocked?'Сохранение оставлено нетронутым. Эта ферма временная; импортируйте исправную копию.':'Хранилище недоступно. Экспортируйте копию фермы.'};
      }
    },
    write(value,expectedRevision,now):SaveResult{
      if(blocked)return failed('Сохранение защищено от перезаписи');
      try{
        const current=storage.getItem(SAVE_KEY);
        // Compare exact bytes too: two tabs can have equal revision numbers but different states.
        if(current!==baselineRaw)return failed('Ферма изменена в другой вкладке. Экспортируйте текущую копию и обновите страницу.',true);
        if(current!==null){const data=JSON.parse(current) as {format?:string;revision?:number};if(data.format===FORMAT&&(data.revision??0)!==expectedRevision)return failed('Версия сохранения изменилась',true);}
        const raw=encode(value,now);storage.setItem(SAVE_KEY,raw);baselineRaw=raw;available=true;return {ok:true,conflict:false,message:'Сохранено'};
      }catch{available=false;return failed('Не удалось сохранить. Экспортируйте копию.');}
    },
    replace(value,now):SaveResult{
      try{const old=storage.getItem(SAVE_KEY);backup(old);const raw=encode(value,now);storage.setItem(SAVE_KEY,raw);baselineRaw=raw;blocked=false;available=true;return {ok:true,conflict:false,message:'Ферма восстановлена'};}
      catch{available=false;return failed('Не удалось сохранить импорт. Исходная ферма не заменена.');}
    },
    inspect:()=>Object.freeze({blocked,available:available&&!blocked,key:SAVE_KEY}),
  };
}
