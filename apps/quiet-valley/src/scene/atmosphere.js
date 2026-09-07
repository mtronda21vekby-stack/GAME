/* Authored environmental dressing and workshop feedback; no economic state lives here. */
'use strict';
export function createAtmosphere(FarmProduction) {
  function make(R,world,art){
    let seed=90417;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const add=(type,p,s,color,g=null,rotation=[0,0,0],alpha=1)=>R.add(type,p,s,color,rotation,g,alpha);
    const group=(p=[0,0,0],parent=null)=>R.group(p,[1,1,1],[0,0,0],parent);
    const farm=world.roots.farm;
    const moving=[],workshopNodes={},banners=[];
    // Instanced meadow blades: a low-cost authored edge, not a random grass carpet
    // on the crop plots, main lane or animal paths.
    for(const [region,root] of Object.entries(world.roots)){
      const radius=region==='farm'?[14.3,11.0]:[11.0,9.0];
      for(let i=0;i<820;i++){
        const angle=random()*Math.PI*2,r=.79+random()*.18;
        const x=Math.cos(angle)*radius[0]*r,z=Math.sin(angle)*radius[1]*r;
        if(region==='farm'&&((z>4&&x>1&&x<9)||(x<-3&&z>5)||(x>-9&&x<1&&z<5&&z>-8)))continue;
        if(region==='river'&&Math.abs(x)<3.6)continue;
        const height=.35+random()*.58;
        const blade=add('blade',[x,.28,z],[1,height,1],['#668747','#8caa5e','#b5ba72','#5d804e'][i%4],root,[0,random()*6.28,0]);
        blade.fx=[2,0,.45,i*.23];
      }
      // Long-lived ambience particles are pooled and never accumulate.
      for(let i=0;i<12;i++){
        const x=(random()-.5)*radius[0]*1.7,z=(random()-.5)*radius[1]*1.7;
        const node=add('sphere',[x,1.7+random()*2,z],[.027,.027,.027],'#eee2ae',root);
        moving.push({node,origin:[...node.p],phase:random()*6.28});
      }
    }
    function cypress(x,z,scale){
      const root=group([x,.22,z],farm);
      add('cylinder',[0,1,0],[.13,2,.13],'#866043',root);
      for(let i=0;i<3;i++){
        const n=add('sphere',[0,1.6+i*.54,0],[.42-i*.05,.83,.42-i*.05],['#3e735b','#528062','#6b9367'][i],root);
        n.fx=[2,0,.18,x+z];
      }
      root.s=[scale,scale,scale];
    }
    cypress(-3.4,-9.2,1);cypress(1.6,-8.7,.95);cypress(10.3,3.5,.9);
    // Lavender beds frame the mill and the approach to the farmhouse.
    for(let i=0;i<32;i++){
      const x=-9.2+(i%2)*.35,z=-7.7+Math.floor(i/2)*.24;
      add('cylinder',[x,.48,z],[.016,.43,.016],'#66825b',farm);
      const flower=add('sphere',[x,.74,z],[.065,.16,.06],i%3?'#a18db7':'#c1a1be',farm);flower.fx=[2,0,.35,i];
    }
    // Craft stations are visible in-world, in the existing buildings and mill.
    for(const [key,station] of Object.entries(FarmProduction.STATIONS)){
      const g=group([station.at[0],.24,station.at[1]+1.45],farm);
      add('box',[0,.37,0],[1.3,.15,.55],'#8c6245',g);
      for(const x of [-.5,.5])add('box',[x,.18,0],[.12,.35,.4],'#644934',g);
      const goods=group([0,.44,0],g);
      for(let i=0;i<3;i++){
        if(key==='mill')add('sphere',[(i-1)*.34,.2,0],[.18,.25,.19],'#e0cba0',goods);
        if(key==='bakery')add('sphere',[(i-1)*.33,.08,0],[.13,.10,.24],'#cf9654',goods);
        if(key==='kitchen'){add('cylinder',[(i-1)*.3,.17,0],[.105,.28,.105],'#a76645',goods);add('cylinder',[(i-1)*.3,.33,0],[.115,.06,.115],'#e6c78a',goods);}
        if(key==='loom')add('box',[(i-1)*.32,.05+i*.02,0],[.3,.09,.36],['#b98f83','#e0cfae','#8da395'][i],goods);
      }
      workshopNodes[key]={g,goods};
    }
    // Celebration has a visible, earned outcome rather than only another counter.
    const garland=group([0,0,0],farm);garland.visible=false;
    for(const x of [-.2,2.3])add('cylinder',[x,1.85,4.4],[.045,3.2,.045],'#9b7455',garland);
    add('box',[1.05,3.35,4.4],[2.55,.025,.025],'#dbc79f',garland);
    for(let i=0;i<7;i++){
      const node=add('cone',[-.08+i*.37,3.16-Math.sin(i/6*Math.PI)*.1,4.4],[.17,.36,.025],['#b96e54','#d3af64','#7d9a7c'][i%3],garland,[0,0,Math.PI]);banners.push(node);
    }
    function animate(time,dt,state){
      for(const item of moving){
        item.node.p[0]=item.origin[0]+Math.sin(time*.18+item.phase)*.65;
        item.node.p[1]=item.origin[1]+Math.sin(time*.7+item.phase)*.25;
        item.node.p[2]=item.origin[2]+Math.cos(time*.21+item.phase)*.65;
        item.node.visible=R.motion>0;
      }
      for(const [key,node] of Object.entries(workshopNodes)){
        node.g.visible=!!state.production?.stations[key];
        const jobs=state.production?.jobs.filter(job=>FarmProduction.RECIPES[job.recipe].station===key)||[];
        node.goods.s[1]=jobs.length?1+Math.sin(time*1.1)*.03:1;
      }
      garland.visible=!!state.production?.festivalDelivered;
      banners.forEach((n,i)=>n.r[0]=Math.sin(time*1.4+i*.4)*.17*R.motion);
      if(art.sails&&!state.production?.stations.mill)art.sails.r[2]=.24;
    }
    return {animate,workshopNodes,inspect:()=>({workshops:Object.keys(workshopNodes),pooledParticles:moving.length})};
  }
  return {make};
}
