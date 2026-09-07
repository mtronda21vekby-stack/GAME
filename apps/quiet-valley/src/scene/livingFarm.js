/* Living-world choreography layered on top of the authored farm art.
 * Keeps simulation state authoritative while making NPCs, animals and props read as a working farm.
 */
'use strict';
export function createLivingFarm(BaseFarmArt){
 return {make(R){
  const art=BaseFarmArt.make(R);
  const group=(p=[0,0,0],s=[1,1,1],r=[0,0,0],parent=null)=>R.group(p,s,r,parent);
  const add=(type,p,s,c,r=[0,0,0],parent=null,alpha=1)=>R.add(type,p,s,c,r,parent,alpha);
  const box=(p,s,c,parent=null,r=[0,0,0])=>add(Math.min(...s)>.12?'bevelBox':'box',p,s,c,r,parent);
  const ball=(p,s,c,parent=null)=>add('sphere',p,s,c,[0,0,0],parent);
  const cyl=(p,s,c,parent=null,r=[0,0,0])=>add('cylinder',p,s,c,r,parent);
  const cone=(p,s,c,parent=null,r=[0,0,0])=>add('cone',p,s,c,r,parent);

  // --- authored utility clusters -------------------------------------------------
  // Feed corner beside the pasture: hay, sacks, bucket and a simple tool rack.
  const feed=group([7.55,.23,-4.45]);
  for(const [x,z,y] of [[-.75,0,.38],[0,0,.38],[-.38,.34,.86]]){
   cyl([x,y,z],[.38,.62,.38],'#c6a64e',feed,[0,0,Math.PI/2]);
   box([x,y,z+.02],[.60,.55,.06],'#8f753d',feed);
  }
  for(let i=0;i<3;i++){
   const sack=group([.72+i*.30,.21,.24], [1,1,1],[0,(i-1)*.18,0],feed);
   ball([0,.18,0],[.20,.27,.16],i%2?'#cbb98d':'#d8c79c',sack);
   cyl([0,.43,0],[.055,.10,.055],'#8c7659',sack);
  }
  const bucket=cyl([1.0,.22,-.37],[.25,.34,.25],'#758783',feed);bucket.fx=[8,0,0,0];
  box([1.0,.42,-.37],[.31,.035,.31],'#536c69',feed);
  const rack=group([-1.27,.08,.58],[1,1,1],[0,.08,0],feed);
  for(const x of [-.42,.42])box([x,.78,0],[.09,1.55,.09],'#79604a',rack);
  box([0,1.28,0],[1.0,.10,.10],'#79604a',rack);
  for(const x of [-.28,.22]){cyl([x,.72,.04],[.035,.88,.035],'#69756b',rack,[0,0,x<0?.13:-.10]);box([x,.20,.04],[.28,.10,.18],'#6f7b70',rack);}

  // Market/work yard is deliberately denser than the play field: crates and hand carts live where work happens.
  const workYard=group([-4.15,.23,5.55]);
  for(let i=0;i<5;i++){
   const x=(i%3)*.67-.67,z=Math.floor(i/3)*.68;
   box([x,.27,z],[.57,.50,.55],i%2?'#a77b50':'#b58a5e',workYard,[0,(i%3-.8)*.12,0]);
   box([x,.52,z],[.59,.055,.57],'#7e6548',workYard,[0,(i%3-.8)*.12,0]);
  }
  const handCart=group([1.15,.05,.45],[.86,.86,.86],[0,-.48,0],workYard);
  box([0,.56,0],[1.45,.18,.92],'#9c7148',handCart);
  for(const z of [-.47,.47])cyl([-.58,.31,z],[.28,.13,.28],'#5e5b4d',handCart,[0,0,Math.PI/2]);
  for(const z of [-.28,.28])box([.93,.41,z],[1.15,.07,.07],'#785b42',handCart,[0,0,-.15]);

  // Gardening station by the cultivated side of the cottage.
  const gardenTools=group([-.85,.23,-4.32]);
  box([0,.28,0],[1.15,.48,.62],'#9d784f',gardenTools);
  box([0,.54,0],[1.22,.06,.68],'#765d43',gardenTools);
  for(const x of [-.36,0,.36]){const pot=cyl([x,.72,0],[.17,.28,.17],'#b47758',gardenTools);pot.fx=[9,0,0,0];ball([x,.96,0],[.20,.16,.19],x?'#779458':'#86a260',gardenTools);}
  cyl([.76,.38,.05],[.15,.30,.15],'#718c87',gardenTools,[0,0,-.18]);
  cyl([.93,.43,.05],[.035,.43,.035],'#718c87',gardenTools,[0,0,.72]);

  // --- logical locomotion zones --------------------------------------------------
  const animalZones={
   cow:{minX:2.75,maxX:8.75,minZ:-4.75,maxZ:2.55,home:[4.3,-1.8],interest:[[3.1,-3.7],[7.7,-4.15],[6.7,1.45],[3.4,.65]]},
   sheep:{minX:2.75,maxX:8.75,minZ:-4.75,maxZ:2.55,home:[6.0,-.2],interest:[[7.7,-4.15],[8.35,.9],[4.0,1.7],[3.1,-3.7]]},
   chicken:{minX:5.8,maxX:9.15,minZ:3.65,maxZ:5.55,home:[8.05,4.55],interest:[[8.2,4.45],[6.35,4.0],[7.05,5.12],[8.85,4.05]]}
  };
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const hash=(id,k)=>{let n=(id+1)*1103515245+(k+17)*12345;n=(n^(n>>>16))>>>0;return n/4294967295;};
  function zoneFor(type){return animalZones[type]||animalZones.sheep;}
  function legalTarget(type,x,z){const q=zoneFor(type);return [clamp(x,q.minX,q.maxX),clamp(z,q.minZ,q.maxZ)];}
  function configureAnimal(m){
   if(!m||m.livingConfigured)return m;
   m.livingConfigured=true;m.lifeDecisionAt=0;m.lifeMode='idle';
   const q=zoneFor(m.type);m.g.p[0]=clamp(m.g.p[0],q.minX,q.maxX);m.g.p[2]=clamp(m.g.p[2],q.minZ,q.maxZ);m.target=[...q.home];
   // Visual anchors improve scale/readability without replacing the existing articulated model.
   if(m.type==='cow'){
    const collar=group([0,1.17,.12],[1,1,1],[0,0,0],m.g);cyl([0,0,0],[.42,.055,.42],'#8d6650',collar);ball([0,-.13,.39],[.07,.09,.05],'#d2ad55',collar);
   }else if(m.type==='sheep'){
    ball([0,.92,-.49],[.16,.13,.14],'#efe6ce',m.g);
   }else{
    const wingL=ball([-.24,.48,0],[.11,.20,.25],'#d0af72',m.g),wingR=ball([.24,.48,0],[.11,.20,.25],'#e0bd7d',m.g);wingL.r[2]=.16;wingR.r[2]=-.16;
   }
   return m;
  }
  for(const m of art.animalModels.values())configureAnimal(m);
  const baseAnimalModel=art.animalModel.bind(art);
  art.animalModel=function(data){return configureAnimal(baseAnimalModel(data));};

  const routes={
   // Cottage -> garden bench -> pasture service lane -> back home.
   elena:[[-7.65,-5.05],[-5.25,-4.72],[-1.35,-4.72],[1.05,-3.65],[2.55,-3.65],[1.05,-4.72],[-3.15,-4.72],[-6.35,-5.05]],
   // Market keeper circulates around stock, order board and the main lane instead of crossing scenery.
   mia:[[-4.55,6.18],[-3.18,6.18],[-2.05,5.92],[-.05,5.28],[.70,3.75],[-.05,5.28],[-2.55,6.15]],
   // Fedor works the windmill/market service loop.
   fedor:[[-5.65,7.15],[-3.75,7.05],[-2.65,6.45],[-1.0,4.95],[-1.0,2.85],[-2.25,4.9],[-4.25,6.25]],
   // Lea cares for the coop, then walks to the market edge and duck pond path.
   lea:[[1.15,6.45],[2.45,5.15],[4.85,4.10],[6.55,4.05],[8.05,4.55],[6.65,4.10],[3.8,5.2],[1.45,6.55]]
  };
  const starts={elena:[-7.65,-5.05],mia:[-4.55,6.18],fedor:[-5.65,7.15],lea:[1.15,6.45]};
  for(const v of art.villagers){
   const route=routes[v.id];if(!route)continue;
   v.route=route.map(p=>[...p]);v.routeIndex=0;v.target=[...route[1]];v.wait=.5+hash(v.id.length,2)*1.2;
   const p=starts[v.id];v.g.p[0]=p[0];v.g.p[2]=p[1];
   // Give people simple carried/work objects so their routes read as tasks rather than aimless wandering.
   if(v.id==='elena'){
    const can=group([.46,1.05,.18],[.62,.62,.62],[0,0,.18],v.g);cyl([0,0,0],[.18,.28,.18],'#6e8d88',can);cyl([.13,.17,0],[.035,.30,.035],'#506d69',can,[0,0,.70]);
   }else if(v.id==='mia'){
    const basket=group([.43,1.02,.16],[.65,.65,.65],[0,0,.08],v.g);box([0,0,0],[.48,.27,.36],'#a87d4d',basket);cyl([0,.24,0],[.27,.05,.27],'#8d6946',basket,[Math.PI/2,0,0]);
   }else if(v.id==='fedor'){
    box([.43,1.0,.13],[.36,.45,.12],'#6f806e',v.g,[0,0,-.08]);
   }else if(v.id==='lea'){
    const bowl=cyl([.42,.99,.16],[.20,.10,.20],'#9e8057',v.g);bowl.r[2]=-.12;
   }
  }

  let elapsed=0;
  const baseAnimate=art.animate.bind(art);
  art.animate=function(t,dt,state){
   elapsed+=Math.max(0,dt||0);
   // Decide animal intent before the base articulated locomotion runs.
   for(const a of state.animals){
    const m=configureAnimal(art.animalModels.get(a.id)||art.animalModel(a)),q=zoneFor(a.type);
    if(!Number.isFinite(m.lifeDecisionAt))m.lifeDecisionAt=0;
    if(elapsed>=m.lifeDecisionAt&&m.pet<=0){
     const slot=Math.floor(elapsed/7)+(a.id||0)*3;
     const hungry=(a.hunger??100)<42;
     let target;
     if(hungry&&a.type!=='chicken')target=[3.1,-3.7];
     else if(hungry&&a.type==='chicken')target=[8.15,4.45];
     else{
      const list=q.interest,idx=Math.floor(hash(a.id,slot)*list.length)%list.length;
      const base=list[idx],jx=(hash(a.id+3,slot)-.5)*.65,jz=(hash(a.id+7,slot)-.5)*.52;target=[base[0]+jx,base[1]+jz];
     }
     m.target=legalTarget(a.type,target[0],target[1]);
     m.wait=2.2+hash(a.id+11,slot)*4.2;m.lifeDecisionAt=elapsed+6+hash(a.id+19,slot)*8;
    }
   }
   baseAnimate(t,dt,state);
   // Hard habitat containment after integration: nobody clips through fences, houses or the shoreline.
   for(const a of state.animals){
    const m=art.animalModels.get(a.id);if(!m)continue;const q=zoneFor(a.type);
    m.g.p[0]=clamp(m.g.p[0],q.minX,q.maxX);m.g.p[2]=clamp(m.g.p[2],q.minZ,q.maxZ);
    m.target=legalTarget(a.type,m.target[0],m.target[1]);
    // idle grazing/pecking gives visible behaviour when stationary
    const moving=Math.hypot(m.target[0]-m.g.p[0],m.target[1]-m.g.p[2])>.14;
    if(!moving&&m.pet<=0){
     if(a.type==='chicken')m.head.r[0]=.28+Math.max(0,Math.sin(t*4+m.phase))*.38;
     else m.head.r[0]=.18+Math.max(0,Math.sin(t*.85+m.phase))*.24;
    }
   }
   // Keep authored villagers on their walkable service routes and add breathing/working cadence at stops.
   for(const v of art.villagers){
    const r=routes[v.id];if(!r)continue;
    v.g.p[0]=clamp(v.g.p[0],-8.2,8.4);v.g.p[2]=clamp(v.g.p[2],-7.5,7.6);
    const moving=Math.hypot(v.target[0]-v.g.p[0],v.target[1]-v.g.p[2])>.10;
    if(!moving){v.torso.r[2]=Math.sin(t*.8+v.phase)*.012;v.head.r[0]=Math.sin(t*.55+v.phase)*.035;}
   }
  };

  art.livingWorld={
   animalZones,
   villagerRoutes:routes,
   inspect(){return {
    animals:[...art.animalModels.values()].map(m=>({id:m.id,type:m.type,x:m.g.p[0],z:m.g.p[2],target:[...m.target]})),
    villagers:art.villagers.map(v=>({id:v.id,x:v.g.p[0],z:v.g.p[2],routeLength:v.route.length,target:[...v.target]}))
   };}
  };
  return art;
 }};
}
