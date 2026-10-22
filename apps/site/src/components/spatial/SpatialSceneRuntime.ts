import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CameraRig } from "../../experience/camera/CameraRig";
import { RendererHost } from "../../experience/core/RendererHost";
import { frameLoop } from "../../experience/core/FrameLoop";
import { RuntimeBudget } from "../../experience/quality/QualityManager";
import { prepareSceneShaders } from "../../experience/core/ShaderPreparation";
import { QUALITY_PRESETS } from "../../experience/quality/qualityPresets";
import { INITIAL_SCROLL_SNAPSHOT } from "../../experience/types";
import { platformGames } from "../../lib/platformGames";
import { disposeModel, finishMetal } from "../platform/crownModel";
import { prefersStaticPlatform } from "../platform/usePlatformParallax";
import { SPATIAL_BRAND_MODEL } from "./brandModel";
import { adaptSpatialBrand } from "./SpatialBrandAdapter";
import { SpatialAtmosphere, SPATIAL_ATMOSPHERE_QUALITY } from "./SpatialAtmosphere";
import { SpatialBloom } from "./SpatialBloom";
import { finishHeroMaterials } from "./SpatialHeroMaterial";
import { createHeroStudio } from "./SpatialHeroStudio";
import { SpatialGalleryStage } from "./SpatialGalleryStage";
import { spatialArrivalEnd, spatialChoreography, spatialInterludeVisible, spatialWorldBlend } from "./SpatialChoreography";
import { spatialAxisJourney, spatialAxisTurn, type SpatialJourneyStops } from "./SpatialAxis";
import { SpatialCloth } from "./SpatialCloth";
import { SpatialRefraction } from "./SpatialRefraction";
import { panelFrontWidth, panelScreenPosition } from "./panelProjection";
import { ScrollJourney, SurfaceMotion, SPATIAL_TIMING } from "./spatialMotion";
import { WORLD_ACCENTS, spatialProgress } from "./spatialState";

const COMPACT_PRESET = { ...QUALITY_PRESETS.low, dprCap:SPATIAL_ATMOSPHERE_QUALITY.mobile.dpr, antialias:true };
const DESKTOP_PRESET = { ...QUALITY_PRESETS.high, dprCap:SPATIAL_ATMOSPHERE_QUALITY.desktop.dpr };
type SceneOptions = { host:HTMLElement; stage:HTMLElement; onStatus:(status:"ready"|"fallback")=>void; onProgress:(complete:number,total:number,phase?:"download"|"prepare"|"complete")=>void };

/** The sculpture and atmosphere share one scroll clock; game panels stay in native layout. */
export class SpatialSceneRuntime {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(38,1,.1,100);
  private cameraRig?:CameraRig;
  private readonly brand = new THREE.Group();
  private readonly journey = new ScrollJourney();
  private readonly detailMotion = new SurfaceMotion([0]);
  private readonly accent = new THREE.Color(WORLD_ACCENTS[0]);
  private readonly desiredAccent = new THREE.Color(WORLD_ACCENTS[0]);
  private readonly paletteTarget = new THREE.Color();
  private worldIndices:readonly number[]=platformGames.map((_,index)=>index);
  private readonly atmosphereOrigin = new THREE.Vector3();
  private readonly accentLight = new THREE.PointLight(WORLD_ACCENTS[0],5,22,2);
  private readonly faceLight = new THREE.DirectionalLight(0xe0e8e8,1);
  private readonly edgeLight = new THREE.DirectionalLight(0x92c5d5,1);
  private readonly keyLight = new THREE.DirectionalLight(0xe3e8e9,3.05);
  private readonly anatomyLight = new THREE.SpotLight(0xc7d5da,55,11,.34,.8,2);
  private readonly spineLight = new THREE.SpotLight(0x91b9c9,85,14,.42,.85,2);
  private readonly lightAim = new THREE.Vector3();
  private readonly gallery:SpatialGalleryStage;
  private axisHeight=1;
  private brandAbort?:AbortController;
  private shaderAbort?:AbortController;
  private readonly atmosphere:SpatialAtmosphere;
  private readonly cloth:SpatialCloth;
  private bloom?:SpatialBloom;
  private refraction?:SpatialRefraction;
  private readonly budget=new RuntimeBudget();
  private readonly renderSize=new THREE.Vector2();
  private opticsWeight=0;private opticsLastSeen=-Infinity;
  private contextLost=false;private contextRevision=0;private restoring=false;
  private readonly constrained=Boolean((navigator as Navigator&{connection?:{saveData?:boolean};deviceMemory?:number}).connection?.saveData)||((navigator as Navigator&{deviceMemory?:number}).deviceMemory??8)<=2||navigator.hardwareConcurrency<=2;
  private readonly metrics={frames:0,frameMs:0,cpuMs:0,drawCalls:0,triangles:0,points:0};
  private readonly motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  private readonly compactQuery = window.matchMedia("(max-width:760px), (max-width:1000px) and (max-height:520px)");
  private readonly pointerQuery = window.matchMedia("(hover:hover) and (pointer:fine)");
  private rendererHost?:RendererHost;
  private environment?:THREE.WebGLRenderTarget;
  private resizeObserver?:ResizeObserver;
  private intersectionObserver?:IntersectionObserver;
  private preferenceObserver?:MutationObserver;
  private frame=0; private lastFrame=0; private elapsed=0; private heldAt:number|null=null;
  private progress=0; private desiredProgress=0;
  private detail=0; private detailOpen=false; private detailFocus=false;
  private pointer={x:0,y:0}; private desiredPointer={x:0,y:0};
  private stageTop=0; private stageHeight=1; private heroHeight=1; private clothSlot?:HTMLElement;
  private journeyStops?:SpatialJourneyStops;
  private viewportWidth=1; private viewportHeight=1;
  private brandReady=false;
  private brandRevision=0;
  private brandArrival=0;
  private grab?:{id:number;x:number;y:number;u:number;v:number;active:boolean;element:HTMLElement};
  private grabFinished=0;
  private focusSide=1;
  private brandSlot={x:0,pageY:0,width:1,height:1};
  private compact=this.compactQuery.matches; private reduced=prefersStaticPlatform(this.motionQuery);
  private paused=false; private inView=true; private disposed=false;

  constructor(private readonly options:SceneOptions) {
    this.gallery=new SpatialGalleryStage(options.stage,this.scene,this.requestFrame);
    this.atmosphere=new SpatialAtmosphere(this.compact);
    this.atmosphere.setQuality(this.compact,this.reduced);
    this.cloth=new SpatialCloth(this.compact);this.cloth.setQuality(this.compact,this.reduced);
    this.scene.add(this.brand,this.atmosphere,this.cloth);
    try {
      const preset=this.compact?COMPACT_PRESET:DESKTOP_PRESET;
      this.rendererHost=new RendererHost({container:options.host,preset:{...preset,dprCap:Math.min(this.constrained?1:Infinity,preset.dprCap)},powerPreference:this.compact?"low-power":"high-performance",onContextState:this.onContextState});
      this.rendererHost.renderer.domElement.className="spatialSceneCanvas";
      this.rendererHost.renderer.info.autoReset=false;
      this.rendererHost.setExposure(1.02);
      this.scene.background=new THREE.Color(0x090d11);
      this.scene.fog=new THREE.FogExp2(0x090d11,.026);
      this.buildLighting();this.configureBloom();this.createRefraction();this.installObservers();this.resize();
      this.budget.suspend(this.budgetInactive(),frameLoop.now());
      this.progress=this.journey.snap(this.desiredProgress);
      options.onStatus("ready"); options.onProgress(0,1);
      void this.loadBrand();
    } catch(error) { this.dispose(); throw error; }
  }

  private buildLighting() {
    this.environment=createHeroStudio(this.rendererHost!.renderer,this.compact);this.scene.environment=this.environment.texture;
    this.scene.add(new THREE.HemisphereLight(0xc2d7e0,0x090d15,.17));
    this.keyLight.position.set(-5,8,5);
    this.faceLight.position.set(1,0,9);this.faceLight.intensity=this.compact?.92:.65;
    this.edgeLight.position.set(5,2,-3);this.edgeLight.intensity=this.compact?2.65:2.4;
    this.accentLight.position.set(2,2,4);
    this.scene.add(this.keyLight,this.faceLight,this.edgeLight,this.accentLight);
    this.scene.add(this.anatomyLight,this.anatomyLight.target,this.spineLight,this.spineLight.target);
  }

  private async loadBrand() {
    this.shaderAbort?.abort();
    this.brandAbort?.abort();
    const controller=this.brandAbort=new AbortController();
    const url=this.compact?SPATIAL_BRAND_MODEL.mobileUrl:SPATIAL_BRAND_MODEL.url;
    this.options.onProgress(0,1);
    try {
      const response=await fetch(url,{signal:controller.signal});
      if(!response.ok)throw new Error("brand_"+response.status);
      const total=Number(response.headers.get("content-length"))||0;let bytes:ArrayBuffer;
      if(response.body){
        const reader=response.body.getReader(),chunks:Uint8Array[]=[];let loaded=0,last=0;this.options.onProgress(0,total,"download");
        while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);loaded+=value.byteLength;if(performance.now()-last>70){this.options.onProgress(loaded,total,"download");last=performance.now();}}
        const joined=new Uint8Array(loaded);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.byteLength;}bytes=joined.buffer;
      }else bytes=await response.arrayBuffer();
      this.options.onProgress(bytes.byteLength,bytes.byteLength,"prepare");
      const gltf=await new GLTFLoader().parseAsync(bytes,url.slice(0,url.lastIndexOf("/")+1));
      if(this.disposed||this.brandAbort!==controller){disposeModel(gltf.scene);return;}
      if(SPATIAL_BRAND_MODEL.finish==="blackcrown-metal")finishMetal(gltf.scene);
      finishHeroMaterials(gltf.scene);
      const adapted=adaptSpatialBrand(gltf.scene,SPATIAL_BRAND_MODEL.fitSpan);
      this.shaderAbort?.abort();
      const previous=[...this.brand.children];this.brand.clear();this.brand.add(adapted.group);
      this.brandRevision++;
      previous.forEach(disposeModel);
      if(this.contextLost||this.restoring)return; // Recovery prepares the latest attached CPU model.
      // The cloth is initially outside the viewport. Compile it before scroll can reveal it.
      let warmed=true;
      try{warmed=await this.prepareShaders();}
      catch{warmed=false;}
      if(this.disposed||this.brandAbort!==controller||this.contextLost||this.restoring)return;
      this.options.stage.dataset.shaderWarmup=warmed?"ready":"fallback";
      if(!this.brandReady)this.brandArrival=this.elapsed;
      this.brandReady=true;this.options.stage.dataset.brandReady="1";this.resize();this.requestFrame();
      this.budget.reset(frameLoop.now());
    } catch { /* A missing hero model must not disable the games or their native fallback. */ }
    finally { if(!this.disposed&&this.brandAbort===controller)this.options.onProgress(1,1,"complete"); }
  }

  private configureBloom() {
    if(this.compact||this.constrained||this.budget.snapshot().level>=3){if(this.bloom)this.shaderAbort?.abort();this.bloom?.dispose();this.bloom=undefined;return;}
    if(!this.bloom&&this.rendererHost){
      try{this.bloom=new SpatialBloom(this.rendererHost.renderer,this.scene,this.camera);}catch{/* Keep the 3D scene usable if HDR targets are unavailable. */}
    }
  }

  private async prepareShaders(){
    this.shaderAbort?.abort();const controller=this.shaderAbort=new AbortController();
    const sceneReady=await(this.bloom?this.bloom.warmup(controller.signal):prepareSceneShaders(this.rendererHost!.renderer,this.scene,this.camera,controller.signal));
    if(controller.signal.aborted||this.disposed||this.contextLost&&!this.restoring)return false;
    // The live background uses a linear output variant even on the direct
    // mobile path. Prepare it before scroll, without retaining a hero target.
    const opticsReady=this.reduced||this.constrained||!this.refraction?true:await this.refraction.warmup(controller.signal,sampler=>this.drawOpticsPreparation(sampler));
    return sceneReady&&opticsReady;
  }

  /** One offscreen first-use submission during the existing loading owner.
   * No live capture, camera changes or persistent hero allocation. */
  private drawOpticsPreparation(sampler:THREE.Texture){
    const cloth=this.cloth,capture=this.refraction;
    const saved={background:cloth.background.value,renderSize:cloth.renderSize.value.clone(),backgroundSize:cloth.backgroundSize.value.clone(),refraction:cloth.refraction.value,
      depth:cloth.depthBackground.value,depthRange:cloth.depthRange.value.clone(),depthReady:cloth.depthReady.value,
      cssSize:cloth.cssSize.value.clone(),projection:cloth.opticalProjection.value.clone(),plane:cloth.opticalExitPlane.value.clone(),depthMode:this.atmosphere.backgroundDepthCapture.value>.5};
    const objects:{object:THREE.Object3D;visible:boolean;frustumCulled:boolean}[]=[],sides=new Map<THREE.Material,THREE.Side>();
    try{
    this.scene.traverse(object=>{
      const drawable=object as THREE.Mesh;
      const materials=Array.isArray(drawable.material)?drawable.material:drawable.material?[drawable.material]:[];
      let allowed=false;for(let parent:THREE.Object3D|null=object;parent;parent=parent.parent)if(parent===cloth||parent===this.atmosphere){allowed=true;break;}
      if(allowed||materials.length){
        objects.push({object,visible:object.visible,frustumCulled:object.frustumCulled});
        // Reveal only the optical roots. Quality-hidden atmosphere children
        // must not upload/render just because the root is prepared offscreen.
        if(object===cloth||object===this.atmosphere)object.visible=true;
        else if(!allowed)object.visible=false;
        object.frustumCulled=false;
      }
      for(const entry of materials)sides.set(entry,entry.side);
    });
      cloth.setOptics(sampler,1,1,1);cloth.setDepthOptics(sampler,this.camera.near,this.camera.far);
      this.atmosphere.setBackgroundDepthCapture(true);
      this.rendererHost!.renderer.render(this.scene,this.camera);
    }finally{
      try{this.atmosphere.setBackgroundDepthCapture(saved.depthMode);}finally{
      for(const [entry,side]of sides)if(entry.side!==side){entry.side=side;entry.needsUpdate=true;}
      objects.forEach(({object,visible,frustumCulled})=>{object.visible=visible;object.frustumCulled=frustumCulled;});
      cloth.background.value=saved.background;cloth.renderSize.value.copy(saved.renderSize);cloth.backgroundSize.value.copy(saved.backgroundSize);cloth.refraction.value=saved.refraction;
      cloth.depthBackground.value=saved.depth;cloth.depthRange.value.copy(saved.depthRange);cloth.depthReady.value=saved.depthReady;
      cloth.cssSize.value.copy(saved.cssSize);cloth.opticalProjection.value.copy(saved.projection);cloth.opticalExitPlane.value.copy(saved.plane);
      // A synchronous lost/dispose callback may already have cleared these
      // references. Cleanup must not resurrect its released capture textures.
      if(this.disposed||this.contextLost||capture!==this.refraction||this.rendererHost!.renderer.getContext().isContextLost()){
        cloth.setOptics(null,1,1,0);cloth.setDepthOptics(null,this.camera.near,this.camera.far);
      }
      }
    }
  }

  private createRefraction(){
    this.cloth.setOptics(null,1,1,0);this.cloth.setDepthOptics(null,this.camera.near,this.camera.far);this.refraction?.dispose();
    if(!this.rendererHost)return;
    this.refraction=new SpatialRefraction(this.rendererHost.renderer,this.scene,this.camera,{
      exclude:()=>[this.cloth],compact:this.compact,
      beforeCapture:()=>{
        this.atmosphere.setBackgroundCapture(this.clothBackgroundDepth(),this.refraction!.size.x/Math.max(1,this.viewportWidth));
      },
      afterCapture:()=>this.atmosphere.setBackgroundCapture(null),
      depthObjects:()=>[this.atmosphere],
      beforeDepthCapture:()=>this.atmosphere.setBackgroundDepthCapture(true),
      afterDepthCapture:()=>this.atmosphere.setBackgroundDepthCapture(false),
    });
  }
  private clothBackgroundDepth(){
    const m=this.cloth.matrixWorld.elements;
    // Conservative bounds include the authored folds and bounded input response.
    return m[14]-(Math.abs(m[2])*.9+Math.abs(m[6])*.9+Math.abs(m[10])*1.2)-.05;
  }
  private applyBudget(){
    if(!this.rendererHost)return;
    const level=this.budget.snapshot().level,preset=this.compact?COMPACT_PRESET:DESKTOP_PRESET;
    this.rendererHost.setPreset({...preset,dprCap:Math.min(this.constrained?1:Infinity,level>=2?(this.compact?.85:1.05):preset.dprCap)});
    this.options.stage.dataset.runtimeQuality=String(level);
    this.configureBloom();this.resize();
  }
  private cancelGrab(){
    const grab=this.grab;this.grab=undefined;
    if(grab?.active&&grab.element.hasPointerCapture(grab.id)){
      try{grab.element.releasePointerCapture(grab.id);}catch{/* The browser may already have cancelled it. */}
    }
    this.cloth.release();this.cloth.setHover(.5,.5,0);
  }
  private budgetInactive(){return document.hidden||!this.inView||this.paused||this.reduced||this.contextLost||this.restoring||this.detailOpen;}
  private updateMotionHold(){
    const held=this.paused||!this.inView||this.contextLost||this.restoring,now=frameLoop.now();
    if(held&&this.heldAt===null){this.heldAt=now;this.detailMotion.sample(now);}
    else if(!held&&this.heldAt!==null){this.detailMotion.delay(now-this.heldAt);this.heldAt=null;}
  }
  private releaseOptics(){this.cloth.setOptics(null,1,1,0);this.cloth.setDepthOptics(null,this.camera.near,this.camera.far);this.refraction?.setEnabled(false);}
  private onContextState=(state:"ready"|"lost")=>{
    if(this.disposed)return;
    if(state==="lost"){
      this.contextRevision++;this.contextLost=true;this.restoring=false;
      this.shaderAbort?.abort();
      this.updateMotionHold();
      this.stop();this.cancelGrab();this.budget.suspend(true,frameLoop.now());
      this.cloth.setOptics(null,1,1,0);this.cloth.setDepthOptics(null,this.camera.near,this.camera.far);this.refraction?.dispose();this.refraction=undefined;this.opticsWeight=0;
      this.options.stage.dataset.contextState="lost";this.options.onStatus("fallback");
    }else if(this.contextLost&&!this.restoring){void this.restoreContext();}
  };
  private async restoreContext(){
    if(!this.rendererHost||this.disposed)return;
    this.restoring=true;const revision=this.contextRevision;
    try{
      const previous=this.environment;
      this.environment=createHeroStudio(this.rendererHost.renderer,this.compact);this.scene.environment=this.environment.texture;previous?.dispose();
      this.bloom?.dispose();this.bloom=undefined;this.configureBloom();this.createRefraction();this.resize();
      let studioCompact=this.compact,warmed=false;
      // One in-flight recovery. A model attached during warmup invalidates only
      // that preparation, never publishes an unprepared replacement as ready.
      while(true){
        if(studioCompact!==this.compact){
          const old=this.environment;this.environment=createHeroStudio(this.rendererHost.renderer,this.compact);this.scene.environment=this.environment.texture;old?.dispose();studioCompact=this.compact;
        }
        const model=this.brandRevision,compact=this.compact,restoredBloom=this.bloom as SpatialBloom|undefined;
        warmed=await this.prepareShaders();
        if(this.disposed||revision!==this.contextRevision)return;
        if(model===this.brandRevision&&compact===this.compact&&restoredBloom===this.bloom)break;
      }
      this.contextLost=false;this.restoring=false;
      this.updateMotionHold();
      if(this.brand.children.length){if(!this.brandReady)this.brandArrival=this.elapsed;this.brandReady=true;this.options.stage.dataset.brandReady="1";}
      this.resize();
      this.options.stage.dataset.contextState="ready";this.options.stage.dataset.shaderWarmup=warmed?"ready":"fallback";
      this.budget.suspend(this.budgetInactive(),frameLoop.now());this.options.onStatus("ready");this.requestFrame();
    }catch{if(!this.disposed&&revision===this.contextRevision)this.fail();}
  }

  /** Local, bounded diagnostics. No telemetry, storage, user identifiers or network. */
  diagnostics(){
    const renderer=this.rendererHost?.renderer,optics=this.refraction?.snapshot();
    return {frames:{...this.metrics},clock:frameLoop.snapshot(),quality:this.budget.snapshot(),context:{lost:this.contextLost,restoring:this.restoring,revision:this.contextRevision},
      resources:{memory:renderer?{...renderer.info.memory}:null,programs:renderer?.info.programs?.length??0,brandMeshes:this.brand.children.length,bloom:!!this.bloom,optics:optics?{...optics,estimatedBytes:optics.colorBytes+optics.pixels*4+optics.depthColorBytes+optics.depthPixels*4}:null},
      opticsWeight:this.opticsWeight,profile:this.cloth.profile,brandReady:this.brandReady};
  }

  setWorld(index:number,visibleGames:readonly number[]=platformGames.map((_,i)=>i)) {
    if(this.disposed)return;
    const selected=visibleGames.includes(index)?index:visibleGames[0]??0;
    this.worldIndices=visibleGames;
    this.desiredAccent.set(WORLD_ACCENTS[selected]??WORLD_ACCENTS[0]);this.requestFrame();
  }
  setDetailOpen(open:boolean){
    if(this.detailOpen===open)return;
    this.detailOpen=open;
    if(open){const selected=this.options.stage.querySelector<HTMLElement>('.spatialGamePanel[data-selected="true"]')?.getBoundingClientRect();this.focusSide=selected&&selected.left+selected.width*.5<this.viewportWidth*.5?-1:1;this.cancelGrab();}
    if(open)this.releaseOptics();
    this.budget.suspend(this.budgetInactive(),frameLoop.now());
    this.gallery.invalidate();
    if(!open)this.onScroll();
    this.requestFrame();
  }
  touchCloth(clientX?:number,clientY?:number) {
    if(this.disposed||this.contextLost||this.paused||this.reduced||this.detailOpen)return false;
    const box=this.clothSlot?.getBoundingClientRect();if(!box?.width||!box.height)return false;
    const u=clientX===undefined?.5:(clientX-box.left)/box.width,v=clientY===undefined?.5:1-(clientY-box.top)/box.height;
    if(frameLoop.now()-this.grabFinished>220)this.cloth.touch(u,v,this.elapsed);this.requestFrame();return true;
  }
  syncScroll(){if(this.disposed)return;this.resize();this.progress=this.journey.snap(this.desiredProgress);this.requestFrame();}
  setDetailFocus(focused:boolean){
    if(this.detailFocus===focused)return;
    this.detailFocus=focused;
    if(this.paused||this.reduced||!this.inView||this.contextLost||this.restoring)this.detailMotion.rebase([focused?1:0]);
    else this.detailMotion.moveTo([focused?1:0],focused?SPATIAL_TIMING.open:SPATIAL_TIMING.close,frameLoop.now());
    this.requestFrame();
  }
  setPaused(paused:boolean){
    if(this.paused===paused)return;
    if(paused)this.cancelGrab();
    this.paused=paused;
    this.updateMotionHold();this.budget.suspend(this.budgetInactive(),frameLoop.now());
    this.gallery.invalidate();
    if(paused)this.cloth.setHover(.5,.5,0);
    this.stop();this.requestFrame();
  }

  private installObservers(){
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(this.options.host);this.resizeObserver.observe(this.options.stage);
    for(const selector of [".spatialBrandSlot",".spatialClothControl",".spatialGameGrid"]){
      const element=this.options.stage.querySelector(selector);if(element)this.resizeObserver.observe(element);
    }
    this.intersectionObserver=new IntersectionObserver(([entry])=>{this.inView=entry.isIntersecting;this.updateMotionHold();this.budget.suspend(this.budgetInactive(),frameLoop.now());if(this.inView)this.requestFrame();else{this.cancelGrab();this.releaseOptics();this.stop();}});
    this.intersectionObserver.observe(this.options.stage);
    this.preferenceObserver=new MutationObserver(this.onPreferenceChange);
    this.preferenceObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-reduced-motion"]});
    this.motionQuery.addEventListener("change",this.onPreferenceChange);this.compactQuery.addEventListener("change",this.onPreferenceChange);
    window.addEventListener("scroll",this.onScroll,{passive:true});window.addEventListener("resize",this.resize,{passive:true});
    window.addEventListener("pointerdown",this.onGrabStart);window.addEventListener("pointerup",this.onGrabEnd);window.addEventListener("pointercancel",this.onGrabEnd);
    window.addEventListener("pointermove",this.onPointer,{passive:false});document.addEventListener("visibilitychange",this.onVisibility);
    window.addEventListener("spatialcasehandoff",this.onCaseHandoff);
  }
  private resize=()=>{
    if(this.disposed||!this.rendererHost)return;
    this.viewportWidth=this.options.host.clientWidth;this.viewportHeight=this.options.host.clientHeight;
    this.rendererHost.resize(this.viewportWidth,this.viewportHeight);
    this.bloom?.resize(this.viewportWidth,this.viewportHeight,this.rendererHost.renderer.getPixelRatio());
    this.camera.aspect=this.viewportWidth/Math.max(1,this.viewportHeight);this.camera.updateProjectionMatrix();
    this.gallery.layout(this.viewportWidth,this.viewportHeight,this.compact,this.reduced||!this.brandReady);
    const box=this.options.stage.getBoundingClientRect();
    this.stageTop=box.top+window.scrollY;this.stageHeight=box.height;
    const slot=this.options.stage.querySelector(".spatialBrandSlot")?.getBoundingClientRect();
    if(slot)this.brandSlot={x:slot.left+slot.width/2,pageY:slot.top+window.scrollY+slot.height/2,width:slot.width,height:slot.height};
    this.clothSlot=this.options.stage.querySelector<HTMLElement>(".spatialClothControl")??undefined;
    const hero=this.options.stage.querySelector(".spatialHero")?.getBoundingClientRect();
    if(hero)this.heroHeight=hero.height;
    const heading=this.options.stage.querySelector(".spatialGalleryHead")?.getBoundingClientRect();
    const about=this.options.stage.querySelector(".spatialIntro")?.getBoundingClientRect();
    const panels=[...this.options.stage.querySelectorAll<HTMLElement>(".spatialGamePanel")].map(element=>element.getBoundingClientRect());
    const material=this.options.stage.querySelector(".spatialMaterial")?.getBoundingClientRect();
    const transition=this.options.stage.querySelector(".spatialTransition")?.getBoundingClientRect();
    const cloth=this.clothSlot?.getBoundingClientRect();
    const span=Math.max(1,this.stageHeight-this.viewportHeight);
    const at=(y:number)=>Math.max(0,Math.min(.98,(y+window.scrollY-this.stageTop)/span));
    if(hero&&heading&&panels.length&&material)this.journeyStops={
      about:about?at(about.top+about.height*.5-this.viewportHeight*.5):undefined,
      intro:at(heading.top-this.viewportHeight*.35),
      projects:panels.map(panel=>at(panel.top+panel.height*.5-this.viewportHeight*.5)),
      exit:at((transition??material).top-this.viewportHeight*.65),
      lab:at(cloth?cloth.top+cloth.height*.5-this.viewportHeight*.5:material.top-this.viewportHeight*.18),
    };
    this.fitBrand();this.onScroll();
  };
  private fitBrand(){
    const journey=spatialAxisJourney({compact:this.compact,width:this.viewportWidth,height:this.viewportHeight,
      slot:{x:this.brandSlot.x,y:this.brandSlot.pageY-this.stageTop,width:this.brandSlot.width,height:this.brandSlot.height},stops:this.journeyStops});
    this.cameraRig=new CameraRig(this.camera,journey.frames,true);
    this.brand.scale.setScalar(journey.axisHeight/4.2);this.brand.position.set(0,0,0);
    this.axisHeight=journey.axisHeight;
    this.anatomyLight.position.set(-this.axisHeight*.1,this.axisHeight*.285,5.5);
    this.anatomyLight.target.position.set(-.1,this.axisHeight*.275,.5);
    this.atmosphere.setAxisHeight(journey.axisHeight);
  }
  private onScroll=()=>{
    // Native dialog scroll locking must never rewind the sculpture timeline.
    if(this.detailOpen)return;
    const heroTravel=Math.max(0,window.scrollY-this.stageTop);
    const heroOpacity=1-THREE.MathUtils.smoothstep(heroTravel,this.heroHeight*.18,this.heroHeight*.6);
    this.options.stage.style.setProperty("--spatial-hero-ui-opacity",String(heroOpacity));
    this.options.stage.dataset.heroUiHidden=heroOpacity===0?"1":"0";
    this.desiredProgress=spatialProgress(window.scrollY,this.stageTop,this.stageHeight,this.viewportHeight);
    this.requestFrame();
  };
  private onPointer=(event:PointerEvent)=>{
    if(this.disposed||this.contextLost||this.reduced||this.paused||this.detailOpen)return;
    if(this.grab?.id===event.pointerId){
      const g=this.grab,dx=event.clientX-g.x,dy=event.clientY-g.y;
      if(!g.active&&Math.abs(dy)>8&&Math.abs(dy)>Math.abs(dx)){this.grab=undefined;return;}
      if(!g.active&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)*1.2){g.active=true;g.element.setPointerCapture(event.pointerId);}
      if(g.active){event.preventDefault();const b=g.element.getBoundingClientRect();this.cloth.grab(g.u,g.v,dx/b.width*.65,-dy/b.height*.4);this.requestFrame();return;}
    }
    if(!this.pointerQuery.matches||event.pointerType!=="mouse")return;
    const cloth=(event.target as Element).closest(".spatialClothControl");
    if(cloth){
      const box=cloth.getBoundingClientRect();
      this.cloth.setHover((event.clientX-box.left)/box.width,1-(event.clientY-box.top)/box.height,1);
      this.desiredPointer.x=this.desiredPointer.y=0;this.requestFrame();return;
    }
    this.cloth.setHover(.5,.5,0);
    this.gallery.pointer(event);
    if(this.compact)return;
    this.desiredPointer.x=(event.clientX/Math.max(1,window.innerWidth)-.5)*.85;
    this.desiredPointer.y=(event.clientY/Math.max(1,window.innerHeight)-.5)*.65;this.requestFrame();
  };
  private onGrabStart=(event:PointerEvent)=>{
    if(this.contextLost||this.paused||this.reduced||this.detailOpen||event.button!==0)return;
    const element=(event.target as Element).closest<HTMLElement>(".spatialClothControl");if(!element)return;const b=element.getBoundingClientRect();
    this.grab={id:event.pointerId,x:event.clientX,y:event.clientY,u:(event.clientX-b.left)/b.width,v:1-(event.clientY-b.top)/b.height,active:false,element};
  };
  private onGrabEnd=(event:PointerEvent)=>{if(this.grab?.id!==event.pointerId)return;if(this.grab.active)this.grabFinished=frameLoop.now();this.cancelGrab();this.requestFrame();};
  private onPreferenceChange=()=>{
    this.shaderAbort?.abort();
    const compact=this.compactQuery.matches,changed=compact!==this.compact;
    this.cancelGrab();
    this.compact=compact;this.reduced=prefersStaticPlatform(this.motionQuery);this.desiredPointer.x=this.desiredPointer.y=0;
    this.atmosphere.setQuality(compact,this.reduced);
    this.cloth.setQuality(compact,this.reduced);
    this.faceLight.intensity=compact?1.05:.82;this.edgeLight.intensity=compact?2.65:2.4;
    this.cloth.setHover(.5,.5,0);
    if(changed&&this.rendererHost&&!this.contextLost){
      const previous=this.environment;
      this.environment=createHeroStudio(this.rendererHost.renderer,compact);this.scene.environment=this.environment.texture;
      previous?.dispose();
    }
    this.budget.suspend(this.budgetInactive(),frameLoop.now());
    this.applyBudget();if(changed)void this.loadBrand();
  };
  private onCaseHandoff=()=>{this.gallery.invalidate();this.requestFrame();};
  private onVisibility=()=>{
    this.budget.suspend(this.budgetInactive(),frameLoop.now());
    if(document.hidden){this.cancelGrab();this.releaseOptics();this.stop();}else this.requestFrame();
  };
  private stop(){frameLoop.cancel(this.frame);this.frame=0;this.lastFrame=0;}
  private requestFrame=()=>{if(!this.disposed&&!this.contextLost&&!this.frame&&this.inView&&!document.hidden)this.frame=frameLoop.request(this.tick,"spatial-scene");};

  private tick=(now:number)=>{
    this.frame=0;if(this.disposed||this.contextLost||!this.inView||document.hidden||!this.rendererHost)return;
    const cpuStart=performance.now();
    const delta=this.lastFrame?now-this.lastFrame:16.67;
    this.lastFrame=now;
    const quality=this.budget.sample(delta,now);if(quality)this.applyBudget();
    const staticScene=this.reduced||this.paused,blend=staticScene?1:-Math.expm1(-Math.max(0,delta)/180);
    if(!staticScene)this.elapsed+=Math.min(delta,100)/1000;
    this.progress=this.journey.update(this.desiredProgress,delta,{paused:this.paused,detailOpen:this.detailOpen,reduced:this.reduced});
    if(this.reduced)this.detailMotion.rebase([this.detailFocus?1:0]);else if(!this.paused)this.detailMotion.sample(now);
    this.detail=this.detailMotion.value[0];
    this.pointer.x+=((this.reduced||this.detailOpen?0:this.paused?this.pointer.x:this.desiredPointer.x)-this.pointer.x)*blend;
    this.pointer.y+=((this.reduced||this.detailOpen?0:this.paused?this.pointer.y:this.desiredPointer.y)-this.pointer.y)*blend;
    if(!this.detailOpen){
      const palette=spatialWorldBlend(this.progress,this.journeyStops,this.worldIndices);
      this.desiredAccent.set(WORLD_ACCENTS[palette.from]??WORLD_ACCENTS[0]);
      this.paletteTarget.set(WORLD_ACCENTS[palette.to]??WORLD_ACCENTS[0]);
      this.desiredAccent.lerp(this.paletteTarget,palette.mix);
    }
    this.accent.lerp(this.desiredAccent,blend);this.accentLight.color.copy(this.accent);
    const snapshot={...INITIAL_SCROLL_SNAPSHOT,progress:this.progress,viewportWidth:this.viewportWidth,viewportHeight:this.viewportHeight,reducedMotion:this.reduced};
    this.cameraRig!.update(snapshot,{x:0,y:0},0);
    // One restrained arrival, then scroll owns the pose. Elapsed freezes on pause.
    if(this.compact&&this.brandReady&&!this.reduced){
      const opening=1-THREE.MathUtils.smoothstep(this.progress,0,spatialArrivalEnd(this.journeyStops));
      this.camera.position.z+=2.2*(1-THREE.MathUtils.smoothstep(this.elapsed-this.brandArrival,0,2.2))*opening;
    }
    if(this.detail>0&&!this.reduced){this.camera.position.x+=this.focusSide*(this.compact?.55:1.15)*this.detail;this.camera.position.z-=(this.compact?1.1:2)*this.detail;this.camera.lookAt(this.camera.position.x,this.camera.position.y,0);}
    this.camera.updateMatrixWorld();
    this.updateObjects();
    this.scene.updateMatrixWorld();
    if(this.cloth.visible)this.cloth.setOpticalBackgroundDepth(this.atmosphere.setLabDepth(this.clothBackgroundDepth(),this.camera.position.z,this.camera.position.y));
    else this.cloth.setOpticalBackgroundDepth(null);
    if(!this.detailOpen)this.gallery.update(this.camera,this.paused?window.scrollY:this.stageTop+this.progress*(this.stageHeight-this.viewportHeight),window.scrollY,this.reduced,this.brandReady);
    this.gallery.focus(this.detail);
    const opticsTarget=!this.reduced&&!this.constrained&&!this.detailOpen&&this.budget.snapshot().level===0&&!this.refraction?.snapshot().failed?1:0;
    if(this.reduced||this.constrained)this.opticsWeight=0;
    else this.opticsWeight+=(opticsTarget-this.opticsWeight)*-Math.expm1(-Math.max(0,delta)/180);
    if(this.cloth.visible)this.opticsLastSeen=now;
    try{this.renderFrame(now);}catch{
      if(this.bloom){
        this.bloom.dispose();this.bloom=undefined;
        try{this.renderFrame(now);}catch{this.fail();return;}
      }else{this.fail();return;}
    }
    this.metrics.frames++;this.metrics.frameMs=delta;this.metrics.cpuMs=performance.now()-cpuStart;
    // No 25/32fps idle cap: the turn and camera must share the display's frame cadence.
    // An opaque settled case owns its video; a hidden background does not burn GPU.
    if(!staticScene&&(!this.detailOpen||this.detailMotion.active))this.requestFrame();else this.lastFrame=0;
  };
  /** The one complete render boundary: capture + final scene/composer. */
  private renderFrame(now=frameLoop.now()){
    const renderer=this.rendererHost!.renderer;renderer.info.reset();
    if(this.bloom)this.bloom.getTargetSize(this.renderSize);else renderer.getDrawingBufferSize(this.renderSize);
    const capture=this.refraction,active=this.cloth.visible&&this.opticsWeight>.005&&!this.reduced;
    if(capture){
      capture.resize(this.viewportWidth,this.viewportHeight,this.renderSize.x/Math.max(1,this.viewportWidth),this.compact);
      const hold=active||(!this.reduced&&!this.constrained&&this.budget.snapshot().level===0&&now-this.opticsLastSeen<1000);
      this.cloth.setOptics(null,this.renderSize.x,this.renderSize.y,0);
      this.cloth.setDepthOptics(null,this.camera.near,this.camera.far);
      capture.setEnabled(hold);
      if(active&&capture.render()){
        this.cloth.setOptics(capture.texture,this.renderSize.x,this.renderSize.y,this.opticsWeight*(.5+.5*this.cloth.sculpture.value));
        this.cloth.setDepthOptics(capture.depthTexture,this.camera.near,this.camera.far);
      }
    }
    if(this.bloom)this.bloom.render();else renderer.render(this.scene,this.camera);
    this.metrics.drawCalls=renderer.info.render.calls;this.metrics.triangles=renderer.info.render.triangles;this.metrics.points=renderer.info.render.points;
  }
  private updateObjects(){
    const p=this.progress,t=this.elapsed;
    this.brand.visible=this.brandReady;
    this.brand.rotation.set(0,spatialAxisTurn(p,this.compact,this.reduced),0);
    const choreography=spatialChoreography(p,this.journeyStops),lab=choreography.departure;
    this.bloom?.setLabPresence(lab);
    const opening=this.compact?1-THREE.MathUtils.smoothstep(p,0,spatialArrivalEnd(this.journeyStops)):0;
    this.keyLight.intensity=3.05+opening*1.2-lab*.85;
    this.faceLight.intensity=((this.compact?1.05:.82)+opening*.55)*(1-lab*.35);
    this.edgeLight.intensity=((this.compact?2.65:2.4)+opening*.45)*(1-lab*.25);
    this.anatomyLight.intensity=(this.compact?55:40)*(.65+choreography.arrival*.35)*(1-lab)+(this.compact?95:75)*lab;
    this.anatomyLight.position.set(-this.axisHeight*.1,this.axisHeight*.285,5.5);
    this.anatomyLight.target.position.set(-.1,this.axisHeight*.275,.5);
    const galleryPresence=this.journeyStops?THREE.MathUtils.smoothstep(p,this.journeyStops.intro*.6,this.journeyStops.intro*1.05):THREE.MathUtils.smoothstep(p,.08,.2);
    const spineT=THREE.MathUtils.clamp((.26986-this.camera.position.y/this.axisHeight)/.76973,0,1);
    const spineX=this.axisHeight*.02167*Math.sin(spineT*Math.PI*2)*Math.sin(spineT*Math.PI)**2;
    this.spineLight.position.set(spineX+3.5,this.camera.position.y+1.4,4.6);
    this.spineLight.target.position.set(spineX,this.camera.position.y-1,0);
    this.spineLight.intensity=(this.compact?65:58)*galleryPresence*(1-lab);
    this.spineLight.color.set(0x91b9c9).lerp(this.accent,.55);
    this.edgeLight.color.set(0x92c5d5).lerp(this.accent,.22*galleryPresence);
    this.atmosphereOrigin.set(0,this.reduced?0:this.camera.position.y*lab,0);
    this.atmosphere.setChoreography(choreography.arrival,lab);
    const atmosphereDpr=Math.min(this.bloom?1.25:Infinity,this.rendererHost!.renderer.getPixelRatio());
    this.atmosphere.update(t,p,this.detail,this.pointer,this.atmosphereOrigin,atmosphereDpr,this.accent,lab);
    this.accentLight.position.set(2,this.camera.position.y+2,4);
    const sheet=this.clothSlot?.getBoundingClientRect();
    const transition=this.options.stage.querySelector(".spatialTransition")?.getBoundingClientRect();
    const interlude=spatialInterludeVisible(transition);
    const outro=this.options.stage.querySelector(".spatialAbout")?.getBoundingClientRect();
    const outroPresence=!!outro&&outro.top<this.viewportHeight&&outro.bottom>0;
    const farewell=outro?1-THREE.MathUtils.smoothstep(outro.top,this.viewportHeight*.12,this.viewportHeight*.95):0;
    this.cloth.setSculpture(1-farewell);
    const closingTravel=this.compact?THREE.MathUtils.smoothstep(farewell,.5,1):farewell;
    const closingFold=this.compact?Math.sin(Math.PI*THREE.MathUtils.smoothstep(farewell,.18,1)):0;
    this.options.stage.style.setProperty("--spatial-cloth-hint-opacity",String(1-THREE.MathUtils.smoothstep(farewell,.15,.4)));
    const catalogueCleared=!!transition&&transition.top<=0;
    this.cloth.visible=this.brandReady&&!!sheet&&catalogueCleared&&((sheet.bottom>0&&sheet.top<this.viewportHeight)||interlude||outroPresence)&&!this.detailOpen;
    const interludeReveal=transition?THREE.MathUtils.smoothstep(-transition.top,0,this.viewportHeight*.24):0;
    this.cloth.material.opacity=(interlude?interludeReveal:1)*(1-farewell*(this.compact?.12:.24));
    // A visible folded volume arrives only after the last game has cleared.
    // Its opening is continuous and reversible; it never spends a chapter edge-on.
    this.cloth.setEntrance(this.reduced?1:THREE.MathUtils.lerp(Math.max(interlude?.46+interludeReveal*.2:0,lab),this.compact?.96:.66,farewell)*(1-closingFold*.35));
    if(sheet&&this.cloth.visible){
      // The sheet enters below the copy in its real native slot, never behind it.
      const slotX=sheet.left+sheet.width/2,slotY=sheet.top+sheet.height/2;
      const outroSlot=this.compact?this.options.stage.querySelector(".spatialOutroClothSlot")?.getBoundingClientRect():undefined;
      const nativeOutro=outroSlot&&outroSlot.width>0?outroSlot:undefined;
      const outroX=nativeOutro?nativeOutro.left+nativeOutro.width/2:this.viewportWidth*.79;
      const outroY=nativeOutro?nativeOutro.top+nativeOutro.height/2:this.viewportHeight*.54;
      // The same sheet travels around the copy, then settles in a full native
      // closing frame. It never remains as an accidentally cropped side strip.
      const returnArc=nativeOutro?(.4*THREE.MathUtils.smoothstep(farewell,0,.5)+.8*Math.sin(Math.PI*closingTravel))*(1-closingTravel):0;
      const centerX=THREE.MathUtils.lerp(slotX,outroX,farewell)+returnArc*this.viewportWidth;
      const width=THREE.MathUtils.lerp(sheet.width,nativeOutro?.width??this.viewportWidth*(this.reduced?.34:.39),closingTravel);
      const height=THREE.MathUtils.lerp(sheet.height,nativeOutro?.height??this.viewportHeight*.86,closingTravel);
      let centerY=THREE.MathUtils.lerp(slotY,outroY,closingTravel);
      if(nativeOutro){
        const copy=this.options.stage.querySelector(".spatialAboutText")?.getBoundingClientRect();
        if(copy)centerY=THREE.MathUtils.lerp(centerY,Math.max(centerY,copy.bottom+28+height*.55),THREE.MathUtils.smoothstep(closingTravel,.15,.35));
      }
      // At the journey's end the sticky canvas leaves with its section. Native
      // slots remain in viewport coordinates, so map them into the canvas first.
      const canvasBox=this.options.host.getBoundingClientRect();
      const position=panelScreenPosition(this.camera,centerX-canvasBox.left,centerY-canvasBox.top,this.viewportWidth,this.viewportHeight,4.4);
      const unit=panelFrontWidth(this.camera,this.viewportWidth,1,position),worldWidth=width/unit;
      this.cloth.position.copy(position);this.cloth.position.y+=height/unit*.015;
      // Keep the authored loose hem inside the interactive slot at both sizes.
      // The deeper LAB folds need lateral room; the bounded farewell keeps its existing fit.
      this.cloth.scale.set(worldWidth*THREE.MathUtils.lerp(this.compact?.74:.94,nativeOutro?.9:.94,farewell)*(1-closingFold*.65),height/unit*.88,worldWidth*.66);this.cloth.update(this.reduced?0:t);
      this.cloth.rotation.set(-.06,THREE.MathUtils.lerp(THREE.MathUtils.lerp(-.42,this.compact?-.035:-.14,this.reduced?1:lab),nativeOutro?-.16:-.48,farewell),THREE.MathUtils.lerp(-.035,nativeOutro?.025:-.1,farewell));
      this.lightAim.set(this.cloth.position.x-3,this.cloth.position.y+3,this.cloth.position.z+5.5);
      this.anatomyLight.position.lerp(this.lightAim,lab);
      this.anatomyLight.target.position.lerp(this.cloth.position,lab);
    }
  }
  private fail(){if(!this.disposed){this.options.onStatus("fallback");this.dispose();}}
  dispose(){
    if(this.disposed)return;this.disposed=true;this.stop();this.brandAbort?.abort();this.shaderAbort?.abort();
    this.contextRevision++;this.cancelGrab();
    this.resizeObserver?.disconnect();this.intersectionObserver?.disconnect();this.preferenceObserver?.disconnect();
    this.motionQuery.removeEventListener("change",this.onPreferenceChange);this.compactQuery.removeEventListener("change",this.onPreferenceChange);
    window.removeEventListener("scroll",this.onScroll);window.removeEventListener("resize",this.resize);window.removeEventListener("pointermove",this.onPointer);document.removeEventListener("visibilitychange",this.onVisibility);
    window.removeEventListener("pointerdown",this.onGrabStart);window.removeEventListener("pointerup",this.onGrabEnd);window.removeEventListener("pointercancel",this.onGrabEnd);
    window.removeEventListener("spatialcasehandoff",this.onCaseHandoff);
    delete this.options.stage.dataset.brandReady;delete this.options.stage.dataset.shaderWarmup;delete this.options.stage.dataset.heroUiHidden;
    delete this.options.stage.dataset.runtimeQuality;delete this.options.stage.dataset.contextState;
    this.cloth.setOptics(null,1,1,0);this.cloth.setDepthOptics(null,this.camera.near,this.camera.far);this.refraction?.dispose();
    this.options.stage.style.removeProperty("--spatial-hero-ui-opacity");this.gallery.dispose();this.atmosphere.dispose();this.cloth.dispose();this.bloom?.dispose();
    this.options.stage.style.removeProperty("--spatial-cloth-hint-opacity");
    disposeModel(this.scene);this.scene.clear();this.scene.environment=null;this.environment?.dispose();this.rendererHost?.dispose();
  }
}
