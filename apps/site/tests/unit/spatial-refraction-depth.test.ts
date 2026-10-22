import { describe, expect, it, vi } from "vitest";
import { Color, FrontSide, Group, Line, Mesh, MeshBasicMaterial, NearestFilter, NoBlending, NoColorSpace, NormalBlending, PerspectiveCamera, Points, RGBAFormat, Scene, Sprite, Texture, UnsignedByteType, Vector4, WebGLRenderTarget, type WebGLRenderer } from "three";
import { SpatialRefraction } from "../../src/components/spatial/SpatialRefraction";
import { SpatialSceneRuntime } from "../../src/components/spatial/SpatialSceneRuntime";
import { SpatialAtmosphere } from "../../src/components/spatial/SpatialAtmosphere";
import { SpatialCloth } from "../../src/components/spatial/SpatialCloth";

function fixture() {
  const previous=new WebGLRenderTarget(17,23);previous.viewport.set(2,3,11,13);previous.scissor.set(1,2,7,9);previous.scissorTest=true;
  const state={target:previous as WebGLRenderTarget|null,viewport:new Vector4(7,11,311,577),scissor:new Vector4(13,19,149,271),scissorTest:true,currentViewport:previous.viewport.clone(),currentScissor:previous.scissor.clone(),currentScissorTest:true,clearColor:new Color(0x123456),clearAlpha:.37};
  const scene=new Scene(),background=new Color(0x192a3b),camera=new PerspectiveCamera();scene.background=background;
  const atmosphere=new Group(),layer=new Mesh(undefined,new MeshBasicMaterial({transparent:true,depthWrite:false,blending:NormalBlending})),dust=new Points();atmosphere.add(layer,dust);
  const cloth=new Mesh(),brand=new Group(),brandMesh=new Mesh(),gallery=new Group(),card=new Mesh(),line=new Line(),sprite=new Sprite(),hidden=new Mesh();
  hidden.visible=false;brand.add(brandMesh);gallery.add(card,line,sprite,hidden);scene.add(atmosphere,cloth,brand,gallery);
  const gl={FRAMEBUFFER:36160,FRAMEBUFFER_COMPLETE:36053,checkFramebufferStatus:vi.fn(()=>36053)};
  const mock={autoClear:true,getContext:()=>gl,getRenderTarget:()=>state.target,
    setRenderTarget:vi.fn((target:WebGLRenderTarget|null)=>{state.target=target;state.currentViewport.copy(target?.viewport??state.viewport);state.currentScissor.copy(target?.scissor??state.scissor);state.currentScissorTest=target?.scissorTest??state.scissorTest;}),
    getViewport:(v:Vector4)=>v.copy(state.viewport),setViewport:(v:Vector4)=>{state.viewport.copy(v);state.currentViewport.copy(v);},
    getScissor:(v:Vector4)=>v.copy(state.scissor),setScissor:(v:Vector4)=>{state.scissor.copy(v);state.currentScissor.copy(v);},
    getScissorTest:()=>state.scissorTest,setScissorTest:(v:boolean)=>{state.scissorTest=state.currentScissorTest=v;},
    getClearColor:(v:Color)=>v.copy(state.clearColor),getClearAlpha:()=>state.clearAlpha,
    setClearColor:vi.fn((color:Color|number,alpha=1)=>{state.clearColor.set(color);state.clearAlpha=alpha;}),clear:vi.fn(),render:vi.fn(),
  };
  const mode={depth:false},events:string[]=[],beforeDepthCapture=vi.fn(()=>{
    mode.depth=true;layer.material.depthWrite=true;layer.material.blending=NoBlending;events.push("depth-before");
  }),afterDepthCapture=vi.fn(()=>{
    mode.depth=false;layer.material.depthWrite=false;layer.material.blending=NormalBlending;events.push("depth-after");
  });
  const capture=new SpatialRefraction(mock as unknown as WebGLRenderer,scene,camera,{
    exclude:()=>[cloth],compact:true,depthObjects:()=>[atmosphere],beforeDepthCapture,afterDepthCapture,
    beforeCapture:()=>events.push("color-before"),afterCapture:()=>events.push("color-after"),
  });capture.resize(393,852,1.25,true);
  const expected={viewport:state.viewport.clone(),scissor:state.scissor.clone(),clearColor:state.clearColor.clone(),clearAlpha:state.clearAlpha};
  const restored=()=>{
    expect(state.target).toBe(previous);expect(scene.background).toBe(background);expect(state.clearColor.equals(expected.clearColor)).toBe(true);expect(state.clearAlpha).toBe(expected.clearAlpha);
    expect(state.viewport.equals(expected.viewport)).toBe(true);expect(state.scissor.equals(expected.scissor)).toBe(true);expect(state.scissorTest).toBe(true);expect(mock.autoClear).toBe(true);
    expect(state.currentViewport.equals(previous.viewport)).toBe(true);expect(state.currentScissor.equals(previous.scissor)).toBe(true);expect(state.currentScissorTest).toBe(true);
    for(const object of [atmosphere,layer,dust,cloth,brand,brandMesh,gallery,card,line,sprite])expect(object.visible).toBe(true);
    expect(hidden.visible).toBe(false);expect(mode.depth).toBe(false);expect(layer.material.depthWrite).toBe(false);expect(layer.material.blending).toBe(NormalBlending);
  };
  return {capture,scene,camera,background,atmosphere,layer,dust,cloth,brandMesh,card,line,sprite,hidden,mock,state,gl,previous,mode,events,beforeDepthCapture,afterDepthCapture,restored};
}

describe("Significant atmospheric depth capture",()=>{
  it.each(["success","throw","lost","disposed"])("rolls back real runtime material/visibility/uniform references after optical preparation %s",outcome=>{
    const scene=new Scene(),cloth=new SpatialCloth(true),atmosphere=new SpatialAtmosphere(true),other=new Mesh(),camera=new PerspectiveCamera(),sampler=new Texture(),oldColor=new Texture(),oldDepth=new Texture();
    scene.add(cloth,atmosphere,other);cloth.visible=false;atmosphere.visible=false;
    cloth.setOptics(oldColor,301,503,.3);cloth.setDepthOptics(oldDepth,.4,90);cloth.backgroundSize.value.set(7,9);cloth.cssSize.value.set(19,31);
    const uniforms=()=>({color:cloth.background.value,depth:cloth.depthBackground.value,refraction:cloth.refraction.value,ready:cloth.depthReady.value,render:cloth.renderSize.value.toArray(),background:cloth.backgroundSize.value.toArray(),range:cloth.depthRange.value.toArray(),css:cloth.cssSize.value.toArray(),projection:cloth.opticalProjection.value.toArray(),plane:cloth.opticalExitPlane.value.toArray()});
    const objects:object[]=[],materials=new Map();scene.traverse(object=>{objects.push({object,visible:object.visible,frustumCulled:object.frustumCulled});const material=(object as Mesh).material;if(material&&!Array.isArray(material))materials.set(material,{side:material.side,depthWrite:material.depthWrite,blending:material.blending});});
    const before=uniforms(),dispose=vi.spyOn(sampler,"dispose"),render=vi.fn(()=>{
      expect(cloth.visible&&atmosphere.visible).toBe(true);expect(other.visible).toBe(false);expect(cloth.frustumCulled).toBe(false);
      expect(cloth.background.value).toBe(sampler);expect(cloth.depthBackground.value).toBe(sampler);expect(cloth.refraction.value).toBe(1);expect(cloth.depthReady.value).toBe(1);
      expect(atmosphere.backgroundDepthCapture.value).toBe(1);atmosphere.traverse(object=>{const material=(object as Mesh).material;if(material&&!Array.isArray(material)){expect(material.depthWrite).toBe(true);expect(material.blending).toBe(NoBlending);}});
      cloth.material.side=FrontSide;cloth.cssSize.value.set(3,5);cloth.opticalProjection.value.identity();cloth.opticalExitPlane.value.set(9,8,7,6);
      if(outcome==="lost"){runtime.contextLost=true;runtime.releaseOptics();}
      if(outcome==="disposed"){runtime.disposed=true;runtime.releaseOptics();}
      if(outcome==="throw")throw new Error("injected actual-draw failure");
    });
    const runtime=Object.assign(Object.create(SpatialSceneRuntime.prototype),{scene,cloth,atmosphere,camera,rendererHost:{renderer:{render,getContext:()=>({isContextLost:()=>runtime.contextLost===true})}}});
    if(outcome==="throw")expect(()=>runtime.drawOpticsPreparation(sampler)).toThrow("injected actual-draw failure");else runtime.drawOpticsPreparation(sampler);
    expect(render).toHaveBeenCalledTimes(1);
    if(outcome==="lost"||outcome==="disposed"){
      expect(cloth.background.value).toBeNull();expect(cloth.depthBackground.value).toBeNull();expect(cloth.refraction.value).toBe(0);expect(cloth.depthReady.value).toBe(0);
    }else expect(uniforms()).toEqual(before);
    expect(atmosphere.backgroundDepthCapture.value).toBe(0);expect(dispose).not.toHaveBeenCalled();
    for(const saved of objects as {object:Mesh;visible:boolean;frustumCulled:boolean}[]){expect(saved.object.visible).toBe(saved.visible);expect(saved.object.frustumCulled).toBe(saved.frustumCulled);}
    for(const [material,saved]of materials){expect(material.side).toBe(saved.side);expect(material.depthWrite).toBe(saved.depthWrite);expect(material.blending).toBe(saved.blending);}
    cloth.dispose();atmosphere.dispose();sampler.dispose();oldColor.dispose();oldDepth.dispose();other.geometry.dispose();(other.material as MeshBasicMaterial).dispose();
  });

  it("keeps the hero allocation free and captures only atmospheric fragments in a separate bounded data target",()=>{
    const f=fixture();expect(f.capture.render()).toBe(false);expect(f.capture.depthTexture).toBeNull();
    expect(f.capture.snapshot()).toMatchObject({allocated:false,depthAllocated:false,depthPixels:0,depthCaptures:0});expect(f.mock.render).not.toHaveBeenCalled();
    f.mock.render.mockImplementation((scene,camera)=>{
      expect(scene).toBe(f.scene);expect(camera).toBe(f.camera);expect(f.cloth.visible).toBe(false);
      if(!f.mode.depth){
        f.events.push("color-render");expect(f.scene.background).toBe(f.background);expect(f.brandMesh.visible).toBe(true);expect(f.card.visible).toBe(true);
      }else{
        f.events.push("depth-render");expect(f.scene.background).toBeNull();expect(f.state.clearColor.getHex()).toBe(0xffffff);expect(f.state.clearAlpha).toBe(1);
        for(const object of [f.brandMesh,f.card,f.line,f.sprite,f.hidden])expect(object.visible).toBe(false);
        expect(f.layer.visible).toBe(true);expect(f.dust.visible).toBe(true);expect(f.layer.material.depthWrite).toBe(true);expect(f.layer.material.blending).toBe(NoBlending);
        const target=f.state.target!;expect(target.texture.name).toBe("BLACKCROWN_LAB_BACKGROUND_DEPTH_RGBA8");expect(target.texture.type).toBe(UnsignedByteType);expect(target.texture.format).toBe(RGBAFormat);
        expect(target.texture.minFilter).toBe(NearestFilter);expect(target.texture.magFilter).toBe(NearestFilter);expect(target.texture.colorSpace).toBe(NoColorSpace);
        expect(target.texture.generateMipmaps).toBe(false);expect(target.samples).toBe(0);expect(target.depthBuffer).toBe(true);expect(target.width*target.height).toBeLessThanOrEqual(250000);
      }
    });
    f.capture.setEnabled(true);expect(f.capture.render()).toBe(true);expect(f.mock.render).toHaveBeenCalledTimes(2);
    expect(f.events).toEqual(["color-before","color-render","depth-before","depth-render","depth-after","color-after"]);f.restored();
    const s=f.capture.snapshot();expect(s).toMatchObject({allocated:true,depthAllocated:true,captures:1,depthCaptures:1,failed:false,depthFailed:false});
    expect(s.depthPixels).toBe(s.pixels);expect(s.depthColorBytes).toBe(s.colorBytes);expect(f.capture.depthTexture).not.toBe(f.capture.texture);
    f.capture.dispose();f.previous.dispose();
  });

  it.each(["before","framebuffer","render","after"])("retains color and restores state when optional depth fails at %s",failure=>{
    const f=fixture();let depthDisposal:ReturnType<typeof vi.spyOn>|undefined;
    if(failure==="before")f.beforeDepthCapture.mockImplementation(()=>{f.mode.depth=true;throw new Error("injected depth setup");});
    if(failure==="framebuffer")f.gl.checkFramebufferStatus.mockReturnValueOnce(36053).mockReturnValueOnce(36054);
    if(failure==="after")f.afterDepthCapture.mockImplementation(()=>{f.mode.depth=false;f.layer.material.depthWrite=false;f.layer.material.blending=NormalBlending;throw new Error("injected depth cleanup");});
    f.mock.setRenderTarget.mockImplementation(target=>{
      f.state.target=target;f.state.currentViewport.copy(target?.viewport??f.state.viewport);f.state.currentScissor.copy(target?.scissor??f.state.scissor);f.state.currentScissorTest=target?.scissorTest??f.state.scissorTest;
      if(target?.texture.name==="BLACKCROWN_LAB_BACKGROUND_DEPTH_RGBA8"&&!depthDisposal)depthDisposal=vi.spyOn(target,"dispose").mockImplementation(()=>{expect(f.state.target).not.toBe(target);});
    });
    f.mock.render.mockImplementation(()=>{if(f.mode.depth&&failure==="render")throw new Error("injected depth draw");});
    f.capture.setEnabled(true);expect(f.capture.render()).toBe(true);
    f.restored();expect(f.afterDepthCapture).toHaveBeenCalledTimes(1);expect(f.capture.texture).not.toBeNull();expect(f.capture.depthTexture).toBeNull();
    expect(f.capture.snapshot()).toMatchObject({enabled:true,allocated:true,failed:false,depthAllocated:false,depthFailed:true});
    if(depthDisposal)expect(depthDisposal).toHaveBeenCalledTimes(1);
    const calls=f.mock.render.mock.calls.length;expect(f.capture.render()).toBe(true);expect(f.mock.render).toHaveBeenCalledTimes(calls+1);expect(f.beforeDepthCapture).toHaveBeenCalledTimes(1);
    f.capture.dispose();f.previous.dispose();
  });

  it("reuses and resizes both targets, releases both on disable, and does not revive after disposal",()=>{
    const f=fixture();f.capture.setEnabled(true);expect(f.capture.render()).toBe(true);
    const targets=[...new Set(f.mock.setRenderTarget.mock.calls.map(([target])=>target).filter(target=>target&&target!==f.previous))] as WebGLRenderTarget[];
    expect(targets).toHaveLength(2);const disposals=targets.map(t=>vi.spyOn(t,"dispose")),textures=[f.capture.texture,f.capture.depthTexture];
    expect(f.capture.render()).toBe(true);expect([f.capture.texture,f.capture.depthTexture]).toEqual(textures);
    f.capture.resize(430,932,3,true);expect(f.capture.depthTexture).toBeNull();expect(f.capture.render()).toBe(true);
    for(const target of targets){expect(target.width).toBe(f.capture.size.x);expect(target.height).toBe(f.capture.size.y);expect(target.width*target.height).toBeLessThanOrEqual(250000);}
    f.capture.setEnabled(false);for(const disposed of disposals)expect(disposed).toHaveBeenCalledTimes(2); // resize releases storage, then disable releases target
    expect(f.capture.texture).toBeNull();expect(f.capture.depthTexture).toBeNull();expect(f.capture.snapshot()).toMatchObject({allocated:false,depthAllocated:false,pixels:0,depthPixels:0});
    f.capture.setEnabled(true);expect(f.capture.render()).toBe(true);expect(f.capture.texture).not.toBe(textures[0]);expect(f.capture.depthTexture).not.toBe(textures[1]);
    f.capture.dispose();const calls=f.mock.render.mock.calls.length;f.capture.dispose();f.capture.setEnabled(true);expect(f.capture.render()).toBe(false);expect(f.mock.render).toHaveBeenCalledTimes(calls);
    expect(f.capture.depthTexture).toBeNull();f.previous.dispose();
  });

  it("releases both attachments if the required color pass fails after a successful depth frame",()=>{
    const f=fixture();f.capture.setEnabled(true);expect(f.capture.render()).toBe(true);
    const targets=[...new Set(f.mock.setRenderTarget.mock.calls.map(([target])=>target).filter(target=>target&&target!==f.previous))] as WebGLRenderTarget[];
    const disposals=targets.map(target=>vi.spyOn(target,"dispose").mockImplementation(()=>{expect(f.state.target).not.toBe(target);}));
    f.mock.render.mockImplementation(()=>{throw new Error("injected color loss");});expect(f.capture.render()).toBe(false);f.restored();
    for(const disposed of disposals)expect(disposed).toHaveBeenCalledTimes(1);
    expect(f.capture.snapshot()).toMatchObject({enabled:false,failed:true,allocated:false,depthAllocated:false,depthCaptures:1});
    expect(f.capture.texture).toBeNull();expect(f.capture.depthTexture).toBeNull();f.capture.dispose();f.previous.dispose();
  });

  it("skips an unselected drawable parent without suppressing its selected atmospheric descendants",()=>{
    const f=fixture(),ancestor=new Mesh();ancestor.layers.mask=5;f.scene.add(ancestor);ancestor.add(f.atmosphere);
    f.mock.render.mockImplementation(()=>{
      expect(ancestor.visible).toBe(true);expect(ancestor.layers.mask).toBe(f.mode.depth?0:5);
      expect(f.atmosphere.visible).toBe(true);expect(f.layer.visible).toBe(true);
    });
    f.capture.setEnabled(true);expect(f.capture.render()).toBe(true);expect(ancestor.layers.mask).toBe(5);f.restored();f.capture.dispose();f.previous.dispose();
  });
});
