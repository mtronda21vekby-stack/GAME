import * as F from '../rendering/index.js';
/* All farm, vegetation and articulated animal models are generated here. No downloaded art. */
'use strict';
export function createFarmArt(FarmSim) {
 function make(R){
  let seed=7163;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const colors={cream:'#eee4c8',wood:'#aa794d',dark:'#68452f',grass:'#8fa565',leaf:'#648543',mint:'#527b71',roof:'#bb7558',soil:'#694b32',water:'#5cb5b7'};
  const box=(p,s,c,r=[0,0,0],g=null)=>{
   const n=R.add(Math.min(...s)>.12?'bevelBox':'box',p,s,c,r,g);
   if([colors.wood,colors.dark,'#bd8d59','#bcab87'].includes(c))n.fx=[7,0,0,0];
   if([colors.mint,colors.roof].includes(c))n.fx=[8,0,0,0];
   if(['#e5d6b3','#d6b286'].includes(c))n.fx=[9,0,0,0];
   return n;
  };
  const ball=(p,s,c,g=null)=>{const n=R.add('sphere',p,s,c,[0,0,0],g);if(n.c[1]>n.c[0]*1.035&&n.c[1]>n.c[2]*1.10&&n.c[1]>.05)n.fx=[2,0,.75,p[0]+p[2]*1.7];return n;};
  const cyl=(p,s,c,r=[0,0,0],g=null,alpha=1)=>R.add('cylinder',p,s,c,r,g,alpha);
  const cone=(p,s,c,r=[0,0,0],g=null)=>R.add('cone',p,s,c,r,g);
  const group=(p=[0,0,0],s=[1,1,1],r=[0,0,0],parent=null)=>R.group(p,s,r,parent);
  const treeTops=[],wheels=[],clouds=[],cropModels=[],animalModels=new Map(),flowers=[],villagers=[];
  const terrain={layers:[],shore:[]};
  const soil=R.add('island',[0,-.69,0],[14.6,1.6,11.4],'#997457');
  const turf=R.add('island',[0,.13,0],[14.75,.3,11.5],colors.grass);turf.fx=[4,0,0,0];
  const bedrock=R.add('island',[0,-1.48,0],[14.2,.32,11.1],'#79644b');
  terrain.layers=[soil,turf,bedrock].map(node=>({node,scale:[...node.s]}));
  // Layered rocks reveal that this is a little living diorama, not an infinite plane.
  for(let i=0;i<56;i++){let a=i/56*Math.PI*2,r=1+rnd()*.035;const node=ball([Math.cos(a)*14.3*r,-.9+rnd()*.45,Math.sin(a)*11.1*r],[.24+rnd()*.38,.20+rnd()*.3,.22+rnd()*.38],['#bda17f','#cfb393','#8f775f'][i%3]);terrain.shore.push({node,position:[...node.p]});}
  function bush(x,z,s=1){for(let k=0;k<3;k++)ball([x+(k-1)*.29*s,.38*s+.2,z+(k%2)*.13],[.47*s,.36*s,.41*s],['#6f904c','#809f54','#557944'][k]);}
  function tree(x,z,s=1,fruit=false){const g=group([x,.2,z],[s,s,s]);cyl([0,1,0],[.16,1.8,.16],colors.wood,[0,0,-.05],g);cyl([.18,1.58,0],[.09,.78,.09],colors.wood,[0,0,-.65],g);const top=group([0,2.4,0],[1,1,1],[0,0,0],g);for(let k=0;k<5;k++){let a=k/5*Math.PI*2;ball([Math.cos(a)*.43,(k%2)*.28,Math.sin(a)*.43],[.87,.87,.83],['#7ba451','#91ae59','#658e48','#83a652','#5b8148'][k],top);}ball([0,.57,0],[.73,.8,.68],'#8aac5b',top);if(fruit)for(let k=0;k<9;k++){let a=k/9*6.28;ball([Math.cos(a)*.91,-.2+(k%3)*.32,Math.sin(a)*.91],[.105,.115,.105],'#da7656',top);}treeTops.push({g:top,phase:rnd()*6});return g;}
  [[-11,-6,1.2],[-11.8,-3,.85],[-12,1,1],[-10,4.1,.8],[-10.5,7.1,1.0],[11,-3,1.1],[11,-7.3,.92],[7.7,-8.4,1.1],[4.8,-8.9,.85],[-5,-9.6,.7],[-1,-10,.7],[-12.2,-.3,.55],[11.9,1,.85],[10.8,5.3,.7]].forEach(([x,z,s],i)=>tree(x,z,s,i>4));
  for(let i=0;i<20;i++){let a=rnd()*6.28;let x=Math.cos(a)*12.4,z=Math.sin(a)*9.5;if(z>5&&x>0)continue;bush(x,z,.6+rnd()*.6);}
  // Stepping-stone main lane and branch to the cottage.
  for(let i=0;i<24;i++){const z=-8.1+i*.65;const x=.72+Math.sin(i*.35)*.12;R.add('island',[x,.304,z],[.67+(i%3)*.04,.09,.35],'#d3bd95',[0,(i%3)*.2,0]);}
  for(let i=0;i<8;i++)R.add('island',[-.6-i*.72,.30,-4.75],[.43,.08,.33],'#d4bf9b',[0,rnd(),0]);
  function fence(x1,z1,x2,z2){const len=Math.hypot(x2-x1,z2-z1),n=Math.ceil(len/1.55),a=Math.atan2(x2-x1,z2-z1);for(let i=0;i<=n;i++){let f=i/n;box([x1+(x2-x1)*f,.8,z1+(z2-z1)*f],[.14,1.2,.14],colors.cream);cone([x1+(x2-x1)*f,1.45,z1+(z2-z1)*f],[.12,.2,.12],colors.cream);}for(let y of [.69,1.12])box([(x1+x2)/2,y,(z1+z2)/2],[.09,.13,len],colors.cream,[0,a,0]);}
  fence(2.0,-5.35,9.6,-5.35);fence(9.6,-5.35,9.6,2.8);fence(2,-5.35,2,-.9);fence(2,1.1,2,3.3);fence(2,3.3,6.9,3.3);fence(8.6,3.3,9.6,3.3);
  // Barn / cottage: timber siding, glass, gabled roof, chimney and window boxes.
  function building(x,z,w,d,h,roofColor,wallColor){let g=group([x,.2,z]);box([0,h*.5,0],[w,h,d],wallColor,[0,0,0],g);for(let i=0;i<Math.floor(w/.3);i++)box([-w/2+.12+i*.3,h*.5,d/2+.018],[.028,h,.028],'#c7bc9c',[0,0,0],g);
   for(let side of [-1,1]){box([side*w/2,h*.5,d/2+.04],[.13,h+.05,.15],colors.cream,[0,0,0],g);box([side*w*.26,h+.53,0],[w*.62,.14,d+.48],roofColor,[0,0,side*-.47],g);}
   cyl([0,h+1.03,0],[.11,d+.5,.11],roofColor,[Math.PI/2,0,0],g);
   // Authored roof courses catch light at grazing angles; shared box geometry.
   for(const side of [-1,1])for(let row=0;row<5;row++){
    const xx=side*(.08+row*w*.105),yy=h+1.02-row*w*.051;
    box([xx,yy,.01],[w*.13,.052,d+.43],roofColor,[0,0,-side*.47],g);
   }
   // A foundation course and corner beams make the house sit on the ground.
   box([0,.15,0],[w+.16,.29,d+.12],'#afa087',[0,0,0],g);

   // Gable infill.
   for(let k=0;k<8;k++){let yy=h+k*.12;box([0,yy,d/2-.02],[Math.max(.1,w-k*w/8),.14,.11],wallColor,[0,0,0],g);}
   box([-.55,.7,d/2+.08],[.82,1.4,.12],'#628677',[0,0,0],g);box([-.55,.7,d/2+.16],[.66,1.23,.06],'#517163',[0,0,0],g);ball([-.31,.68,d/2+.23],[.045,.045,.045],'#dec690',g);
   const win=(xx,yy,zz)=>{box([xx,yy,zz],[.92,.92,.1],colors.cream,[0,0,0],g);box([xx,yy,zz+.07],[.74,.74,.07],'#567b80',[0,0,0],g).fx=[5,0,0,0];box([xx,yy,zz+.12],[.055,.8,.06],colors.cream,[0,0,0],g);box([xx,yy,zz+.13],[.8,.055,.05],colors.cream,[0,0,0],g);box([xx,yy-.55,zz+.13],[1.05,.2,.3],colors.wood,[0,0,0],g);for(let k=0;k<4;k++){ball([xx-.34+k*.22,yy-.38,zz+.15],[.19,.16,.18],'#6b9146',g);ball([xx-.34+k*.22,yy-.28,zz+.24],[.07,.07,.07],k%2?'#f0ce67':'#f2ba9d',g);}};
   win(w*.27,h*.56,d/2+.09);box([0,.06,d/2+.58],[w+.5,.12,.85],'#bcab87',[0,0,0],g);
   box([-w*.27,h+.75,-d*.18],[.5,1.35,.5],'#b6a184',[0,0,0],g);box([-w*.27,h+1.47,-d*.18],[.64,.13,.64],'#7e7762',[0,0,0],g);
   for(let k=0;k<4;k++){const p=[x-w*.27,h+1.8,z-d*.18];const n=R.add('sphere',p,[.14,.19,.14],'#e7e7d3',[0,0,0],null,.20);clouds.push({n,origin:[...p],phase:k/4});}
   return g;}
  building(-6.5,-6.8,4.05,3,2.15,colors.mint,'#e5d6b3');
  building(-1.15,-7.85,2.8,2.5,1.8,colors.roof,'#d6b286');
  // Windmill with four articulated canvas sails.
  const wm=group([-10,.2,-3.65]); // local ground offset
  cyl([0,1.55,0],[.56,3,.56],'#e8dab9',[0,0,0],wm);cone([0,3.42,0],[.9,.9,.9],colors.mint,[0,0,0],wm);
  const sails=group([0,2.73,.68],[1,1,1],[0,0,0],wm);for(let i=0;i<4;i++){let g=group([0,0,0],[1,1,1],[0,0,i*Math.PI/2],sails);box([0,.9,0],[.08,2,.1],colors.wood,[0,0,0],g);box([.22,1.12,.015],[.55,1.05,.045],colors.cream,[0,0,-.06],g);for(let q=0;q<4;q++)box([.21,.69+q*.25,.05],[.55,.024,.05],'#bdab86',[0,0,0],g);}ball([0,0,.07],[.17,.17,.17],colors.wood,sails);
  // Stable accessories: hay, water trough, little chicken coop.
  for(let i=0;i<3;i++){cyl([7.6+(i%2)*.7,.52+(i===2?.56:0),-4.25],[.4,.63,.4],'#c4a84d',[0,0,Math.PI/2]);box([7.6+(i%2)*.7,.54+(i===2?.56:0),-4.25],[.64,.59,.07],'#947940');}
  box([3.1,.47,-3.75],[1.65,.4,.7],'#9b8160');box([3.1,.69,-3.75],[1.42,.035,.49],'#75adae');
  let coop=group([8.2,.2,4.4]);box([0,.72,0],[1.8,1.3,1.4],'#d4ac70',[0,0,0],coop);box([0,1.53,0],[2.15,.17,1.7],colors.roof,[0,0,-.13],coop);box([0,.62,.72],[.6,.7,.07],'#665740',[0,0,0],coop);box([0,.17,1.1],[.62,.08,1.08],colors.wood,[.21,0,0],coop);for(let i=0;i<5;i++)box([0,.28-i*.04,.8+i*.15],[.63,.05,.06],colors.cream,[0,0,0],coop);
  // Market stall with striped awning, baskets and produce.
  const market=group([-5.2,.2,7.1]);box([0,.62,0],[3,.85,1.15],'#bd8d59',[0,0,0],market);for(let x of [-1.4,1.4])box([x,1.35,-.35],[.09,2.55,.09],colors.dark,[0,0,0],market);
  for(let i=0;i<10;i++){let c=i%2?'#efe1bd':'#7e9b67';box([-1.52+i*.335,2.65,0],[.34,.1,1.85],c,[.12,0,0],market);box([-1.52+i*.335,2.48,.89],[.34,.3,.075],c,[0,0,0],market);}
  for(let i=0;i<3;i++){box([-.97+i*.98,1.13,0],[.85,.19,.91],colors.wood,[0,0,0],market);for(let j=0;j<6;j++)ball([-1.23+i*.98+(j%3)*.24,1.3,Math.floor(j/3)*.27-.14],[.14,.14,.14],['#d89050','#a8ac55','#d67753'][i],market);}
  // Market order board: a physical goal hub beside the produce stall.
  const orderBoard=group([-2.55,.2,6.75],[1,1,1],[0,-.08,0]);
  for(const x of [-.85,.85])box([x,.88,0],[.12,1.75,.12],colors.dark,[0,0,0],orderBoard);
  box([0,1.58,0],[2.1,1.45,.16],'#7a6045',[0,0,0],orderBoard);box([0,1.58,.10],[1.86,1.20,.055],'#d8c99e',[0,0,0],orderBoard);
  for(let i=0;i<3;i++){const x=-.56+i*.56;box([x,1.58,.145],[.42,.72,.028],i===1?'#f0e8cc':'#fff5d8',[0,0,(i-1)*.04],orderBoard);ball([x,1.93,.18],[.035,.035,.025],'#b76c4e',orderBoard);}
  box([0,2.44,.03],[1.26,.27,.12],'#56745b',[0,0,0],orderBoard);
  const orderLamp=ball([.92,2.35,.18],[.095,.095,.075],'#e7c46c',orderBoard);orderLamp.fx=[5,0,0,0];orderLamp.visible=false;
  // Four lightweight villagers make the farm feel inhabited. Their stories live in gameplay.js.
  function villager(id,name,pos,shirt,hair,route){
   const g=group([pos[0],.23,pos[1]],[1,1,1]),torso=group([0,0,0],[1,1,1],[0,0,0],g),head=group([0,0,0],[1,1,1],[0,0,0],g),arms=[],legs=[];
   const contact=R.add('disc',[0,-.205,0],[.46,1,.31],'#1f3327',[0,0,0],g,.17);contact.fx=[10,0,0,0];
   cyl([0,1.12,0],[.31,.80,.31],shirt,[0,0,0],torso);head.p=[0,1.72,0];ball([0,0,0],[.27,.30,.27],'#d6ae8c',head);ball([0,.19,-.03],[.28,.14,.27],hair,head);
   if(id==='elena'){cyl([0,.25,0],[.44,.045,.39],'#d4b16d',[0,0,0],head);cyl([0,.35,0],[.25,.19,.23],'#dabd80',[0,0,0],head);cyl([0,.28,0],[.26,.055,.24],'#79634a',[0,0,0],head);}
   if(id==='mia'){cyl([0,.24,0],[.25,.17,.25],'#f0e7d2',[0,0,0],head);for(let i=0;i<3;i++)ball([(i-1)*.12,.40,0],[.15,.16,.20],'#f4ead6',head);box([0,1.02,.30],[.40,.55,.045],'#efe4c8',[0,0,0],torso);}
   if(id==='fedor'){ball([0,.23,0],[.30,.16,.28],'#455f51',head);box([0,.23,.27],[.38,.045,.24],'#455f51',[0,0,0],head);}
   if(id==='lea'){ball([.25,.01,-.15],[.13,.28,.15],hair,head);box([0,1.05,.30],[.4,.44,.04],'#bd976c',[0,0,0],torso);}

   for(const side of [-1,1]){const a=group([side*.38,1.33,0],[1,1,1],[0,0,0],g);cyl([0,-.20,0],[.075,.56,.075],'#d6ae8c',[0,0,side*.08],a);arms.push(a);const l=group([side*.17,.73,0],[1,1,1],[0,0,0],g);cyl([0,-.28,0],[.10,.67,.10],'#687268',[0,0,0],l);box([0,-.60,.09],[.22,.14,.34],'#574f42',[0,0,0],l);legs.push(l);}
   ball([-.10,.03,.25],[.025,.03,.018],'#383c33',head);ball([.10,.03,.25],[.025,.03,.018],'#383c33',head);
   const v={id,name,g,head,torso,arms,legs,route,routeIndex:0,target:[route[0][0],route[0][1]],wait:2+rnd()*3,phase:rnd()*6.28};villagers.push(v);return v;
  }
  villager('elena','Елена',[-7.8,-5.0],'#8e9b70','#7b6250',[[-7.8,-5.0],[-6.3,-3.9],[-7.2,-7.2]]);
  villager('mia','Мия',[-3.3,6.2],'#c98963','#7a4f3d',[[-3.3,6.2],[-5.0,6.5],[-1.8,5.7]]);
  villager('fedor','Фёдор',[-5.0,7.8],'#6e8f7d','#5a4b3e',[[-5.0,7.8],[-3.8,7.4],[-6.0,6.6]]);
  villager('lea','Лея',[1.6,6.9],'#9a819d','#6f564a',[[1.6,6.9],[2.2,5.4],[.5,7.4]]);
  // Pond: soft banks, transparent surface, reed beds, ducks, a bench.
  R.add('island',[5.4,.30,7.15],[3.65,.13,2.46],'#bfbb83');R.add('island',[5.4,.36,7.15],[3.34,.04,2.18],'#438f9b'); // below the lowest wave; avoid surface/bed intersections
  const water=R.add('water',[5.4,.435,7.15],[3.21,1,2.08],colors.water,[0,0,0],null,.97);water.fx=[1,0,0,0];
  for(let i=0;i<12;i++){let a=i/12*Math.PI*2;if(a<1.9&&a>.4)continue;const x=5.4+Math.cos(a)*3.2,z=7.15+Math.sin(a)*2.25;ball([x,.44,z],[.29,.15,.22],'#b1ad8b');if(i%2===0)for(let j=0;j<4;j++){cyl([x+(rnd()-.5)*.3,.67+rnd()*.22,z+(rnd()-.5)*.3],[.025,.58,.025],'#7e9552');}}
  for(let i=0;i<5;i++){let a=i/5*6.28;cyl([5.4+Math.cos(a)*1.9,.467,7.15+Math.sin(a)*1.4],[.20,.018,.16],'#86b267');}
  const ducks=[];for(let i=0;i<2;i++){const g=group([5.0+i*1.0,.48,7.0+i*.5],[.6,.6,.6]);ball([0,.18,0],[.32,.22,.48],colors.cream,g);ball([0,.48,.32],[.18,.19,.19],colors.cream,g);ball([0,.43,.53],[.12,.055,.16],'#da9b47',g);ball([.13,.52,.43],[.025,.03,.025],'#403d34',g);ducks.push(g);}
  const bench=group([1.65,.2,7.65],[1,1,1],[0,-.28,0]);for(let x of [-.65,.65])box([x,.35,0],[.12,.65,.56],colors.dark,[0,0,0],bench);box([0,.67,0],[1.7,.12,.72],colors.wood,[0,0,0],bench);for(let x of [-.68,.68])box([x,1.06,-.32],[.09,.95,.1],colors.dark,[0,0,0],bench);box([0,1.21,-.32],[1.68,.4,.12],colors.wood,[0,0,0],bench);
  // Vegetable beds: individual growth stages are scaled models, not flat icons.
  for(let id=0;id<16;id++){
   let x=-7.5+(id%4)*2.04,z=-2.35+Math.floor(id/4)*2.04;
   const dirt=box([x,.29,z],[1.73,.20,1.73],colors.soil);dirt.fx=[3,0,0,0];
   for(let dx of [-.88,.88])box([x+dx,.36,z],[.10,.18,1.88],colors.wood);
   for(let dz of [-.88,.88])box([x,.36,z+dz],[1.85,.18,.10],colors.wood);
   const ridges=[];for(let k=0;k<5;k++)ridges.push(box([x-.65+k*.32,.42,z],[.17,.11,1.58],'#856343'));
   ridges.forEach(n=>n.fx=[3,0,0,0]);
   const species={};for(const key of ['carrot','wheat','pumpkin']){
    let start=R.meshes.length;const g=group([x,.43,z]);
    if(key==='carrot')for(let i=0;i<9;i++){let xx=(i%3-1)*.49,zz=(Math.floor(i/3)-1)*.49;cone([xx,.13,zz],[.135,.36,.135],'#d98138',[Math.PI,0,0],g);for(let j=0;j<3;j++){let a=j/3*6.28;const leaf=ball([xx+Math.cos(a)*.11,.43,zz+Math.sin(a)*.11],[.07,.27,.115],j%2?'#5c8d44':'#78a44c',g);leaf.r=[Math.sin(a)*.5,0,Math.cos(a)*.5];}}
    if(key==='wheat')for(let i=0;i<12;i++){let xx=(i%4-1.5)*.32,zz=(Math.floor(i/4)-1)*.44;let h=.8+(i%3)*.08;cyl([xx,h*.5,zz],[.022,h,.022],'#b09b43',[0,0,(i%2-.5)*.1],g);for(let k=0;k<3;k++){ball([xx-.047+k%2*.085,h-.16+k*.09,zz],[.068,.12,.045],'#d9bd62',g);}let leaf=ball([xx+.07,.38,zz],[.045,.20,.03],'#8d9b46',g);leaf.r[2]=-.7;}
    if(key==='pumpkin')for(let i=0;i<4;i++){let xx=(i%2-.5)*.84,zz=(Math.floor(i/2)-.5)*.84;for(let j=0;j<6;j++){let a=j/6*6.28;ball([xx+Math.cos(a)*.12,.23,zz+Math.sin(a)*.12],[.23,.24,.23],j%2?'#d18b40':'#dd9c48',g);}cyl([xx,.49,zz],[.045,.19,.045],'#69814a',[0,0,-.17],g);let leaf=ball([xx+.30,.09,zz+.14],[.32,.045,.21],'#658749',g);leaf.r[1]=i;}
    species[key]={g,nodes:R.meshes.slice(start)};if(key==='wheat')species[key].nodes.forEach(n=>n.fx=[2,0,.42,x+z]);
   }
   const flag=group([x+.63,.42,z-.64]);cyl([0,.45,0],[.025,.8,.025],colors.dark,[0,0,0],flag);box([0,.77,0],[.36,.26,.04],colors.cream,[0,0,0],flag);
   cropModels.push({id,x,z,dirt,ridges,species});
  }
  // Small flower meadows, grass tufts, a barrel and wagon.
  for(let i=0;i<280;i++){let x=(rnd()-.5)*27,z=(rnd()-.5)*20;if(x*x/190+z*z/108>1)continue;let clear=(x>-9.0&&x<1.8&&z>-8.7&&z<6)||(x>1&&x<10&&z>-6&&z<4)||(x>-7&&x<-3&&z>5)||(x>1&&x<10&&z>4);if(clear)continue;let g=group([x,.23,z]);cone([0,.12,0],[.04,.23,.04],i%2?'#769950':'#a2b768',[0,0,.23],g);cone([.08,.10,0],[.035,.18,.035],'#729149',[0,0,-.28],g);if(i%3===0){cyl([0,.27,0],[.014,.35,.014],'#819b55',[0,0,0],g);ball([0,.47,0],[.055,.055,.055],'#d5ad4b',g);for(let k=0;k<5;k++){let a=k/5*6.28;ball([Math.cos(a)*.072,.46,Math.sin(a)*.072],[.067,.025,.05],i%2?'#eee5c7':'#d1a5ac',g);}}}
  let wagon=group([-8.5,.2,6.7],[1,1,1],[0,.35,0]);box([0,.53,0],[1.3,.15,1.6],'#ac7d4d',[0,0,0],wagon);for(let x of [-.65,.65]){box([x,.88,0],[.08,.57,1.67],colors.wood,[0,0,0],wagon);for(let z of [-.52,.52]){cyl([x*1.15,.38,z],[.31,.12,.31],'#646147',[0,0,Math.PI/2],wagon);cyl([x*1.2,.38,z],[.11,.14,.11],colors.cream,[0,0,Math.PI/2],wagon);}}
  cyl([-3.9,.7,-5.12],[.42,.9,.42],'#a0aba0');cyl([-3.9,1.17,-5.12],[.45,.08,.45],'#6e877c');
  function animalModel(data){const kind=data.type;const g=group([3+data.id*.85,.23,-1+(data.id%3)*1.1],[1,1,1]);const head=group([0,0,0],[1,1,1],[0,0,0],g),legs=[],tail=group([0,0,0],[1,1,1],[0,0,0],g);let body;
   const contactSize=kind==='cow'?[.74,1,.54]:kind==='sheep'?[.58,1,.43]:[.30,1,.24];const contact=R.add('disc',[0,-.205,0],contactSize,'#1e3126',[0,0,0],g,.18);contact.fx=[10,0,0,0];
   if(kind==='cow'){
    body=ball([0,.92,0],[.49,.49,.82],'#eee7d4',g);for(const [x,y,z,sx,sy,sz] of [[.40,1.07,-.22,.14,.26,.27],[-.42,1.0,.30,.12,.27,.26],[.13,1.31,-.28,.32,.11,.27],[.35,.83,.48,.16,.26,.2]])ball([x,y,z],[sx,sy,sz],'#565345',g);
    head.p=[0,1.03,.66];ball([0,.15,.23],[.31,.35,.37],'#eee7d4',head);ball([0,-.02,.54],[.31,.19,.2],'#d4a39a',head);for(let side of [-1,1]){let e=ball([side*.34,.33,.17],[.24,.08,.13],'#d6c1aa',head);e.r[2]=side*.3;cone([side*.19,.52,.12],[.07,.22,.07],'#cabc96',[0,0,side*-.26],head);ball([side*.27,.27,.43],[.065,.07,.03],'#fcf8e8',head);ball([side*.285,.27,.453],[.028,.039,.021],'#343b32',head);ball([side*.14,-.01,.715],[.04,.034,.018],'#9d776d',head);}
    for(let i=0;i<4;i++){let l=group([(i%2-.5)*.64,.61,(Math.floor(i/2)-.5)*1.02],[1,1,1],[0,0,0],g);cyl([0,-.2,0],[.10,.5,.10],'#e1d4b8',[0,0,0],l);box([0,-.45,.035],[.21,.15,.25],'#635d4c',[0,0,0],l);legs.push(l);}tail.p=[0,1.0,-.76];cyl([0,-.14,-.12],[.04,.51,.04],'#c8baa0',[-.45,0,0],tail);ball([0,-.4,-.25],[.08,.13,.09],'#665f4d',tail);
   }else if(kind==='sheep'){
    body=ball([0,.78,0],[.40,.43,.56],'#e8dfc6',g);for(let i=0;i<19;i++){let a=i/19*6.28;let yy=i%3*.15;ball([Math.cos(a)*.31,.73+yy,Math.sin(a)*.40],[.22,.23,.23],i%2?'#eee5cf':'#e2d8bf',g);}head.p=[0,.97,.48];ball([0,0,.13],[.24,.29,.25],'#a79c7e',head);ball([0,-.08,.29],[.22,.16,.13],'#b9ab8c',head);for(let side of [-1,1]){ball([side*.25,.08,.07],[.19,.066,.10],'#a49b7f',head);ball([side*.17,.08,.31],[.035,.045,.03],'#3e4336',head);}for(let i=0;i<4;i++){let l=group([(i%2-.5)*.5,.51,(Math.floor(i/2)-.5)*.68],[1,1,1],[0,0,0],g);cyl([0,-.17,0],[.069,.42,.069],'#9c9275',[0,0,0],l);box([0,-.35,.015],[.15,.1,.18],'#5e5f4b',[0,0,0],l);legs.push(l);}tail.p=[0,.83,-.58];ball([0,0,0],[.13,.17,.14],'#e3d8bb',tail);
   }else{
    body=ball([0,.42,0],[.25,.31,.36],'#e7d1a1',g);ball([-.23,.48,-.02],[.085,.20,.24],'#cfb67f',g);ball([.23,.48,-.02],[.085,.20,.24],'#e6c68d',g);head.p=[0,.7,.26];ball([0,0,.05],[.17,.18,.18],'#eadbb9',head);cone([0,-.015,.25],[.069,.18,.069],'#cb9345',[Math.PI/2,0,0],head);for(let side of [-1,1])ball([side*.13,.03,.15],[.025,.031,.018],'#3b3f32',head);for(let i=0;i<3;i++)ball([0,.18,-.04+i*.065],[.055,.09,.055],'#b95f49',head);ball([0,-.13,.16],[.047,.095,.043],'#bf6a52',head);for(let i=0;i<2;i++){let l=group([(i-.5)*.19,.22,0],[1,1,1],[0,0,0],g);cyl([0,-.07,0],[.027,.21,.027],'#bd8e48',[0,0,0],l);box([0,-.16,.06],[.09,.045,.15],'#bd8e48',[0,0,0],l);legs.push(l);}tail.p=[0,.57,-.33];for(let i=0;i<3;i++){let fe=ball([(i-1)*.1,.04,0],[.08,.21,.09],'#a48150',tail);fe.r[0]=-.45;}
   }
   let pos=kind==='chicken'?[5.3+(data.id%3)*1.1,.23,4.1+(data.id%2)*.65]:[3.5+(data.id%3)*1.5,.23,-2.3+(data.id%2)*1.7];g.p=pos;
   const m={id:data.id,type:kind,g,head,legs,tail,body,originY:body.p[1],phase:rnd()*6.28,target:[pos[0],pos[2]],wait:1+rnd()*3,move:false,pet:0};animalModels.set(data.id,m);return m;
  }
  function updateCrops(state,now){for(const m of cropModels){
   const p=state.plots[m.id];m.targetWet=FarmSim.moisture(p,now);if(m.wet===undefined)m.wet=m.targetWet;
   m.dirt.c=F.rgb(!p.unlocked?'#8e9271':colors.soil);
   m.dirt.fx[1]=m.wet;for(const ridge of m.ridges)ridge.fx[1]=m.wet;
   for(const [key,sp] of Object.entries(m.species)){const visible=p.crop===key&&p.unlocked;for(const node of sp.nodes)node.visible=visible;
    if(visible){const progress=p.waterAt?Math.max(0,Math.min(1,1-(p.readyAt-now)/Math.max(1,p.readyAt-p.waterAt))):.02,scale=.20+progress*.80;sp.g.s=[scale,scale,scale];}
   }
  }}
  function animate(t,dt,state){const readyOrder=state.game?.orders?.some(o=>Object.entries(o.items).every(([key,n])=>(state.inventory[key]||0)>=n));orderLamp.visible=!!readyOrder;if(readyOrder){const pulse=1+Math.sin(t*3.2)*.10;orderLamp.s=[.095*pulse,.095*pulse,.075*pulse];}for(const c of clouds){const p=(t*.16+c.phase)%1;c.n.p=[c.origin[0]+p*.4+Math.sin(t*.3)*.09,c.origin[1]+p*1.65,c.origin[2]];const scale=Math.sin(p*Math.PI);c.n.s=[(.14+p*.27)*scale,(.2+p*.25)*scale,(.14+p*.27)*scale];}for(const m of cropModels){m.wet+=(m.targetWet-m.wet)*Math.min(1,dt*5.5);m.dirt.fx[1]=m.wet;m.ridges.forEach(n=>n.fx[1]=m.wet);}sails.r[2]=t*.23;for(const o of treeTops)o.g.r[2]=Math.sin(t*.9+o.phase)*.013;ducks.forEach((d,i)=>{d.p[0]=5.4+Math.sin(t*.10+i*2.8)*1.35;d.p[2]=7.2+Math.cos(t*.10+i*2.8)*.7;d.r[1]=Math.PI/2-t*.10-i*2.8;});
   for(const a of state.animals){let m=animalModels.get(a.id)||animalModel(a),g=m.g;let chicken=a.type==='chicken';m.wait-=dt;let dx=m.target[0]-g.p[0],dz=m.target[1]-g.p[2],dist=Math.hypot(dx,dz);m.move=dist>.10&&m.pet<=0;
    if(m.move){let speed=chicken?.48:.38,step=Math.min(dist,speed*dt);g.p[0]+=dx/dist*step;g.p[2]+=dz/dist*step;let goal=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(goal-g.r[1]),Math.cos(goal-g.r[1]));g.r[1]+=delta*Math.min(1,dt*5);g.p[1]=.23+Math.sin(t*9+m.phase)*.014;}
    else{g.p[1]=.23;if(m.wait<0){m.target=chicken?[3.2+rnd()*5.7,3.6+rnd()*1.7]:[3.1+rnd()*5.35,-4.2+rnd()*6.45];m.wait=4+rnd()*7;}}
    m.legs.forEach((l,i)=>l.r[0]=m.move?Math.sin(t*(chicken?12:8)+i%2*Math.PI+m.phase)*.38:0);
    m.head.r[0]=m.pet>0?-.22:!m.move?(Math.sin(t*1.5+m.phase)*.1+.19):Math.sin(t*3)*.05;
    m.head.r[1]=!m.move?Math.sin(t*.7+m.phase)*.2:0;m.tail.r[2]=Math.sin(t*3+m.phase)*.22;m.body.s[1]*=1; m.body.p[1]=m.originY+Math.sin(t*2+m.phase)*.013;
    if(m.pet>0){m.pet-=dt;g.p[1]=.23+Math.max(0,Math.sin(m.pet*7))*.12;}
   }
   for(const v of villagers){v.wait-=dt;let dx=v.target[0]-v.g.p[0],dz=v.target[1]-v.g.p[2],dist=Math.hypot(dx,dz),moving=dist>.08;if(moving){const step=Math.min(dist,.25*dt);v.g.p[0]+=dx/dist*step;v.g.p[2]+=dz/dist*step;const goal=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(goal-v.g.r[1]),Math.cos(goal-v.g.r[1]));v.g.r[1]+=delta*Math.min(1,dt*4);v.legs.forEach((l,i)=>l.r[0]=Math.sin(t*6+i*Math.PI+v.phase)*.28);v.arms.forEach((a,i)=>a.r[0]=Math.sin(t*6+(i+1)*Math.PI+v.phase)*.18);}else{v.legs.forEach(l=>l.r[0]=0);v.arms.forEach(a=>a.r[0]=0);v.head.r[1]=Math.sin(t*.55+v.phase)*.16;if(v.wait<0){v.routeIndex=(v.routeIndex+1)%v.route.length;v.target=[...v.route[v.routeIndex]];v.wait=4+rnd()*5;}}}
   // Soft separation prevents animals occupying exactly the same spot.
   let list=[...animalModels.values()];for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){let a=list[i],b=list[j];if((a.type==='chicken')!==(b.type==='chicken'))continue;let dx=a.g.p[0]-b.g.p[0],dz=a.g.p[2]-b.g.p[2],d=Math.hypot(dx,dz),sep=a.type==='chicken'?.42:.92;if(d<sep&&d>.001){const shift=(sep-d)*Math.min(dt*2,.1);a.g.p[0]+=dx/d*shift;b.g.p[0]-=dx/d*shift;a.g.p[2]+=dz/d*shift;b.g.p[2]-=dz/d*shift;}}
  }
  return {terrain,sails,cropModels,animalModels,animalModel,villagers,updateCrops,animate,marketPoint:[-5.2,2.0,7.1],orderBoardPoint:[-2.55,2.45,6.75],troughPoint:[3.1,.8,-3.75]};
 }
 return {make};
}
