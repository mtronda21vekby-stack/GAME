/* Bounded 3D watering VFX pool. Visual completion never controls simulation. */
'use strict';
const FarmWater=(()=>{
 function make(R){
  const slots=[];const reduced=R.motion===0;let serial=0;
  const add=(type,p,s,c,rot,g,alpha=1)=>R.add(type,p,s,c,rot||[0,0,0],g||null,alpha);
  for(let k=0;k<4;k++){
   const can=R.group([0,0,0]);can.visible=false;
   add('cylinder',[0,0,0],[.31,.53,.31],'#447c78',null,can);
   add('cylinder',[0,.27,0],[.33,.045,.33],'#b4d6b4',null,can);
   add('cylinder',[.39,.03,0],[.07,.78,.07],'#609b94',[0,0,-1.03],can);
   add('cylinder',[.77,.16,0],[.145,.08,.145],'#d4ddc3',[0,0,-1.1],can);
   add('cylinder',[-.36,.12,0],[.043,.57,.043],'#94b5a0',null,can);
   add('cylinder',[-.18,.39,0],[.045,.38,.045],'#94b5a0',[0,0,Math.PI/2],can);
   add('cylinder',[-.18,-.15,0],[.045,.38,.045],'#94b5a0',[0,0,Math.PI/2],can);
   const drops=Array.from({length:32},(_,i)=>{const n=add('sphere',[0,0,0],[.028,.080,.028],i%3?'#8cd5df':'#d3eff0',null,null,.88);n.fx=[6,0,0,0];n.visible=false;return n;});
   const rings=Array.from({length:3},()=>{const n=add('ring',[0,0,0],[.3,1,.3],'#84c8cb',null,null,.37);n.fx=[6,0,0,0];n.visible=false;return n;});
   slots.push({can,drops,rings,age:10,id:null,x:0,z:0,serial:0});
  }
  function start(id,x,z,groundY=0){let s=slots.find(s=>s.id===id&&s.age<2.35)||slots.find(s=>s.age>=2.35)||slots.reduce((a,b)=>a.age>b.age?a:b);s.id=id;s.groundY=groundY;s.x=x;s.z=z;s.age=0;s.serial=++serial;s.can.visible=true;return s;}
  function animate(dt){for(const s of slots){s.age+=dt;const life=reduced?.85:2.35;if(s.age>=life){s.can.visible=false;s.drops.forEach(n=>n.visible=false);s.rings.forEach(n=>n.visible=false);continue;}
   const enter=Math.min(1,s.age/.20),leave=Math.max(0,(s.age-1.75)/.60);
   s.can.p=[s.x-1.02,2.28+(s.groundY||0)+.18*(1-enter)+leave*.45,s.z+.17];s.can.r[2]=-.33+Math.sin(s.age*4)*.07;
   s.can.visible=s.age<1.95;
   s.drops.forEach((n,i)=>{if(reduced){n.visible=false;return;}
    const delay=i*.041,cycle=.64,t=(s.age-delay)%cycle;n.visible=s.age>=delay&&s.age<1.85+delay*.18&&t>=0;
    if(!n.visible)return;const a=t/cycle,theta=i*2.39996,spread=.12+(i%5)*.13;
    n.p=[s.x-.25+a*Math.cos(theta)*spread,2.25+(s.groundY||0)-1.74*a*a,s.z+.15+a*Math.sin(theta)*spread];
    n.s=[.026,.045+.07*a,.026];
    if(n.p[1]<.49+(s.groundY||0))n.visible=false;
   });
   s.rings.forEach((n,i)=>{const t=s.age-.35-i*.22;n.visible=!reduced&&t>0&&t<.88;if(n.visible){const r=.13+t*.79;n.p=[s.x+.18*Math.sin(i*3),.49+(s.groundY||0)+i*.006,s.z+.2*Math.cos(i*3)];n.s=[r,1,r*.83];}});
  }}
  return {start,animate,inspect:()=>({total:serial,active:slots.filter(s=>s.age<(reduced?.85:2.35)).map(s=>({id:s.id,age:s.age})),capacity:4})};
 }
 return {make};
})();
