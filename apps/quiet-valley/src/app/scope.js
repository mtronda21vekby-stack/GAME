/** Narrow ports preserve live view-state access without exposing the entire composition context. */
export function scope(context,keys){
 const port=Object.create(null);
 for(const key of keys)Object.defineProperty(port,key,{enumerable:true,get:()=>context[key],set:value=>{context[key]=value;}});
 return Object.seal(port);
}
