import {parseCommand} from './commands.js';
import type {Clock,DomainPort,FarmState,Result,SaveRepository,SaveResult} from '../ports/contracts.js';
const copy=<T>(v:T):T=>structuredClone(v);
function freeze<T>(v:T):T{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.freeze(v);for(const value of Object.values(v))freeze(value);}return v;}
const failure=(message:string,code:string):Result=>({ok:false,message,code});
/** One state writer. Rejected commands cannot partially mutate the farm. UI sees frozen copies. */
export class GameSession {
 #state:FarmState;#revision=0;#view:Readonly<FarmState>|null=null;#lastNow:number;#disposed=false;
 #receipts=new Map<string,{signature:string;result:Result}>();
 readonly warning:string;
 constructor(private domain:DomainPort,private clock:Clock,private repository:SaveRepository){
  this.#lastNow=clock.now();const loaded=repository.load(domain,this.#lastNow);this.#state=loaded.state;this.warning=loaded.warning;domain.resume(this.#state,this.#lastNow);
 }
 now(){this.#lastNow=Math.max(this.#lastNow,this.clock.now());return this.#lastNow;}
 snapshot():Readonly<FarmState>{return this.#view??(this.#view=freeze(copy(this.#state)));}
 dispatch(raw:unknown,id?:string,expectedRevision?:number):Result {
  if(this.#disposed)return failure('Сессия закрыта','disposed');
  let command;try{command=parseCommand(raw);}catch(e){return failure(e instanceof Error?e.message:'Некорректное действие','invalid-command');}
  const signature=JSON.stringify(command);
  if(id){if(!/^[\w-]{1,96}$/.test(id))return failure('Некорректный requestId','invalid-id');const receipt=this.#receipts.get(id);if(receipt)return receipt.signature===signature?copy(receipt.result):failure('requestId уже использован','idempotency-conflict');}
  if(expectedRevision!==undefined&&expectedRevision!==this.#revision)return failure('Ферма изменилась','revision-conflict');
  const candidate=copy(this.#state);let result;
  try{result=this.domain.act(candidate,command,this.now());}catch{return failure('Действие отменено. Ферма не изменена.','domain-error');}
  if(!result.ok)return copy(result);
  this.#state=candidate;this.#revision++;this.#view=null;
  if(id){this.#receipts.set(id,{signature,result:copy(result)});if(this.#receipts.size>128)this.#receipts.delete(this.#receipts.keys().next().value!);}
  return copy(result);
 }
 advance(resume=false){if(this.#disposed)return;this.domain[resume?'resume':'tick'](this.#state,this.now());this.#revision++;this.#view=null;}
 save():SaveResult{return this.#disposed?{ok:false,message:'Сессия закрыта'}:this.repository.save(this.#state);}
 exportJSON(){return JSON.stringify(this.#state,null,2);}
 importJSON(raw:string):SaveResult {
  if(this.#disposed)throw Error('Сессия закрыта');if(raw.length>1048576)throw Error('Слишком большой файл');
  const state=this.domain.validate(JSON.parse(raw),this.now());this.domain.resume(state,this.now());
  const result=this.repository.replace(state);if(result.ok){this.#state=state;this.#revision++;this.#view=null;this.#receipts.clear();}return result;
 }
 reset():SaveResult{return this.importJSON(JSON.stringify(this.domain.fresh(this.now())));}
 persistence(){return this.repository.inspect();}
 get revision(){return this.#revision;}
 dispose(){if(this.#disposed)return;this.save();this.#disposed=true;this.#receipts.clear();}
}
