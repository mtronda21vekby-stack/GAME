import { LinearFilter, LinearSRGBColorSpace, RGBAFormat, UnsignedByteType, Vector2, Vector4, WebGLRenderTarget, type Camera, type Object3D, type Scene, type Texture, type WebGLRenderer } from "three";
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

type RefractionOptions = { exclude:()=>readonly Object3D[]; compact?:boolean; beforeCapture?:()=>void; afterCapture?:()=>void };
type WarmupPreparation = { controller:AbortController; target:WebGLRenderTarget; bound:boolean; released:boolean };

/** One live, linear scene snapshot. Called only by the existing scene tick.
 * The caller hides cloth and clips atmosphere to known background in the hooks:
 * this is background-layer screen-space refraction, not volume ray tracing. */
export class SpatialRefraction {
  readonly size=new Vector2(1,1);
  private target?:WebGLRenderTarget;
  private targetReady=false;
  private enabled=false;
  private failed=false;
  private disposed=false;
  private captures=0;
  private readonly viewport=new Vector4();
  private readonly scissor=new Vector4();
  private readonly warmups=new Set<WarmupPreparation>();

  constructor(private readonly renderer:WebGLRenderer,private readonly scene:Scene,private readonly camera:Camera,private readonly options:RefractionOptions) {}

  get texture():Texture|null{return this.target?.texture??null;}

  /** Prepare the actual capture-format shader variants without drawing a frame
   * or retaining an offscreen allocation in the hero. Binding is synchronous:
   * readiness polling must never leave this scratch target on the renderer. */
  async warmup(signal:AbortSignal):Promise<boolean> {
    if(this.disposed||this.failed||signal.aborted)return false;
    let preparation:WarmupPreparation|undefined;
    const cancel=()=>{
      if(!preparation)return;
      preparation.controller.abort();this.releaseWarmup(preparation);
    };
    try {
      const renderer=this.renderer,context=renderer.getContext();
      if(context.isContextLost()||this.disposed||this.failed||signal.aborted)return false;
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
      return complete&&!this.disposed&&!this.failed&&!signal.aborted&&!preparation.controller.signal.aborted&&!context.isContextLost()&&renderer.getContext()===context;
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
  }

  setEnabled(enabled:boolean) {
    this.enabled=enabled&&!this.failed&&!this.disposed;
    if(!this.enabled)this.release();
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

  snapshot(){return {enabled:this.enabled,allocated:!!this.target,width:this.size.x,height:this.size.y,pixels:this.target?this.size.x*this.size.y:0,colorBytes:this.target?this.size.x*this.size.y*4:0,captures:this.captures,failed:this.failed};}
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
    preparation.released=true;preparation.target.dispose();
  }
  private cancelWarmups(){for(const preparation of this.warmups){preparation.controller.abort();this.releaseWarmup(preparation);}}
  private release(){this.target?.dispose();this.target=undefined;this.targetReady=false;}
  dispose(){if(this.disposed)return;this.disposed=true;this.enabled=false;this.cancelWarmups();this.release();}
}
