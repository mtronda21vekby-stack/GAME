import * as T from '../../vendor/three.js';

const geom={box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,12,8),rock:new T.IcosahedronGeometry(1,0),cylinder:new T.CylinderGeometry(1,1,1,16),cone:new T.CylinderGeometry(0,1,1,12)};
const materialCache=new Map();
export function material(color,roughness=.78,emissive=0){
 const key=color+'|'+roughness+'|'+emissive;
 if(!materialCache.has(key))materialCache.set(key,new T.MeshStandardMaterial({color,roughness,metalness:roughness<.35?.32:0,emissive:emissive?color:0,emissiveIntensity:emissive}));
 return materialCache.get(key);
}
export function part(parent,type,p,s,color,r=[0,0,0],roughness=.78){
 const m=new T.Mesh(geom[type]||type,material(color,roughness));m.position.set(...p);m.scale.set(...s);m.rotation.set(r[0]||0,r[1]||0,r[2]||0);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
export function group(parent,p=[0,0,0]){const g=new T.Group();g.position.set(...p);parent.add(g);return g;}
function geometry(positions,indices){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));if(indices)g.setIndex(indices);g.computeVertexNormals();return g;}
const roof=geometry([-1,0,-1,1,0,-1,0,.65,-1,-1,0,1,1,0,1,0,.65,1],[0,2,1,3,4,5,0,3,5,0,5,2,2,5,4,2,4,1,0,1,4,0,4,3]).toNonIndexed();roof.computeVertexNormals();
const roofMat='#c96f48',wood='#bd966d',cream='#f3e2bf',slate='#344b4b',glass='#356671';
export function house(parent,x,z,scale=1,color=cream,rotation=0){
 const g=group(parent,[x,.89,z]);g.scale.setScalar(scale);g.rotation.y=rotation;
 part(g,'box',[0,.65,0],[1.55,1.3,1.25],color);
 part(g,'box',[0,.10,0],[1.7,.24,1.38],'#b5b09a');
 part(g,roof,[0,1.28,0],[.96,1,.83],roofMat);
 for(let side of [-1,1])for(let k=0;k<4;k++)part(g,'box',[side*(.13+k*.21),1.88-k*.14,0],[.27,.046,1.62],k%2?'#ba694a':'#d57c51',[0,0,-side*.60]);
 part(g,'box',[-.46,.51,.641],[.42,.9,.075],slate);part(g,'box',[-.47,.54,.69],[.34,.72,.025],'#476756');
 for(const xx of [.32]){
  part(g,'box',[xx,.78,.65],[.5,.51,.08],cream);
  const m=part(g,'box',[xx,.78,.698],[.4,.4,.025],glass);m.material=material('#628d8d',.35,.10);
  part(g,'box',[xx,.78,.72],[.027,.4,.025],cream);part(g,'box',[xx,.78,.72],[.4,.028,.025],cream);
  part(g,'box',[xx,.45,.71],[.64,.12,.20],wood);
  for(let i=0;i<3;i++){part(g,'sphere',[xx-.2+i*.20,.55,.74],[.13,.13,.1],'#718b52');part(g,'sphere',[xx-.2+i*.20,.64,.79],[.04,.05,.04],'#f7c174');}
  for(let s of [-1,1])part(g,'box',[xx+s*.33,.78,.67],[.13,.5,.05],'#698b7d',[0,s*.3,0]);
 }
 for(let s of [-1,1])part(g,'box',[s*.75,.7,.66],[.06,1.35,.075],wood);
 part(g,'box',[.44,1.87,-.26],[.22,.62,.23],'#baa58c');part(g,'box',[.44,2.18,-.26],[.3,.075,.3],slate);
 part(g,'box',[0,.08,.9],[1.85,.13,.45],'#d8c4a5');return g;
}
function tree(parent,x,z,s=1,kind='pine'){
 const g=group(parent,[x,.84,z]);g.scale.setScalar(s);part(g,'cylinder',[0,.65,0],[.11,1.35,.11],'#7d6850');
 if(kind==='pine')for(let j=0;j<3;j++)part(g,'cone',[0,1.1+j*.46,0],[.7-j*.14,1.35-j*.17,.7-j*.14],['#557659','#698462','#789167'][j]);
 else for(let i=0;i<4;i++){const a=i*2.2;part(g,'sphere',[Math.sin(a)*.27,1.45+i*.12,Math.cos(a)*.3],[.65,.63,.59],['#7c935b','#95a667','#688850','#91a168'][i]);}
}
function islandGeometry(r,rz,height,seed){
 const n=40,positions=[],indices=[];const shape=[];
 for(let i=0;i<n;i++){let a=i/n*Math.PI*2;const wobble=1+.034*Math.sin(a*7+seed)+.025*Math.cos(a*5-seed);shape.push([Math.cos(a)*r*wobble,Math.sin(a)*rz*wobble]);}
 const rings=[[.83,-.63],[1.0,.1],[.97,height-.22],[.83,height]];
 for(const [scale,y]of rings)for(const [x,z]of shape)positions.push(x*scale,y,z*scale);
 for(let k=0;k<rings.length-1;k++)for(let i=0;i<n;i++){const j=(i+1)%n,a=k*n+i,b=k*n+j,c=(k+1)*n+j,d=(k+1)*n+i;indices.push(a,d,b,b,d,c);}
 positions.push(0,height,0);for(let i=0;i<n;i++)indices.push(rings.length*n,(rings.length-1)*n+(i+1)%n,(rings.length-1)*n+i);
 const g=geometry(positions,indices).toNonIndexed();g.computeVertexNormals();return g;
}
function lighthouse(parent,x,z){
 const g=group(parent,[x,1.0,z]);part(g,'cylinder',[0,.12,0],[1.25,.24,1.25],'#b7b39c');
 const tower=new T.CylinderGeometry(.58,.85,3.7,24);
 part(g,tower,[0,2.0,0],[1,1,1],cream);
 for(const y of [1.25,2.65])part(g,new T.CylinderGeometry(.85-(y-.15)*.073,.85-(y-.65)*.073,.5,24),[0,y,0],[1,1,1],'#b85644');
 part(g,'box',[0,.59,.83],[.34,.87,.04],slate);
 for(let i=0;i<3;i++){const a=i*2.1;part(g,'box',[Math.sin(a)*.65,2.15,Math.cos(a)*.65],[.22,.38,.05],glass,[0,a,0]);}
 part(g,'cylinder',[0,3.95,0],[.98,.16,.98],slate);
 part(g,'cylinder',[0,4.28,0],[.57,.63,.57],'#9fd2cd',[],.25);
 const beacon=part(g,'sphere',[0,4.3,0],[.38,.39,.38],'#ffe0a0');beacon.material=material('#ffd68d',.4,2.7);
 for(let i=0;i<12;i++){let a=i/12*Math.PI*2;part(g,'cylinder',[Math.cos(a)*.86,4.18,Math.sin(a)*.86],[.021,.52,.021],slate);}
 part(g,new T.TorusGeometry(.86,.033,6,24),[0,4.43,0],[1,1,1],slate,[Math.PI/2,0,0]);
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2;part(g,'cylinder',[Math.cos(a)*.55,4.34,Math.sin(a)*.55],[.028,.77,.028],slate);}
 part(g,'cone',[0,4.92,0],[.83,.62,.83],'#a85742');part(g,'sphere',[0,5.28,0],[.1,.1,.1],slate);
 return {g,beacon,top:new T.Vector3(x,5.4,z)};
}
function pier(parent,port,island){
 const dx=port.x-island.x,dz=port.z-island.z,a=Math.atan2(dx,dz),d=Math.hypot(dx,dz);
 const g=group(parent,[port.x,.17,port.z]);g.rotation.y=a;
 const length=Math.max(1.9,d-island.r+1.7);
 part(g,'box',[0,.2,-length/2],[1.18,.22,length],wood);
 for(let i=0;i<Math.ceil(length/.22);i++)part(g,'box',[0,.34,-.12-i*.22],[1.2,.055,.15],i%2?'#c8aa7e':'#bda079');
 for(let side of [-1,1])for(let z=-.25;z>-length;z-=.85){part(g,'cylinder',[side*.61,.14,z],[.065,1.0,.065],'#665b46');part(g,'cylinder',[side*.61,.67,z],[.09,.08,.09],cream);}
 part(g,'cylinder',[.78,.65,-.8],[.045,1.45,.045],slate);part(g,'box',[1.00,1.28,-.8],[.44,.26,.04],port.color);
 const lamp=part(g,'sphere',[.78,1.48,-.8],[.13,.15,.13],port.color);lamp.material=material(port.color,.6,.6);
 for(let i=0;i<3;i++)part(g,'box',[i%2*.4-.2,.66+Math.floor(i/2)*.26,-length+.8],[.30,.30,.34],['#d49b5a','#ac7b51','#e9c182'][i]);
 return g;
}
/** Merge static scenery by material: detail without hundreds of independent draw calls. */
function mergeStatic(root){
 root.updateMatrixWorld(true);const sets=new Map();
 root.traverse(m=>{if(!m.isMesh)return;const key=m.material;let set=sets.get(key);if(!set){set=[];sets.set(key,set);}set.push(m);});
 const merged=new T.Group();
 for(const [mat,meshes]of sets){
  let size=0;const geos=meshes.map(m=>{const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrixWorld);size+=g.attributes.position.array.length;return g;});
  const p=new Float32Array(size),n=new Float32Array(size);let i=0;
  for(const g of geos){p.set(g.attributes.position.array,i);n.set(g.attributes.normal.array,i);i+=g.attributes.position.array.length;g.dispose();}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setAttribute('normal',new T.Float32BufferAttribute(n,3));
  const mesh=new T.Mesh(geometry,mat);mesh.castShadow=true;mesh.receiveShadow=true;merged.add(mesh);
 }
 return merged;
}
export function buildArchipelago(scene,map){
 const root=new T.Group();let seed=317;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 let lightTop=new T.Vector3(-10,6,-6);
 map.islands.forEach((o,index)=>{
  const rock=o.type==='rock',g=group(root,[o.x,0,o.z]);
  part(g,islandGeometry(o.r,o.rz,rock?.9:.6,index+1),[0,0,0],[1,1,1],rock?'#a69b7e':'#d7c098');
  if(!rock){
   part(g,islandGeometry(o.r*.84,o.rz*.84,.8,index+3),[0,.02,0],[1,1,1],o.type==='forest'?'#728764':'#8b9e6a');
   for(let i=0;i<10;i++){const a=i/10*Math.PI*2,r=.55+rand()*.28;tree(g,Math.cos(a)*o.r*r,Math.sin(a)*o.rz*r,.55+rand()*.40,i%3?'pine':'round');}
   if(o.type==='lighthouse'){
    lightTop=lighthouse(g,-.9,-.6).top.add(new T.Vector3(o.x,0,o.z));
    house(g,1.25,.3,.78);house(g,0,1.6,.62,'#e6c091',-.20);house(g,-1.55,1.3,.59,'#eadac0',.32);
    for(let i=0;i<9;i++)part(g,'cylinder',[.3+Math.sin(i*.6)*.15,.85,i*.28-1.4],[.29,.035,.19],'#bdb99b');
   }else if(o.type==='village'){
    house(g,.2,.7,.86,'#f3dfbf',.1);house(g,-1.1,-.75,.61,'#e7c59f',-.3);house(g,1.45,-.8,.58,'#c0d0ba',.4);
   }else{
    house(g,.5,-.25,.72,'#d5c2a2',-.3);
   }
   for(let j=0;j<18;j++){let a=rand()*6.28,r=(.6+rand()*.32);const x=Math.cos(a)*o.r*r,z=Math.sin(a)*o.rz*r;part(g,'sphere',[x,.82,z],[.19,.13,.16],j%3?'#849961':'#b2ac77');}
  }else for(let i=0;i<5;i++){
   const a=i*2.4;const m=part(g,'rock',[Math.cos(a)*o.r*.35,.55+rand()*.5,Math.sin(a)*o.rz*.32],[.45+rand()*.4,.6+rand()*.6,.45+rand()*.45],i%2?'#a9a48d':'#898d79',[rand(),rand(),rand()]);
  }
 });
 for(const p of map.ports)pier(root,p,map.islands[p.island]);
 // Distant islets establish depth without changing the navigable map.
 for(let i=0;i<9;i++){const a=i/9*Math.PI*2,x=Math.cos(a)*33,z=Math.sin(a)*27;const g=group(root,[x,0,z]);part(g,islandGeometry(2+rand()*3,1.5+rand()*2,1.2,10+i),[0,0,0],[1,1,1],'#8ea89c');for(let k=0;k<3;k++)tree(g,k*.65-.65,0,.7+rand()*.4);}
 const merged=mergeStatic(root);scene.add(merged);
 return {root:merged,lightTop,dispose(){scene.remove(merged);merged.traverse(m=>{if(m.isMesh)m.geometry.dispose();});}};
}
function hullGeometry(){
 const outline=[[-.4,-.9],[-.5,-.55],[-.48,.5],[-.26,.95],[0,1.14],[.26,.95],[.48,.5],[.5,-.55],[.4,-.9]];
 const p=[],idx=[];for(const [scale,y]of [[.6,-.16],[1,.28]])for(const [x,z]of outline)p.push(x*scale,y,z*scale);
 const n=outline.length;for(let i=0;i<n;i++){const j=(i+1)%n;idx.push(i,j,n+j,i,n+j,n+i);}p.push(0,.28,0);for(let i=0;i<n;i++)idx.push(n*2,n+i,n+(i+1)%n);
 const g=geometry(p,idx).toNonIndexed();g.computeVertexNormals();return g;
}
const hull=hullGeometry();
export function buildShip(kind,color){
 const root=new T.Group(),g=group(root);const scale=kind==='fishing'?.74:kind==='cargo'?1.05:.95;g.scale.setScalar(scale);
 part(g,hull,[0,0,0],[1,1,1],color,[],.48);
 part(g,'box',[0,.30,-.05],[.74,.07,1.62],'#eddfc5');
 part(g,'box',[0,.34,-.7],[.83,.07,.10],cream);part(g,'box',[-.41,.34,-.15],[.055,.09,1.05],cream);part(g,'box',[.41,.34,-.15],[.055,.09,1.05],cream);
 if(kind==='cargo'){
  part(g,'box',[0,.60,-.43],[.65,.5,.46],cream);part(g,'box',[0,.86,-.43],[.75,.08,.57],slate);
  for(let row=0;row<2;row++)for(let j=0;j<2;j++){const col=j?'#826f65':'#ce793f';part(g,'box',[(j-.5)*.36,.49,.05+row*.44],[.32,.3,.4],col);for(let i=0;i<3;i++)part(g,'box',[(j-.5)*.36-.12+i*.12,.65,.05+row*.44],[.025,.025,.39],'#bcb394');}
 }else if(kind==='ferry'){
  part(g,'box',[0,.57,-.05],[.7,.5,1.22],cream);part(g,'box',[0,.89,-.05],[.81,.11,1.38],'#faf2d6');
  for(const side of [-1,1])for(let i=0;i<4;i++)part(g,'box',[side*.356,.64,-.51+i*.27],[.025,.22,.19],glass);
  part(g,'box',[0,1.10,-.17],[.44,.36,.54],cream);part(g,'box',[0,1.31,-.17],[.50,.06,.62],slate);
 }else{
  part(g,'box',[0,.62,.16],[.63,.59,.55],cream);part(g,'box',[0,.95,.16],[.76,.08,.64],'#597665');
  part(g,'box',[0,.56,-.53],[.63,.24,.53],'#9b825d');part(g,'box',[0,.70,-.54],[.50,.04,.40],'#758774');
 }
 const cabinZ=kind==='cargo'?-.19:kind==='ferry'?.05:.445;
 part(g,'box',[0,.68,cabinZ],[.49,.19,.026],glass,[],.35);
 part(g,'cylinder',[.23,.96,-.48],[.052,1.0,.052],slate);part(g,'box',[.34,1.29,-.48],[.24,.14,.026],color);
 part(g,'cylinder',[-.22,.89,-.64],[.075,.44,.075],slate);
 for(const x of [-.43,.43])part(g,new T.TorusGeometry(.10,.028,5,14),[x,.42,-.46],[1,1,1],'#f3e4c4',[0,Math.PI/2,0]);
 for(const side of [-1,1]){const m=part(g,'sphere',[side*.38,.40,.63],[.04,.04,.04],side===1?'#85d49a':'#f08b6f');m.material=material(side===1?'#85d49a':'#f08b6f',.5,.8);}
 return mergeStatic(root);
}
export function disposeMaterials(){for(const m of materialCache.values())m.dispose();for(const g of Object.values(geom))g.dispose();roof.dispose();hull.dispose();}
