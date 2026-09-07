/* BLACKCROWN World Bridge v1: versioned, same-origin and intentionally small.
 * The farm remains an isolated runtime. Online authority can later replace local persistence
 * without coupling the renderer to lobby React internals.
 */
'use strict';
(()=>{
 const CHANNEL='blackcrown.world.v1';
 const WORLD_ID='quiet-valley';
 const VERSION='0.5.0';
 const origin=location.origin;
 function envelope(type,payload){return {channel:CHANNEL,worldId:WORLD_ID,version:VERSION,type,payload:payload??null,at:Date.now()};}
 function send(type,payload){
  if(window.parent===window)return;
  try{window.parent.postMessage(envelope(type,payload),origin);}catch(_){/* host bridge is best-effort */}
 }
 function snapshot(){
  try{
   const data=window.FarmApp?.inspect?.();
   if(!data)return null;
   return {
    version:data.version,
    region:data.state?.world?.region||'farm',
    coins:data.state?.coins||0,
    level:Math.floor((data.state?.xp||0)/100)+1,
    reputation:data.state?.game?.reputation||0,
    story:data.state?.game?.story||0,
    ordersCompleted:data.state?.game?.ordersCompleted||0,
    webgl:data.webgl||null
   };
  }catch(_){return null;}
 }
 function emitReady(){const data=snapshot();if(!data)return false;send('world.ready',data);return true;}
 window.addEventListener('message',(event)=>{
  if(event.origin!==origin||event.source!==window.parent)return;
  const msg=event.data;
  if(!msg||msg.channel!==CHANNEL||msg.worldId!==WORLD_ID)return;
  if(msg.type==='host.requestSnapshot')send('world.snapshot',snapshot());
  if(msg.type==='host.focus')try{document.querySelector('#world')?.focus({preventScroll:true});}catch(_){}
 });
 window.BlackCrownWorld=Object.freeze({channel:CHANNEL,id:WORLD_ID,version:VERSION,snapshot,send});
 let attempts=0;const timer=setInterval(()=>{attempts++;if(emitReady()||attempts>240)clearInterval(timer);},100);
 window.addEventListener('pagehide',()=>send('world.leaving',snapshot()),{once:true});
})();
