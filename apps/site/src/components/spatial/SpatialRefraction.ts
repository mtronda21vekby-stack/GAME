import { LinearFilter, LinearSRGBColorSpace, RGBAFormat, UnsignedByteType, Vector2, Vector4, WebGLRenderTarget, type Camera, type Object3D, type Scene, type Texture, type WebGLRenderer } from "three";

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

  constructor(private readonly renderer:WebGLRenderer,private readonly scene:Scene,private readonly camera:Camera,private readonly options:RefractionOptions) {}

  get texture():Texture|null{return this.target?.texture??null;}

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
        this.target=new WebGLRenderTarget(this.size.x,this.size.y,{
          type:UnsignedByteType,format:RGBAFormat,minFilter:LinearFilter,magFilter:LinearFilter,
          generateMipmaps:false,depthBuffer:true,stencilBuffer:false,samples:0,
          colorSpace:LinearSRGBColorSpace,
        });
        this.target.texture.name="BLACKCROWN_LAB_BACKGROUND_RGBA8";
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
      if(this.failed)this.release();
    }
    return captured;
  }

  snapshot(){return {enabled:this.enabled,allocated:!!this.target,width:this.size.x,height:this.size.y,pixels:this.target?this.size.x*this.size.y:0,colorBytes:this.target?this.size.x*this.size.y*4:0,captures:this.captures,failed:this.failed};}
  private release(){this.target?.dispose();this.target=undefined;this.targetReady=false;}
  dispose(){if(this.disposed)return;this.disposed=true;this.enabled=false;this.release();}
}
