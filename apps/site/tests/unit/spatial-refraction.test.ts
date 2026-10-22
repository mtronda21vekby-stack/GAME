import { describe, expect, it, vi } from "vitest";
import { Color, Group, LinearFilter, Object3D, PerspectiveCamera, RGBAFormat, Scene, UnsignedByteType, Vector4, WebGLRenderTarget, type WebGLRenderer } from "three";
import { refractionTargetSize, SpatialRefraction } from "../../src/components/spatial/SpatialRefraction";

/** CPU-only renderer double. Three has logical default-buffer viewport/scissor
 * state and separate physical current-attachment state; test both explicitly. */
function rendererDouble() {
  const previous=new WebGLRenderTarget(17,23);
  previous.viewport.set(2,3,11,13);previous.scissor.set(1,2,7,9);previous.scissorTest=true;
  const state={target:previous as WebGLRenderTarget|null,viewport:new Vector4(7,11,311,577),scissor:new Vector4(13,19,149,271),scissorTest:true,currentViewport:previous.viewport.clone(),currentScissor:previous.scissor.clone(),currentScissorTest:previous.scissorTest};
  const gl={FRAMEBUFFER:36160,FRAMEBUFFER_COMPLETE:36053,checkFramebufferStatus:vi.fn(()=>36053)};
  const rectangle=(target:Vector4,x:number|Vector4,y?:number,z?:number,w?:number)=>{
    if(x instanceof Vector4)target.copy(x);else target.set(x,y!,z!,w!);
  };
  const mock={
    autoClear:false,
    getContext:()=>gl,
    getRenderTarget:()=>state.target,
    setRenderTarget:vi.fn((target:WebGLRenderTarget|null)=>{
      state.target=target;
      state.currentViewport.copy(target?.viewport??state.viewport);
      state.currentScissor.copy(target?.scissor??state.scissor);state.currentScissorTest=target?.scissorTest??state.scissorTest;
    }),
    getViewport:(target:Vector4)=>target.copy(state.viewport),
    setViewport:vi.fn((x:number|Vector4,y?:number,z?:number,w?:number)=>{rectangle(state.viewport,x,y,z,w);state.currentViewport.copy(state.viewport);}),
    getScissor:(target:Vector4)=>target.copy(state.scissor),
    setScissor:vi.fn((x:number|Vector4,y?:number,z?:number,w?:number)=>{rectangle(state.scissor,x,y,z,w);state.currentScissor.copy(state.scissor);}),
    getScissorTest:()=>state.scissorTest,
    setScissorTest:vi.fn((enabled:boolean)=>{state.scissorTest=state.currentScissorTest=enabled;}),
    getClearColor:(target:Color)=>target.set(0x123456),
    getClearAlpha:()=>1,
    clear:vi.fn(),
    render:vi.fn(),
  };
  const expected={viewport:state.viewport.clone(),scissor:state.scissor.clone(),scissorTest:state.scissorTest,autoClear:mock.autoClear};
  return {renderer:mock as unknown as WebGLRenderer,mock,state,gl,previous,expected};
}

function capturedTarget(mock:ReturnType<typeof rendererDouble>["mock"],previous:WebGLRenderTarget) {
  return mock.setRenderTarget.mock.calls.map(([target])=>target).find(target=>target&&target!==previous)!;
}

describe("Bounded live-scene refraction capture",()=>{
  it.each([
    [393,852,1.25,true,250000],
    [430,932,3,true,250000],
    [1440,900,1.25,false,500000],
    [7680,4320,4,false,500000],
  ])("caps capture pixels for %ix%i at DPR%s",(width,height,dpr,compact,limit)=>{
    const size=refractionTargetSize(width,height,dpr,compact);
    expect(Number.isInteger(size.width)&&Number.isInteger(size.height)).toBe(true);
    expect(size.width).toBeGreaterThan(0);expect(size.height).toBeGreaterThan(0);
    expect(size.pixels).toBe(size.width*size.height);expect(size.pixels).toBeLessThanOrEqual(limit);
    // Pixel rounding must not distort the viewport aspect in normal usable sizes.
    expect(Math.abs(size.width/size.height-width/height)).toBeLessThan(.01);
  });

  it("keeps invalid sizing finite and never allocates while disabled",()=>{
    for(const values of [[0,0,0],[-10,NaN,Infinity],[Infinity,852,NaN]]){
      const size=refractionTargetSize(...values as [number,number,number],true);
      expect([size.width,size.height,size.pixels].every(Number.isFinite)).toBe(true);
      expect(size.width).toBeGreaterThan(0);expect(size.height).toBeGreaterThan(0);
      expect(size.pixels).toBeLessThanOrEqual(250000);
    }
    const {renderer,mock,previous}=rendererDouble(),capture=new SpatialRefraction(renderer,new Scene(),new PerspectiveCamera(),{exclude:()=>[]});
    capture.resize(393,852,1.25,true);capture.setEnabled(false);
    expect(capture.render()).toBe(false);expect(capture.texture).toBeNull();
    expect(capture.snapshot().allocated).toBe(false);expect(mock.render).not.toHaveBeenCalled();
    expect(mock.setRenderTarget).not.toHaveBeenCalled();capture.dispose();previous.dispose();
  });

  it("captures only selected background content, then restores every visibility and renderer state",()=>{
    const {renderer,mock,state,previous,expected}=rendererDouble(),scene=new Scene(),camera=new PerspectiveCamera();
    const cloth=new Group(),foreground=new Group(),alreadyHidden=new Object3D(),background=new Group();
    alreadyHidden.visible=false;scene.add(cloth,foreground,alreadyHidden,background);
    const capture=new SpatialRefraction(renderer,scene,camera,{exclude:()=>[cloth,foreground,alreadyHidden,cloth]});
    capture.resize(430,932,1.25,true);capture.setEnabled(true);
    mock.render.mockImplementation((renderedScene,renderedCamera)=>{
      expect(renderedScene).toBe(scene);expect(renderedCamera).toBe(camera);
      expect(cloth.visible).toBe(false);expect(foreground.visible).toBe(false);
      expect(alreadyHidden.visible).toBe(false);expect(background.visible).toBe(true);
      expect(state.target).not.toBe(previous);expect(state.currentScissorTest).toBe(false);expect(mock.autoClear).toBe(false);
    });
    expect(capture.render()).toBe(true);
    expect(cloth.visible).toBe(true);expect(foreground.visible).toBe(true);expect(alreadyHidden.visible).toBe(false);
    expect(state.target).toBe(previous);expect(state.viewport.equals(expected.viewport)).toBe(true);
    expect(state.scissor.equals(expected.scissor)).toBe(true);expect(state.scissorTest).toBe(expected.scissorTest);expect(mock.autoClear).toBe(expected.autoClear);
    expect(state.currentViewport.equals(previous.viewport)).toBe(true);expect(state.currentScissor.equals(previous.scissor)).toBe(true);expect(state.currentScissorTest).toBe(previous.scissorTest);
    expect(mock.clear).toHaveBeenCalledTimes(1);
    expect(capture.snapshot()).toMatchObject({enabled:true,allocated:true,captures:1,failed:false});
    const target=capturedTarget(mock,previous);
    expect(target.texture.type).toBe(UnsignedByteType);expect(target.texture.format).toBe(RGBAFormat);
    expect(target.texture.generateMipmaps).toBe(false);expect(target.samples).toBe(0);
    expect(target.texture.minFilter).toBe(LinearFilter);expect(target.texture.magFilter).toBe(LinearFilter);
    expect(target.width*target.height).toBeLessThanOrEqual(250000);expect(capture.texture).toBe(target.texture);
    capture.dispose();previous.dispose();
  });

  it("reuses its target on repeated captures and resizes without accumulating allocations",()=>{
    const {renderer,mock,previous}=rendererDouble(),capture=new SpatialRefraction(renderer,new Scene(),new PerspectiveCamera(),{exclude:()=>[]});
    capture.resize(393,852,1.25,true);capture.setEnabled(true);expect(capture.render()).toBe(true);
    const target=capturedTarget(mock,previous),texture=capture.texture;
    for(let i=0;i<4;i++)expect(capture.render()).toBe(true);
    expect(capture.texture).toBe(texture);expect(capture.snapshot().captures).toBe(5);
    capture.resize(430,932,1.25,true);expect(capture.render()).toBe(true);
    expect(capture.texture).toBe(texture);expect(target.width*target.height).toBeLessThanOrEqual(250000);
    expect(capture.size.x).toBe(target.width);expect(capture.size.y).toBe(target.height);
    const disposed=vi.spyOn(target,"dispose");
    capture.setEnabled(false);expect(capture.texture).toBeNull();expect(capture.snapshot().allocated).toBe(false);
    expect(disposed).toHaveBeenCalledTimes(1);expect(capture.render()).toBe(false);
    capture.dispose();capture.dispose();expect(disposed).toHaveBeenCalledTimes(1);previous.dispose();
  });

  it("can release and re-enter LAB, then cannot revive after final disposal",()=>{
    const {renderer,mock,previous}=rendererDouble(),capture=new SpatialRefraction(renderer,new Scene(),new PerspectiveCamera(),{exclude:()=>[]});
    capture.resize(393,852,1.25,true);capture.setEnabled(true);expect(capture.render()).toBe(true);
    const first=capturedTarget(mock,previous),firstDisposed=vi.spyOn(first,"dispose");
    capture.setEnabled(false);expect(firstDisposed).toHaveBeenCalledTimes(1);
    mock.setRenderTarget.mockClear();capture.setEnabled(true);expect(capture.render()).toBe(true);
    const second=capturedTarget(mock,previous),secondDisposed=vi.spyOn(second,"dispose");
    expect(second).not.toBe(first);expect(capture.snapshot().captures).toBe(2);
    capture.dispose();capture.dispose();expect(secondDisposed).toHaveBeenCalledTimes(1);
    const calls=mock.render.mock.calls.length;
    capture.resize(1440,900,1.5,false);capture.setEnabled(true);expect(capture.render()).toBe(false);
    expect(capture.texture).toBeNull();expect(capture.snapshot()).toMatchObject({enabled:false,allocated:false});
    expect(mock.render).toHaveBeenCalledTimes(calls);previous.dispose();
  });

  it.each(["incomplete target","render exception"])("falls back once after %s and restores prior state",failure=>{
    const {renderer,mock,state,gl,previous,expected}=rendererDouble(),hidden=new Object3D(),shown=new Object3D();hidden.visible=false;
    const capture=new SpatialRefraction(renderer,new Scene(),new PerspectiveCamera(),{exclude:()=>[shown,hidden]});
    capture.resize(1440,900,1.25,false);capture.setEnabled(true);
    if(failure==="incomplete target")gl.checkFramebufferStatus.mockReturnValue(36054);
    else mock.render.mockImplementation(()=>{throw new Error("injected capture failure");});
    expect(capture.render()).toBe(false);
    expect(shown.visible).toBe(true);expect(hidden.visible).toBe(false);
    expect(state.target).toBe(previous);expect(state.viewport.equals(expected.viewport)).toBe(true);
    expect(state.scissor.equals(expected.scissor)).toBe(true);expect(state.scissorTest).toBe(expected.scissorTest);expect(mock.autoClear).toBe(expected.autoClear);
    expect(state.currentViewport.equals(previous.viewport)).toBe(true);expect(state.currentScissor.equals(previous.scissor)).toBe(true);expect(state.currentScissorTest).toBe(previous.scissorTest);
    expect(capture.snapshot()).toMatchObject({enabled:false,allocated:false,captures:0,failed:true});expect(capture.texture).toBeNull();
    const targetCalls=mock.setRenderTarget.mock.calls.length,renderCalls=mock.render.mock.calls.length;
    capture.setEnabled(true);expect(capture.render()).toBe(false);
    expect(mock.setRenderTarget).toHaveBeenCalledTimes(targetCalls);expect(mock.render).toHaveBeenCalledTimes(renderCalls);
    capture.dispose();previous.dispose();
  });

  it("runs temporary background hooks around the same capture submission",()=>{
    const {renderer,mock,previous}=rendererDouble(),events:string[]=[],cloth=new Object3D();let clipping=false;
    const beforeCapture=vi.fn(()=>{events.push("before");clipping=true;}),afterCapture=vi.fn(()=>{events.push("after");clipping=false;});
    const capture=new SpatialRefraction(renderer,new Scene(),new PerspectiveCamera(),{exclude:()=>[cloth],beforeCapture,afterCapture});
    mock.render.mockImplementation(()=>{events.push("render");expect(clipping).toBe(true);expect(cloth.visible).toBe(false);});
    capture.resize(393,852,1.25,true);capture.setEnabled(true);expect(capture.render()).toBe(true);
    expect(events).toEqual(["before","render","after"]);expect(clipping).toBe(false);expect(cloth.visible).toBe(true);
    expect(beforeCapture).toHaveBeenCalledTimes(1);expect(afterCapture).toHaveBeenCalledTimes(1);
    capture.dispose();previous.dispose();
  });

  it.each(["before hook","framebuffer","render"])("always resets capture-only state after a %s failure",failure=>{
    const {renderer,mock,state,gl,previous,expected}=rendererDouble(),cloth=new Object3D();let clipping=false;
    const beforeCapture=vi.fn(()=>{clipping=true;if(failure==="before hook")throw new Error("injected before hook");});
    const afterCapture=vi.fn(()=>{clipping=false;});
    const capture=new SpatialRefraction(renderer,new Scene(),new PerspectiveCamera(),{exclude:()=>[cloth],beforeCapture,afterCapture});
    if(failure==="framebuffer")gl.checkFramebufferStatus.mockReturnValue(36054);
    if(failure==="render")mock.render.mockImplementation(()=>{throw new Error("injected renderer");});
    capture.resize(430,932,1.25,true);capture.setEnabled(true);expect(capture.render()).toBe(false);
    expect(beforeCapture).toHaveBeenCalledTimes(1);expect(afterCapture).toHaveBeenCalledTimes(1);
    expect(clipping).toBe(false);expect(cloth.visible).toBe(true);expect(state.target).toBe(previous);
    expect(state.viewport.equals(expected.viewport)).toBe(true);expect(state.scissor.equals(expected.scissor)).toBe(true);
    expect(state.currentViewport.equals(previous.viewport)).toBe(true);expect(state.currentScissor.equals(previous.scissor)).toBe(true);
    expect(state.scissorTest).toBe(expected.scissorTest);expect(mock.autoClear).toBe(expected.autoClear);
    expect(capture.snapshot()).toMatchObject({failed:true,enabled:false,allocated:false});
    capture.setEnabled(true);expect(capture.render()).toBe(false);expect(beforeCapture).toHaveBeenCalledTimes(1);expect(afterCapture).toHaveBeenCalledTimes(1);
    capture.dispose();previous.dispose();
  });

  it("latches an after-hook failure without leaving objects or attachment state changed",()=>{
    const {renderer,mock,state,previous,expected}=rendererDouble(),cloth=new Object3D(),afterCapture=vi.fn(()=>{throw new Error("injected after hook");});
    const capture=new SpatialRefraction(renderer,new Scene(),new PerspectiveCamera(),{exclude:()=>[cloth],afterCapture});
    capture.resize(393,852,1.25,true);capture.setEnabled(true);expect(capture.render()).toBe(false);
    expect(afterCapture).toHaveBeenCalledTimes(1);expect(cloth.visible).toBe(true);expect(state.target).toBe(previous);
    expect(state.viewport.equals(expected.viewport)).toBe(true);expect(state.scissor.equals(expected.scissor)).toBe(true);
    expect(state.currentViewport.equals(previous.viewport)).toBe(true);expect(state.currentScissor.equals(previous.scissor)).toBe(true);
    expect(capture.texture).toBeNull();expect(capture.snapshot()).toMatchObject({failed:true,enabled:false,allocated:false});
    capture.setEnabled(true);expect(capture.render()).toBe(false);expect(mock.render).toHaveBeenCalledTimes(1);
    capture.dispose();previous.dispose();
  });

  it("does not enter temporary capture hooks while disabled or disposed",()=>{
    const {renderer,previous}=rendererDouble(),beforeCapture=vi.fn(),afterCapture=vi.fn();
    const capture=new SpatialRefraction(renderer,new Scene(),new PerspectiveCamera(),{exclude:()=>[],beforeCapture,afterCapture});
    expect(capture.render()).toBe(false);capture.dispose();capture.setEnabled(true);expect(capture.render()).toBe(false);
    expect(beforeCapture).not.toHaveBeenCalled();expect(afterCapture).not.toHaveBeenCalled();previous.dispose();
  });

  it("treats an exclusion callback error as an optional-effect failure and still runs cleanup",()=>{
    const {renderer,mock,state,previous,expected}=rendererDouble(),beforeCapture=vi.fn(),afterCapture=vi.fn();
    const capture=new SpatialRefraction(renderer,new Scene(),new PerspectiveCamera(),{exclude:()=>{throw new Error("injected exclusion failure");},beforeCapture,afterCapture});
    capture.resize(393,852,1.25,true);capture.setEnabled(true);let result:boolean|undefined;
    expect(()=>{result=capture.render();}).not.toThrow();expect(result).toBe(false);
    expect(beforeCapture).not.toHaveBeenCalled();expect(afterCapture).toHaveBeenCalledTimes(1);expect(mock.render).not.toHaveBeenCalled();
    expect(capture.texture).toBeNull();expect(capture.snapshot()).toMatchObject({failed:true,enabled:false,allocated:false});
    expect(state.target).toBe(previous);expect(state.viewport.equals(expected.viewport)).toBe(true);expect(state.scissor.equals(expected.scissor)).toBe(true);
    expect(state.currentViewport.equals(previous.viewport)).toBe(true);expect(state.currentScissor.equals(previous.scissor)).toBe(true);
    capture.setEnabled(true);expect(capture.render()).toBe(false);expect(afterCapture).toHaveBeenCalledTimes(1);
    capture.dispose();previous.dispose();
  });
});
