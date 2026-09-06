/* Quiet Valley — small, dependency-free WebGL2 renderer. Original source. */
'use strict';
const F = (() => {
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
 function geometry(type){const out=[];function vert(p,n){out.push(...p,...n);}function tri(a,b,c,na,nb=na,nc=na){vert(a,na);vert(b,nb);vert(c,nc);}
  if(type==='box'){
   const faces=[[[1,0,0],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]], [[-1,0,0],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]], [[0,1,0],[-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5]],[[0,-1,0],[-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]],[[0,0,1],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]], [[0,0,-1],[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5]]];
   for(const [n,a,b,c,d] of faces){tri(a,b,c,n);tri(a,c,d,n);}
  } else if(type==='sphere'){
   const nx=16,ny=10;const at=(a,b)=>[Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)];
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
 // Material IDs: 0 matte, 1 pond, 2 foliage, 3 soil, 4 meadow, 5 window, 6 water spray.
 const vertex=`#version 300 es
 precision highp float;
 layout(location=0) in vec3 aP;layout(location=1) in vec3 aN;
 layout(location=2) in mat4 aM;layout(location=6) in vec3 aC;layout(location=7) in vec4 aFX;
 uniform mat4 uVP,uLight;uniform float uTime,uMotion;
 out vec3 vN,vC,vP,vLocal;out vec4 vS;flat out vec4 vFX;
 void main(){
  vec4 world=aM*vec4(aP,1.);vec3 n=normalize(transpose(inverse(mat3(aM)))*aN);
  if(aFX.x>1.5&&aFX.x<2.5){
   float wind=sin(world.x*1.43+world.z*.83+uTime*1.35+aFX.w)*.65+sin(world.z*2.4-uTime*2.2)*.35;
   float bend=clamp(aP.y+.7,0.,1.4)*aFX.z*.08*uMotion;
   world.x+=wind*bend;world.z+=wind*bend*.35;n=normalize(n+vec3(wind*bend*.7,0.,wind*bend*.3));
  }
  if(aFX.x>.5&&aFX.x<1.5){
   float edge=aFX.y>.5?abs(aP.x-.18*sin(aP.z*3.)):length(aP.xz);float bank=1.-smoothstep(.75,1.,edge);
   world.y+=(sin(world.x*2.7+uTime*.9)*.025+sin(world.z*4.2-uTime*1.1)*.018)*bank*uMotion;
  }
  vP=world.xyz;vLocal=aP;vN=n;vC=aC;vFX=aFX;vS=uLight*world;gl_Position=uVP*world;
 }`;
 const frag=`#version 300 es
 precision highp float;
 in vec3 vN,vC,vP,vLocal;in vec4 vS;flat in vec4 vFX;out vec4 outColor;
 uniform highp sampler2D uShadow;uniform vec3 uSun,uEye;
 uniform float uDay,uAlpha,uShadowEnabled,uShadowTexel,uTime,uQuality,uMotion;
 float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1)),f.x),f.y);}
 float compareDepth(vec3 s,vec2 offset,float bias){return s.z-bias>texture(uShadow,s.xy+offset*uShadowTexel).r?.30:1.;}
 float shadow(vec3 n){
  if(uShadowEnabled<.5)return 1.;vec3 s=vS.xyz/vS.w*.5+.5;
  if(any(lessThan(s,vec3(0)))||any(greaterThan(s,vec3(1))))return 1.;
  float bias=max(.0010*(1.-max(dot(n,uSun),0.)),.0005);
  if(uQuality<.5)return compareDepth(s,vec2(0),bias);
  if(uQuality<1.5)return (compareDepth(s,vec2(-.65,-.65),bias)+compareDepth(s,vec2(.65,-.65),bias)+compareDepth(s,vec2(-.65,.65),bias)+compareDepth(s,vec2(.65,.65),bias))*.25;
  float sum=0.;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)sum+=compareDepth(s,vec2(float(x),float(y))*1.25,bias);return sum/9.;
 }
 vec3 tonemap(vec3 c){c=(c*(2.51*c+.03))/(c*(2.43*c+.59)+.14);return pow(clamp(c,0.,1.),vec3(1./2.2));}
 void main(){
  vec3 n=normalize(vN),viewDir=normalize(uEye-vP);float material=vFX.x;
  vec3 base=vC;float shine=0.,alpha=uAlpha;
  float sh=shadow(n);float daylight=clamp(uDay,0.,1.);float clock=uTime*uMotion;
  if(material>.5&&material<1.5){
   // Analytic wave normal, procedural caustics and sky Fresnel (not SSR).
   vec2 w=vP.xz;float radius=vFX.y>.5?abs(vLocal.x-.18*sin(vLocal.z*3.)):length(vLocal.xz);
   n=normalize(vec3(-.13*cos(w.x*2.7+clock*.9)-.055*cos((w.x+w.y)*5.-clock*.8),1.,-.13*cos(w.y*4.2-clock*1.1)-.055*cos((w.x+w.y)*5.-clock*.8)));
   float fresnel=.05+.80*pow(1.-max(dot(n,viewDir),0.),3.);
   vec3 deep=vec3(.045,.235,.255),shallow=vec3(.23,.53,.42);
   base=mix(deep,shallow,smoothstep(.30,.95,radius));
   float ripple=.5+.5*sin(w.x*4.1+sin(w.y*3.4+clock*.65)*1.8-clock*.7);
   float caustic=pow(ripple,8.)*(.5+.5*sin(w.y*6.1-w.x*2.7+clock*.8));
   base+=vec3(.075,.105,.065)*caustic;
   vec3 sky=mix(vec3(.23,.39,.49),vec3(.61,.77,.75),clamp(n.y,0.,1.));
   base=mix(base,sky,fresnel);
   float shore=smoothstep(.928,.991,radius)*(1.-smoothstep(1.015,1.05,radius));
   base=mix(base,vec3(.72,.83,.62),shore*(.44+.16*sin(radius*95.-clock*1.8)));
   float sunGlint=pow(max(dot(n,normalize(uSun+viewDir)),0.),100.);
   shine=(sunGlint*.92+caustic*.055)*daylight;
  } else if(material>2.5&&material<3.5){
   float grain=noise2(vP.xz*22.);base*=.86+grain*.23;
   float wet=clamp(vFX.y,0.,1.);base=mix(base,base*vec3(.40,.48,.49),wet);
   shine=wet*pow(max(dot(n,normalize(uSun+viewDir)),0.),32.)*.23*daylight;
   // Fine droplets catch the sun on freshly watered ridges.
   shine+=wet*smoothstep(.83,.96,grain)*pow(max(dot(n,normalize(uSun+viewDir)),0.),8.)*.025;
  } else if(material>3.5&&material<4.5){
   float patches=noise2(vP.xz*.52)*.65+noise2(vP.xz*2.3)*.35;
   base*=mix(.78,1.13,patches);base=mix(base,base*vec3(1.04,1.08,.86),noise2(vP.xz*17.)*.13);
  } else if(material>1.5&&material<2.5){base*=.94+.06*sin(vP.y*3.+vP.x);}
  float lambert=max(dot(n,uSun),0.);
  vec3 hemi=mix(vec3(.24,.27,.17),vec3(.53,.64,.73),clamp(n.y*.5+.5,0.,1.));
  vec3 light=hemi*.61+vec3(1.,.88,.65)*lambert*sh*.92;
  if(material>1.5&&material<2.5)light+=vec3(.24,.32,.12)*pow(max(dot(-uSun,viewDir),0.),2.)*.32;
  light=mix(vec3(.13,.19,.30)+light*.22,light,daylight);
  vec3 c=base*light+vec3(1.,.92,.76)*shine*sh;
  if(material>4.5&&material<5.5)c+=vec3(1.2,.66,.18)*(1.-daylight)*1.7;
  if(material>5.5){c=base*(.9+daylight*.35)+vec3(.14,.24,.28);}
  float fog=smoothstep(26.,75.,length(vP.xz));c=mix(c,vec3(.70,.76,.62),fog*.65);
  outColor=vec4(tonemap(c),alpha);
 }`;
 const depthFrag=`#version 300 es
 precision highp float;void main(){}`;
 const screenVertex=`#version 300 es
 precision highp float;out vec2 vUV;
 void main(){vUV=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(vUV*2.-1.,0.,1.);}`;
 const screenFrag=`#version 300 es
 precision highp float;in vec2 vUV;out vec4 outColor;
 uniform highp sampler2D uScene;uniform vec2 uPixel;
 vec3 bright(vec2 uv){vec4 c=texture(uScene,uv);float l=dot(c.rgb,vec3(.2126,.7152,.0722));return c.rgb*smoothstep(.72,.98,l)*c.a;}
 void main(){vec4 c=texture(uScene,vUV);
  // Small edge-aware resolve keeps the offscreen high-quality pass from adding stair steps.
  vec4 north=texture(uScene,vUV+vec2(0.,uPixel.y)),south=texture(uScene,vUV-vec2(0.,uPixel.y));
  vec4 east=texture(uScene,vUV+vec2(uPixel.x,0.)),west=texture(uScene,vUV-vec2(uPixel.x,0.));
  vec3 lum=vec3(.2126,.7152,.0722);float l=dot(c.rgb,lum);
  float contrast=max(max(abs(dot(north.rgb,lum)-l),abs(dot(south.rgb,lum)-l)),max(abs(dot(east.rgb,lum)-l),abs(dot(west.rgb,lum)-l)));
  c=mix(c,(c*4.+north+south+east+west)/8.,smoothstep(.10,.28,contrast)*.60);
  vec3 b=vec3(0.);
  b+=bright(vUV+uPixel*vec2(3.,0.));b+=bright(vUV-uPixel*vec2(3.,0.));b+=bright(vUV+uPixel*vec2(0.,3.));b+=bright(vUV-uPixel*vec2(0.,3.));
  b+=bright(vUV+uPixel*vec2(5.,5.));b+=bright(vUV+uPixel*vec2(-5.,5.));b+=bright(vUV+uPixel*vec2(5.,-5.));b+=bright(vUV-uPixel*vec2(5.,5.));
  c.rgb+=b*.0125*c.a;float vignette=1.-smoothstep(.38,.82,length(vUV-.5))*.065;c.rgb*=vignette;outColor=c;
 }`;
 const QUALITY={low:{label:'Экономный',shadow:1024,dpr:1,post:false,pcf:0,interval:5},balanced:{label:'Сбалансированный',shadow:1024,dpr:1.25,post:false,pcf:1,interval:3},high:{label:'Красиво',shadow:2048,dpr:1.75,post:true,pcf:2,interval:2}};
 class Renderer{
  constructor(canvas){
   this.canvas=canvas;const gl=this.gl=canvas.getContext('webgl2',{alpha:true,antialias:true,preserveDrawingBuffer:false,powerPreference:'default'});
   if(!gl)throw new Error('WebGL 2 недоступен. Откройте игру в Safari или Chrome с аппаратным ускорением.');
   this.program=this.compile(vertex,frag);this.depth=this.compile(vertex,depthFrag);
   this.warnings=[];try{this.post=this.compile(screenVertex,screenFrag);}catch(e){this.post=null;this.warnings.push('Постобработка отключена: '+e.message);}
   this.uniforms=new Map();this.batches=new Map();this.meshes=[];this.day=1;this.time=0;this.frameCount=0;
   this.motion=matchMedia('(prefers-reduced-motion: reduce)').matches?0:1;
   this.sun=norm([-12,22,8]);this.light=mm(ortho(-24,24,-24,24,1,95),look(mul(this.sun,42),[0,0,0]));
   this.shadow=gl.createTexture();this.fb=gl.createFramebuffer();this.screenVAO=gl.createVertexArray();
   this.camera={yaw:.58,pitch:.79,size:16.4,target:[0,0,-.1]};
   let setting;try{setting=localStorage.getItem('quiet-valley.graphics.v2');}catch(_){}
   this.setQuality(Object.hasOwn(QUALITY,setting)?setting:'balanced',false);
   gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
  }
  compile(v,f){const gl=this.gl,p=gl.createProgram(),shaders=[];try{for(const [kind,src] of [[gl.VERTEX_SHADER,v],[gl.FRAGMENT_SHADER,f]]){const s=gl.createShader(kind);shaders.push(s);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}catch(e){gl.deleteProgram(p);throw e;}finally{shaders.forEach(s=>gl.deleteShader(s));}}
  locations(program){if(!this.uniforms.has(program)){let out={};for(const key of ['uVP','uLight','uTime','uMotion','uSun','uEye','uDay','uAlpha','uShadow','uShadowTexel','uShadowEnabled','uQuality','uScene','uPixel'])out[key]=this.gl.getUniformLocation(program,key);this.uniforms.set(program,out);}return this.uniforms.get(program);}
  setQuality(name,persist=true){
   if(!Object.hasOwn(QUALITY,name))return;this.quality=name;this.settings=QUALITY[name];const gl=this.gl,size=Math.min(this.settings.shadow,gl.getParameter(gl.MAX_TEXTURE_SIZE));
   this.shadowSize=size;gl.bindTexture(gl.TEXTURE_2D,this.shadow);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,size,size,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.bindFramebuffer(gl.FRAMEBUFFER,this.fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,this.shadow,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
   this.shadowOK=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;gl.bindFramebuffer(gl.FRAMEBUFFER,null);this.frameCount=0;this.resize();
   if(persist)try{localStorage.setItem('quiet-valley.graphics.v2',name);}catch(_){}
  }
  batch(type,alpha=1){
   const key=type+':'+alpha;if(this.batches.has(key))return this.batches.get(key);const gl=this.gl,geo=geometry(type),vao=gl.createVertexArray();gl.bindVertexArray(vao);
   const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,geo,gl.STATIC_DRAW);
   for(let i=0;i<2;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,24,i*12);}
   const ib=gl.createBuffer(),stride=23*4;gl.bindBuffer(gl.ARRAY_BUFFER,ib);
   for(let i=0;i<4;i++){gl.enableVertexAttribArray(2+i);gl.vertexAttribPointer(2+i,4,gl.FLOAT,false,stride,i*16);gl.vertexAttribDivisor(2+i,1);}
   gl.enableVertexAttribArray(6);gl.vertexAttribPointer(6,3,gl.FLOAT,false,stride,64);gl.vertexAttribDivisor(6,1);
   gl.enableVertexAttribArray(7);gl.vertexAttribPointer(7,4,gl.FLOAT,false,stride,76);gl.vertexAttribDivisor(7,1);
   const b={type,alpha,vao,ib,count:geo.length/6,nodes:[],data:new Float32Array(0)};this.batches.set(key,b);this.sortedBatches=[...this.batches.values()].sort((a,b)=>b.alpha-a.alpha);return b;
  }
  add(type,p,s,color,rot=[0,0,0],parent=null,alpha=1){const n={p:[...p],s:[...s],r:[...rot],c:rgb(color),fx:[0,0,0,0],parent,visible:true,m:ident()};this.batch(type,alpha).nodes.push(n);this.meshes.push(n);return n;}
  group(p=[0,0,0],s=[1,1,1],r=[0,0,0],parent=null){return {p,s,r,parent,m:ident(),isGroup:true,visible:true};}
  matrix(n){if(n.stamp===this.stamp)return n.m;n.m=trs(n.p,n.s,n.r);if(n.parent)n.m=mm(this.matrix(n.parent),n.m);n.stamp=this.stamp;return n.m;}
  visible(n){if(n.visible===false)return false;return n.parent?this.visible(n.parent):true;}
  update(){this.stamp=(this.stamp||0)+1;const gl=this.gl;for(const b of this.batches.values()){const count=b.nodes.length;if(b.data.length<count*23)b.data=new Float32Array(count*23);let k=0;for(const n of b.nodes){if(!this.visible(n))continue;b.data.set(this.matrix(n),k*23);b.data.set(n.c,k*23+16);b.data.set(n.fx,k*23+19);k++;}b.instances=k;gl.bindBuffer(gl.ARRAY_BUFFER,b.ib);gl.bufferData(gl.ARRAY_BUFFER,b.data.subarray(0,k*23),gl.DYNAMIC_DRAW);}}
  resize(){
   const gl=this.gl,d=Math.min(devicePixelRatio||1,this.settings.dpr),bounds=this.canvas.getBoundingClientRect();this.w=Math.max(1,bounds.width);this.h=Math.max(1,bounds.height);
   this.canvas.width=Math.max(1,Math.round(this.w*d));this.canvas.height=Math.max(1,Math.round(this.h*d));
   if(this.sceneFB){gl.deleteFramebuffer(this.sceneFB);gl.deleteTexture(this.sceneTex);gl.deleteRenderbuffer(this.sceneDepth);this.sceneFB=null;}
   this.postOK=false;
   if(this.settings.post&&this.post){
    const w=this.canvas.width,h=this.canvas.height;this.sceneTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.sceneTex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    this.sceneDepth=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,this.sceneDepth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);this.sceneFB=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this.sceneFB);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.sceneTex,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,this.sceneDepth);this.postOK=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;gl.bindFramebuffer(gl.FRAMEBUFFER,null);
   }
   this.frameCount=0;
  }
  cameraVP(){const c=this.camera,off=[Math.sin(c.yaw)*Math.cos(c.pitch)*42,Math.sin(c.pitch)*42,Math.cos(c.yaw)*Math.cos(c.pitch)*42];this.eye=add(c.target,off);this.view=look(this.eye,c.target);this.vp=mm(ortho(-c.size*this.w/this.h,c.size*this.w/this.h,-c.size,c.size,.1,120),this.view);return this.vp;}
  project(p){if(!this.vp)this.cameraVP();const q=transform(this.vp,p);return {x:(q[0]/q[3]*.5+.5)*this.w,y:(1-(q[1]/q[3]*.5+.5))*this.h,z:q[2]/q[3]};}
  ground(x,y,height=.47){const c=this.camera,z=norm(sub(this.eye,c.target)),right=norm(cross([0,1,0],z)),up=cross(z,right),nx=(x/this.w*2-1)*c.size*this.w/this.h,ny=(1-y/this.h*2)*c.size;const pos=add(add(this.eye,mul(right,nx)),mul(up,ny)),dir=mul(z,-1),t=(height-pos[1])/dir[1];return add(pos,mul(dir,t));}
  draw(time=this.time){
   this.time=time;const gl=this.gl;this.update();this.cameraVP();gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
   const render=(program,depth)=>{
    const u=this.locations(program);gl.useProgram(program);gl.uniformMatrix4fv(u.uVP,false,depth?this.light:this.vp);gl.uniformMatrix4fv(u.uLight,false,this.light);gl.uniform1f(u.uTime,this.time);gl.uniform1f(u.uMotion,this.motion);
    if(!depth){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.shadow);gl.uniform1i(u.uShadow,0);gl.uniform3fv(u.uSun,this.sun);gl.uniform3fv(u.uEye,this.eye);gl.uniform1f(u.uDay,this.day);gl.uniform1f(u.uShadowEnabled,this.shadowOK?1:0);gl.uniform1f(u.uShadowTexel,1/this.shadowSize);gl.uniform1f(u.uQuality,this.settings.pcf);}
    for(const b of this.sortedBatches){if(depth&&b.alpha<1)continue;if(!b.instances)continue;
     if(!depth){gl.uniform1f(u.uAlpha,b.alpha);if(b.alpha<1){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);}else{gl.disable(gl.BLEND);gl.depthMask(true);}}
     gl.bindVertexArray(b.vao);gl.drawArraysInstanced(gl.TRIANGLES,0,b.count,b.instances);
    }gl.depthMask(true);
   };
   if(this.shadowOK&&this.frameCount++%this.settings.interval===0){gl.bindFramebuffer(gl.FRAMEBUFFER,this.fb);gl.viewport(0,0,this.shadowSize,this.shadowSize);gl.disable(gl.BLEND);gl.clear(gl.DEPTH_BUFFER_BIT);render(this.depth,true);}
   gl.bindFramebuffer(gl.FRAMEBUFFER,this.postOK?this.sceneFB:null);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);render(this.program,false);
   if(this.postOK){gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.useProgram(this.post);const u=this.locations(this.post);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.sceneTex);gl.uniform1i(u.uScene,0);gl.uniform2f(u.uPixel,1/this.canvas.width,1/this.canvas.height);gl.bindVertexArray(this.screenVAO);gl.drawArrays(gl.TRIANGLES,0,3);}
  }
 }
 return {Renderer,QUALITY,v,add,sub,mul,dot,cross,norm,mm,trs,rgb,TAU};
})();
