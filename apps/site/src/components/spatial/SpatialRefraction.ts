import { Color, DataTexture, LinearFilter, LinearSRGBColorSpace, NearestFilter, NoColorSpace, RGBAFormat, UnsignedByteType, Vector2, Vector4, WebGLRenderTarget, type Camera, type Object3D, type Scene, type Texture, type WebGLRenderer } from "three";
import { prepareSceneShaders } from "../../experience/core/ShaderPreparation";

export const SPATIAL_REFRACTION_PIXELS = { mobile:250_000, desktop:500_000 } as const;

/** Half the final image in each direction, bounded by a real allocation budget. */
export function refractionTargetSize(width:number,height:number,dpr:number,compact:boolean) {
  const safe=(value:number,fallback:number)=>Number.isFinite(value)&&value>0?Math.min(value,1e7):fallback;
  let w=Math.max(1,Math.floor(safe(width,1)*safe(dpr,1)*.5));
  let h=Math.max(1,Math.floor(safe(height,1)*safe(dpr,1)*.5));
  const cap=compact?SPATIAL_REFRACTION_PIXELS.mobile:SPATIAL_REFRACTION_PIXELS.desktop;
  const fit=Math.min(1,Math.sqrt(cap/(w*h)),2048/w,2048/h);
  w=Math.max(1,Math.floor(w*fit));h=Math.max(1,Math.floor(h*fit));
  return {width:w,height:h,pixels:w*h};
}

type RefractionOptions = {
  exclude:()=>readonly Object3D[]; compact?:boolean; beforeCapture?:()=>void; afterCapture?:()=>void;
  depthObjects?:()=>readonly Object3D[]; beforeDepthCapture?:()=>void; afterDepthCapture?:()=>void;
};
type WarmupPreparation = { controller:AbortController; target:WebGLRenderTarget; sampler?:DataTexture; bound:boolean; released:boolean };

/** Live background color and optional significant-surface packed depth, driven
 * only by the existing scene tick. The original atmospheric vertex/fragment
 * programs retain their warp, clipping and alpha rejection in both passes. */
export class SpatialRefraction {
  readonly size=new Vector2(1,1);
  private target?:WebGLRenderTarget;
  private targetReady=false;
  private depthTarget?:WebGLRenderTarget;
  private depthTargetReady=false;
  private depthFailed=false;
  private depthCaptures=0;
  private enabled=false;
  private failed=false;
  private disposed=false;
  private captures=0;
  private readonly viewport=new Vector4();
  private readonly scissor=new Vector4();
  private readonly depthClearColor=new Color();
  private readonly warmups=new Set<WarmupPreparation>();

  constructor(private readonly renderer:WebGLRenderer,private readonly scene:Scene,private readonly camera:Camera,private readonly options:RefractionOptions) {}

  get texture():Texture|null{return this.target?.texture??null;}
  get depthTexture():Texture|null{return this.depthTargetReady&&!this.depthFailed?this.depthTarget?.texture??null:null;}

  /** Prepare the capture format, then optionally submit one synchronous draw.
   * The transient white sampler is separate from the attachment: no feedback.
   * Readiness polling never leaves a scratch target or changed scene state. */
  async warmup(signal:AbortSignal,draw?:(sampler:Texture)=>void):Promise<boolean> {
    if(this.disposed||this.failed||signal.aborted)return false;
    let preparation:WarmupPreparation|undefined;
    const cancel=()=>{
      if(!preparation)return;
      preparation.controller.abort();this.releaseWarmup(preparation);
    };
    try {
      const renderer=this.renderer,context=renderer.getContext();
      if(context.isContextLost()||this.disposed||this.failed||signal.aborted)return false;
      // In r170 every non-XR offscreen attachment compiles LinearSRGB output,
      // even the NoColorSpace packed-depth texture. The depth uniform branch
      // already belongs to these same programs; no second preparation is needed.
      // A newer preparation owns readiness; old completion/abort cannot tear
      // down its scratch target or signal during context recovery.
      this.cancelWarmups();
      preparation={controller:new AbortController(),target:this.createTarget(1,1,"BLACKCROWN_LAB_BACKGROUND_PREPARE_RGBA8"),bound:false,released:false};
      this.warmups.add(preparation);signal.addEventListener("abort",cancel,{once:true});
      const previous=renderer.getRenderTarget();
      let ready:Promise<boolean>;
      preparation.bound=true;
      try {
        renderer.setRenderTarget(preparation.target);
        if(this.disposed||this.failed||signal.aborted||context.isContextLost()||renderer.getContext()!==context)return false;
        ready=prepareSceneShaders(renderer,this.scene,this.camera,preparation.controller.signal);
      } finally {
        try{renderer.setRenderTarget(previous);}
        finally {
          preparation.bound=false;
          if(preparation.controller.signal.aborted)this.releaseWarmup(preparation);
        }
      }
      const complete=await ready;
      const available=()=>!this.disposed&&!this.failed&&!signal.aborted&&!preparation!.controller.signal.aborted&&!context.isContextLost()&&renderer.getContext()===context;
      if(!complete||!available())return false;
      if(draw){
        const attachment=renderer.getRenderTarget(),autoClear=renderer.autoClear,scissorTest=renderer.getScissorTest(),clearAlpha=renderer.getClearAlpha(),background=this.scene.background;
        const viewport=renderer.getViewport(new Vector4()),scissor=renderer.getScissor(new Vector4()),clearColor=renderer.getClearColor(new Color());
        preparation.bound=true;
        try{
          if(!available())return false;
          const sampler=preparation.sampler=new DataTexture(new Uint8Array([255,255,255,255]),1,1,RGBAFormat,UnsignedByteType);
          sampler.minFilter=NearestFilter;sampler.magFilter=NearestFilter;sampler.colorSpace=NoColorSpace;sampler.generateMipmaps=false;sampler.needsUpdate=true;
          renderer.setRenderTarget(preparation.target);renderer.setScissorTest(false);renderer.autoClear=false;
          this.scene.background=null;renderer.setClearColor(0xffffff,1);renderer.clear();
          if(!available())return false;
          draw(sampler);
        }finally{
          try{
            this.scene.background=background;renderer.autoClear=autoClear;renderer.setClearColor(clearColor,clearAlpha);
            renderer.setScissorTest(scissorTest);renderer.setScissor(scissor);renderer.setViewport(viewport);
          }finally{
            try{renderer.setRenderTarget(attachment);}
            finally{preparation.bound=false;if(preparation.controller.signal.aborted)this.releaseWarmup(preparation);}
          }
        }
      }
      return available();
    } catch {
      // Abort, readiness timeout and unsupported allocation are optional-effect
      // preparation failures, not permanent capture failures.
      return false;
    } finally {
      signal.removeEventListener("abort",cancel);
      if(preparation){
        preparation.controller.abort();this.releaseWarmup(preparation);this.warmups.delete(preparation);
      }
    }
  }

  resize(width:number,height:number,dpr:number,compact=this.options.compact??false) {
    if(this.disposed)return;
    const next=refractionTargetSize(width,height,dpr,compact);
    if(next.width===this.size.x&&next.height===this.size.y)return;
    this.size.set(next.width,next.height);
    this.target?.setSize(next.width,next.height);this.targetReady=false;
    this.depthTarget?.setSize(next.width,next.height);this.depthTargetReady=false;
  }

  setEnabled(enabled:boolean) {
    const wasEnabled=this.enabled;
    this.enabled=enabled&&!this.failed&&!this.disposed;
    if(!this.enabled){if(wasEnabled)this.cancelWarmups();this.release();}
  }

  render():boolean {
    if(!this.enabled||this.failed||this.disposed)return false;
    const renderer=this.renderer;
    const previous=renderer.getRenderTarget(),autoClear=renderer.autoClear,scissorTest=renderer.getScissorTest();
    renderer.getViewport(this.viewport);renderer.getScissor(this.scissor);
    let hidden:{object:Object3D;visible:boolean}[]=[];
    let captured=false;
    try {
      hidden=[...new Set(this.options.exclude())].map(object=>({object,visible:object.visible}));
      if(!this.target){
        this.target=this.createTarget(this.size.x,this.size.y,"BLACKCROWN_LAB_BACKGROUND_RGBA8");
      }
      hidden.forEach(({object})=>{object.visible=false;});
      this.options.beforeCapture?.();
      renderer.setRenderTarget(this.target);renderer.setScissorTest(false);renderer.autoClear=false;
      if(!this.targetReady){
        const gl=renderer.getContext();
        if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error("LAB background framebuffer unavailable");
        this.targetReady=true;
      }
      renderer.clear();renderer.render(this.scene,this.camera);
      this.captures++;captured=true;
      if(this.options.depthObjects&&!this.depthFailed)this.renderDepth();
    } catch {
      this.failed=true;this.enabled=false;
    } finally {
      try{this.options.afterCapture?.();}catch{this.failed=true;this.enabled=false;captured=false;}
      hidden.forEach(({object,visible})=>{object.visible=visible;});
      renderer.autoClear=autoClear;
      // Restore global viewport/scissor first; setRenderTarget then restores the
      // previous attachment's own pixel viewport, including nondefault targets.
      renderer.setViewport(this.viewport);renderer.setScissor(this.scissor);renderer.setScissorTest(scissorTest);
      renderer.setRenderTarget(previous);
      if(this.failed){this.cancelWarmups();this.release();}
    }
    return captured;
  }

  /** Packed RGBA has discrete digits: filtering them would corrupt depth.
   * White is r170 packDepthToRGBA(1), the explicit far/no-hit sentinel. */
  private renderDepth(){
    const renderer=this.renderer,previous=renderer.getRenderTarget(),background=this.scene.background;
    const clearAlpha=renderer.getClearAlpha();renderer.getClearColor(this.depthClearColor);
    const hidden:{object:Object3D;visible:boolean}[]=[];
    const masked:{object:Object3D;mask:number}[]=[];
    try {
      const roots=new Set(this.options.depthObjects!());
      if(!roots.size)return;
      const ancestors=new Set<Object3D>();
      for(const root of roots)for(let parent=root.parent;parent&&parent!==this.scene;parent=parent.parent)ancestors.add(parent);
      this.scene.traverse(object=>{
        const drawable=object as Object3D&{isMesh?:boolean;isPoints?:boolean;isLine?:boolean;isSprite?:boolean};
        if(!drawable.isMesh&&!drawable.isPoints&&!drawable.isLine&&!drawable.isSprite)return;
        let allowed=false;for(let parent:Object3D|null=object;parent;parent=parent.parent){if(roots.has(parent)){allowed=true;break;}}
        if(!allowed){
          // Object.visible=false also suppresses descendants. An unselected
          // drawable ancestor must skip its own draw without hiding a selected
          // child; Three still traverses children when a parent's layers fail.
          if(ancestors.has(object)){masked.push({object,mask:object.layers.mask});object.layers.mask=0;}
          else {hidden.push({object,visible:object.visible});object.visible=false;}
        }
      });
      if(!this.depthTarget){
        this.depthTarget=this.createTarget(this.size.x,this.size.y,"BLACKCROWN_LAB_BACKGROUND_DEPTH_RGBA8");
        this.depthTarget.texture.minFilter=NearestFilter;this.depthTarget.texture.magFilter=NearestFilter;
        this.depthTarget.texture.colorSpace=NoColorSpace;
      }
      this.options.beforeDepthCapture?.();
      // A colored Scene.background forces its own clear in Three even with
      // autoClear=false. Depth must instead start at the far/no-hit sentinel.
      this.scene.background=null;renderer.setClearColor(0xffffff,1);renderer.setRenderTarget(this.depthTarget);
      if(!this.depthTargetReady){
        const gl=renderer.getContext();
        if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error("LAB background depth framebuffer unavailable");
      }
      renderer.clear();renderer.render(this.scene,this.camera);
      this.depthTargetReady=true;this.depthCaptures++;
    } catch {
      // Color capture plus the projected backing plane remain usable when
      // optional significant-depth rendering is unsupported or fails.
      this.depthFailed=true;
    } finally {
      try{this.options.afterDepthCapture?.();}catch{this.depthFailed=true;}
      this.scene.background=background;hidden.forEach(({object,visible})=>{object.visible=visible;});
      masked.forEach(({object,mask})=>{object.layers.mask=mask;});
      renderer.setClearColor(this.depthClearColor,clearAlpha);renderer.setRenderTarget(previous);
      if(this.depthFailed)this.releaseDepth();
    }
  }

  snapshot(){return {enabled:this.enabled,allocated:!!this.target,width:this.size.x,height:this.size.y,pixels:this.target?this.size.x*this.size.y:0,colorBytes:this.target?this.size.x*this.size.y*4:0,captures:this.captures,failed:this.failed,
    depthAllocated:!!this.depthTarget,depthPixels:this.depthTarget?this.size.x*this.size.y:0,depthColorBytes:this.depthTarget?this.size.x*this.size.y*4:0,depthCaptures:this.depthCaptures,depthFailed:this.depthFailed};}
  private createTarget(width:number,height:number,name:string){
    const target=new WebGLRenderTarget(width,height,{
      type:UnsignedByteType,format:RGBAFormat,minFilter:LinearFilter,magFilter:LinearFilter,
      generateMipmaps:false,depthBuffer:true,stencilBuffer:false,samples:0,
      colorSpace:LinearSRGBColorSpace,
    });
    target.texture.name=name;return target;
  }
  private releaseWarmup(preparation:WarmupPreparation){
    if(preparation.bound||preparation.released)return;
    preparation.released=true;try{preparation.sampler?.dispose();}finally{preparation.target.dispose();}
  }
  private cancelWarmups(){for(const preparation of this.warmups){preparation.controller.abort();this.releaseWarmup(preparation);}}
  private releaseDepth(){this.depthTarget?.dispose();this.depthTarget=undefined;this.depthTargetReady=false;}
  private release(){this.target?.dispose();this.target=undefined;this.targetReady=false;this.releaseDepth();}
  dispose(){if(this.disposed)return;this.disposed=true;this.enabled=false;this.cancelWarmups();this.release();}
}
