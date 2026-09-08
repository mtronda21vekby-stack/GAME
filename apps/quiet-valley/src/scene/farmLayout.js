/* Quiet Valley v0.9.2 — Farm Rebuild II.
 *
 * This pass performs a deterministic authored rebuild on top of the stable
 * v0.9.1 scene. Major landmarks are relocated as complete root groups, crop
 * beds are translated as complete footprints, old loose livestock clutter is
 * removed, and new paths / utility props are authored explicitly.
 */
'use strict';

export function createFarmLayout(BaseFarmArt){
 return {make(R){
  const art=BaseFarmArt.make(R);

  const near=(a,b,e=.035)=>Math.abs(a-b)<=e;
  const rootOf=node=>{let g=node?.parent||null;while(g?.parent)g=g.parent;return g;};
  const roots=[...new Set((R.meshes||[]).map(rootOf).filter(Boolean))];
  const findRoot=(x,z)=>roots.find(g=>Array.isArray(g.p)&&near(g.p[0],x,.04)&&near(g.p[2],z,.04));
  const moveRoot=(from,to)=>{const g=findRoot(from[0],from[1]);if(!g)return false;g.p[0]=to[0];g.p[2]=to[1];if(to[2]!=null)g.r[1]=to[2];return true;};

  // Large authored objects move only as complete root groups. No proximity
  // translation of their children is allowed.
  const landmarkPlan={
   farmhouse:{from:[-6.5,-6.8],to:[-8.15,-6.15,.05]},
   cottage:{from:[-1.15,-7.85],to:[-3.55,-7.45,-.03]},
   windmill:{from:[-10,-3.65],to:[-9.35,.35,.02]},
   market:{from:[-5.2,7.1],to:[-8.05,5.95,.04]},
   orderBoard:{from:[-2.55,6.75],to:[-5.45,6.15,-.06]},
   wagon:{from:[-8.5,6.7],to:[-10.25,5.55,.28]},
   coop:{from:[8.2,4.4],to:[8.15,4.65,-.05]},
   bench:{from:[1.65,7.65],to:[2.15,7.85,-.18]}
  };
  const moved={};for(const [id,p] of Object.entries(landmarkPlan))moved[id]=moveRoot(p.from,p.to);

  // Rebuild the sixteen beds into two clean 2-column blocks with a wide
  // central service aisle. Each bed footprint is moved exactly once.
  const columns=[-7.25,-5.25,-2.05,-.05];
  const rows=[-3.05,-1.00,1.05,3.10];
  const oldCenters=(art.cropModels||[]).map(m=>[m.x,m.z]);
  const newCenters=[];
  for(const m of art.cropModels||[]){
   const nx=columns[m.id%4],nz=rows[Math.floor(m.id/4)],ox=m.x,oz=m.z,dx=nx-ox,dz=nz-oz;
   // Loose border, ridge, dirt and marker meshes occupy a non-overlapping
   // footprint around each original bed. Move that exact footprint only.
   for(const n of R.meshes||[]){
    if(n.parent)continue;
    if(Math.abs(n.p[0]-ox)<=.96&&Math.abs(n.p[2]-oz)<=.96&&n.p[1]>=.20&&n.p[1]<=1.35){n.p[0]+=dx;n.p[2]+=dz;}
   }
   for(const sp of Object.values(m.species||{})){sp.g.p[0]+=dx;sp.g.p[2]+=dz;}
   m.x=nx;m.z=nz;newCenters.push([nx,nz]);
  }

  // Remove the old ungrouped hay / trough clutter by its exact authored
  // coordinates. Recreate a cleaner utility station deeper inside the paddock.
  let removedLoose=0;
  for(const n of R.meshes||[]){
   if(n.parent)continue;
   const oldTrough=Math.abs(n.p[0]-3.1)<1.0&&Math.abs(n.p[2]+3.75)<.65&&n.p[1]<1.1;
   const oldHay=n.p[0]>7.0&&n.p[0]<9.0&&Math.abs(n.p[2]+4.25)<.75&&n.p[1]<1.5;
   if(oldTrough||oldHay){n.visible=false;removedLoose++;}
  }

  const box=(p,s,c,r=[0,0,0],g=null)=>R.add('bevelBox',p,s,c,r,g);
  const cyl=(p,s,c,r=[0,0,0],g=null)=>R.add('cylinder',p,s,c,r,g);
  const utility=R.group([7.05,.20,-3.72],[1,1,1],[0,.02,0]);
  box([0,.28,0],[1.85,.42,.72],'#9b8160',[0,0,0],utility);
  box([0,.51,0],[1.58,.05,.50],'#75adae',[0,0,0],utility);
  const hay=R.group([8.45,.20,-3.88]);
  for(const p of [[0,.34,0],[.62,.34,0],[.31,.82,.03]]){cyl(p,[.38,.60,.38],'#c4a84d',[0,0,Math.PI/2],hay);box([p[0],p[1],p[2]],[.62,.58,.07],'#947940',[0,0,0],hay);}
  const tools=R.group([6.15,.20,-4.45]);
  box([0,.72,0],[.10,1.35,.10],'#68452f',[0,0,0],tools);
  box([.30,.80,0],[.10,1.12,.10],'#68452f',[0,0,.18],tools);
  box([-.30,.73,0],[.10,1.20,.10],'#68452f',[0,0,-.16],tools);
  box([0,1.35,0],[1.05,.12,.12],'#aa794d',[0,0,0],tools);

  // A real central working courtyard and service paths. These are low profile
  // so they never cover crop hit targets.
  const path=(x,z,w,d,r=0)=>R.add('island',[x,.305,z],[w,.075,d],'#d1bb94',[0,r,0]);
  path(.72,-.25,.78,5.8);                    // main spine
  path(-3.66,.10,2.15,.58);                  // crop cross-aisle
  path(-6.30,4.55,3.1,.58,-.08);             // market approach
  path(-5.85,-5.05,3.0,.58,.05);             // homes approach
  path(4.20,3.65,4.0,.58,.02);               // coop / pasture route
  const plaza=R.group([.85,.20,4.35]);
  box([0,.13,0],[2.6,.16,2.0],'#c8b287',[0,0,0],plaza);
  box([0,.32,-.67],[1.65,.18,.34],'#aa794d',[0,0,0],plaza);
  for(const x of [-.65,.65])box([x,.58,-.67],[.12,.70,.12],'#68452f',[0,0,0],plaza);

  const landmarks={
   farmhouse:[-8.15,-6.15],cottage:[-3.55,-7.45],windmill:[-9.35,.35],
   market:[-8.05,5.95],orderBoard:[-5.45,6.15],wagon:[-10.25,5.55],
   coop:[8.15,4.65],trough:[7.05,-3.72],plaza:[.85,4.35]
  };

  const routes={
   elena:[[-7.65,-5.55],[-5.9,-5.0],[-3.7,-4.85],[-1.0,-4.85],[.70,-3.55],[-1.0,-4.85],[-3.7,-4.85],[-5.9,-5.0]],
   mia:[[-7.60,5.55],[-6.1,5.85],[-4.8,5.25],[-2.7,4.65],[.55,4.30],[-2.7,4.65],[-4.8,5.25],[-6.1,5.85]],
   fedor:[[-8.95,.25],[-8.1,-.5],[-7.5,-1.8],[-6.4,-3.2],[-5.8,-4.8],[-7.0,-3.0],[-8.2,-1.3]],
   lea:[[7.80,4.55],[7.0,4.05],[5.8,3.65],[4.2,3.65],[2.2,4.05],[.85,4.35],[2.2,4.05],[5.8,3.65]]
  };
  for(const v of art.villagers||[]){
   const route=routes[v.id];if(!route)continue;
   v.route=route.map(p=>[...p]);v.routeIndex=0;v.target=[...route[1]];v.wait=.5;
   v.g.p[0]=route[0][0];v.g.p[2]=route[0][1];
  }
  if(art.livingWorld?.villagerRoutes)for(const [id,route] of Object.entries(routes))art.livingWorld.villagerRoutes[id]=route.map(p=>[...p]);

  art.marketPoint=[landmarks.market[0],2.0,landmarks.market[1]];
  art.orderBoardPoint=[landmarks.orderBoard[0],2.45,landmarks.orderBoard[1]];
  art.troughPoint=[landmarks.trough[0],.8,landmarks.trough[1]];

  art.layoutWorld={
   version:'0.9.2',rebuild:true,moved,removedLoose,plotCenters:newCenters,landmarks,routes,
   anchors:{market:[...art.marketPoint],orders:[...art.orderBoardPoint],trough:[...art.troughPoint]},
   inspect(){return {version:'0.9.2',rebuild:true,moved:{...moved},removedLoose,plotCenters:newCenters.map(p=>[...p]),landmarks:Object.fromEntries(Object.entries(landmarks).map(([k,v])=>[k,[...v]])),routes:Object.fromEntries(Object.entries(routes).map(([k,v])=>[k,v.map(p=>[...p])])),anchors:{market:[...art.marketPoint],orders:[...art.orderBoardPoint],trough:[...art.troughPoint]}};}
  };
  return art;
 }};
}
