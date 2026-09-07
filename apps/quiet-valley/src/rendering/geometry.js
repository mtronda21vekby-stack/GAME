import {TAU,norm} from './math.js';
 function geometry(type){const out=[];function vert(p,n){out.push(...p,...n);}function tri(a,b,c,na,nb=na,nc=na){vert(a,na);vert(b,nb);vert(c,nc);}
  if(type==='bevelBox'){
   const a=.5,b=.445;
   for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
    const u=(axis+1)%3,v=(axis+2)%3,n=[0,0,0];n[axis]=sign;
    const points=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([su,sv])=>{const p=[0,0,0];p[axis]=sign*a;p[u]=su*b;p[v]=sv*b;return p;});
    tri(points[0],points[1],points[2],n);tri(points[0],points[2],points[3],n);
   }
   for(let x=0;x<3;x++)for(let y=x+1;y<3;y++)for(const sx of [-1,1])for(const sy of [-1,1]){
    const z=3-x-y,n=[0,0,0];n[x]=sx;n[y]=sy;
    const p=(hi,t)=>{const r=[0,0,0];r[x]=sx*(hi?a:b);r[y]=sy*(hi?b:a);r[z]=t*b;return r;};
    tri(p(true,-1),p(true,1),p(false,1),norm(n));tri(p(true,-1),p(false,1),p(false,-1),norm(n));
   }
   for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])tri([x*a,y*b,z*b],[x*b,y*a,z*b],[x*b,y*b,z*a],norm([x,y,z]));
  }else if(type==='blade'){
   tri([-.06,0,0],[.06,0,0],[.015,.65,.04],[0,0,1]);
   tri([.06,0,0],[-.06,0,0],[.015,.65,.04],[0,0,-1]);
  } else if(type==='box'){
   const faces=[[[1,0,0],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]], [[-1,0,0],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]], [[0,1,0],[-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5]],[[0,-1,0],[-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]],[[0,0,1],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]], [[0,0,-1],[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]];
   for(const [n,a,b,c,d] of faces){tri(a,b,c,n);tri(a,c,d,n);}
  } else if(type==='sphere'){
   const nx=12,ny=8;const at=(a,b)=>[Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)];
   for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    let a=at(i/nx*TAU,j/ny*Math.PI),b=at((i+1)/nx*TAU,j/ny*Math.PI),c=at((i+1)/nx*TAU,(j+1)/ny*Math.PI),d=at(i/nx*TAU,(j+1)/ny*Math.PI);
    tri(a,b,c,a,b,c);tri(a,c,d,a,c,d);
   }
  } else if(type==='cylinder'||type==='cone'){
   const top=type==='cone'?0:1,N=16;
   for(let i=0;i<N;i++){
    let a=i/N*TAU,b=(i+1)/N*TAU;
    const pa=[Math.cos(a),-.5,Math.sin(a)],pb=[Math.cos(b),-.5,Math.sin(b)],pc=[top*Math.cos(b),.5,top*Math.sin(b)],pd=[top*Math.cos(a),.5,top*Math.sin(a)];
    let na=norm([Math.cos(a),1-top,Math.sin(a)]),nb=norm([Math.cos(b),1-top,Math.sin(b)]);
    tri(pa,pd,pc,na,na,nb);tri(pa,pc,pb,na,nb,nb);tri([0,-.5,0],pa,pb,[0,-1,0]);if(top)tri([0,.5,0],pc,pd,[0,1,0]);
   }
  } else if(type==='ring'){
   const N=40,pt=(i,r)=>[Math.cos(i/N*TAU)*r,0,Math.sin(i/N*TAU)*r];
   for(let i=0;i<N;i++){let a=pt(i,.87),b=pt(i+1,.87),c=pt(i+1,1),d=pt(i,1);tri(a,c,d,[0,1,0]);tri(a,b,c,[0,1,0]);}
  } else if(type==='river'||type==='riverbank'){
   const N=64,W=10,center=z=>.18*Math.sin(z*3.);
   if(type==='river')for(let j=0;j<N;j++)for(let i=0;i<W;i++){
    const za=j/N*2-1,zb=(j+1)/N*2-1,xa=i/W*2-1,xb=(i+1)/W*2-1;
    const a=[xa+center(za),0,za],b=[xb+center(za),0,za],c=[xb+center(zb),0,zb],d=[xa+center(zb),0,zb];tri(a,d,c,[0,1,0]);tri(a,c,b,[0,1,0]);
   }
   else for(let side of [-1,1])for(let j=0;j<N;j++){
    const za=j/N*2-1,zb=(j+1)/N*2-1;
    const a=[side+center(za),0,za],b=[side*1.20+center(za),0,za],c=[side*1.20+center(zb),0,zb],d=[side+center(zb),0,zb];tri(a,d,c,[0,1,0]);tri(a,c,b,[0,1,0]);
   }
  } else if(type==='water'){
   const N=64, rings=12;
   const pt=(i,j)=>{const a=i/N*TAU,r=j/rings;return [Math.cos(a)*r*(1+.02*Math.sin(a*5)),0,Math.sin(a)*r*(1+.03*Math.sin(a*3))];};
   for(let j=0;j<rings;j++)for(let i=0;i<N;i++){let a=pt(i,j),b=pt(i+1,j),c=pt(i+1,j+1),d=pt(i,j+1);tri(a,d,c,[0,1,0]);if(j)tri(a,c,b,[0,1,0]);}
  } else if(type==='island'){
   const N=80;const pt=(i,y,s)=>{let a=i/N*TAU;return [Math.cos(a)*s*(1+.02*Math.sin(a*5)),y,Math.sin(a)*s*(1+.03*Math.sin(a*3))];};
   for(let i=0;i<N;i++){const a=pt(i,.5,1),b=pt(i+1,.5,1),c=pt(i,-.5,.965),d=pt(i+1,-.5,.965);tri([0,.5,0],b,a,[0,1,0]);let na=norm([a[0],.04,a[2]]),nb=norm([b[0],.04,b[2]]);tri(a,b,d,na,nb,nb);tri(a,d,c,na,nb,na);}
  }
  return new Float32Array(out);
 }

export {geometry};
