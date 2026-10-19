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
import { spatialAxisJourney, spatialAxisTurn, type SpatialJourneyStops } from "./SpatialAxis";
import { SpatialCloth } from "./SpatialCloth";
import { panelFrontWidth, panelScreenPosition } from "./panelProjection";
import { ScrollJourney, SurfaceMotion, SPATIAL_TIMING } from "./spatialMotion";
import { WORLD_ACCENTS, spatialProgress } from "./spatialState";

const COMPACT_PRESET = { ...QUALITY_PRESETS.low, dprCap:SPATIAL_ATMOSPHERE_QUALITY.mobile.dpr, antialias:true };
const DESKTOP_PRESET = { ...QUALITY_PRESETS.high, dprCap:SPATIAL_ATMOSPHERE_QUALITY.desktop.dpr };
type SceneOptions = { host:HTMLElement; stage:HTMLElement; onStatus:(status:"ready"|"fallback")=>void; onProgress:(complete:number,total:number)=>void };

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
  private readonly atmosphereOrigin = new THREE.Vector3();
  private readonly accentLight = new THREE.PointLight(WORLD_ACCENTS[0],14,22,2);
  private readonly faceLight = new THREE.DirectionalLight(0xe0e8e8,1);
  private readonly edgeLight = new THREE.DirectionalLight(0x92c5d5,1);
  private readonly keyLight = new THREE.DirectionalLight(0xf0eeeb,3.6);
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
  private progress=0; private desiredProgress=0;
  private detail=0; private detailOpen=false; private detailFocus=false;
  private pointer={x:0,y:0}; private desiredPointer={x:0,y:0};
  private stageTop=0; private stageHeight=1; private heroHeight=1; private clothSlot?:HTMLElement;
  private journeyStops?:SpatialJourneyStops;
  private viewportWidth=1; private viewportHeight=1;
  private brandReady=false;
  private brandSlot={x:0,pageY:0,width:1,height:1};
  private compact=this.compactQuery.matches; private reduced=prefersStaticPlatform(this.motionQuery);
  private paused=false; private inView=true; private disposed=false;

  constructor(private readonly options:SceneOptions) {
    this.atmosphere=new SpatialAtmosphere(this.compact);
    this.atmosphere.setQuality(this.compact,this.reduced);
    this.cloth=new SpatialCloth(this.compact);this.cloth.setQuality(this.compact,this.reduced);
    this.scene.add(this.brand,this.atmosphere,this.cloth);
    try {
      this.rendererHost=new RendererHost({container:options.host,preset:this.compact?COMPACT_PRESET:DESKTOP_PRESET,powerPreference:this.compact?"low-power":"high-performance",onContextState:state=>{if(state==="lost")this.fail();}});
      this.rendererHost.renderer.domElement.className="spatialSceneCanvas";
      this.rendererHost.setExposure(1.02);
      this.scene.background=new THREE.Color(0x090d11);
      this.scene.fog=new THREE.FogExp2(0x090d11,.026);
      this.buildLighting();this.configureBloom();this.installObservers();this.resize();
      this.progress=this.journey.snap(this.desiredProgress);
      options.onStatus("ready"); options.onProgress(0,1);
      void this.loadBrand();
    } catch(error) { this.dispose(); throw error; }
  }

  private buildLighting() {
    const room=new RoomEnvironment(), pmrem=new PMREMGenerator(this.rendererHost!.renderer);
    try { this.environment=pmrem.fromScene(room,.05); this.scene.environment=this.environment.texture; }
    finally { room.dispose(); pmrem.dispose(); }
    this.scene.add(new THREE.HemisphereLight(0xd8e3e5,0x101720,.65));
    this.keyLight.position.set(-5,9,6);
    this.faceLight.position.set(1,0,9);this.faceLight.intensity=this.compact?1.45:.8;
    this.edgeLight.position.set(5,2,-3);this.edgeLight.intensity=this.compact?3.1:3.5;
    this.accentLight.position.set(2,2,4);
    this.scene.add(this.keyLight,this.faceLight,this.edgeLight,this.accentLight);
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
      // The cloth is initially outside the viewport. Compile it before scroll can reveal it.
      let warmed=true;
      try{await (this.bloom?this.bloom.warmup():this.rendererHost!.renderer.compileAsync(this.scene,this.camera));}
      catch{warmed=false;}
      if(this.disposed||this.brandAbort!==controller)return;
      this.options.stage.dataset.shaderWarmup=warmed?"ready":"fallback";
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

  setWorld(index:number,visibleGames:readonly number[]=platformGames.map((_,i)=>i)) {
    if(this.disposed)return;
    const selected=visibleGames.includes(index)?index:visibleGames[0]??0;
    this.desiredAccent.set(WORLD_ACCENTS[selected]??WORLD_ACCENTS[0]);this.requestFrame();
  }
  setDetailOpen(open:boolean){
    if(this.detailOpen===open)return;
    this.detailOpen=open;
    if(!open)this.onScroll();
    this.requestFrame();
  }
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
  setPaused(paused:boolean){
    if(this.paused===paused)return;
    if(paused&&!this.paused){this.pausedAt=performance.now();this.detailMotion.sample(this.pausedAt);}
    if(!paused&&this.paused)this.detailMotion.delay(performance.now()-this.pausedAt);
    this.paused=paused;
    if(paused)this.cloth.setHover(.5,.5,0);
    this.stop();this.requestFrame();
  }

  private installObservers(){
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(this.options.host);this.resizeObserver.observe(this.options.stage);
    for(const selector of [".spatialBrandSlot",".spatialClothControl",".spatialGameGrid"]){
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
    const box=this.options.stage.getBoundingClientRect();
    this.stageTop=box.top+window.scrollY;this.stageHeight=box.height;
    const slot=this.options.stage.querySelector(".spatialBrandSlot")?.getBoundingClientRect();
    if(slot)this.brandSlot={x:slot.left+slot.width/2,pageY:slot.top+window.scrollY+slot.height/2,width:slot.width,height:slot.height};
    this.clothSlot=this.options.stage.querySelector<HTMLElement>(".spatialClothControl")??undefined;
    const hero=this.options.stage.querySelector(".spatialHero")?.getBoundingClientRect();
    if(hero)this.heroHeight=hero.height;
    const heading=this.options.stage.querySelector(".spatialGalleryHead")?.getBoundingClientRect();
    const panels=[...this.options.stage.querySelectorAll<HTMLElement>(".spatialGamePanel")].map(element=>element.getBoundingClientRect());
    const material=this.options.stage.querySelector(".spatialMaterial")?.getBoundingClientRect();
    const span=Math.max(1,this.stageHeight-this.viewportHeight);
    const at=(y:number)=>Math.max(0,Math.min(.98,(y+window.scrollY-this.stageTop)/span));
    if(hero&&heading&&panels.length&&material)this.journeyStops={
      intro:at(heading.top-this.viewportHeight*.35),
      projects:panels.map(panel=>at(panel.top+panel.height*.5-this.viewportHeight*.5)),
      exit:at(material.top-this.viewportHeight*.88),
      lab:at(material.top-this.viewportHeight*.18),
    };
    this.fitBrand();this.onScroll();
  };
  private fitBrand(){
    const journey=spatialAxisJourney({compact:this.compact,width:this.viewportWidth,height:this.viewportHeight,
      slot:{x:this.brandSlot.x,y:this.brandSlot.pageY-this.stageTop,width:this.brandSlot.width,height:this.brandSlot.height},stops:this.journeyStops});
    this.cameraRig=new CameraRig(this.camera,journey.frames,true);
    this.brand.scale.setScalar(journey.axisHeight/4.2);this.brand.position.set(0,0,0);
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
    if(this.reduced||this.paused||this.detailOpen||!this.pointerQuery.matches||event.pointerType!=="mouse")return;
    const cloth=(event.target as Element).closest(".spatialClothControl");
    if(cloth){
      const box=cloth.getBoundingClientRect();
      this.cloth.setHover((event.clientX-box.left)/box.width,1-(event.clientY-box.top)/box.height,1);
      this.desiredPointer.x=this.desiredPointer.y=0;this.requestFrame();return;
    }
    this.cloth.setHover(.5,.5,0);
    if(this.compact)return;
    this.desiredPointer.x=(event.clientX/Math.max(1,window.innerWidth)-.5)*.85;
    this.desiredPointer.y=(event.clientY/Math.max(1,window.innerHeight)-.5)*.65;this.requestFrame();
  };
  private onPreferenceChange=()=>{
    const compact=this.compactQuery.matches,changed=compact!==this.compact;
    this.compact=compact;this.reduced=prefersStaticPlatform(this.motionQuery);this.desiredPointer.x=this.desiredPointer.y=0;
    this.atmosphere.setQuality(compact,this.reduced);this.rendererHost?.setPreset(compact?COMPACT_PRESET:DESKTOP_PRESET);
    this.cloth.setQuality(compact,this.reduced);
    this.faceLight.intensity=compact?1.45:.8;this.edgeLight.intensity=compact?3.1:3.5;
    this.cloth.setHover(.5,.5,0);
    this.configureBloom();this.resize();if(changed)void this.loadBrand();
  };
  private onVisibility=()=>{if(document.hidden)this.stop();else this.requestFrame();};
  private stop(){cancelAnimationFrame(this.frame);this.frame=0;this.lastFrame=0;}
  private requestFrame=()=>{if(!this.disposed&&!this.frame&&this.inView&&!document.hidden)this.frame=requestAnimationFrame(this.tick);};

  private tick=(now:number)=>{
    this.frame=0;if(this.disposed||!this.inView||document.hidden||!this.rendererHost)return;
    const delta=this.lastFrame?now-this.lastFrame:16.67;
    this.lastFrame=now;
    const staticScene=this.reduced||this.paused,blend=staticScene?1:-Math.expm1(-Math.max(0,delta)/180);
    if(!staticScene)this.elapsed+=Math.min(delta,100)/1000;
    this.progress=this.journey.update(this.desiredProgress,delta,{paused:this.paused,detailOpen:this.detailOpen,reduced:this.reduced});
    if(this.reduced)this.detailMotion.rebase([this.detailFocus?1:0]);else if(!this.paused)this.detailMotion.sample(now);
    this.detail=this.detailMotion.value[0];
    this.pointer.x+=((this.reduced||this.detailOpen?0:this.paused?this.pointer.x:this.desiredPointer.x)-this.pointer.x)*blend;
    this.pointer.y+=((this.reduced||this.detailOpen?0:this.paused?this.pointer.y:this.desiredPointer.y)-this.pointer.y)*blend;
    this.accent.lerp(this.desiredAccent,blend);this.accentLight.color.copy(this.accent);
    const snapshot={...INITIAL_SCROLL_SNAPSHOT,progress:this.progress,viewportWidth:this.viewportWidth,viewportHeight:this.viewportHeight,reducedMotion:this.reduced};
    this.cameraRig!.update(snapshot,{x:0,y:0},0);
    this.camera.updateMatrixWorld();
    this.updateObjects();
    this.scene.updateMatrixWorld();
    try{if(this.bloom)this.bloom.render();else this.rendererHost.renderer.render(this.scene,this.camera);}catch{
      if(this.bloom){
        this.bloom.dispose();this.bloom=undefined;
        try{this.rendererHost.renderer.render(this.scene,this.camera);}catch{this.fail();return;}
      }else{this.fail();return;}
    }
    // No 25/32fps idle cap: the turn and camera must share the display's frame cadence.
    if(!staticScene&&(!this.detailOpen||this.detailMotion.active))this.requestFrame();else this.lastFrame=0;
  };
  private updateObjects(){
    const p=this.progress,t=this.elapsed;
    this.brand.visible=this.brandReady;
    this.brand.rotation.set(0,spatialAxisTurn(p,this.compact,this.reduced),0);
    const lab=this.journeyStops?THREE.MathUtils.smoothstep(p,this.journeyStops.exit,this.journeyStops.lab):0;
    this.bloom?.setLabPresence(lab);
    this.keyLight.intensity=3.6-lab*1.4;
    this.faceLight.intensity=(this.compact?1.45:.8)*(1-lab*.5);
    this.edgeLight.intensity=(this.compact?3.1:3.5)*(1-lab*.3);
    this.atmosphere.update(t,p,this.detail,this.pointer,this.atmosphereOrigin,this.rendererHost!.renderer.getPixelRatio(),this.accent,lab);
    this.accentLight.position.set(2,this.camera.position.y+2,4);
    const sheet=this.clothSlot?.getBoundingClientRect();
    this.cloth.visible=!!sheet&&sheet.bottom>0&&sheet.top<this.viewportHeight&&!this.detailOpen;
    if(sheet&&this.cloth.visible){
      const position=panelScreenPosition(this.camera,sheet.left+sheet.width/2,sheet.top+sheet.height/2,this.viewportWidth,this.viewportHeight,4.4);
      const unit=panelFrontWidth(this.camera,this.viewportWidth,1,position),worldWidth=sheet.width/unit;
      this.cloth.position.copy(position);this.cloth.position.y+=sheet.height/unit*.015;
      // Keep the authored loose hem inside the interactive slot at both sizes.
      this.cloth.scale.set(worldWidth*.94,sheet.height/unit*.88,worldWidth*.66);this.cloth.update(this.reduced?0:t);
      this.cloth.rotation.set(-.06,this.compact?-.035:-.14,-.035);
    }
  }
  private fail(){if(!this.disposed){this.options.onStatus("fallback");this.dispose();}}
  dispose(){
    if(this.disposed)return;this.disposed=true;this.stop();this.brandAbort?.abort();
    this.resizeObserver?.disconnect();this.intersectionObserver?.disconnect();this.preferenceObserver?.disconnect();
    this.motionQuery.removeEventListener("change",this.onPreferenceChange);this.compactQuery.removeEventListener("change",this.onPreferenceChange);
    window.removeEventListener("scroll",this.onScroll);window.removeEventListener("resize",this.resize);window.removeEventListener("pointermove",this.onPointer);document.removeEventListener("visibilitychange",this.onVisibility);
    delete this.options.stage.dataset.brandReady;delete this.options.stage.dataset.shaderWarmup;delete this.options.stage.dataset.heroUiHidden;
    this.options.stage.style.removeProperty("--spatial-hero-ui-opacity");this.atmosphere.dispose();this.cloth.dispose();this.bloom?.dispose();
    disposeModel(this.scene);this.scene.clear();this.scene.environment=null;this.environment?.dispose();this.rendererHost?.dispose();
  }
}
