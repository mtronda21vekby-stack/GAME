/* Screen-space picking: match the raised visible soil, not an unrelated ground plane. */
'use strict';
const FarmPick=(()=>{
 function inside(point,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
 function edgeDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
 function plotAt(renderer,models,x,y,padding=4){
  renderer.cameraVP();const p={x,y};let best=null;
  for(const m of models){const corners=[[-.91,-.91],[.91,-.91],[.91,.91],[-.91,.91]].map(([dx,dz])=>renderer.project([m.x+dx,m.surface??.475,m.z+dz]));
   if(corners.every(c=>c.z<-1||c.z>1))continue;
   const hit=inside(p,corners),distance=hit?0:Math.min(...corners.map((a,i)=>edgeDistance(p,a,corners[(i+1)%4])));
   if(distance>padding)continue;const center=renderer.project([m.x,m.surface??.475,m.z]),score=(hit?0:10000)+distance*100+Math.hypot(x-center.x,y-center.y);
   if(!best||score<best.score)best={id:m.id,score};
  }return best?.id??null;
 }
 return {inside,edgeDistance,plotAt};
})();
if(typeof module!=='undefined')module.exports=FarmPick;
