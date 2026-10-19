import * as THREE from "three";
import { PMREMGenerator } from "three/src/extras/PMREMGenerator.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CameraRig } from "../../experience/camera/CameraRig";
import { RendererHost } from "../../experience/core/RendererHost";
import { QUALITY_PRESETS } from "../../experience/quality/qualityPresets";
import { INITIAL_SCROLL_SNAPSHOT } from "../../experience/types";
import { platformGames } from "../../lib/platformGames";
import { disposeModel, finishMetal } from "../platform/crownModel";
import { prefersStaticPlatform } from "../platform/usePlatformParallax";
import { SPATIAL_BRAND_MODEL } from "./brandModel";
import { adaptSpatialBrand } from "./SpatialBrandAdapter";
import { SpatialAtmosphere, SPATIAL_ATMOSPHERE_QUALITY } from "./SpatialAtmosphere";
import { SpatialBloom } from "./SpatialBloom";
import { animateHeroMaterials } from "./SpatialHeroMaterial";
import { spatialAxisJourney, spatialAxisTurn } from "./SpatialAxis";
import { SpatialCloth } from "./SpatialCloth";
import { panelCSSMatrix, panelFrontWidth, panelScreenPosition, panelStyle } from "./panelProjection";
import { createOrbitCard } from "./SpatialObjects";
import { DampedScalar, SurfaceMotion, SPATIAL_TIMING } from "./spatialMotion";
import { ALL_WORLD_INDICES, ORBIT_CARD_WIDTH, WORLD_ACCENTS, nearestOrbitTurn, orbitCardPose, spatialProgress } from "./spatialState";

const COMPACT_PRESET = { ...QUALITY_PRESETS.low, dprCap:SPATIAL_ATMOSPHERE_QUALITY.mobile.dpr, antialias:true };
const DESKTOP_PRESET = { ...QUALITY_PRESETS.high, dprCap:SPATIAL_ATMOSPHERE_QUALITY.desktop.dpr };
type SceneOptions = { host:HTMLElement; stage:HTMLElement; panelRoot:HTMLElement; onStatus:(status:"ready"|"fallback")=>void; onProgress:(complete:number,total:number)=>void };

/** One physical scene projects the native game panels; input and launch links stay in HTML. */
export class SpatialSceneRuntime {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(38,1,.1,100);
  private readonly anchorCamera = new THREE.PerspectiveCamera(38,1,.1,100);
  private cameraRig?:CameraRig;
  private anchorRig?:CameraRig;
  private readonly brand = new THREE.Group();
  private readonly gallery = new THREE.Group();
  private readonly cards = platformGames.map(()=>createOrbitCard());
  private readonly panelElements:HTMLElement[];
  private readonly panelSizes = platformGames.map(()=>({width:640,height:570}));
  private readonly orbitMotion = new DampedScalar(0,SPATIAL_TIMING.orbit);
  private readonly turnMotion = new DampedScalar(-.14,840);
  private readonly detailMotion = new SurfaceMotion([0]);
  private readonly focusMotion = platformGames.map(()=>new DampedScalar(0,SPATIAL_TIMING.focus));
  private readonly accent = new THREE.Color(WORLD_ACCENTS[0]);
  private readonly desiredAccent = new THREE.Color(WORLD_ACCENTS[0]);
  private readonly accentLight = new THREE.PointLight(WORLD_ACCENTS[0],14,22,2);
  private brandAbort?:AbortController;
  private readonly atmosphere:SpatialAtmosphere;
  private readonly cloth:SpatialCloth;
  private bloom?:SpatialBloom;
  private readonly motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  private readonly compactQuery = window.matchMedia("(max-width:760px)");
  private readonly pointerQuery = window.matchMedia("(hover:hover) and (pointer:fine)");
  private rendererHost?:RendererHost;
  private environment?:THREE.WebGLRenderTarget;
  private resizeObserver?:ResizeObserver;
  private intersectionObserver?:IntersectionObserver;
  private preferenceObserver?:MutationObserver;
  private frame=0; private lastFrame=0; private elapsed=0; private pausedAt=0;
  private progress=0; private desiredProgress=0; private orbit=0; private desiredOrbit=0;
  private detail=0; private detailOpen=false; private detailFocus=false;
  private pointer={x:0,y:0}; private desiredPointer={x:0,y:0};
  private stageTop=0; private stageHeight=1; private gallerySlot?:HTMLElement; private clothSlot?:HTMLElement;
  private viewportWidth=1; private viewportHeight=1; private panelScale=1;
  private brandReady=false;
  private brandSlot={x:0,pageY:0,width:1,height:1};
  private compact=this.compactQuery.matches; private reduced=prefersStaticPlatform(this.motionQuery);
  private paused=false; private inView=true; private disposed=false;
  private worldIndex=0; private visibleGames=[...ALL_WORLD_INDICES];

  constructor(private readonly options:SceneOptions) {
    this.atmosphere=new SpatialAtmosphere(this.compact);
    this.atmosphere.setQuality(this.compact,this.reduced);
    this.cloth=new SpatialCloth(this.compact);this.cloth.setQuality(this.compact,this.reduced);
    this.panelElements=[...options.panelRoot.querySelectorAll<HTMLElement>("[data-game-panel]")];
    this.cards.forEach(card=>this.gallery.add(card.group));
    this.scene.add(this.brand,this.gallery,this.atmosphere,this.cloth);
    try {
      this.rendererHost=new RendererHost({container:options.host,preset:this.compact?COMPACT_PRESET:DESKTOP_PRESET,powerPreference:this.compact?"low-power":"high-performance",onContextState:state=>{if(state==="lost")this.fail();}});
      this.rendererHost.renderer.domElement.className="spatialSceneCanvas";
      this.rendererHost.setExposure(.97);
      this.scene.background=new THREE.Color(0x090d11);
      this.scene.fog=new THREE.FogExp2(0x090d11,.026);
      this.buildLighting();this.configureBloom();this.installObservers();this.resize();
      options.onStatus("ready"); options.onProgress(0,1);
      void this.loadBrand();
    } catch(error) { this.dispose(); throw error; }
  }

  private buildLighting() {
    const room=new RoomEnvironment(), pmrem=new PMREMGenerator(this.rendererHost!.renderer);
    try { this.environment=pmrem.fromScene(room,.05); this.scene.environment=this.environment.texture; }
    finally { room.dispose(); pmrem.dispose(); }
    this.scene.add(new THREE.HemisphereLight(0xc9d8db,0x06090d,1.5));
    const key=new THREE.DirectionalLight(0xedf2ef,4.2); key.position.set(-3,5,7);
    const rim=new THREE.DirectionalLight(0x8cb1c8,2.5); rim.position.set(5,1,-3);
    this.accentLight.position.set(2,2,4);
    this.scene.add(key,rim,this.accentLight);
  }

  private async loadBrand() {
    this.brandAbort?.abort();
    const controller=this.brandAbort=new AbortController();
    const url=this.compact?SPATIAL_BRAND_MODEL.mobileUrl:SPATIAL_BRAND_MODEL.url;
    this.options.onProgress(0,1);
    try {
      const response=await fetch(url,{signal:controller.signal});
      if(!response.ok)throw new Error("brand_"+response.status);
      const gltf=await new GLTFLoader().parseAsync(await response.arrayBuffer(),url.slice(0,url.lastIndexOf("/")+1));
      if(this.disposed||this.brandAbort!==controller){disposeModel(gltf.scene);return;}
      if(SPATIAL_BRAND_MODEL.finish==="blackcrown-metal")finishMetal(gltf.scene);
      animateHeroMaterials(gltf.scene,this.atmosphere.time,this.atmosphere.motion);
      const adapted=adaptSpatialBrand(gltf.scene,SPATIAL_BRAND_MODEL.fitSpan);
      const previous=[...this.brand.children];this.brand.clear();this.brand.add(adapted.group);
      previous.forEach(disposeModel);
      this.brandReady=true;this.options.stage.dataset.brandReady="1";this.fitBrand();this.requestFrame();
    } catch { /* A missing hero model must not disable the games or their native fallback. */ }
    finally { if(!this.disposed&&this.brandAbort===controller)this.options.onProgress(1,1); }
  }

  private configureBloom() {
    if(this.compact){this.bloom?.dispose();this.bloom=undefined;return;}
    if(!this.bloom&&this.rendererHost){
      try{this.bloom=new SpatialBloom(this.rendererHost.renderer,this.scene,this.camera);}catch{/* Keep the 3D scene usable if HDR targets are unavailable. */}
    }
  }

  setWorld(index:number,visibleGames:readonly number[]=ALL_WORLD_INDICES) {
    if(this.disposed)return;
    this.visibleGames=visibleGames.filter(value=>value>=0&&value<platformGames.length);
    if(!this.visibleGames.length)this.visibleGames=[...ALL_WORLD_INDICES];
    this.worldIndex=this.visibleGames.includes(index)?index:this.visibleGames[0];
    this.desiredOrbit=nearestOrbitTurn(this.orbit,this.visibleGames.indexOf(this.worldIndex),this.visibleGames.length);
    if(this.paused)this.settleSelection();
    this.desiredAccent.set(WORLD_ACCENTS[this.worldIndex]); this.measurePanels(); this.requestFrame();
  }
  setDetailOpen(open:boolean){this.detailOpen=open;this.requestFrame();}
  touchCloth(clientX?:number,clientY?:number) {
    if(this.disposed||this.paused||this.reduced||this.detailOpen)return false;
    const box=this.clothSlot?.getBoundingClientRect();if(!box?.width||!box.height)return false;
    const u=clientX===undefined?.5:(clientX-box.left)/box.width,v=clientY===undefined?.5:1-(clientY-box.top)/box.height;
    this.cloth.touch(u,v,this.elapsed);this.requestFrame();return true;
  }
  setDetailFocus(focused:boolean){
    if(this.detailFocus===focused)return;
    this.detailFocus=focused;
    if(this.paused||this.reduced)this.detailMotion.rebase([focused?1:0]);
    else this.detailMotion.moveTo([focused?1:0],focused?SPATIAL_TIMING.open:SPATIAL_TIMING.close,performance.now());
    this.requestFrame();
  }
  private settleSelection(){
    this.orbit=this.orbitMotion.snap(this.desiredOrbit);
    this.focusMotion.forEach((motion,index)=>motion.snap(index===this.worldIndex?1:0));
  }
  setPaused(paused:boolean){
    if(paused&&!this.paused){this.pausedAt=performance.now();this.detailMotion.sample(this.pausedAt);}
    if(!paused&&this.paused)this.detailMotion.delay(performance.now()-this.pausedAt);
    this.paused=paused;
    if(paused&&this.elapsed===0){this.settleSelection();this.progress=this.desiredProgress;}
    this.stop();this.requestFrame();
  }

  private installObservers(){
    this.resizeObserver=new ResizeObserver(entries=>{
      const changed=entries.some(entry=>{
        const index=this.panelElements.indexOf(entry.target as HTMLElement);
        return index<0||((entry.target as HTMLElement).offsetHeight>0&&Math.abs((entry.target as HTMLElement).offsetHeight-this.panelSizes[index].height)>1);
      });
      if(changed)this.resize();
    });
    this.resizeObserver.observe(this.options.host);this.resizeObserver.observe(this.options.stage);
    this.panelElements.forEach(element=>this.resizeObserver!.observe(element));
    for(const selector of [".spatialGalleryVisual",".spatialBrandSlot",".spatialPanelFallback",".spatialClothControl"]){
      const element=this.options.stage.querySelector(selector);if(element)this.resizeObserver.observe(element);
    }
    this.intersectionObserver=new IntersectionObserver(([entry])=>{this.inView=entry.isIntersecting;if(this.inView)this.requestFrame();else this.stop();});
    this.intersectionObserver.observe(this.options.stage);
    this.preferenceObserver=new MutationObserver(this.onPreferenceChange);
    this.preferenceObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-reduced-motion"]});
    this.motionQuery.addEventListener("change",this.onPreferenceChange);this.compactQuery.addEventListener("change",this.onPreferenceChange);
    window.addEventListener("scroll",this.onScroll,{passive:true});window.addEventListener("resize",this.resize,{passive:true});
    window.addEventListener("pointermove",this.onPointer,{passive:true});document.addEventListener("visibilitychange",this.onVisibility);
  }
  private resize=()=>{
    if(this.disposed||!this.rendererHost)return;
    this.viewportWidth=this.options.host.clientWidth;this.viewportHeight=this.options.host.clientHeight;
    this.rendererHost.resize(this.viewportWidth,this.viewportHeight);
    this.bloom?.resize(this.viewportWidth,this.viewportHeight,this.rendererHost.renderer.getPixelRatio());
    this.camera.aspect=this.viewportWidth/Math.max(1,this.viewportHeight);this.camera.updateProjectionMatrix();
    this.anchorCamera.aspect=this.camera.aspect;this.anchorCamera.updateProjectionMatrix();
    const box=this.options.stage.getBoundingClientRect();
    this.stageTop=box.top+window.scrollY;this.stageHeight=box.height;
    const slot=this.options.stage.querySelector(".spatialBrandSlot")?.getBoundingClientRect();
    if(slot)this.brandSlot={x:slot.left+slot.width/2,pageY:slot.top+window.scrollY+slot.height/2,width:slot.width,height:slot.height};
    this.gallerySlot=this.options.stage.querySelector<HTMLElement>(".spatialGalleryVisual")??undefined;
    this.clothSlot=this.options.stage.querySelector<HTMLElement>(".spatialClothControl")??undefined;
    this.fitBrand();this.measurePanels();this.onScroll();
  };
  private measurePanels(){
    const width=Math.max(240,Math.min(this.compact?420:640,this.viewportWidth-(this.compact?40:100)));
    const hidden=this.panelElements.map(element=>element.hidden);
    for(const element of this.panelElements){element.hidden=false;element.style.width=width+"px";}
    this.panelElements.forEach((element,index)=>{const height=element.offsetHeight;if(height)this.panelSizes[index]={width,height};});
    this.panelElements.forEach((element,index)=>{element.hidden=hidden[index];});
    const height=Math.max(...this.panelSizes.map(size=>size.height));
    this.options.stage.style.setProperty("--spatial-panel-height",height+"px");
  }
  private fitBrand(){
    const journey=spatialAxisJourney({compact:this.compact,width:this.viewportWidth,height:this.viewportHeight,
      slot:{x:this.brandSlot.x,y:this.brandSlot.pageY-this.stageTop,width:this.brandSlot.width,height:this.brandSlot.height}});
    this.cameraRig=new CameraRig(this.camera,journey.frames,true);this.anchorRig=new CameraRig(this.anchorCamera,journey.frames,true);
    this.brand.scale.setScalar(journey.axisHeight/4.2);this.brand.position.set(0,0,0);
    this.atmosphere.setAxisHeight(journey.axisHeight);
  }
  private projectPanels(){
    this.options.panelRoot.dataset.projected="1";
    this.panelElements.forEach((element,index)=>{
      const slot=this.visibleGames.indexOf(index),card=this.cards[index];
      const pose=orbitCardPose(Math.max(0,slot),this.visibleGames.length,this.orbit);
      const showing=slot>=0&&this.gallery.visible&&!this.detailOpen&&this.viewportHeight>=740&&pose.z>-.8;
      element.hidden=!showing;if(!showing)return;
      const size=this.panelSizes[index];
      const world=card.group.matrixWorld.clone().multiply(new THREE.Matrix4().makeTranslation(0,0,.066));
      element.style.transform=panelStyle(panelCSSMatrix(this.camera,world,this.viewportWidth,this.viewportHeight,size.width,size.height,ORBIT_CARD_WIDTH));
      element.style.opacity=String(.35+.65*card.focus);
      element.style.zIndex=String(Math.round((pose.z+4)*10));
    });
  }
  private onScroll=()=>{this.desiredProgress=spatialProgress(window.scrollY,this.stageTop,this.stageHeight,this.viewportHeight);if(this.paused)this.progress=this.desiredProgress;this.requestFrame();};
  private onPointer=(event:PointerEvent)=>{
    if(this.compact||this.reduced||this.paused||this.detailOpen||!this.pointerQuery.matches||event.pointerType!=="mouse")return;
    if((event.target as Element).closest(".spatialClothControl")){this.desiredPointer.x=this.desiredPointer.y=0;this.requestFrame();return;}
    this.desiredPointer.x=(event.clientX/Math.max(1,window.innerWidth)-.5)*.85;
    this.desiredPointer.y=(event.clientY/Math.max(1,window.innerHeight)-.5)*.65;this.requestFrame();
  };
  private onPreferenceChange=()=>{
    const compact=this.compactQuery.matches,changed=compact!==this.compact;
    this.compact=compact;this.reduced=prefersStaticPlatform(this.motionQuery);this.desiredPointer.x=this.desiredPointer.y=0;
    this.atmosphere.setQuality(compact,this.reduced);this.rendererHost?.setPreset(compact?COMPACT_PRESET:DESKTOP_PRESET);
    this.cloth.setQuality(compact,this.reduced);
    this.configureBloom();this.resize();if(changed)void this.loadBrand();
  };
  private onVisibility=()=>{if(document.hidden)this.stop();else this.requestFrame();};
  private stop(){cancelAnimationFrame(this.frame);this.frame=0;this.lastFrame=0;}
  private requestFrame=()=>{if(!this.disposed&&!this.frame&&this.inView&&!document.hidden)this.frame=requestAnimationFrame(this.tick);};

  private tick=(now:number)=>{
    this.frame=0;if(this.disposed||!this.inView||document.hidden||!this.rendererHost)return;
    const delta=this.lastFrame?now-this.lastFrame:16.67;
    const pointerTarget=this.detailOpen?{x:0,y:0}:this.desiredPointer;
    const travelling=Math.abs(this.desiredProgress-this.progress)>.0001||Math.abs(this.desiredOrbit-this.orbit)>.0001||this.detailMotion.active||Math.abs(this.pointer.x-pointerTarget.x)>.0001||Math.abs(this.pointer.y-pointerTarget.y)>.0001;
    if(this.lastFrame&&delta<(this.compact?40:31)&&!travelling){this.requestFrame();return;}
    this.lastFrame=now;
    const staticScene=this.reduced||this.paused,blend=staticScene?1:1-Math.exp(-Math.min(delta,100)/180);
    if(!staticScene)this.elapsed+=Math.min(delta,100)/1000;
    const target=this.paused?this.progress:this.desiredProgress;
    this.progress+=(target-this.progress)*blend;
    this.orbit=this.reduced?this.orbitMotion.snap(this.desiredOrbit):this.paused?this.orbitMotion.value:this.orbitMotion.update(this.desiredOrbit,delta);
    if(this.reduced)this.detailMotion.rebase([this.detailFocus?1:0]);else if(!this.paused)this.detailMotion.sample(now);
    this.detail=this.detailMotion.value[0];
    this.pointer.x+=((this.reduced||this.detailOpen?0:this.paused?this.pointer.x:this.desiredPointer.x)-this.pointer.x)*blend;
    this.pointer.y+=((this.reduced||this.detailOpen?0:this.paused?this.pointer.y:this.desiredPointer.y)-this.pointer.y)*blend;
    this.accent.lerp(this.desiredAccent,blend);this.accentLight.color.copy(this.accent);
    const snapshot={...INITIAL_SCROLL_SNAPSHOT,progress:this.progress,viewportWidth:this.viewportWidth,viewportHeight:this.viewportHeight,reducedMotion:this.reduced};
    this.cameraRig!.update(snapshot,this.pointer,this.elapsed);
    this.anchorRig!.update(snapshot,{x:0,y:0},0);this.anchorCamera.updateMatrixWorld();
    this.camera.position.x+=this.detail*(this.compact?.3:.65);this.camera.position.z-=this.detail*(this.compact?1.2:1);
    this.camera.updateMatrixWorld();
    this.updateObjects(delta);
    this.scene.updateMatrixWorld();this.projectPanels();
    try{if(this.bloom)this.bloom.render();else this.rendererHost.renderer.render(this.scene,this.camera);}catch{
      if(this.bloom){
        this.bloom.dispose();this.bloom=undefined;
        try{this.rendererHost.renderer.render(this.scene,this.camera);}catch{this.fail();return;}
      }else{this.fail();return;}
    }
    const unsettled=travelling||Math.abs(this.pointer.x-pointerTarget.x)>.0001||Math.abs(this.pointer.y-pointerTarget.y)>.0001||this.visibleGames.some(index=>Math.abs(this.focusMotion[index].value-(index===this.worldIndex?1:0))>.0001);
    if(!staticScene&&(unsettled||!this.detailOpen&&(this.brand.visible||this.atmosphere.visible)))this.requestFrame();else this.lastFrame=0;
  };
  private updateObjects(delta:number){
    const p=this.progress,t=this.elapsed;
    const galleryMix=THREE.MathUtils.smoothstep(p,.12,.32),end=THREE.MathUtils.smoothstep(p,.88,1);
    this.brand.visible=this.brandReady;
    const turn=this.reduced?this.turnMotion.snap(spatialAxisTurn(p,this.compact,true)):this.paused?this.turnMotion.value:this.turnMotion.update(spatialAxisTurn(p,this.compact),delta);
    this.brand.rotation.set(0,turn+(this.reduced?0:this.pointer.x*.08),0);
    this.gallery.visible=galleryMix>.04&&end<.99;
    this.gallery.position.z=-6*(1-galleryMix)-end*8;
    const slot=this.gallerySlot?.getBoundingClientRect(),centerY=slot?slot.top+slot.height/2:this.viewportHeight/2;
    const center=panelScreenPosition(this.camera,this.viewportWidth/2,centerY,this.viewportWidth,this.viewportHeight,3.85+this.gallery.position.z);
    this.gallery.position.x=center.x;this.gallery.position.y=center.y-.8;
    this.panelScale=this.panelSizes[this.worldIndex].width/panelFrontWidth(this.camera,this.viewportWidth,ORBIT_CARD_WIDTH,center);
    this.atmosphere.update(t,p,this.detail,this.pointer,new THREE.Vector3(),this.rendererHost!.renderer.getPixelRatio(),this.accent);
    this.accentLight.position.set(2+Math.sin(t*.12)*1.3,this.anchorCamera.position.y+2,4);
    const sheet=this.clothSlot?.getBoundingClientRect();
    this.cloth.visible=!!sheet&&sheet.bottom>0&&sheet.top<this.viewportHeight&&!this.detailOpen;
    if(sheet&&this.cloth.visible){
      const position=panelScreenPosition(this.camera,sheet.left+sheet.width/2,sheet.top+sheet.height/2,this.viewportWidth,this.viewportHeight,4.4);
      const unit=panelFrontWidth(this.camera,this.viewportWidth,1,position),worldWidth=sheet.width/unit;
      this.cloth.position.copy(position);this.cloth.scale.set(worldWidth,sheet.height/unit,worldWidth*.7);this.cloth.update(this.reduced?0:t);
    }
    this.cards.forEach((card,index)=>{
      const slot=this.visibleGames.indexOf(index);card.group.visible=slot>=0;if(slot<0)return;
      const pose=orbitCardPose(slot,this.visibleGames.length,this.orbit);
      card.group.visible=pose.z>-.8;
      card.focus=this.reduced?this.focusMotion[index].snap(index===this.worldIndex?1:0):this.paused?this.focusMotion[index].value:this.focusMotion[index].update(index===this.worldIndex?1:0,delta);
      card.group.position.set(pose.x*1.25,pose.y,pose.z+card.focus*.25);
      card.group.scale.setScalar(this.panelScale*(.82+.18*card.focus));
      card.group.rotation.set(0,pose.rotation*.65,pose.roll*.25);
      card.backing.scale.y=ORBIT_CARD_WIDTH*this.panelSizes[index].height/this.panelSizes[index].width;
      card.backing.material.opacity=.035;card.backing.material.emissive.copy(this.accent).multiplyScalar(.01*card.focus);
    });
  }
  private fail(){if(!this.disposed){this.options.onStatus("fallback");this.dispose();}}
  dispose(){
    if(this.disposed)return;this.disposed=true;this.stop();this.brandAbort?.abort();
    this.resizeObserver?.disconnect();this.intersectionObserver?.disconnect();this.preferenceObserver?.disconnect();
    this.motionQuery.removeEventListener("change",this.onPreferenceChange);this.compactQuery.removeEventListener("change",this.onPreferenceChange);
    window.removeEventListener("scroll",this.onScroll);window.removeEventListener("resize",this.resize);window.removeEventListener("pointermove",this.onPointer);document.removeEventListener("visibilitychange",this.onVisibility);
    this.options.panelRoot.removeAttribute("data-projected");this.options.stage.style.removeProperty("--spatial-panel-height");
    delete this.options.stage.dataset.brandReady;this.atmosphere.dispose();this.cloth.dispose();this.bloom?.dispose();
    for(const element of this.panelElements){for(const property of ["transform","width","opacity","z-index"])element.style.removeProperty(property);element.hidden=false;}
    disposeModel(this.scene);this.scene.clear();this.scene.environment=null;this.environment?.dispose();this.rendererHost?.dispose();
  }
}
