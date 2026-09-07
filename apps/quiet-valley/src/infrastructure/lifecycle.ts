/** All external work has explicit ownership. Disposing an app never leaves input/timers behind. */
export class Lifetime {
  #cleanups=new Set<()=>void>(); #disposed=false;
  get disposed(){return this.#disposed;}
  own(cleanup:()=>void){if(this.#disposed)cleanup();else this.#cleanups.add(cleanup);return cleanup;}
  listen(target:EventTarget,type:string,listener:EventListener,options?:AddEventListenerOptions){target.addEventListener(type,listener,options);this.own(()=>target.removeEventListener(type,listener,options));}
  timeout(fn:()=>void,ms:number){let cleanup:()=>void;const id=setTimeout(()=>{this.#cleanups.delete(cleanup);if(!this.#disposed)fn();},ms);cleanup=()=>clearTimeout(id);this.own(cleanup);return id;}
  interval(fn:()=>void,ms:number){const id=setInterval(()=>{if(!this.#disposed)fn();},ms);this.own(()=>clearInterval(id));return id;}
  frames(fn:(now:number)=>void,onError:(error:unknown)=>void){
    let id:number;const run=(now:number)=>{if(this.#disposed)return;try{fn(now);}catch(error){onError(error);return;}id=requestAnimationFrame(run);};
    id=requestAnimationFrame(run);this.own(()=>cancelAnimationFrame(id));
  }
  dispose(){if(this.#disposed)return;this.#disposed=true;for(const fn of [...this.#cleanups].reverse()){try{fn();}catch{ /* Dispose remaining resources even if one adapter fails. */ }}this.#cleanups.clear();}
}
