import { HalfFloatType, Vector2, WebGLRenderTarget, type Camera, type Scene, type WebGLRenderer } from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { prepareSceneShaders } from "../../experience/core/ShaderPreparation";

/** Desktop HDR bloom. Native HTML cards remain above this canvas and stay crisp. */
export class SpatialBloom {
  private readonly composer:EffectComposer;
  private readonly bloom=new UnrealBloomPass(new Vector2(1,1),.24,.65,1.35);
  private readonly output=new OutputPass();
  constructor(private readonly renderer:WebGLRenderer,private readonly scene:Scene,private readonly camera:Camera) {
    const target=new WebGLRenderTarget(1,1,{type:HalfFloatType,depthBuffer:true,stencilBuffer:false});
    this.composer=new EffectComposer(renderer,target);
    this.composer.addPass(new RenderPass(scene,camera));this.composer.addPass(this.bloom);this.composer.addPass(this.output);
  }
  resize(width:number,height:number,dpr:number) {
    this.composer.setPixelRatio(Math.min(1.25,dpr));this.composer.setSize(width,height);
  }
  render(){this.composer.render();}
  getTargetSize(out:Vector2){return out.set(this.composer.readBuffer.width,this.composer.readBuffer.height);}
  setLabPresence(amount:number){this.bloom.strength=.24*(1-Math.max(0,Math.min(1,amount))*.75);}
  /** Prepare HDR and the direct SRGB fallback before a quality downgrade can
   * select it. Each binding is restored before asynchronous readiness polling. */
  async warmup(signal:AbortSignal):Promise<boolean>{
    if(signal.aborted)return false;
    const context=this.renderer.getContext();
    const available=()=>!signal.aborted&&!context.isContextLost()&&this.renderer.getContext()===context;
    if(!available())return false;
    const prepare=(target:WebGLRenderTarget|null)=>{
      if(!available())return Promise.resolve(false);
      const previous=this.renderer.getRenderTarget();
      try{
        this.renderer.setRenderTarget(target);
        if(!available())return Promise.resolve(false);
        return prepareSceneShaders(this.renderer,this.scene,this.camera,signal);
      }finally{this.renderer.setRenderTarget(previous);}
    };
    const hdrReady=await prepare(this.composer.readBuffer);
    if(!available())return false;
    const directReady=await prepare(null);
    return available()&&hdrReady&&directReady;
  }
  dispose(){this.bloom.dispose();this.output.dispose();this.composer.dispose();}
}
