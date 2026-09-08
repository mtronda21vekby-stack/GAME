/* Quiet Valley v0.9.1 — Farm Layout Recovery.
 *
 * v0.9.0 attempted to relocate authored props and all sixteen crop beds by
 * proximity. That was unsafe: the crop footprints overlap neighbouring roots,
 * so unrelated meshes could be translated a second time. The result was the
 * broken, scattered farm visible in production.
 *
 * This recovery pass deliberately keeps the authored farm geometry in its
 * stable coordinates. We only provide deterministic interaction anchors and
 * NPC routes. Future layout work must move explicitly-owned groups, never
 * arbitrary meshes discovered by proximity.
 */
'use strict';
export function createFarmLayout(BaseFarmArt){
 return {make(R){
  const art=BaseFarmArt.make(R);

  // Crop beds stay in the authored 4x4 matrix from farm.js. Do not translate
  // their loose dirt/ridge meshes here; they are not grouped under one root.
  const plotCenters=(art.cropModels||[]).map(m=>[m.x,m.z]);

  // Keep major authored landmarks at the coordinates where their complete
  // model groups were created. This avoids half-moved houses, mills and stalls.
  const landmarks={
   farmhouse:[-6.5,-6.8],
   cottage:[-1.15,-7.85],
   windmill:[-10,-3.65],
   market:[-5.2,7.1],
   orderBoard:[-2.55,6.75],
   wagon:[-8.5,6.7],
   coop:[8.2,4.4],
   trough:[3.1,-3.75]
  };

  // Routes follow the existing visible lane and avoid crossing crop beds or
  // the livestock fence. They also remain inside the living-world bounds.
  const routes={
   elena:[[-6.2,-6.4],[-4.5,-5.5],[-2.3,-4.8],[.7,-4.8],[-1.5,-4.8],[-4.5,-5.5]],
   mia:[[-5.0,6.4],[-3.6,5.8],[-1.6,5.2],[.7,4.5],[-1.6,5.2],[-3.6,5.8]],
   fedor:[[-8.9,-3.5],[-8.2,-2.1],[-7.7,-.5],[-7.5,1.2],[-8.0,-.4],[-8.4,-2.0]],
   lea:[[7.9,4.0],[7.0,3.5],[5.8,3.1],[4.6,2.9],[5.8,3.1],[7.0,3.5]]
  };

  for(const v of art.villagers||[]){
   const route=routes[v.id];
   if(!route)continue;
   v.route=route.map(p=>[...p]);
   v.routeIndex=0;
   v.target=[...route[1]];
   v.wait=.5;
   v.g.p[0]=route[0][0];
   v.g.p[2]=route[0][1];
  }
  if(art.livingWorld?.villagerRoutes){
   for(const [id,route] of Object.entries(routes))
    art.livingWorld.villagerRoutes[id]=route.map(p=>[...p]);
  }

  // Interaction anchors match the visible authored props exactly.
  art.marketPoint=[landmarks.market[0],2.0,landmarks.market[1]];
  art.orderBoardPoint=[landmarks.orderBoard[0],2.45,landmarks.orderBoard[1]];
  art.troughPoint=[landmarks.trough[0],.8,landmarks.trough[1]];

  art.layoutWorld={
   recovery:true,
   plotCenters,
   landmarks,
   routes,
   anchors:{
    market:[...art.marketPoint],
    orders:[...art.orderBoardPoint],
    trough:[...art.troughPoint]
   },
   inspect(){
    return {
     recovery:true,
     plotCenters:plotCenters.map(p=>[...p]),
     landmarks:Object.fromEntries(Object.entries(landmarks).map(([k,v])=>[k,[...v]])),
     routes:Object.fromEntries(Object.entries(routes).map(([k,v])=>[k,v.map(p=>[...p])])),
     anchors:{market:[...art.marketPoint],orders:[...art.orderBoardPoint],trough:[...art.troughPoint]}
    };
   }
  };
  return art;
 }};
}
