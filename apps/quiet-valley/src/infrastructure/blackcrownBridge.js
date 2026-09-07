const channel='blackcrown.world.v1',worldId='quiet-valley';
/** Read-only host bridge. Account credentials and economy writes never enter the renderer. */
export function attachBridge({inspect,lifetime,host,origin,version}){
 const snapshot=()=>{const data=inspect();return {version,region:data.state.world.region,coins:data.state.coins,level:Math.floor(data.state.xp/100)+1,reputation:data.state.game.reputation,story:data.state.game.story,ordersCompleted:data.state.game.ordersCompleted,webgl:data.webgl};};
 const send=type=>{if(host.parent!==host)host.parent.postMessage({channel,worldId,version,type,payload:snapshot(),at:Date.now()},origin);};
 lifetime.on(host,'message',event=>{const msg=event.data;if(event.source!==host.parent||event.origin!==origin||msg?.channel!==channel||msg.worldId!==worldId)return;if(msg.type==='host.requestSnapshot')send('world.snapshot');if(msg.type==='host.focus')host.document.getElementById('world')?.focus({preventScroll:true});});
 lifetime.on(host,'pagehide',()=>send('world.leaving'));send('world.ready');
}
