import {TAU,v,add,sub,mul,dot,cross,norm,ident,mm,trs,look,ortho,transform,rgb} from './math.js';
import {geometry} from './geometry.js';
import {waitForGPUFrame} from './frameCompletion.js';
import vertex from './shaders/vertex.js';
import frag from './shaders/frag.js';
import depthFrag from './shaders/depthFrag.js';
import screenVertex from './shaders/screenVertex.js';
import screenFrag from './shaders/screenFrag.js';
import depthVertex from './shaders/depthVertex.js';
import shadowFragment from './shaders/shadowFragment.js';
 const QUALITY={low:{label:'Экономный',shadow:512,dpr:1,post:false,pcf:1,interval:6},balanced:{label:'Сбалансированный',shadow:1024,dpr:1.5,post:false,pcf:1,interval:3},high:{label:'Красиво',shadow:2048,dpr:1.75,post:true,pcf:2,interval:2}};
 class Renderer{
  constructor(canvas,{quality='balanced',motion=1,onQualityChange=()=>{}}={}){
   this.onQualityChange=onQualityChange;this.disposed=false;this.frameLifetime=new AbortController();
   this.canvas=canvas;const gl=this.gl=canvas.getContext('webgl2',{alpha:true,antialias:true,preserveDrawingBuffer:false,powerPreference:'default'});
   if(!gl)throw new Error('WebGL 2 недоступен. Откройте игру в Safari или Chrome с аппаратным ускорением.');
   this.glVersion=gl.getParameter(gl.VERSION);
   this.warnings=[];this.program=null;this.depth=null;this.post=null;this.drawStats={calls:0,triangles:0,instances:0};
   this.uniforms=new Map();this.batches=new Map();this.meshes=[];this.day=1;this.time=0;this.frameCount=0;
   this.motion=motion;this.rain=0;
   this.sun=norm([-12,22,8]);this.light=mm(ortho(-24,24,-24,24,1,95),look(mul(this.sun,42),[0,0,0]));
   this.shadow=gl.createTexture();this.fb=gl.createFramebuffer();this.screenVAO=gl.createVertexArray();
   this.camera={yaw:.58,pitch:.79,size:16.4,target:[0,0,-.1]};
   const setting=quality;
   this.initialQuality=Object.hasOwn(QUALITY,setting)?setting:'balanced';
   this.quality=this.initialQuality;this.settings=QUALITY[this.quality];
   gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
  }
  static async create(canvas,options){
   const renderer=new Renderer(canvas,options);
   try{await renderer.initialize();return renderer;}catch(error){renderer.dispose();throw error;}
  }
  async initialize(){
   this.program=await this.compile(vertex,frag,'materials');
   try{this.depth=await this.compile(depthVertex,shadowFragment,'depth');}
   catch(error){this.warnings.push('Тени недоступны: '+error.message);}
   // Compiles asynchronously where the driver supports it, without the expensive
   // material vertex shader being compiled a second time for the depth pass.
   try{this.post=await this.compile(screenVertex,screenFrag,'presentation');}
   catch(error){this.warnings.push('Постобработка недоступна: '+error.message);}
   this.setQuality(this.initialQuality,false);
  }
  async compile(v,f,label){
   const gl=this.gl,program=gl.createProgram(),shaders=[];
   const extension=gl.getExtension('KHR_parallel_shader_compile');
   try{
    for(const [type,source] of [[gl.VERTEX_SHADER,v],[gl.FRAGMENT_SHADER,f]]){
     const shader=gl.createShader(type);shaders.push(shader);
     gl.shaderSource(shader,source);gl.compileShader(shader);gl.attachShader(program,shader);
    }
    gl.linkProgram(program);
    const started=performance.now();
    if(extension){
     while(!gl.getProgramParameter(program,extension.COMPLETION_STATUS_KHR)){
      if(gl.isContextLost())throw Error('WebGL context lost during '+label);
      if(performance.now()-started>12000)throw Error('Shader timeout: '+label);
      await new Promise(resolve=>setTimeout(resolve,16));
     }
    }
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
     const messages=shaders.map(shader=>gl.getShaderInfoLog(shader)||'').join('\n');
     throw Error(label+': '+gl.getProgramInfoLog(program)+'\n'+messages);
    }
    return program;
   }catch(error){gl.deleteProgram(program);throw error;}
   finally{for(const shader of shaders)gl.deleteShader(shader);}
  }
  locations(program){if(!this.uniforms.has(program)){let out={};for(const key of ['uVP','uLight','uTime','uMotion','uSun','uEye','uDay','uAlpha','uShadow','uShadowTexel','uShadowEnabled','uQuality','uRain','uScene','uPixel'])out[key]=this.gl.getUniformLocation(program,key);this.uniforms.set(program,out);}return this.uniforms.get(program);}
  setQuality(name,persist=true){
   if(!Object.hasOwn(QUALITY,name))return;this.quality=name;this.settings=QUALITY[name];const gl=this.gl,size=Math.min(this.settings.shadow,gl.getParameter(gl.MAX_TEXTURE_SIZE));
   this.shadowSize=size;gl.bindTexture(gl.TEXTURE_2D,this.shadow);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,size,size,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
   gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
   gl.bindFramebuffer(gl.FRAMEBUFFER,this.fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,this.shadow,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
   this.shadowOK=!!this.depth&&gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;gl.bindFramebuffer(gl.FRAMEBUFFER,null);this.frameCount=0;this.resize();
   if(persist)this.onQualityChange(name);
  }
  batch(type,alpha=1){
   const key=type+':'+alpha;if(this.batches.has(key))return this.batches.get(key);const gl=this.gl,geo=geometry(type),vao=gl.createVertexArray();gl.bindVertexArray(vao);
   const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,geo,gl.STATIC_DRAW);
   for(let i=0;i<2;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,24,i*12);}
   const ib=gl.createBuffer(),stride=23*4;gl.bindBuffer(gl.ARRAY_BUFFER,ib);
   for(let i=0;i<4;i++){gl.enableVertexAttribArray(2+i);gl.vertexAttribPointer(2+i,4,gl.FLOAT,false,stride,i*16);gl.vertexAttribDivisor(2+i,1);}
   gl.enableVertexAttribArray(6);gl.vertexAttribPointer(6,3,gl.FLOAT,false,stride,64);gl.vertexAttribDivisor(6,1);
   gl.enableVertexAttribArray(7);gl.vertexAttribPointer(7,4,gl.FLOAT,false,stride,76);gl.vertexAttribDivisor(7,1);
   const b={type,alpha,vao,vb,ib,count:geo.length/6,nodes:[],data:new Float32Array(0)};this.batches.set(key,b);this.sortedBatches=[...this.batches.values()].sort((a,b)=>b.alpha-a.alpha);return b;
  }
  add(type,p,s,color,rot=[0,0,0],parent=null,alpha=1){const n={p:[...p],s:[...s],r:[...rot],c:rgb(color),fx:[0,0,0,0],parent,visible:true,m:ident()};this.batch(type,alpha).nodes.push(n);this.meshes.push(n);return n;}
  group(p=[0,0,0],s=[1,1,1],r=[0,0,0],parent=null){return {p,s,r,parent,m:ident(),isGroup:true,visible:true};}
  matrix(n){
   if(n.stamp===this.stamp)return n.m;
   const parent=n.parent;const pm=parent?this.matrix(parent):null;
   const values=[...n.p,...n.s,...n.r];
   const changed=!n.cachedTRS||values.some((value,i)=>value!==n.cachedTRS[i])||n.cachedParent!==parent||n.parentVersion!==(parent?.matrixVersion||0);
   if(changed){
    n.m=trs(n.p,n.s,n.r);if(pm)n.m=mm(pm,n.m);
    n.cachedTRS=values;n.cachedParent=parent;n.parentVersion=parent?.matrixVersion||0;
    n.matrixVersion=(n.matrixVersion||0)+1;
   }
   n.stamp=this.stamp;return n.m;
  }
  visible(n){if(n.visibilityStamp===this.stamp)return n.cachedVisible;n.visibilityStamp=this.stamp;return n.cachedVisible=n.visible!==false&&(!n.parent||this.visible(n.parent));}
  update(){this.stamp=(this.stamp||0)+1;const gl=this.gl;for(const b of this.batches.values()){const count=b.nodes.length;if(b.data.length<count*23)b.data=new Float32Array(count*23);let k=0;for(const n of b.nodes){if(!this.visible(n))continue;b.data.set(this.matrix(n),k*23);b.data.set(n.c,k*23+16);b.data.set(n.fx,k*23+19);k++;}b.instances=k;gl.bindBuffer(gl.ARRAY_BUFFER,b.ib);if(b.capacity!==b.data.byteLength){gl.bufferData(gl.ARRAY_BUFFER,b.data.byteLength,gl.DYNAMIC_DRAW);b.capacity=b.data.byteLength;}if(k)gl.bufferSubData(gl.ARRAY_BUFFER,0,b.data.subarray(0,k*23));}}
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
  waitForFrame(){return waitForGPUFrame(this.gl,{signal:this.frameLifetime.signal});}
  dispose(){
   if(this.disposed)return;this.disposed=true;this.frameLifetime.abort();const gl=this.gl;
   for(const b of this.batches.values()){gl.deleteBuffer(b.vb);gl.deleteBuffer(b.ib);gl.deleteVertexArray(b.vao);}
   for(const p of [this.program,this.depth,this.post])if(p)gl.deleteProgram(p);
   for(const t of [this.shadow,this.sceneTex])if(t)gl.deleteTexture(t);
   for(const f of [this.fb,this.sceneFB])if(f)gl.deleteFramebuffer(f);
   if(this.sceneDepth)gl.deleteRenderbuffer(this.sceneDepth);if(this.screenVAO)gl.deleteVertexArray(this.screenVAO);
   this.batches.clear();this.meshes.length=0;this.uniforms.clear();
  }
  draw(time=this.time){
   if(this.disposed)return;
   if(!this.program)return;
   this.drawStats={calls:0,triangles:0,instances:0};
   this.time=time;const gl=this.gl;this.update();this.cameraVP();gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
   const render=(program,depth)=>{
    const u=this.locations(program);gl.useProgram(program);gl.uniformMatrix4fv(u.uVP,false,depth?this.light:this.vp);gl.uniformMatrix4fv(u.uLight,false,this.light);gl.uniform1f(u.uTime,this.time);gl.uniform1f(u.uMotion,this.motion);
    if(!depth){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.shadow);gl.uniform1i(u.uShadow,0);gl.uniform3fv(u.uSun,this.sun);gl.uniform3fv(u.uEye,this.eye);gl.uniform1f(u.uDay,this.day);gl.uniform1f(u.uShadowEnabled,this.shadowOK?1:0);gl.uniform1f(u.uShadowTexel,1/this.shadowSize);gl.uniform1f(u.uQuality,this.settings.pcf);gl.uniform1f(u.uRain,this.rain);}
    for(const b of this.sortedBatches){if(depth&&b.alpha<1)continue;if(!b.instances)continue;
     if(!depth){gl.uniform1f(u.uAlpha,b.alpha);if(b.alpha<1){gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);}else{gl.disable(gl.BLEND);gl.depthMask(true);}}
     gl.bindVertexArray(b.vao);gl.drawArraysInstanced(gl.TRIANGLES,0,b.count,b.instances);this.drawStats.calls++;if(!depth){this.drawStats.triangles+=b.count*b.instances/3;this.drawStats.instances+=b.instances;}
    }gl.depthMask(true);
   };
   if(this.depth&&this.shadowOK&&this.frameCount++%this.settings.interval===0){gl.bindFramebuffer(gl.FRAMEBUFFER,this.fb);gl.viewport(0,0,this.shadowSize,this.shadowSize);gl.disable(gl.BLEND);gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.25,2.0);render(this.depth,true);gl.disable(gl.POLYGON_OFFSET_FILL);}
   gl.bindFramebuffer(gl.FRAMEBUFFER,this.postOK?this.sceneFB:null);gl.viewport(0,0,this.canvas.width,this.canvas.height);const dusk=1-this.day;gl.clearColor(0,0,0,0);this.canvas.style.setProperty('--dusk',String(dusk));gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);render(this.program,false);
   if(this.postOK){gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.useProgram(this.post);const u=this.locations(this.post);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.sceneTex);gl.uniform1i(u.uScene,0);gl.uniform2f(u.uPixel,1/this.canvas.width,1/this.canvas.height);gl.bindVertexArray(this.screenVAO);gl.drawArrays(gl.TRIANGLES,0,3);}
  }
 }

export {Renderer,QUALITY};
