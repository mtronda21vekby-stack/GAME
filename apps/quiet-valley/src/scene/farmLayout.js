/* Curated spatial pass for the home farm.
 * Reuses authored assets but moves them into readable functional districts,
 * opens the centre of the island, remaps the 16 crop beds around a service aisle,
 * removes redundant legacy clutter, and reconnects NPC routes to the new layout.
 */
'use strict';
export function createFarmLayout(BaseFarmArt){
 return {make(R){
  const art=BaseFarmArt.make(R);
  const EPS=.08;
  const near=(a,b)=>Math.abs(a-b)<=EPS;
  const roots=new Set();
  const rootOf=node=>{let p=node?.parent,last=null;while(p){last=p;p=p.parent;}return last;};
  for(const mesh of R.meshes||[]){const root=rootOf(mesh);if(root)roots.add(root);}
  const findRoot=(x,z)=>[...roots].find(g=>g?.p&&near(g.p[0],x)&&near(g.p[2],z));
  const moveRoot=(from,to)=>{const g=findRoot(from[0],from[1]);if(!g)return false;g.p[0]=to[0];g.p[2]=to[1];return true;};

  // Strong zoning. Keep authored assets out of crop and circulation footprints.
  // West = utility/market, south-west = homes, centre-left = fields, east = livestock.
  const moved={
   farmhouse:moveRoot([-6.5,-6.8],[-8.65,-6.10]),
   cottage:moveRoot([-1.15,-7.85],[-4.65,-7.15]),
   windmill:moveRoot([-10,-3.65],[-8.05,.65]),
   market:moveRoot([-5.2,7.1],[-8.45,6.45]),
   orderBoard:moveRoot([-2.55,6.75],[-5.95,6.25]),
   wagon:moveRoot([-8.5,6.7],[-9.65,5.10]),
   coop:moveRoot([8.2,4.4],[8.05,5.05]),
   feedYard:moveRoot([7.55,-4.45],[7.25,-4.20]),
   workYard:moveRoot([-4.15,5.55],[-7.15,4.85]),
   gardenTools:moveRoot([-.85,-4.32],[-3.20,-5.45])
  };

  // Reposition every crop bed by gameplay ID. Two 2-column bands are separated by a
  // wide service aisle, leaving clear space for houses, windmill and market.
  const plotXs=[-6.35,-4.25,-1.30,.80];
  const plotZs=[-2.85,-.65,1.55,3.75];
  const plotCenters=[];
  const movedRoots=new Set();
  for(const m of art.cropModels||[]){
   const oldX=m.x,oldZ=m.z;
   const row=Math.floor(m.id/4),col=m.id%4;
   const newX=plotXs[col],newZ=plotZs[row],dx=newX-oldX,dz=newZ-oldZ;
   plotCenters[m.id]=[newX,newZ];
   for(const mesh of R.meshes||[]){
    if(mesh.parent||!mesh.p)continue;
    if(Math.abs(mesh.p[0]-oldX)<=1.01&&Math.abs(mesh.p[2]-oldZ)<=1.01){mesh.p[0]+=dx;mesh.p[2]+=dz;}
   }
   for(const root of roots){
    if(movedRoots.has(root)||!root?.p)continue;
    if(Math.abs(root.p[0]-oldX)<=1.01&&Math.abs(root.p[2]-oldZ)<=1.01){root.p[0]+=dx;root.p[2]+=dz;movedRoots.add(root);}
   }
   m.x=newX;m.z=newZ;
  }

  // Hide duplicated loose stable/service props superseded by the living-farm clusters.
  const obsoleteLoose=node=>{
   if(node.parent||!node.p)return false;
   const [x,,z]=node.p;
   const stableDuplicate=x>2.2&&x<9.2&&z>-4.95&&z<-3.15;
   const oldBarrel=x>-4.45&&x<-3.35&&z>-5.55&&z<-4.75;
   return stableDuplicate||oldBarrel;
  };
  let removedLoose=0;
  for(const mesh of R.meshes||[])if(obsoleteLoose(mesh)){mesh.visible=false;removedLoose++;}

  const group=(p=[0,0,0],s=[1,1,1],r=[0,0,0],parent=null)=>R.group(p,s,r,parent);
  const add=(type,p,s,c,r=[0,0,0],parent=null,alpha=1)=>R.add(type,p,s,c,r,parent,alpha);
  const box=(p,s,c,parent=null,r=[0,0,0])=>add(Math.min(...s)>.12?'bevelBox':'box',p,s,c,r,parent);
  const cyl=(p,s,c,parent=null,r=[0,0,0])=>add('cylinder',p,s,c,r,parent);
  const ball=(p,s,c,parent=null)=>add('sphere',p,s,c,[0,0,0],parent);

  const path=(a,b,step=.72)=>{
   const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),n=Math.max(1,Math.ceil(len/step));
   for(let i=0;i<=n;i++){
    const f=i/n,x=a[0]+dx*f,z=a[1]+dz*f;
    add('island',[x,.305,z],[.44+(i%3)*.03,.065,.29],'#d4bf99',[0,Math.atan2(dx,dz),0]);
   }
  };

  // Main circulation avoids all crop footprints.
  path([-2.78,-5.05],[-2.78,5.30]);
  path([-2.78,5.30],[-5.75,5.75]);
  path([-5.75,5.75],[-8.05,6.15]);
  path([1.15,3.05],[5.75,3.05]);
  path([5.75,3.05],[7.90,4.30]);
  path([-.20,-5.15],[-4.25,-5.15]);
  path([-4.25,-5.15],[-7.80,-5.70]);
  path([-7.35,4.75],[-8.00,1.55]);

  // Compact forecourt on the service aisle; no overlap with beds.
  const court=group([-2.78,.23,.55]);
  add('island',[0,.08,0],[.92,.08,.92],'#cfbc97',[0,.25,0],court);
  box([-.62,.34,.18],[.58,.10,.26],'#9b7650',court,[0,.12,0]);
  box([.62,.34,-.18],[.58,.10,.26],'#9b7650',court,[0,-.12,0]);
  for(const p of [[-.78,.28,-.52],[.76,.28,.52]]){
   cyl([p[0],.20,p[2]],[.22,.25,.22],'#a97b58',court);
   ball([p[0],.47,p[2]],[.27,.23,.27],'#759451',court);
  }

  // One clean pasture service station, aligned to the lower fence line.
  const service=group([4.25,.23,-4.15]);
  box([0,.30,0],[1.55,.38,.66],'#9b8160',service);
  box([0,.52,0],[1.30,.045,.46],'#75adae',service);
  for(const x of [-1.05,1.02]){
   cyl([x,.34,.05],[.32,.54,.32],'#c4a84d',service,[0,0,Math.PI/2]);
   box([x,.34,.08],[.52,.46,.055],'#92763d',service);
  }

  // Home-yard props are kept between the two houses, not on crop edges.
  const homeYard=group([-6.25,.23,-6.15]);
  box([0,.27,0],[1.15,.10,.50],'#9a7650',homeYard);
  for(const x of [-.48,.48])box([x,.54,0],[.09,.62,.09],'#7a6047',homeYard);
  box([0,.70,0],[1.08,.08,.10],'#7a6047',homeYard);
  const wash=cyl([.92,.28,.15],[.23,.34,.23],'#78908a',homeYard);wash.fx=[8,0,0,0];

  const sign=group([1.05,.23,4.55]);
  box([0,.70,0],[.10,1.35,.10],'#7d6047',sign);
  box([0,1.14,0],[1.35,.52,.12],'#c7b58c',sign,[0,.08,0]);
  box([0,1.14,.07],[1.12,.055,.03],'#7e8f68',sign,[0,.08,0]);

  // NPC routes use the same corridors as the visible paths and remain inside runtime bounds.
  const routes={
   elena:[[-8.05,-5.65],[-6.35,-5.45],[-4.35,-5.15],[-2.78,-5.00],[-2.78,-3.65],[-2.78,-5.00],[-6.00,-5.35]],
   mia:[[-8.10,6.20],[-6.60,5.95],[-5.75,5.75],[-3.90,5.45],[-2.78,5.25],[-3.90,5.45],[-6.10,5.80]],
   fedor:[[-8.00,4.75],[-8.10,3.65],[-8.05,2.55],[-8.00,1.40],[-7.90,2.50],[-7.80,3.65],[-7.35,4.70]],
   lea:[[7.95,4.85],[6.90,4.15],[5.70,3.10],[4.25,3.10],[2.35,3.35],[4.25,3.10],[6.50,4.00]]
  };
  for(const v of art.villagers||[]){
   const route=routes[v.id];if(!route)continue;
   v.route=route.map(p=>[...p]);v.routeIndex=0;v.target=[...route[1]];v.wait=.5;
   v.g.p[0]=route[0][0];v.g.p[2]=route[0][1];
  }
  if(art.livingWorld?.villagerRoutes){
   for(const [id,route] of Object.entries(routes))art.livingWorld.villagerRoutes[id]=route.map(p=>[...p]);
  }

  art.marketPoint=[-8.45,2.0,6.45];
  art.orderBoardPoint=[-5.95,2.45,6.25];
  art.troughPoint=[4.25,.8,-4.15];

  art.layoutWorld={
   moved,removedLoose,routes,plotCenters,
   districts:{homes:[-8.65,-4.65,-6.10,-7.15],market:[-8.45,-5.95,6.45,6.25],utility:[-8.05,.65],livestock:[4.25,8.05,-4.15,5.05]},
   anchors:{market:[...art.marketPoint],orders:[...art.orderBoardPoint],trough:[...art.troughPoint]},
   inspect(){return {moved:{...moved},removedLoose,plotCenters:plotCenters.map(p=>[...p]),routes:Object.fromEntries(Object.entries(routes).map(([k,v])=>[k,v.map(p=>[...p])])),anchors:{market:[...art.marketPoint],orders:[...art.orderBoardPoint],trough:[...art.troughPoint]}};}
  };
  return art;
 }};
}
