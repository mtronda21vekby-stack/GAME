import * as F from '../rendering/index.js';
/* Procedural regional dioramas. Shared instanced geometry; only the active island is drawn. */
'use strict';
export function createValleyWorld(FarmExpansion, FarmSim) {
 function make(R,home){
  const X=FarmExpansion,roots={},features=[],projects={},fruits=[],bees=[],wheels=[],waters=[],sprinklers=[];
  const decorations=new Map();let active='farm',revision='',ghost=null,grid=null,placement=null;
  const color={grass:'#a4bb78',wood:'#a58258',dark:'#5e6650',cream:'#f1e6c8',leaf:'#83a55e',rock:'#b0b2a0'};
  const add=(type,p,s,c,g=null,r=[0,0,0],alpha=1)=>R.add(type,p,s,c,r,g,alpha);
  const box=(p,s,c,g,r)=>add('box',p,s,c,g,r);
  const ball=(p,s,c,g)=>add('sphere',p,s,c,g);
  const cyl=(p,s,c,g,r)=>add('cylinder',p,s,c,g,r);
  const cone=(p,s,c,g,r)=>add('cone',p,s,c,g,r);
  const group=(p=[0,0,0],parent=null,s=[1,1,1])=>R.group(p,s,[0,0,0],parent);
  let seed=3857;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  // Attach roots rather than copying original meshes, including animals created later.
  function attach(nodes,root){const seen=new Set();for(let n of nodes){while(n.parent&&n.parent!==root)n=n.parent;if(n===root||seen.has(n)||n.parent===root)continue;seen.add(n);n.parent=root;}}
  roots.farm=group();attach([...R.meshes],roots.farm);
  home.cropModels.forEach(m=>{m.region='farm';m.surface=.475;});
  const originalAnimal=home.animalModel;
  home.animalModel=function(a){const start=R.meshes.length,m=originalAnimal(a);attach(R.meshes.slice(start),roots.farm);return m;};
  function leaf(p,s,c,g){const n=ball(p,s,c,g);n.fx=[2,0,.24,p[0]+p[2]];return n;}
  function grass(p,s,c,g){const n=add('island',p,s,c,g);n.fx=[4,0,0,0];return n;}
  function tree(x,z,size,g,kind='broad'){
   const t=group([x,.23,z],g,[size,size,size]);cyl([0,1.1,0],[.16,2.2,.16],color.wood,t);
   if(kind==='pine'){for(let i=0;i<3;i++){const n=cone([0,1.8+i*.57,0],[1.02-i*.19,1.8-i*.19,1.02-i*.19],['#789875','#648b70','#89a074'][i],t);n.fx=[2,0,.10,x+z];}}
   else{for(let k=0;k<5;k++){const a=k/5*6.28;leaf([Math.cos(a)*.5,2.2+(k%2)*.25,Math.sin(a)*.5],[.85,.85,.8],['#87a562','#a3b476','#789b60','#91aa63','#729163'][k],t);}leaf([0,2.9,0],[.7,.72,.7],color.leaf,t);}
   return t;
  }
  function tuft(x,z,g,flower=false){const t=group([x,.25,z],g);cone([0,.17,0],[.05,.33,.05],'#819c58',t,[0,0,.25]);cone([.1,.12,0],[.04,.26,.04],'#91a965',t,[0,0,-.3]);if(flower){cyl([0,.28,0],[.018,.42,.018],'#7b9750',t);ball([0,.51,0],[.1,.055,.1],['#e0aeab','#e9cd79','#f1dec0'][Math.floor(rnd()*3)],t);}return t;}
  function island(region,c){const root=roots[region]=group();root.visible=false;
   add('island',[0,-.59,0],[11.3,1.35,9.4],'#a29576',root);
   add('island',[0,-.23,0],[11.55,.78,9.5],'#bfad8d',root);
   grass([0,.1,0],[11.7,.26,9.6],c,root);
   for(let i=0;i<34;i++){const a=i/34*6.28;const x=Math.cos(a)*11.2,z=Math.sin(a)*9.1;box([x,-.66-rnd()*.2,z],[.8+ rnd()*.6,.9,.8],i%3?'#ac9d7d':'#b6a587',root,[0,a,0]);}
   for(let i=0;i<65;i++){const a=rnd()*6.28,rr=.78+rnd()*.15;tuft(Math.cos(a)*11.5*rr,Math.sin(a)*9.2*rr,root,i%3===0);}
   return root;
  }
  function feature(region,key,kind,pos,extra={}){const f={region,key,kind,pos,...extra};features.push(f);return f;}
  function lamp(x,z,g){const t=group([x,.24,z],g);box([0,.06,0],[.4,.14,.4],'#a6aa91',t);cyl([0,.92,0],[.055,1.8,.055],color.dark,t);box([0,1.94,0],[.36,.44,.36],color.dark,t);const glow=box([0,1.94,0],[.30,.35,.30],'#ead5a7',t);glow.fx=[5,0,0,0];cone([0,2.25,0],[.34,.22,.34],color.dark,t);return t;}
  function bench(x,z,g){const t=group([x,.24,z],g);for(const a of [-.55,.55])box([a,.28,0],[.12,.55,.7],color.dark,t);for(const a of [-.25,0,.25])box([0,.6,a],[1.55,.09,.18],color.wood,t);for(const a of [-.6,.6])box([a,.95,-.36],[.08,.9,.09],color.dark,t);box([0,1.13,-.36],[1.55,.32,.08],color.wood,t);return t;}
  function path(points,g,stone=true){const root=group([0,0,0],g);for(let j=1;j<points.length;j++){const a=points[j-1],b=points[j],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.66);for(let i=0;i<steps;i++){const f=i/steps;add('island',[a[0]+(b[0]-a[0])*f,.283,a[1]+(b[1]-a[1])*f],[.5,.085,.36],stone?['#c4c1a5','#b5b6a0','#d5ccac'][i%3]:'#cfb893',root,[0,.2*(i%3),0]);}}return root;}
  function pond(x,z,sx,sz,g){add('island',[x,.295,z],[sx+.25,.15,sz+.25],'#bcb997',g);add('island',[x,.337,z],[sx,.035,sz],'#508e96',g);const w=add('water',[x,.42,z],[sx,1,sz],'#7bb6b4',g,[0,0,0],.97);w.fx=[1,0,0,0];waters.push(w);return w;}
  function cottage(x,z,g,scale=1,roof='#899e8c'){
   const t=group([x,.23,z],g,[scale,scale,scale]);box([0,1,0],[3.4,2,2.6],'#e2d2ad',t);
   for(let k=0;k<10;k++)box([-1.6+k*.35,1,1.32],[.04,2,.04],'#cbb998',t);
   for(const s of [-1,1])box([s*.85,2.28,0],[2.1,.17,3.15],roof,t,[0,0,-s*.4]);
   box([-.7,.72,1.38],[.8,1.45,.08],'#6e8e7e',t);
   box([.85,1.2,1.4],[.95,.88,.08],color.cream,t);const win=box([.85,1.2,1.46],[.72,.65,.06],'#638a8a',t);win.fx=[5,0,0,0];box([.85,1.2,1.5],[.04,.67,.04],color.cream,t);
   box([0,.04,1.6],[3.8,.14,.9],'#b8ab89',t);return t;
  }
  function project(key,g,pos){projects[key]=g;g.visible=false;if(pos)feature(X.projects[key].region,key,'project',pos);return g;}
  function irrigation(region,g,positions,x,z){const root=group([0,0,0],g);const tank=group([x,.24,z],root);
   for(const sx of [-.45,.45])for(const sz of [-.4,.4])box([sx,.65,sz],[.12,1.3,.12],color.wood,tank);
   cyl([0,1.53,0],[.62,1.2,.62],'#819e97',tank);cyl([0,2.15,0],[.65,.10,.65],'#496e6b',tank);
   for(const [px,pz,py=0] of positions){const head=group([px,.27+py,pz],root);cyl([0,.28,0],[.05,.56,.05],'#879b9b',head);box([0,.58,0],[.55,.07,.10],'#486f6e',head);
    const drops=[];for(let k=0;k<8;k++){const n=ball([0,0,0],[.035,.065,.035],'#a5dde0',head);n.fx=[6,0,0,0];drops.push(n);}sprinklers.push({region,head,drops});}
   return root;
  }
  // HOME: existing farming remains intact; functional construction is layered on top.
  const hp=path([[.7,-8],[.7,6],[-2,6]],roots.farm);lamp(.2,-5, hp);lamp(1.2,4.5,hp);project('farm_paths',hp);
  const compost=group([-1.6,.23,-4.55],roots.farm);for(let i=0;i<2;i++){box([i*.75,.35,0],[.68,.68,.8],color.wood,compost);box([i*.75,.67,0],[.57,.12,.68],'#5f6344',compost);}project('farm_soil',compost);
  project('farm_water',irrigation('farm',roots.farm,[[-6.4,-1.3],[-2.4,-1.3],[-6.4,2.8],[-2.4,2.8]],-8.8,-3.1));
  // APPLE ORCHARD: circular planting sites, old cottage and a flowering pergola.
  const orchard=island('orchard','#b1c387');cottage(-6.8,-6.25,orchard,.88,'#b78d7b');path([[-6,-4.5],[-7,0],[-4,4.6],[3.8,4.6]],orchard,false);
  pond(7.35,-5.8,1.6,1.13,orchard);bench(-7,6,orchard);
  [[-9,-5,.8],[-9,-1,.85],[-6,-8,1],[0,-8,.85],[4,-7.5,.9],[9,-4,.8],[9,3,.7],[-9,5,.75]].forEach(([x,z,s])=>tree(x,z,s,orchard));
  const wild=group([0,0,0],orchard),orchardSoil=[];
  for(const p of X.fruitSites){const site=group([p.x,.23,p.z],orchard);const soil=add('island',[0,.015,0],[1.4,.05,1.2],'#94744f',site);soil.fx=[3,0,0,0];orchardSoil.push(soil);
   const sapling=group([0,0,0],site);cyl([0,.95,0],[.13,1.9,.13],color.wood,sapling);const crown=group([0,1.8,0],sapling),fruit=[],blossom=[];
   for(let k=0;k<5;k++){const a=k/5*6.28;leaf([Math.cos(a)*.48,.25*(k%2),Math.sin(a)*.48],[.85,.8,.8],['#87ac64','#a2b96e','#7e9f60','#91b368','#81a45d'][k],crown);}
   leaf([0,.64,0],[.72,.65,.72],'#9ab76a',crown);
   for(let k=0;k<10;k++){const a=k/10*6.28;const pp=[Math.cos(a)*1.08,.12+(k%3)*.31,Math.sin(a)*1.08];fruit.push(ball(pp,[.14,.15,.14],k%2?'#d66e55':'#bd594d',crown));blossom.push(ball(pp,[.12,.07,.12],'#f3d6c2',crown));}
   const weeds=group([p.x,.23,p.z],wild);for(let k=0;k<4;k++)leaf([(k%2-.5)*.8,.45,Math.floor(k/2)*.65-.3],[.75,.6,.7],'#8d9d64',weeds);
   fruits.push({id:p.id,site,sapling,crown,fruit,blossom,soil});feature('orchard','tree'+p.id,'tree',[p.x,3.4,p.z],{id:p.id});
  }
  const clearMarker=group([0,0,0],orchard);project('orchard_clear',clearMarker,[0,1,4.7]);
  const soilBag=group([-5.8,.23,3.4],orchard);for(let i=0;i<3;i++)ball([i*.5,.25,0],[.25,.25,.45],'#9c8a63',soilBag);project('orchard_soil',soilBag);
  project('orchard_water',irrigation('orchard',orchard,[[-2.1,-1],[1.7,-1],[4.8,-1]],-7.6,-2.8));
  const arbor=group([5.5,.23,5.0],orchard);for(let x of [-1.4,1.4])for(let z of [-1,1])box([x,1.3,z],[.15,2.6,.15],color.cream,arbor);
  for(let z of [-1.15,1.15])box([0,2.65,z],[3.2,.17,.18],color.wood,arbor);for(let x=-1.6;x<1.7;x+=.4)box([x,2.8,0],[.13,.16,2.7],color.wood,arbor);
  bench(0,0,arbor);for(let i=0;i<10;i++){const a=i/10*6.28;leaf([Math.cos(a)*1.65,2.68,Math.sin(a)*1.2],[.45,.23,.4],'#8f9f65',arbor);ball([Math.cos(a)*1.65,2.86,Math.sin(a)*1.2],[.12,.09,.12],'#dcafa8',arbor);}project('orchard_arbor',arbor);
  // RIVER: long flowing waterway, waterfall, repaired bridge and stepped vegetable terraces.
  const river=island('river','#9fbe8b');cottage(-6.3,-5.3,river,.75,'#89aaa3');
  add('riverbank',[0,.295,0],[1.6,1,8.3],'#b7bea1',river);
  add('river',[0,.335,0],[1.6,1,8.3],'#55999d',river);
  const riverWater=add('river',[0,.435,0],[1.6,1,8.3],'#7bb6b4',river,[0,0,0],.97);riverWater.fx=[1,1,0,0];
  for(let i=0;i<13;i++){const z=-7.3+i*1.2,cx=.288*Math.sin(z/8.3*3);for(const side of [-1,1])ball([side*1.7+cx,.30,z],[.30,.25,.47],i%2?'#bec1a9':'#a8b4a1',river);}
  for(let i=0;i<9;i++){box([i%3-1, .5+(i%3)*.3,-7.4-Math.floor(i/3)*.55],[1.1,1.35,1.1],'#9baa98',river,[0,i*.15,0]);}
  const fall=box([0,1.15,-6.6],[1.3,1.7,.17],'#90c5c2',river);fall.fx=[1,0,0,0];
  const broken=group([0,.24,.1],river);for(const side of [-1,1])for(let i=0;i<3;i++)box([side*(1.4+i*.35),.22,-.65+i*.35],[.43,.16,1.2],color.wood,broken,[0,side*.25,i*.08]);
  const bridge=group([0,.24,.1],river);for(let i=0;i<18;i++){let x=-2.65+i*.31,yy=.25+Math.cos(x/3*Math.PI/2)*.40;box([x,yy,0],[.30,.14,1.75],'#c3a473',bridge);}
  for(const z of [-.93,.93])for(let i=0;i<6;i++){let x=-2.6+i*1.04;box([x,.94,z],[.12,1.3,.12],color.cream,bridge);if(i<5)box([x+.52,1.5,z],[1.10,.09,.09],color.cream,bridge);}
  project('river_bridge',bridge,[0,2.2,.1]);path([[-6,-3],[-4,0],[-2,0]],river,false);
  const terraces=group([0,0,0],river);const terraceBrush=group([0,0,0],river);
  // Reuse the same crop geometry and picking contract as the home farm, at measured surface heights.
  function buildPlot(id,x,z,baseY,g){
   const pg=group([0,baseY,0],g),dirt=box([x,.29,z],[1.73,.20,1.73],'#896642',pg);dirt.fx=[3,0,0,0];
   for(const dx of [-.88,.88])box([x+dx,.36,z],[.1,.18,1.88],color.wood,pg);
   for(const dz of [-.88,.88])box([x,.36,z+dz],[1.85,.18,.1],color.wood,pg);
   const ridges=[];for(let k=0;k<5;k++){const n=box([x-.65+k*.32,.42,z],[.17,.11,1.58],'#856343',pg);n.fx=[3,0,0,0];ridges.push(n);}
   const species={};for(const key of ['carrot','wheat','pumpkin']){
    const start=R.meshes.length,sg=group([x,.43,z],pg);
    if(key==='carrot')for(let i=0;i<9;i++){const xx=(i%3-1)*.48,zz=(Math.floor(i/3)-1)*.48;cone([xx,.14,zz],[.13,.35,.13],'#d88340',sg,[Math.PI,0,0]);for(let j=0;j<3;j++){const a=j/3*6.28;const n=ball([xx+Math.cos(a)*.1,.44,zz+Math.sin(a)*.1],[.065,.26,.1],'#77a454',sg);n.r=[Math.sin(a)*.5,0,Math.cos(a)*.5];}}
    if(key==='wheat')for(let i=0;i<12;i++){const xx=(i%4-1.5)*.32,zz=(Math.floor(i/4)-1)*.44;const h=.8+i%3*.08;cyl([xx,h/2,zz],[.022,h,.022],'#b29d4c',sg);for(let k=0;k<3;k++)ball([xx+(k%2-.5)*.08,h-.16+k*.09,zz],[.067,.12,.045],'#dac16c',sg);}
    if(key==='pumpkin')for(let i=0;i<4;i++){const xx=(i%2-.5)*.8,zz=(Math.floor(i/2)-.5)*.8;for(let j=0;j<6;j++){const a=j/6*6.28;ball([xx+Math.cos(a)*.11,.24,zz+Math.sin(a)*.11],[.23,.24,.23],j%2?'#cf893e':'#de9d4e',sg);}cyl([xx,.48,zz],[.05,.2,.05],'#748751',sg);}
    species[key]={g:sg,nodes:R.meshes.slice(start)};if(key==='wheat')species[key].nodes.forEach(n=>n.fx=[2,0,.42,x+z]);
   }
   home.cropModels.push({id,x,z,region:'river',surface:.475+baseY,dirt,ridges,species,pg});
  }
  for(let row=0;row<4;row++){const z=-3.9+row*2.25,baseY=.15+(3-row)*.25;box([5.35,baseY/2+.08,z],[5.0,baseY+.2,2.25],'#a9ad90',terraces);grass([5.35,baseY+.20,z],[2.5,.04,1.15],'#a3b979',terraces);
   for(let col=0;col<2;col++)buildPlot(16+row*2+col,4.15+col*2.3,z,baseY,terraces);
   for(let i=0;i<3;i++)leaf([4+i*.9,.5,z],[.75,.55,.7],'#88a477',terraceBrush);
  }
  project('river_fields',terraces,[5.2,2.0,4.9]);
  const rw=irrigation('river',river,[[3.0,-2.8,.8],[7.6,-2.8,.8],[3.0,1.7,.3],[7.6,1.7,.3]],2.35,-5.7);
  const wheel=group([1.4,1.1,-3.9],rw);wheel.r[1]=.55;for(const z of [-.25,.25])add('ring',[0,0,z],[1.06,1,1.06],'#887a53',wheel,[Math.PI/2,0,0]);
  for(let k=0;k<12;k++){const a=k/12*6.28;box([Math.cos(a)*.9,Math.sin(a)*.9,0],[.3,.16,.55],color.wood,wheel,[0,0,a]);box([Math.cos(a)*.5,Math.sin(a)*.5,0],[1,.07,.12],'#6e7260',wheel,[0,0,a]);}cyl([0,0,0],[.16,.5,.16],color.dark,wheel,[Math.PI/2,0,0]);wheels.push(wheel);project('river_water',rw);
  const rcompost=group([8.5,.24,0],river);box([0,.5,0],[.8,1,.9],color.wood,rcompost);box([0,1,0],[.7,.1,.8],'#77694b',rcompost);project('river_soil',rcompost);
  [[-9,-6,1],[-8,6,.8],[-10,0,.9],[9,-5,1],[9,4,.8],[6,-8,.9],[-3,-8,1.1]].forEach(([x,z,s])=>tree(x,z,s,river));
  // FOREST: tall conifers frame an open working glade. Bees orbit real 3D hives.
  const forest=island('forest','#9bae83');
  [[-9,-4,1.15],[-7,-7,1],[-2,-8,1.2],[3,-8,1.05],[8,-6,1.3],[10,-1,1.1],[9,5,.95],[-10,2,1.05],[-9,6,.9],[5,8,.8]].forEach(([x,z,s],i)=>tree(x,z,s,forest,i%3?'pine':'broad'));
  pond(-4.2,-4,1.8,1.22,forest);path([[0,8],[0,4],[1,1],[3,-1]],forest,false);
  const fp=path([[0,8],[0,4],[1,1],[3,-1]],forest);lamp(-.8,4.7,fp);lamp(1.6,.5,fp);project('forest_paths',fp);
  const apiary=group([3,.23,-1.2],forest);for(let i=0;i<3;i++){const h=group([(i%2)*1.5,0,Math.floor(i/2)*1.6],apiary);for(let j=0;j<3;j++)box([0,.38+j*.29,0],[.95,.27,.9],j%2?'#d7bc75':'#c8ac6a',h);box([0,1.15,0],[1.13,.18,1.08],'#849778',h);box([0,.34,.47],[.37,.08,.05],'#5f6549',h);box([0,.27,.6],[.7,.08,.3],color.wood,h);}
  for(let i=0;i<7;i++){const b=group([0,0,0],apiary,[.9,.9,.9]);ball([0,0,0],[.07,.065,.12],'#d8b767',b);box([0,0,0],[.14,.13,.037],'#615c43',b);ball([.09,.07,0],[.10,.018,.067],'#e6e5cf',b);ball([-.09,.07,0],[.10,.018,.067],'#e6e5cf',b);bees.push({g:b,phase:i});}
  project('forest_apiary',apiary,[3.7,2.0,-.6]);feature('forest','honey','honey',[3.7,2.4,-.6]);
  const cabin=cottage(-3,-.5,forest,.72,'#87987d');for(let i=0;i<4;i++)box([-4.8+i*.45,.55,-2.3],[.4,.65,.9],'#bc9764',forest);project('forest_cabin',cabin,[-3,2.8,-.5]);
  for(let i=0;i<24;i++){const a=i/24*6.28;tuft(4+Math.cos(a)*2.4,-.6+Math.sin(a)*2.5,forest,true);}
  // Clearable stumps and rocks are not decoration-only: every node has a persistent resource ID.
  const resourceArt=new Map();for(const n of X.resourceNodes){const g=group([n.x,.23,n.z],roots[n.region]);
   if(n.type==='wood'){cyl([0,.28,0],[.44,.55,.44],'#97744e',g);cyl([0,.57,0],[.39,.035,.39],'#d5b887',g);cyl([0,.592,0],[.24,.025,.24],'#b99363',g);for(let i=0;i<3;i++){const a=i/3*6.28;box([Math.cos(a)*.38,.08,Math.sin(a)*.38],[.7,.16,.18],color.wood,g,[0,-a,0]);}}
   else{ball([-.17,.24,0],[.57,.39,.42],color.rock,g);ball([.38,.16,.19],[.36,.29,.35],'#bbc0aa',g);ball([.13,.50,-.03],[.28,.24,.24],'#c0c4b1',g);}
   resourceArt.set(n.key,g);feature(n.region,n.key,'resource',[n.x,1.20,n.z],{resource:n});}
  function makeDecor(type,x,z,g,rotation=0){const root=group([x,0,z],g);root.r[1]=rotation*Math.PI/2;
   if(type==='path')add('island',[0,.30,0],[.92,.1,.83],'#c9c5a6',root);
   if(type==='bench')bench(0,0,root);
   if(type==='lamp')lamp(0,0,root);
   if(type==='tree')tree(0,0,.68,root);
   if(type==='fence'){for(let x of [-.7,.7]){box([x,.83,0],[.12,1.2,.12],color.cream,root);cone([x,1.5,0],[.12,.17,.12],color.cream,root);}for(let y of [.65,1.15])box([0,y,0],[1.5,.1,.09],color.cream,root);}
   if(type==='flowers'){box([0,.34,0],[1.5,.24,.7],color.wood,root);for(let k=0;k<7;k++){const x=-.6+k*.2;leaf([x,.55,0],[.17,.18,.24],'#91a366',root);cyl([x,.69,0],[.02,.4,.02],'#84985f',root);ball([x,.92,0],[.13,.07,.13],k%2?'#e4b5b0':'#e9ca77',root);}}
   return root;
  }
  function removeGroup(root){if(!root)return;const belongs=n=>{while(n){if(n===root)return true;n=n.parent;}return false;};R.meshes=R.meshes.filter(n=>!belongs(n));for(const b of R.batches.values())b.nodes=b.nodes.filter(n=>!belongs(n));}
  function sync(s){active=s.world.region;for(const [key,g] of Object.entries(roots))g.visible=key===active;
   for(const [key,g] of Object.entries(projects))g.visible=X.level(s,key)>0;
   wild.visible=!X.level(s,'orchard_clear');broken.visible=!X.level(s,'river_bridge');terraceBrush.visible=!X.level(s,'river_fields');
   for(const [key,g] of resourceArt)g.visible=!s.world.cleared.includes(key);
   for(const [id,g] of decorations){if(!s.world.decor.some(d=>d.id===id&&g.decorSignature===JSON.stringify(d))){removeGroup(g);decorations.delete(id);}}
   for(const d of s.world.decor)if(!decorations.has(d.id)){const g=makeDecor(d.type,d.x,d.z,roots[d.region],d.rotation);g.decorSignature=JSON.stringify(d);decorations.set(d.id,g);}
   for(const m of fruits){const t=s.world.trees[m.id],cleared=X.level(s,'orchard_clear');m.site.visible=!!cleared;m.sapling.visible=t.planted;}
   // Visual richness tracks the second fertility upgrade, not only a numeric bonus.
   compost.s[0]=1+X.level(s,'farm_soil')*.14;soilBag.s[1]=.8+X.level(s,'orchard_soil')*.25;rcompost.s[1]=.85+X.level(s,'river_soil')*.25;
   R.frameCount=0;revision=JSON.stringify([s.world.projects,s.world.cleared,s.world.decor]);
  }
  function animate(t,dt,s){const now=Date.now();
   for(const m of fruits){const st=s.world.trees[m.id];const ready=st.waterAt&&now>=st.readyAt;const total=Math.max(1,st.readyAt-st.waterAt);const progress=st.waterAt?Math.max(0,Math.min(1,1-(st.readyAt-now)/total)):0;
    const size=.45+progress*.55;m.sapling.s=[size,size,size];m.soil.fx[1]=st.waterAt?1:0;
    m.fruit.forEach(n=>n.visible=!!ready);m.blossom.forEach(n=>n.visible=!!st.waterAt&&!ready);m.crown.r[2]=Math.sin(t*.8+m.id)*.013*R.motion;
   }
   for(const w of wheels)w.r[2]=t*.46*R.motion;
   bees.forEach(({g,phase:i})=>{g.p=[.7+Math.sin(t*.85+i)*1.7,1.4+Math.sin(t*1.6+i)*.25,.8+Math.cos(t*.85+i)*1.4];g.r[1]=t*.85+i;});
   for(const s of sprinklers){s.drops.forEach((d,i)=>{const a=t*2+i*6.28/8,f=(t*.8+i/8)%1;d.p=[Math.cos(a)*f*.75,.7+.6*Math.sin(f*Math.PI)-f*.8,Math.sin(a)*f*.75];d.visible=R.motion>0;});}
  }
  function featureVisible(f,s){if(f.region!==s.world.region)return false;
   if(f.kind==='resource')return !s.world.cleared.includes(f.key);
   if(f.kind==='tree')return !!X.level(s,'orchard_clear');
   if(f.kind==='project')return !X.level(s,f.key);
   if(f.kind==='honey')return !!X.level(s,'forest_apiary');return true;
  }
  function setPlacement(type,s,rotation=0){removeGroup(grid);removeGroup(ghost);grid=group();ghost=null;placement=type?{type,rotation}:null;
   if(!type)return;for(let x=-12;x<=12;x+=2)for(let z=-10;z<=10;z+=2)if(X.allowedCell(s.world.region,x,z)){
    const valid=!X.placementCheck(s,s.world.region,x,z);add('box',[x,.30,z],[1.8,.025,1.8],valid?'#c6dfae':'#d4b8a1',grid,[0,0,0],valid?.36:.22);
   }
   if(type!=='remove'){ghost=makeDecor(type,0,0,null,rotation);for(const n of R.meshes){let p=n;while(p&&p!==ghost)p=p.parent;if(p===ghost)n.c=F.rgb('#c0dba3');}ghost.visible=false;}
  }
  function preview(x,z,s){if(!ghost)return;ghost.p[0]=x;ghost.p[2]=z;ghost.visible=!X.placementCheck(s,s.world.region,x,z);}
  function focusCamera(region,mobile=false){return region==='farm'?{yaw:.48,pitch:.69,size:mobile?21.6:13.8,target:[-1.0,.3,.4]}:{yaw:.34,pitch:.73,size:mobile?18.7:11.9,target:[0,.2,0]};}
  return {roots,features,projects,fruits,decorations,sync,animate,featureVisible,setPlacement,preview,focusCamera,active:()=>active,
   inspect:()=>({region:active,visibleRoots:Object.entries(roots).filter(([,g])=>g.visible).map(([k])=>k),visibleProjects:Object.entries(projects).filter(([k,g])=>g.visible&&X.projects[k].region===active).map(([k])=>k),decorations:decorations.size,riverPlots:home.cropModels.filter(m=>m.region==='river').length})};
 }
 return {make};
}
