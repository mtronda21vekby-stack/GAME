import { beforeEach, describe, expect, it, vi } from "vitest";
import { Color, HalfFloatType, LinearFilter, LinearSRGBColorSpace, PerspectiveCamera, RGBAFormat, Scene, UnsignedByteType, Vector4, WebGLRenderTarget, type WebGLRenderer } from "three";

const preparation=vi.hoisted(()=>({prepare:vi.fn()}));
vi.mock("../../src/experience/core/ShaderPreparation",()=>({prepareSceneShaders:preparation.prepare}));
import { SpatialRefraction } from "../../src/components/spatial/SpatialRefraction";

function fixture() {
  const previous=new WebGLRenderTarget(17,23);previous.viewport.set(2,3,11,13);previous.scissor.set(1,2,7,9);previous.scissorTest=true;
  const state={target:previous as WebGLRenderTarget|null,contextLost:false,viewport:new Vector4(5,7,311,577),scissor:new Vector4(11,13,149,271),scissorTest:true,currentViewport:previous.viewport.clone(),currentScissor:previous.scissor.clone(),currentScissorTest:true,clearColor:new Color(0x123456),clearAlpha:.37};
  const gl={FRAMEBUFFER:36160,FRAMEBUFFER_COMPLETE:36053,checkFramebufferStatus:vi.fn(()=>36053),isContextLost:()=>state.contextLost};
  const mock={
    autoClear:false,domElement:new EventTarget(),getContext:()=>gl,getRenderTarget:()=>state.target,getPixelRatio:()=>1.25,
    setRenderTarget:vi.fn((target:WebGLRenderTarget|null)=>{state.target=target;state.currentViewport.copy(target?.viewport??state.viewport);state.currentScissor.copy(target?.scissor??state.scissor);state.currentScissorTest=target?.scissorTest??state.scissorTest;}),
    getViewport:(value:Vector4)=>value.copy(state.viewport),getScissor:(value:Vector4)=>value.copy(state.scissor),getScissorTest:()=>state.scissorTest,
    getClearColor:(value:Color)=>value.copy(state.clearColor),getClearAlpha:()=>state.clearAlpha,setClearColor:(value:Color|number,alpha=1)=>{state.clearColor.set(value);state.clearAlpha=alpha;},
    setViewport:vi.fn((value:Vector4)=>{state.viewport.copy(value);state.currentViewport.copy(value);}),
    setScissor:vi.fn((value:Vector4)=>{state.scissor.copy(value);state.currentScissor.copy(value);}),
    setScissorTest:vi.fn((value:boolean)=>{state.scissorTest=state.currentScissorTest=value;}),clear:vi.fn(),render:vi.fn(),
  };
  const renderer=mock as unknown as WebGLRenderer,scene=new Scene(),camera=new PerspectiveCamera(),exclude=vi.fn(()=>[]),beforeCapture=vi.fn(),afterCapture=vi.fn();
  const capture=new SpatialRefraction(renderer,scene,camera,{exclude,beforeCapture,afterCapture});capture.resize(393,852,1.25,true);
  return {capture,renderer,mock,state,previous,scene,camera,exclude,beforeCapture,afterCapture};
}

type Pending={signal:AbortSignal;target:WebGLRenderTarget;dispose:ReturnType<typeof vi.spyOn>;resolve:(value:boolean)=>void};
function deferredPreparation(f:ReturnType<typeof fixture>,ignoreAbort=false,type:typeof UnsignedByteType|typeof HalfFloatType=UnsignedByteType) {
  const pending:Pending[]=[];
  preparation.prepare.mockImplementation((renderer:WebGLRenderer,scene:Scene,camera:PerspectiveCamera,signal:AbortSignal)=>{
    expect(renderer).toBe(f.renderer);expect(scene).toBe(f.scene);expect(camera).toBe(f.camera);
    const target=f.state.target!;expect(target).not.toBe(f.previous);expect(target.width).toBe(1);expect(target.height).toBe(1);
    expect(target.texture.type).toBe(type);expect(target.texture.format).toBe(RGBAFormat);expect(target.texture.colorSpace).toBe(LinearSRGBColorSpace);
    expect(target.texture.minFilter).toBe(LinearFilter);expect(target.texture.magFilter).toBe(LinearFilter);expect(target.texture.generateMipmaps).toBe(false);expect(target.samples).toBe(0);
    expect(target.depthBuffer).toBe(true);expect(target.stencilBuffer).toBe(false);
    let resolve!:(value:boolean)=>void;const promise=new Promise<boolean>(done=>{resolve=done;});
    const abort=()=>resolve(false);if(!ignoreAbort)signal.addEventListener("abort",abort,{once:true});
    pending.push({signal,target,dispose:vi.spyOn(target,"dispose"),resolve});
    return promise.finally(()=>signal.removeEventListener("abort",abort));
  });
  return pending;
}

beforeEach(()=>{preparation.prepare.mockReset();});

describe("Owned refraction shader preparation",()=>{
  it("submits a real HalfFloat HDR attachment without retaining a hero target",async()=>{
    const f=fixture(),requests=deferredPreparation(f,false,HalfFloatType),before=f.capture.snapshot(),draw=vi.fn(sampler=>{
      expect(f.state.target).toBe(requests[0].target);expect(sampler).not.toBe(requests[0].target.texture);
    });
    const pending=f.capture.warmup(new AbortController().signal,draw,"hdr");
    expect(f.state.target).toBe(f.previous);requests[0].resolve(true);expect(await pending).toBe(true);
    expect(draw).toHaveBeenCalledTimes(1);expect(requests[0].dispose).toHaveBeenCalledTimes(1);expect(f.capture.snapshot()).toEqual(before);
    f.capture.dispose();f.previous.dispose();
  });

  it.each(["rgba8","hdr"] as const)("rejects an incomplete %s framebuffer before any clear or draw without latching failure",async output=>{
    const f=fixture(),requests=deferredPreparation(f,false,output==="hdr"?HalfFloatType:UnsignedByteType),draw=vi.fn(),cleanup=vi.fn(),before=f.capture.snapshot();
    f.mock.getContext().checkFramebufferStatus.mockReturnValueOnce(36054);
    const pending=f.capture.warmup(new AbortController().signal,draw,output,cleanup);requests[0].resolve(true);
    expect(await pending).toBe(false);expect(draw).not.toHaveBeenCalled();expect(cleanup).not.toHaveBeenCalled();expect(f.mock.clear).not.toHaveBeenCalled();
    expect(f.state.target).toBe(f.previous);expect(requests[0].dispose).toHaveBeenCalledTimes(1);expect(f.capture.snapshot()).toEqual(before);
    const retry=f.capture.warmup(new AbortController().signal,draw,output);requests[1].resolve(true);expect(await retry).toBe(true);expect(draw).toHaveBeenCalledTimes(1);
    expect(f.capture.snapshot()).toEqual(before);f.capture.dispose();f.previous.dispose();
  });

  it.each(["success","abort","throw","dispose"])("replaces submitted native pixels after state rollback even on %s",async outcome=>{
    const f=fixture(),external=new AbortController(),background=new Color(0x224466),events:string[]=[];f.scene.background=background;
    const before={viewport:f.state.viewport.clone(),scissor:f.state.scissor.clone(),color:f.state.clearColor.clone(),alpha:f.state.clearAlpha,snapshot:f.capture.snapshot()};
    preparation.prepare.mockImplementation(()=>{expect(f.state.target).toBeNull();return Promise.resolve(true);});
    let samplerDisposal:ReturnType<typeof vi.spyOn>|undefined;
    const pending=f.capture.warmup(external.signal,sampler=>{
      events.push("warm");expect(f.state.target).toBeNull();expect(f.state.scissorTest).toBe(true);
      expect(f.mock.getContext().checkFramebufferStatus).not.toHaveBeenCalled();
      expect(f.state.viewport.toArray()).toEqual([0,0,6.4,6.4]);expect(f.state.scissor.toArray()).toEqual([0,0,6.4,6.4]);
      expect(f.state.viewport.z*f.mock.getPixelRatio()).toBe(8);expect(f.state.viewport.w*f.mock.getPixelRatio()).toBe(8);
      expect(f.mock.clear).not.toHaveBeenCalled(); // Caller hides the native host before its first clear.
      samplerDisposal=vi.spyOn(sampler,"dispose");
      if(outcome==="abort")external.abort();if(outcome==="dispose")f.capture.dispose();
      if(outcome==="throw")throw new Error("native warm failure");
    },"canvas",()=>{
      events.push("normal");expect(f.state.target).toBe(f.previous);expect(f.scene.background).toBe(background);
      expect(f.state.viewport.equals(before.viewport)).toBe(true);expect(f.state.scissor.equals(before.scissor)).toBe(true);
      expect(f.state.clearColor.equals(before.color)).toBe(true);expect(f.state.clearAlpha).toBe(before.alpha);expect(f.mock.autoClear).toBe(false);
      expect(samplerDisposal).not.toHaveBeenCalled();
    });
    expect(await pending).toBe(outcome==="success");expect(events).toEqual(["warm","normal"]);expect(samplerDisposal).toHaveBeenCalledTimes(1);
    expect(f.mock.setRenderTarget.mock.calls.every(([target])=>target===null||target===f.previous)).toBe(true);
    expect(f.capture.snapshot()).toEqual(before.snapshot);f.capture.dispose();f.previous.dispose();
  });

  it("does not touch native pixels or run cleanup when cancellation precedes readiness",async()=>{
    const f=fixture(),external=new AbortController(),draw=vi.fn(),cleanup=vi.fn();let finish!:(value:boolean)=>void;
    preparation.prepare.mockImplementation(()=>new Promise<boolean>(resolve=>{finish=resolve;}));
    const pending=f.capture.warmup(external.signal,draw,"canvas",cleanup);external.abort();finish(true);
    expect(await pending).toBe(false);expect(draw).not.toHaveBeenCalled();expect(cleanup).not.toHaveBeenCalled();expect(f.mock.clear).not.toHaveBeenCalled();
    expect(f.state.target).toBe(f.previous);f.capture.dispose();f.previous.dispose();
  });

  it("submits against a local capture-format target and restores the renderer before awaiting readiness",async()=>{
    const f=fixture(),requests=deferredPreparation(f),external=new AbortController(),before=f.capture.snapshot();
    const promise=f.capture.warmup(external.signal);
    expect(requests).toHaveLength(1);expect(preparation.prepare).toHaveBeenCalledTimes(1);
    expect(requests[0].signal).not.toBe(external.signal);expect(requests[0].dispose).not.toHaveBeenCalled();
    expect(f.state.target).toBe(f.previous);expect(f.state.currentViewport.equals(f.previous.viewport)).toBe(true);expect(f.state.currentScissor.equals(f.previous.scissor)).toBe(true);
    expect(f.capture.texture).toBeNull();expect(f.capture.snapshot()).toEqual(before);
    expect(f.mock.clear).not.toHaveBeenCalled();expect(f.mock.render).not.toHaveBeenCalled();expect(f.exclude).not.toHaveBeenCalled();expect(f.beforeCapture).not.toHaveBeenCalled();expect(f.afterCapture).not.toHaveBeenCalled();
    requests[0].resolve(true);expect(await promise).toBe(true);expect(requests[0].dispose).toHaveBeenCalledTimes(1);
    expect(f.capture.snapshot()).toEqual(before);f.capture.dispose();f.previous.dispose();
  });

  it.each(["success","throw","abort","dispose"])("restores all state and owns one separate sampler after a warm draw %s",async outcome=>{
    const f=fixture(),requests=deferredPreparation(f),external=new AbortController(),background=new Color(0x224466);f.scene.background=background;
    const before={snapshot:f.capture.snapshot(),viewport:f.state.viewport.clone(),scissor:f.state.scissor.clone(),color:f.state.clearColor.clone(),alpha:f.state.clearAlpha};
    let samplerDisposal:ReturnType<typeof vi.spyOn>|undefined;
    const draw=vi.fn(sampler=>{
      const scratch=f.state.target!;expect(scratch).toBe(requests[0].target);expect(sampler).not.toBe(scratch.texture);
      expect(Array.from(sampler.image.data)).toEqual([255,255,255,255]);expect(f.scene.background).toBeNull();expect(f.mock.autoClear).toBe(false);expect(f.state.scissorTest).toBe(false);
      samplerDisposal=vi.spyOn(sampler,"dispose").mockImplementation(()=>{expect(f.state.target).toBe(f.previous);});
      if(outcome==="abort")external.abort();if(outcome==="dispose")f.capture.dispose();
      expect(samplerDisposal).not.toHaveBeenCalled();expect(requests[0].dispose).not.toHaveBeenCalled();
      if(outcome==="throw")throw new Error("injected warm draw failure");
    });
    const pending=f.capture.warmup(external.signal,draw);expect(draw).not.toHaveBeenCalled();expect(f.state.target).toBe(f.previous);
    requests[0].resolve(true);expect(await pending).toBe(outcome==="success");expect(draw).toHaveBeenCalledTimes(1);
    expect(samplerDisposal).toHaveBeenCalledTimes(1);expect(requests[0].dispose).toHaveBeenCalledTimes(1);
    expect(f.scene.background).toBe(background);expect(f.state.target).toBe(f.previous);expect(f.state.viewport.equals(before.viewport)).toBe(true);expect(f.state.scissor.equals(before.scissor)).toBe(true);expect(f.state.scissorTest).toBe(true);expect(f.mock.autoClear).toBe(false);
    expect(f.state.currentViewport.equals(f.previous.viewport)).toBe(true);expect(f.state.currentScissor.equals(f.previous.scissor)).toBe(true);expect(f.state.clearColor.equals(before.color)).toBe(true);expect(f.state.clearAlpha).toBe(before.alpha);
    expect(f.capture.snapshot()).toEqual(before.snapshot);expect(f.capture.texture).toBeNull();expect(f.capture.depthTexture).toBeNull();f.capture.dispose();f.previous.dispose();
  });

  it("never invokes a draw after readiness was cancelled",async()=>{
    const f=fixture(),requests=deferredPreparation(f,true),external=new AbortController(),draw=vi.fn(),pending=f.capture.warmup(external.signal,draw);
    external.abort();requests[0].resolve(true);expect(await pending).toBe(false);expect(draw).not.toHaveBeenCalled();expect(f.mock.clear).not.toHaveBeenCalled();expect(requests[0].dispose).toHaveBeenCalledTimes(1);f.capture.dispose();f.previous.dispose();
  });

  it("restores the original attachment before releasing resources even if another state restore throws",async()=>{
    const f=fixture(),requests=deferredPreparation(f),external=new AbortController();let disposed:ReturnType<typeof vi.spyOn>|undefined;
    const pending=f.capture.warmup(external.signal,sampler=>{
      disposed=vi.spyOn(sampler,"dispose").mockImplementation(()=>{expect(f.state.target).toBe(f.previous);});
      f.mock.setViewport.mockImplementation(()=>{throw new Error("injected viewport restore failure");});
    });requests[0].resolve(true);
    expect(await pending).toBe(false);expect(f.state.target).toBe(f.previous);expect(disposed).toHaveBeenCalledTimes(1);expect(requests[0].dispose).toHaveBeenCalledTimes(1);
    expect(f.capture.snapshot()).toMatchObject({failed:false,allocated:false,depthAllocated:false,captures:0,depthCaptures:0});f.capture.dispose();f.previous.dispose();
  });

  it.each(["already aborted","disposed","failed","lost context"])("does not allocate or submit preparation when %s",async condition=>{
    const f=fixture(),external=new AbortController();
    if(condition==="already aborted")external.abort();
    if(condition==="disposed")f.capture.dispose();
    if(condition==="lost context")f.state.contextLost=true;
    if(condition==="failed"){
      f.capture.setEnabled(true);f.mock.render.mockImplementation(()=>{throw new Error("injected render failure");});expect(f.capture.render()).toBe(false);
    }
    f.mock.setRenderTarget.mockClear();
    expect(await f.capture.warmup(external.signal)).toBe(false);expect(preparation.prepare).not.toHaveBeenCalled();expect(f.mock.setRenderTarget).not.toHaveBeenCalled();
    expect(f.capture.texture).toBeNull();f.capture.dispose();f.previous.dispose();
  });

  it.each(["external abort","dispose"])("cancels its owned readiness work on %s and releases only its scratch target",async action=>{
    const f=fixture(),requests=deferredPreparation(f),external=new AbortController(),promise=f.capture.warmup(external.signal);
    expect(requests[0].signal.aborted).toBe(false);
    if(action==="external abort")external.abort();else f.capture.dispose();
    expect(requests[0].signal.aborted).toBe(true);expect(await promise).toBe(false);expect(requests[0].dispose).toHaveBeenCalledTimes(1);
    expect(f.state.target).toBe(f.previous);expect(f.capture.texture).toBeNull();expect(f.mock.render).not.toHaveBeenCalled();f.capture.dispose();f.previous.dispose();
  });

  it("keeps timeout/best-effort false retryable without latching the capture failure state",async()=>{
    const f=fixture(),requests=deferredPreparation(f),external=new AbortController();
    const first=f.capture.warmup(external.signal);requests[0].resolve(false);expect(await first).toBe(false);
    expect(f.capture.snapshot().failed).toBe(false);expect(requests[0].dispose).toHaveBeenCalledTimes(1);
    const retry=f.capture.warmup(external.signal);expect(requests).toHaveLength(2);expect(requests[1].target).not.toBe(requests[0].target);
    requests[1].resolve(true);expect(await retry).toBe(true);expect(requests[1].dispose).toHaveBeenCalledTimes(1);expect(f.capture.snapshot().failed).toBe(false);
    f.capture.dispose();f.previous.dispose();
  });

  it("cancels pending preparation when an active LAB capture is disabled",async()=>{
    const f=fixture(),requests=deferredPreparation(f),external=new AbortController();
    f.capture.setEnabled(true);const pending=f.capture.warmup(external.signal);f.capture.setEnabled(false);
    expect(requests[0].signal.aborted).toBe(true);expect(await pending).toBe(false);expect(requests[0].dispose).toHaveBeenCalledTimes(1);
    expect(f.state.target).toBe(f.previous);expect(f.capture.snapshot()).toMatchObject({allocated:false,depthAllocated:false});f.capture.dispose();f.previous.dispose();
  });

  it("allows one-shot hero preparation while live capture remains disabled",async()=>{
    const f=fixture(),requests=deferredPreparation(f),external=new AbortController(),pending=f.capture.warmup(external.signal);
    f.capture.setEnabled(false);expect(requests[0].signal.aborted).toBe(false);requests[0].resolve(true);expect(await pending).toBe(true);
    expect(f.capture.snapshot()).toMatchObject({enabled:false,allocated:false,depthAllocated:false,depthCaptures:0});f.capture.dispose();f.previous.dispose();
  });

  it("supersedes older valid work without allowing its external abort/finally to affect the new owner",async()=>{
    const f=fixture(),requests=deferredPreparation(f),oldExternal=new AbortController(),newExternal=new AbortController();
    const first=f.capture.warmup(oldExternal.signal),second=f.capture.warmup(newExternal.signal);
    expect(requests).toHaveLength(2);expect(requests[0].signal.aborted).toBe(true);expect(requests[1].signal.aborted).toBe(false);
    expect(await first).toBe(false);expect(requests[0].dispose).toHaveBeenCalledTimes(1);expect(requests[1].dispose).not.toHaveBeenCalled();
    oldExternal.abort();expect(requests[1].signal.aborted).toBe(false);expect(f.state.target).toBe(f.previous);
    requests[1].resolve(true);expect(await second).toBe(true);expect(requests[1].dispose).toHaveBeenCalledTimes(1);f.capture.dispose();f.previous.dispose();
  });

  it("leaves pending valid work owned when a new request is already aborted",async()=>{
    const f=fixture(),requests=deferredPreparation(f),external=new AbortController(),invalid=new AbortController(),valid=f.capture.warmup(external.signal);
    invalid.abort();expect(await f.capture.warmup(invalid.signal)).toBe(false);expect(requests).toHaveLength(1);expect(requests[0].signal.aborted).toBe(false);
    requests[0].resolve(true);expect(await valid).toBe(true);expect(requests[0].dispose).toHaveBeenCalledTimes(1);f.capture.dispose();f.previous.dispose();
  });

  it("does not accept late success from a cancelled owner after recovery creates a fresh capture",async()=>{
    const old=fixture(),oldRequests=deferredPreparation(old,true),oldExternal=new AbortController(),oldPending=old.capture.warmup(oldExternal.signal);
    old.capture.dispose();expect(oldRequests[0].signal.aborted).toBe(true);
    const fresh=fixture(),freshRequests=deferredPreparation(fresh),freshExternal=new AbortController(),freshPending=fresh.capture.warmup(freshExternal.signal);
    oldExternal.abort();oldRequests[0].resolve(true);expect(await oldPending).toBe(false);expect(oldRequests[0].dispose).toHaveBeenCalledTimes(1);
    expect(freshRequests[0].signal.aborted).toBe(false);expect(freshRequests[0].dispose).not.toHaveBeenCalled();
    freshRequests[0].resolve(true);expect(await freshPending).toBe(true);expect(freshRequests[0].dispose).toHaveBeenCalledTimes(1);
    fresh.capture.dispose();old.previous.dispose();fresh.previous.dispose();
  });

  it("restores the prior attachment before disposing scratch when abort happens during synchronous submission",async()=>{
    const f=fixture(),external=new AbortController();let disposed:ReturnType<typeof vi.spyOn>|undefined;
    preparation.prepare.mockImplementation((_renderer,_scene,_camera,signal:AbortSignal)=>{
      const scratch=f.state.target!,dispose=scratch.dispose;
      disposed=vi.spyOn(scratch,"dispose").mockImplementation(()=>{expect(f.state.target).toBe(f.previous);dispose.call(scratch);});
      external.abort();expect(signal.aborted).toBe(true);expect(disposed).not.toHaveBeenCalled();
      return Promise.resolve(false);
    });
    const pending=f.capture.warmup(external.signal);
    expect(f.state.target).toBe(f.previous);expect(disposed).toHaveBeenCalledTimes(1);expect(await pending).toBe(false);
    expect(disposed).toHaveBeenCalledTimes(1);expect(f.capture.snapshot().failed).toBe(false);f.capture.dispose();f.previous.dispose();
  });

  it("releases scratch on readiness rejection while keeping the optional effect retryable",async()=>{
    const f=fixture(),external=new AbortController();let disposed:ReturnType<typeof vi.spyOn>|undefined;
    preparation.prepare.mockImplementation(()=>{
      disposed=vi.spyOn(f.state.target!,"dispose");return Promise.reject(new Error("injected readiness rejection"));
    });
    const pending=f.capture.warmup(external.signal);expect(f.state.target).toBe(f.previous);
    expect(await pending).toBe(false);expect(disposed).toHaveBeenCalledTimes(1);expect(f.capture.snapshot().failed).toBe(false);
    expect(f.mock.render).not.toHaveBeenCalled();expect(f.capture.texture).toBeNull();f.capture.dispose();f.previous.dispose();
  });

  it("rejects a late readiness result from a replaced WebGL context and cancels its old owned signal",async()=>{
    const f=fixture(),requests=deferredPreparation(f,true),external=new AbortController(),pending=f.capture.warmup(external.signal),oldContext=f.mock.getContext();
    const replacement={...oldContext};f.mock.getContext=()=>replacement;requests[0].resolve(true);
    expect(await pending).toBe(false);expect(requests[0].signal.aborted).toBe(true);expect(requests[0].dispose).toHaveBeenCalledTimes(1);
    expect(f.capture.snapshot()).toMatchObject({failed:false,allocated:false,captures:0});expect(f.state.target).toBe(f.previous);
    f.capture.dispose();f.previous.dispose();
  });

  it("still releases scratch if restoring the previous target throws",async()=>{
    const f=fixture(),external=new AbortController(),setTarget=f.mock.setRenderTarget.getMockImplementation()!;let disposed:ReturnType<typeof vi.spyOn>|undefined;
    f.mock.setRenderTarget.mockImplementation(target=>{setTarget(target);if(target===f.previous)throw new Error("injected restore failure");});
    preparation.prepare.mockImplementation(()=>{disposed=vi.spyOn(f.state.target!,"dispose");return Promise.resolve(true);});
    expect(await f.capture.warmup(external.signal)).toBe(false);expect(disposed).toHaveBeenCalledTimes(1);
    expect(f.capture.snapshot()).toMatchObject({failed:false,allocated:false,captures:0});f.capture.dispose();f.previous.dispose();
  });
});
