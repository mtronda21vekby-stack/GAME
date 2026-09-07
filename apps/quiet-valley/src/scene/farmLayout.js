/* Curated spatial pass for the home farm.
 * Reuses authored assets but moves them into readable functional districts,
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

  // Functional zoning: homes south-west, market north-west, utilities west,
  // livestock east. Crop plots and the central lane remain the visual/gameplay core.
  const moved={
   farmhouse:moveRoot([-6.5,-6.8],[-8.35,-6.45]),
   cottage:moveRoot([-1.15,-7.85],[-4.75,-7.35]),
   windmill:moveRoot([-10,-3.65],[-7.85,1.25]),
   market:moveRoot([-5.2,7.1],[-7.05,6.55]),
   orderBoard:moveRoot([-2.55,6.75],[-4.45,6.45]),
   wagon:moveRoot([-8.5,6.7],[-9.25,5.35]),
   coop:moveRoot([8.2,4.4],[8.0,5.0]),
   feedYard:moveRoot([7.55,-4.45],[7.15,-4.15]),
   workYard:moveRoot([-4.15,5.55],[-5.15,5.25]),
   gardenTools:moveRoot([-.85,-4.32],[-3.35,-5.15])
  };

  // Remove duplicated loose legacy props now superseded by the living-farm clusters.
  // Only top-level meshes are touched; articulated models and grouped authored assets stay intact.
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

  // Continuous secondary paths make the zoning readable from the default isometric camera.
  const path=(a,b,step=.72)=>{
   const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),n=Math.max(1,Math.ceil(len/step));
   for(let i=0;i<=n;i++){
    const f=i/n,x=a[0]+dx*f,z=a[1]+dz*f;
    add('island',[x,.305,z],[.46+(i%3)*.03,.065,.30],'#d4bf99',[0,Math.atan2(dx,dz),0]);
   }
  };
  path([.6,-5.0],[-4.45,-5.0]);          // garden/home spur
  path([-4.45,-5.0],[-7.6,-5.8]);       // farmhouse approach
  path([-.2,4.8],[-4.3,5.8]);           // market approach
  path([1.45,3.25],[5.7,3.25]);         // livestock service lane
  path([5.7,3.25],[7.8,4.35]);          // coop spur

  // Rebuild one clean pasture service point after removing the old scattered trough/hay props.
  const service=group([3.65,.23,-4.05]);
  box([0,.30,0],[1.65,.38,.68],'#9b8160',service);
  box([0,.52,0],[1.40,.045,.48],'#75adae',service);
  for(const x of [-1.15,1.12]){
   cyl([x,.34,.05],[.34,.56,.34],'#c4a84d',service,[0,0,Math.PI/2]);
   box([x,.34,.08],[.55,.48,.055],'#92763d',service);
  }

  // Small, deliberate social/working anchors instead of random filler.
  const homeYard=group([-6.15,.23,-6.0]);
  box([0,.27,0],[1.25,.10,.55],'#9a7650',homeYard);
  for(const x of [-.52,.52])box([x,.54,0],[.09,.62,.09],'#7a6047',homeYard);
  box([0,.70,0],[1.18,.08,.10],'#7a6047',homeYard);
  const wash=cyl([1.0,.28,.15],[.24,.36,.24],'#78908a',homeYard);wash.fx=[8,0,0,0];
  for(let i=0;i<3;i++)ball([-1.05+i*.30,.25,.05],[.14,.12,.14],i===1?'#d0b069':'#b88b65',homeYard);

  const sign=group([.85,.23,4.45]);
  box([0,.70,0],[.10,1.35,.10],'#7d6047',sign);
  box([0,1.14,0],[1.35,.52,.12],'#c7b58c',sign,[0,.08,0]);
  box([0,1.14,.07],[1.12,.055,.03],'#7e8f68',sign,[0,.08,0]);

  // Re-author villager traffic for the new districts. Routes intentionally follow paths
  // and stop at useful places rather than cutting through crop plots or animal fences.
  const routes={
   elena:[[-8.0,-5.75],[-6.25,-5.25],[-4.3,-5.0],[-3.2,-4.85],[-1.2,-4.75],[-3.2,-4.85],[-5.7,-5.2]],
   mia:[[-7.0,6.05],[-5.8,5.85],[-4.45,6.15],[-2.9,5.75],[-1.0,4.95],[-2.9,5.75],[-5.15,5.55]],
   fedor:[[-7.75,1.35],[-7.4,2.3],[-7.15,3.7],[-6.8,5.0],[-5.15,5.4],[-6.8,5.0],[-7.35,3.25]],
   lea:[[7.95,4.85],[6.9,4.2],[5.6,3.3],[3.8,3.3],[2.0,3.55],[3.8,3.3],[6.4,4.0]]
  };
  for(const v of art.villagers||[]){
   const route=routes[v.id];if(!route)continue;
   v.route=route.map(p=>[...p]);v.routeIndex=0;v.target=[...route[1]];v.wait=.5;
   v.g.p[0]=route[0][0];v.g.p[2]=route[0][1];
  }
  if(art.livingWorld?.villagerRoutes){
   for(const [id,route] of Object.entries(routes))art.livingWorld.villagerRoutes[id]=route.map(p=>[...p]);
  }

  // Picking/labels must follow the visual objects. Moving only meshes would leave invisible
  // interaction hotspots at the old positions and make the rearranged farm feel broken.
  art.marketPoint=[-7.05,2.0,6.55];
  art.orderBoardPoint=[-4.45,2.45,6.45];
  art.troughPoint=[3.65,.8,-4.05];

  art.layoutWorld={
   moved,removedLoose,routes,
   districts:{homes:[-8.35,-4.75,-6.45,-7.35],market:[-7.05,-4.45,6.55,6.45],utility:[-7.85,1.25],livestock:[3.65,8.0,-4.05,5.0]},
   anchors:{market:[...art.marketPoint],orders:[...art.orderBoardPoint],trough:[...art.troughPoint]},
   inspect(){return {moved:{...moved},removedLoose,routes:Object.fromEntries(Object.entries(routes).map(([k,v])=>[k,v.map(p=>[...p])])),anchors:{market:[...art.marketPoint],orders:[...art.orderBoardPoint],trough:[...art.troughPoint]}};}
  };
  return art;
 }};
}
