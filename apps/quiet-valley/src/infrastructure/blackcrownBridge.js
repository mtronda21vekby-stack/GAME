const CHANNEL='blackcrown.world.v1';
/** Host protocol has read/focus capabilities only. It cannot change inventory or clocks. */
export function attachBlackcrownBridge({host,origin,version,inspect,focus,lifetime}){
  function snapshot(){const data=inspect();const s=data.state;return {version,region:s.world.region,coins:s.coins,level:Math.floor(s.xp/100)+1,reputation:s.game.reputation,story:s.game.story,ordersCompleted:s.game.ordersCompleted,webgl:data.webgl};}
  function send(type){if(host.parent===host)return;host.parent.postMessage({channel:CHANNEL,worldId:'quiet-valley',version,type,payload:snapshot(),at:Date.now()},origin);}
  lifetime.listen(host,'message',event=>{
    if(event.origin!==origin||event.source!==host.parent||!event.data||event.data.channel!==CHANNEL||event.data.worldId!=='quiet-valley')return;
    if(event.data.type==='host.requestSnapshot')send('world.snapshot');
    else if(event.data.type==='host.focus')focus();
  });
  send('world.ready');lifetime.listen(host,'pagehide',()=>send('world.leaving'));
  return Object.freeze({snapshot});
}
