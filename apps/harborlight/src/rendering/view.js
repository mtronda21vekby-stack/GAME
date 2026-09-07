import * as T from '../../vendor/three.js';
import {MAPS,COLORS,SHIPS} from '../domain/catalog.js';
import {storm} from '../domain/simulation.js';
import {buildArchipelago,buildShip,part,group,material} from './models.js';
import {createOcean} from './ocean.js';

export class HarborView{
 constructor(canvas,onError){
  this.canvas=canvas;this.onError=onError;this.scene=new T.Scene();this.scene.background=new T.Color('#acc9c9');this.scene.fog=new T.FogExp2('#acc9c9',.009);
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'default'});this.renderer.outputColorSpace=T.SRGBColorSpace;
  this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.camera=new T.OrthographicCamera(-20,20,20,-20,.1,200);this.camera.position.set(17,32,32);this.camera.lookAt(0,0,0);
  this.ambient=new T.HemisphereLight('#d9eff4','#557765',2.0);this.scene.add(this.ambient);
  this.sun=new T.DirectionalLight('#ffe6b3',3.3);this.sun.position.set(-18,32,14);this.sun.castShadow=true;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-24,right:24,top:22,bottom:-22,near:1,far:100});this.sun.shadow.bias=-.0002;this.sun.shadow.normalBias=.10;this.scene.add(this.sun);
  this.ships=new Map();this.paths=new Map();this.time=0;this.lastShadow=0;this.target=new T.Vector3(0,0,0);this.yaw=.28;this.zoom=1;this.currentMap=-1;this.particles=[];this.seagulls=[];this.lastEvents=0;this.quality='balanced';
  this.guide=new T.Line(new T.BufferGeometry(),new T.LineBasicMaterial({color:'#fff4ce',transparent:true,opacity:.9}));this.scene.add(this.guide);
  this.selection=new T.Mesh(new T.RingGeometry(.88,.95,48),new T.MeshBasicMaterial({color:'#ffe0a0',transparent:true,opacity:.72,side:2,depthWrite:false}));this.selection.rotation.x=-Math.PI/2;this.selection.position.y=.25;this.selection.visible=false;this.scene.add(this.selection);
  this.stormMesh=new T.Mesh(new T.RingGeometry(3.2,3.4,80),new T.MeshBasicMaterial({color:'#c9dce4',transparent:true,opacity:.22,side:2,depthWrite:false}));this.stormMesh.rotation.x=-Math.PI/2;this.scene.add(this.stormMesh);
  this.rescueModel=buildShip('fishing','#f1d999');this.rescueModel.scale.setScalar(.68);this.scene.add(this.rescueModel);
  for(let i=0;i<9;i++){const g=new T.Group();for(let side of [-1,1])part(g,'box',[side*.13,0,0],[.26,.026,.08],'#e8eddd',[0,0,side*.2]);g.position.set(i*2-8,5+i%3,1);this.scene.add(g);this.seagulls.push(g);}
  for(let i=0;i<44;i++){const m=new T.Mesh(new T.SphereGeometry(.075,4,3),new T.MeshBasicMaterial({color:'#ffe2a1',transparent:true,opacity:0,depthWrite:false}));m.visible=false;this.scene.add(m);this.particles.push({m,ttl:0,v:new T.Vector3()});}
  this.onResize=()=>this.resize();window.addEventListener('resize',this.onResize);
  this.onLost=e=>{e.preventDefault();this.onError(Error('Графический контекст прерван. Рейс сохранён; перезапустите игру.'));};canvas.addEventListener('webglcontextlost',this.onLost);
  this.resize();
 }
 async setMap(mapId){
  if(this.currentMap===mapId)return;this.clearShips();this.world?.dispose();this.ocean?.dispose();this.currentMap=mapId;
  const map=MAPS[mapId];this.world=buildArchipelago(this.scene,map);this.ocean=createOcean(this.scene,map);
  if(this.beam)this.scene.remove(this.beam);
  const geo=new T.CylinderGeometry(.06,2.8,24,24,1,true);geo.translate(0,-12,0);geo.rotateX(Math.PI/2);
  this.beam=new T.Mesh(geo,new T.MeshBasicMaterial({color:'#ffdd97',transparent:true,opacity:.045,side:2,depthWrite:false,blending:T.AdditiveBlending}));this.beam.position.copy(this.world.lightTop);this.scene.add(this.beam);
  // Precompile all vessel variants, not just the first boat, to avoid first-interaction stutter.
  const warm=[];for(const k of ['cargo','ferry','fishing']){const m=buildShip(k,COLORS[k]);m.position.y=-15;this.scene.add(m);warm.push(m);}
  if(this.renderer.compileAsync)await this.renderer.compileAsync(this.scene,this.camera);else this.renderer.compile(this.scene,this.camera);
  for(const m of warm)this.scene.remove(m);
  this.renderer.render(this.scene,this.camera);
 }
 setQuality(q){this.quality=q;this.renderer.setPixelRatio(Math.min(devicePixelRatio,q==='high'?2:q==='low'?1:1.4));const size=q==='high'?2048:q==='low'?512:1024;
  this.sun.shadow.mapSize.set(size,size);if(this.sun.shadow.map){this.sun.shadow.map.dispose();this.sun.shadow.map=null;}this.resize();}
 resize(){const r=this.canvas.getBoundingClientRect();this.width=Math.max(1,r.width);this.height=Math.max(1,r.height);this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,this.quality==='high'?2:this.quality==='low'?1:1.4));this.renderer.setSize(this.width,this.height,false);this.updateCamera();}
 updateCamera(){
  const aspect=this.width/this.height;const half=aspect<.85?23/aspect:21.4;
  const hh=half/this.zoom;this.camera.left=-hh*aspect;this.camera.right=hh*aspect;this.camera.top=hh;this.camera.bottom=-hh;
  const verticalOffset=aspect<.85?2:1;
  this.camera.position.set(this.target.x+Math.sin(this.yaw)*40,this.target.y+37,this.target.z+Math.cos(this.yaw)*40);
  this.camera.lookAt(this.target.x,this.target.y,this.target.z-verticalOffset);this.camera.updateProjectionMatrix();this.camera.updateMatrixWorld();
 }
 zoomBy(factor){this.zoom=Math.max(.85,Math.min(2.1,this.zoom*factor));this.updateCamera();}
 resetCamera(){this.target.set(0,0,0);this.yaw=.28;this.zoom=1;this.updateCamera();}
 project(p,y=.45){const v=new T.Vector3(p.x,y,p.z).project(this.camera);return {x:(v.x*.5+.5)*this.width,y:(.5-v.y*.5)*this.height};}
 ground(x,y){const near=new T.Vector3(x/this.width*2-1,1-y/this.height*2,-1).unproject(this.camera),far=new T.Vector3(x/this.width*2-1,1-y/this.height*2,1).unproject(this.camera);const d=far.sub(near);const t=-near.y/d.y;return {x:near.x+d.x*t,z:near.z+d.z*t};}
 setDraft(points,valid=true){this.guide.geometry.dispose();this.guide.geometry=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(p.x,.27,p.z)));this.guide.material.color.set(valid?'#fff4ce':'#ff8371');}
 routeLine(ship){let obj=this.paths.get(ship.id);if(!obj){obj={signature:'',line:new T.Line(new T.BufferGeometry(),new T.LineBasicMaterial({color:COLORS[ship.kind],transparent:true,opacity:.6,depthWrite:false}))};this.scene.add(obj.line);this.paths.set(ship.id,obj);}return obj;}
 clearShips(){for(const m of this.ships.values())this.scene.remove(m.root);for(const p of this.paths.values()){this.scene.remove(p.line);p.line.geometry.dispose();p.line.material.dispose();}this.ships.clear();this.paths.clear();}
 burst(p,color){let count=0;for(const f of this.particles){if(f.ttl>0)continue;f.ttl=.8+Math.random()*.7;f.m.visible=true;f.m.position.set(p.x,.6,p.z);f.v.set((Math.random()-.5)*2.5,2+Math.random()*2,(Math.random()-.5)*2.5);f.m.material.color.set(color);if(++count>=14)break;}}
 update(s,dt,selected=null,demo=false){
  this.time+=Math.min(dt,.1);const t=this.time;
  const desired=s.stage>=2?1:s.stage===1?.42:0;this.weather=(this.weather??0)+(desired-(this.weather??0))*Math.min(1,dt*.7);
  const w=this.weather;this.ambient.intensity=2-w*.7;this.sun.intensity=3.3-w*1.85;this.sun.color.set(w<.7?'#ffe3ad':'#d3dceb');
  this.scene.background.copy(new T.Color('#acc9c9').lerp(new T.Color('#587383'),w));this.scene.fog.color.copy(this.scene.background);this.ocean?.update(t,s.stage>=2?w:0);
  if(this.beam){this.beam.rotation.y=t*.36;this.beam.material.opacity=.022+w*.047;}
  const alive=new Set();
  for(const ship of s.ships){alive.add(ship.id);let model=this.ships.get(ship.id);
   if(!model){const root=buildShip(ship.kind,COLORS[ship.kind]);this.scene.add(root);const wake=new T.Mesh(new T.PlaneGeometry(.82,2.4),new T.MeshBasicMaterial({color:'#d3eee5',transparent:true,opacity:.22,side:2,depthWrite:false}));wake.rotation.x=-Math.PI/2;root.add(wake);wake.position.set(0,-.02,-1.55);model={root,wake};this.ships.set(ship.id,model);}
   model.root.position.set(ship.x,.13+Math.sin(ship.x*.42+t*.85)*.085+Math.cos(ship.z*.51-t*.67)*.05,ship.z);
   model.root.rotation.y=ship.heading;model.root.rotation.z=Math.sin(t*1.7+ship.id)*.027;model.root.rotation.x=Math.cos(t*1.5+ship.id)*.023;
   model.wake.visible=ship.path.length>0&&ship.hold<=0;model.wake.material.opacity=.13+Math.sin(t*3)*.025;
   const path=this.routeLine(ship),points=[{x:ship.x,z:ship.z},...ship.path];
   const signature=JSON.stringify(ship.path);
   if(path.signature!==signature){path.signature=signature;path.line.geometry.dispose();path.line.geometry=new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(p.x,.13,p.z)));}
   else{const position=path.line.geometry.attributes.position;if(position){position.setXYZ(0,ship.x,.13,ship.z);position.needsUpdate=true;}}
   path.line.visible=ship.path.length>0&&!demo;path.line.material.opacity=selected===ship.id?.9:.34;
  }
  for(const [id,m]of this.ships)if(!alive.has(id)){this.scene.remove(m.root);this.ships.delete(id);const p=this.paths.get(id);if(p){this.scene.remove(p.line);p.line.geometry.dispose();p.line.material.dispose();this.paths.delete(id);}}
  const active=s.ships.find(b=>b.id===selected);this.selection.visible=!!active&&!demo;if(active)this.selection.position.set(active.x,.20,active.z);
  this.rescueModel.visible=!!s.rescue;if(s.rescue){this.rescueModel.position.set(s.rescue.x,.16+Math.sin(t*2)*.08,s.rescue.z);this.rescueModel.rotation.z=Math.sin(t*2)*.1;}
  const zone=storm(s);this.stormMesh.visible=zone.active&&!demo;this.stormMesh.position.set(zone.x,.12,zone.z);this.stormMesh.rotation.z=t*.06;
  for(let i=0;i<this.seagulls.length;i++){const g=this.seagulls[i];const a=t*.075+i*.68;g.position.set(Math.cos(a)*(8+i*.5),5+Math.sin(a*2+i)*.35,Math.sin(a)*9);g.rotation.y=-a;g.children.forEach((wing,k)=>wing.rotation.z=(k===0?-1:1)*(.1+Math.sin(t*4+i)*.24));}
  for(const f of this.particles){if(f.ttl<=0)continue;f.ttl-=dt;f.m.position.addScaledVector(f.v,dt);f.v.y-=dt*3;f.m.material.opacity=Math.min(1,f.ttl);if(f.ttl<=0)f.m.visible=false;}
  for(const e of s.events)if(e.id>this.lastEvents){if(e.at&&['delivery','rescue','collision'].includes(e.type))this.burst(e.at,e.type==='collision'?'#ed9276':'#f8d38a');this.lastEvents=Math.max(this.lastEvents,e.id);}
  this.renderer.render(this.scene,this.camera);
 }
 diagnostics(){return {engine:'Three.js r170',webgl:this.renderer.getContext().getParameter(this.renderer.getContext().VERSION),calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,quality:this.quality,scene:this.currentMap};}
 dispose(){window.removeEventListener('resize',this.onResize);this.canvas.removeEventListener('webglcontextlost',this.onLost);this.clearShips();this.world?.dispose();this.ocean?.dispose();this.renderer.dispose();}
}
