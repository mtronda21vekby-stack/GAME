/** Every subscription and GPU owner belongs to one application lifetime. */
export class Lifetime {
 #cleanups=new Set();#disposed=false;
 get disposed(){return this.#disposed;}
 own(fn){if(this.#disposed)fn();else this.#cleanups.add(fn);return fn;}
 on(target,name,fn,options){target.addEventListener(name,fn,options);this.own(()=>target.removeEventListener(name,fn,options));}
 timeout(fn,ms){let cleanup;const id=setTimeout(()=>{this.#cleanups.delete(cleanup);if(!this.#disposed)fn();},ms);cleanup=()=>clearTimeout(id);this.own(cleanup);return id;}
 interval(fn,ms){const id=setInterval(()=>{if(!this.#disposed)fn();},ms);this.own(()=>clearInterval(id));return id;}
 frame(fn){let cleanup;const id=requestAnimationFrame(time=>{this.#cleanups.delete(cleanup);if(!this.#disposed)fn(time);});cleanup=()=>cancelAnimationFrame(id);this.own(cleanup);return id;}
 dispose(){if(this.#disposed)return;this.#disposed=true;for(const fn of [...this.#cleanups].reverse()){try{fn();}catch{}}this.#cleanups.clear();}
}
