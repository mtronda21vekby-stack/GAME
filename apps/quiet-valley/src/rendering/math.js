
 const TAU=Math.PI*2;
 const v=(x=0,y=0,z=0)=>[x,y,z];
 const add=(a,b)=>a.map((n,i)=>n+b[i]);
 const sub=(a,b)=>a.map((n,i)=>n-b[i]);
 const mul=(a,s)=>a.map(n=>n*s);
 const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const norm=a=>mul(a,1/(Math.hypot(...a)||1));
 const ident=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
 function mm(a,b){let o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
 function trs(p=[0,0,0],s=[1,1,1],r=[0,0,0]){
  const [x,y,z]=r, cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);
  return new Float32Array([(cy*cz)*s[0],(cx*sz+sx*sy*cz)*s[0],(sx*sz-cx*sy*cz)*s[0],0,
   (-cy*sz)*s[1],(cx*cz-sx*sy*sz)*s[1],(sx*cz+cx*sy*sz)*s[1],0,
   sy*s[2],-sx*cy*s[2],cx*cy*s[2],0,...p,1]);
 }
 function look(eye,target){const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
 function ortho(l,r,b,t,n,f){return new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]);}
 function transform(m,p){let a=[...p,1];return [0,1,2,3].map(r=>a.reduce((s,q,k)=>s+m[k*4+r]*q,0));}
 function rgb(hex){if(Array.isArray(hex))return hex;hex=hex.replace('#','');return [0,2,4].map(i=>Math.pow(parseInt(hex.slice(i,i+2),16)/255,2.2));}

export {TAU,v,add,sub,mul,dot,cross,norm,ident,mm,trs,look,ortho,transform,rgb};
