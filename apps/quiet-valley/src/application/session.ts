import type { ActionResult, Clock, DomainPort, FarmState, Receipt, SaveRepository, SaveResult, SessionEvent } from '../ports/contracts.js';
import { parseCommand } from './commands.js';

const clone = <T>(value:T):T => structuredClone(value);
function freeze<T>(value:T):T {
  if(value && typeof value==='object' && !Object.isFrozen(value)){
    Object.freeze(value);for(const v of Object.values(value))freeze(v);
  }return value;
}
const fail=(message:string,code:string):ActionResult=>({ok:false,message,code});

/** Single writer for one farm. No DOM, WebGL, storage implementation or network imports. */
export class GameSession {
  #state:FarmState; #revision:number; #persisted:number; #receipts:Receipt[];
  #listeners=new Set<(e:SessionEvent)=>void>(); #disposed=false; #lastTime:number;
  readonly warning:string;
  constructor(private domain:DomainPort, private clock:Clock, private repository:SaveRepository){
    this.#lastTime=clock.now();const loaded=repository.load(domain,this.#lastTime);
    this.#state=loaded.state;this.#revision=loaded.revision;this.#persisted=loaded.revision;this.#receipts=loaded.receipts;
    this.warning=loaded.warning;domain.resume(this.#state,this.#lastTime);
  }
  get revision(){return this.#revision;}
  now(){this.#lastTime=Math.max(this.#lastTime,this.clock.now());return this.#lastTime;}
  snapshot():Readonly<FarmState>{return freeze(clone(this.#state));}
  subscribe(listener:(e:SessionEvent)=>void):()=>void {this.#listeners.add(listener);return()=>this.#listeners.delete(listener);}
  #notify(event:SessionEvent){for(const listener of this.#listeners){try{listener(event);}catch(error){console.error('Game observer failed',error);}}}
  dispatch(raw:unknown, requestId?:string, expectedRevision?:number):ActionResult{
    if(this.#disposed)return fail('Сессия закрыта','disposed');
    let command;try{command=parseCommand(raw);}catch(error){return fail(error instanceof Error?error.message:'Некорректная команда','invalid-command');}
    const signature=JSON.stringify(command);
    if(requestId!==undefined){
      if(!/^[\w-]{1,96}$/.test(requestId))return fail('Некорректный requestId','invalid-request-id');
      const receipt=this.#receipts.find(r=>r.id===requestId);
      if(receipt)return receipt.command===signature?clone(receipt.result):fail('requestId уже использован другой командой','idempotency-conflict');
    }
    if(expectedRevision!==undefined&&expectedRevision!==this.#revision)return fail('Состояние фермы изменилось','revision-conflict');
    // Mutate a candidate. A rejected command or an exception can never partially spend resources.
    const candidate=clone(this.#state);let result:ActionResult;
    try{result=this.domain.act(candidate,command,this.now());}
    catch{return fail('Действие не выполнено. Ферма не изменена.','domain-error');}
    if(!result.ok)return clone(result);
    this.#state=candidate;this.#revision++;
    if(requestId){this.#receipts.push({id:requestId,command:signature,result:clone(result)});this.#receipts=this.#receipts.slice(-128);}
    this.#notify({kind:'command',revision:this.#revision,result:clone(result)});return clone(result);
  }
  advance(resume=false):void{
    if(this.#disposed)return;const next=clone(this.#state);
    (resume?this.domain.resume:this.domain.tick)(next,this.now());
    this.#state=next;this.#revision++;this.#notify({kind:'tick',revision:this.#revision});
  }
  save():SaveResult{
    if(this.#disposed)return {ok:false,conflict:false,message:'Сессия закрыта'};
    const result=this.repository.write({state:this.#state,revision:this.#revision,receipts:this.#receipts},this.#persisted,this.now());
    if(result.ok)this.#persisted=this.#revision;return result;
  }
  exportJSON():string{return JSON.stringify({format:'blackcrown.quiet-valley.save',schemaVersion:1,state:this.#state},null,2);}
  importJSON(raw:string):SaveResult{
    if(this.#disposed)throw new Error('Сессия закрыта');if(raw.length>1048576)throw new Error('Файл слишком большой');
    const decoded:unknown=JSON.parse(raw);
    const obj=decoded as {format?:string;schemaVersion?:number;state?:unknown}|null;
    if(obj?.format==='blackcrown.quiet-valley.save'&&obj.schemaVersion!==1)throw new Error('Неизвестная версия сохранения');
    const state=this.domain.validate(obj?.format==='blackcrown.quiet-valley.save'?obj.state:decoded,this.now());
    this.domain.resume(state,this.now());
    const revision=this.#revision+1;
    const result=this.repository.replace({state,revision,receipts:[]},this.now());
    if(!result.ok)return result;
    this.#state=state;this.#revision=revision;this.#persisted=revision;this.#receipts=[];
    this.#notify({kind:'import',revision});return result;
  }
  reset():SaveResult{return this.importJSON(JSON.stringify(this.domain.fresh(this.now())));}
  inspect(){return {revision:this.#revision,persistedRevision:this.#persisted,receipts:this.#receipts.length,disposed:this.#disposed,persistence:this.repository.inspect()};}
  dispose(){if(this.#disposed)return;this.save();this.#disposed=true;this.#listeners.clear();}
}
