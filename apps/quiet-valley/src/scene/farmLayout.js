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

  // Strong functional zoning. The previous pass still read as one dense cluster in the
  // mobile camera, so this pass deliberately leaves breathing room between districts.
  const moved={
   farmhouse:moveRoot([-6.5,-6.8],[-9.0,-6.15]),
   cottage:moveRoot([-1.15,-7.85],[-4.55,-7.15]),
   windmill:moveRoot([-10,-3.65],[-8.55,.45]),
   market:moveRoot([-5.2,7.1],[-8.0,5.95]),
   orderBoard:moveRoot([-2.55,6.75],[-5.35,5.85]),
   wagon:moveRoot([-8.5,6.7],[-9.25,4.55]),
   coop:moveRoot([8.2,4.4],[8.15,5.15]),
   feedYard:moveRoot([7.55,-4.45],[7.15,-4.25]),
   workYard:moveRoot([-4.15,5.55],[-6.15,4.75]),
   gardenTools:moveRoot([-.85,-4.32],[-3.15,-5.15])
  };

  // Move every authored crop bed, including its loose frame/ridges and its child groups.
  // This keeps gameplay IDs intact but turns the old 4x4 wall of soil into two readable
  // field bands separated by a proper north-south service aisle.
  const plotXs=[-7.2,-5.1,-2.4,-.3];
  const plotZs=[-2.6,-.4,1.8,4.0];
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

  // Remove duplicated loose legacy props now superseded by authored service clusters.
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

  // One strong circulation spine, one market spur and one livestock spur. Fewer paths,
  // but each one has a purpose and reads cleanly at iPhone scale.
  path([-3.75,-4.85],[-3.75,5.25]);      // crop service aisle
  path([-3.75,5.25],[-6.1,5.35]);       // market/work yard spur
  path([.65,3.15],[5.75,3.15]);          // livestock service lane
  path([5.75,3.15],[7.95,4.35]);         // coop spur
  path([-.15,-5.05],[-4.3,-5.05]);       // home/garden approach
  path([-4.3,-5.05],[-7.8,-5.75]);       // farmhouse approach

  // A small central forecourt visually breaks the old continuous soil rectangle.
  const court=group([-3.75,.23,.7]);
  add('island',[0,.08,0],[1.05,.08,1.05],'#cfbc97',[0,.25,0],court);
  box([-.72,.34,.18],[.72,.10,.28],'#9b7650',court,[0,.12,0]);
  box([.72,.34,-.18],[.72,.10,.28],'#9b7650',court,[0,-.12,0]);
  for(const p of [[-.92,.28,-.58],[.88,.28,.58]]){
   cyl([p[0],.20,p[2]],[.25,.25,.25],'#a97b58',court);
   ball([p[0],.49,p[2]],[.31,.25,.31],'#759451',court);
  }

  // Rebuild one clean pasture service point after removing scattered trough/hay props.
  const service=group([3.65,.23,-4.05]);
  box([0,.30,0],[1.65,.38,.68],'#9b8160',service);
  box([0,.52,0],[1.40,.045,.48],'#75adae',service);
  for(const x of [-1.15,1.12]){
   cyl([x,.34,.05],[.34,.56,.34],'#c4a84d',service,[0,0,Math.PI/2]);
   box([x,.34,.08],[.55,.48,.055],'#92763d',service);
  }

  const homeYard=group([-6.45,.23,-6.0]);
  box([0,.27,0],[1.25,.10,.55],'#9a7650',homeYard);
  for(const x of [-.52,.52])box([x,.54,0],[.09,.62,.09],'#7a6047',homeYard);
  box([0,.70,0],[1.18,.08,.10],'#7a6047',homeYard);
  const wash=cyl([1.0,.28,.15],[.24,.36,.24],'#78908a',homeYard);wash.fx=[8,0,0,0];
  for(let i=0;i<3;i++)ball([-1.05+i*.30,.25,.05],[.14,.12,.14],i===1?'#d0b069':'#b88b65',homeYard);

  const sign=group([.75,.23,4.4]);
  box([0,.70,0],[.10,1.35,.10],'#7d6047',sign);
  box([0,1.14,0],[1.35,.52,.12],'#c7b58c',sign,[0,.08,0]);
  box([0,1.14,.07],[1.12,.055,.03],'#7e8f68',sign,[0,.08,0]);

  // NPC traffic follows the redesigned circulation and never crosses the crop beds.
  const routes={
   elena:[[-8.0,-5.65],[-6.4,-5.35],[-4.25,-5.05],[-3.75,-4.55],[-3.75,-2.9],[-3.75,-4.55],[-6.0,-5.3]],
   mia:[[-7.7,5.75],[-6.15,5.35],[-5.35,5.75],[-3.75,5.2],[-3.75,3.95],[-3.75,5.2],[-6.1,5.35]],
   fedor:[[-8.15,.55],[-7.6,1.65],[-6.8,2.85],[-6.15,4.4],[-5.35,5.15],[-6.15,4.4],[-7.4,2.45]],
   lea:[[8.0,4.95],[6.9,4.2],[5.65,3.2],[4.05,3.2],[2.25,3.45],[4.05,3.2],[6.55,4.0]]
  };
  for(const v of art.villagers||[]){
   const route=routes[v.id];if(!route)continue;
   v.route=route.map(p=>[...p]);v.routeIndex=0;v.target=[...route[1]];v.wait=.5;
   v.g.p[0]=route[0][0];v.g.p[2]=route[0][1];
  }
  if(art.livingWorld?.villagerRoutes){
   for(const [id,route] of Object.entries(routes))art.livingWorld.villagerRoutes[id]=route.map(p=>[...p]);
  }

  art.marketPoint=[-8.0,2.0,5.95];
  art.orderBoardPoint=[-5.35,2.45,5.85];
  art.troughPoint=[3.65,.8,-4.05];

  art.layoutWorld={
   moved,removedLoose,routes,plotCenters,
   districts:{homes:[-9.0,-4.55,-6.15,-7.15],market:[-8.0,-5.35,5.95,5.85],utility:[-8.55,.45],livestock:[3.65,8.15,-4.05,5.15]},
   anchors:{market:[...art.marketPoint],orders:[...art.orderBoardPoint],trough:[...art.troughPoint]},
   inspect(){return {moved:{...moved},removedLoose,plotCenters:plotCenters.map(p=>[...p]),routes:Object.fromEntries(Object.entries(routes).map(([k,v])=>[k,v.map(p=>[...p])])),anchors:{market:[...art.marketPoint],orders:[...art.orderBoardPoint],trough:[...art.troughPoint]}};}
  };
  return art;
 }};
}
