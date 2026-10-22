import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { DataTexture, PerspectiveCamera, Plane, Scene, ShaderLib, Vector2, Vector3, Vector4, type Matrix4, type WebGLRenderer } from "three";
import { SpatialCloth } from "../../src/components/spatial/SpatialCloth";

function background(width=24,height=12) {
  return new DataTexture(new Uint8Array(Math.max(1,width*height*4)),width,height);
}

function assembledShader(cloth:SpatialCloth) {
  const shader={uniforms:{},vertexShader:ShaderLib.physical.vertexShader,fragmentShader:ShaderLib.physical.fragmentShader};
  cloth.material.onBeforeCompile(shader as Parameters<typeof cloth.material.onBeforeCompile>[0],{} as WebGLRenderer);
  return shader;
}

/** Independent CPU Snell/plane projection reference; no GLSL execution claimed. */
function opticalPixels(point:Vector3,normal:Vector3,plane:Vector4,projection:Matrix4,css:Vector2,ior:number,bend=1) {
  const incident=point.clone().normalize(),n=normal.clone().normalize(),dot=n.dot(incident),eta=1/ior,k=1-eta*eta*(1-dot*dot);
  if(k<0)return new Vector2();
  const ray=incident.clone().multiplyScalar(eta).addScaledVector(n,-eta*dot-Math.sqrt(k)),planeNormal=new Vector3(plane.x,plane.y,plane.z),distance=planeNormal.dot(point)+plane.w;
  const straightDenominator=planeNormal.dot(incident),bentDenominator=planeNormal.dot(ray);
  if(straightDenominator>=-.08||bentDenominator>=-.08||distance<=0)return new Vector2();
  const straight=point.clone().addScaledVector(incident,-distance/straightDenominator).applyMatrix4(projection),bent=point.clone().addScaledVector(ray,-distance/bentDenominator).applyMatrix4(projection);
  const delta=new Vector2((bent.x-straight.x)*css.x/2,(bent.y-straight.y)*css.y/2),length=delta.length();
  return delta.multiplyScalar(Math.min(1,24/Math.max(length,.001))*Math.max(0,Math.min(1,bend)));
}

function beforeRender(cloth:SpatialCloth,camera:PerspectiveCamera,size:Vector2) {
  const renderer={getSize:(target:Vector2)=>target.copy(size)} as WebGLRenderer;
  cloth.onBeforeRender(renderer,new Scene(),camera,cloth.geometry,cloth.material,null as never);
}

describe("Sculptural LAB profiles and live background optics",()=>{
  it("offers a dark metallic saddle and a materially distinct refractive membrane",()=>{
    const cloth=new SpatialCloth(false),geometry=cloth.geometry;
    expect(cloth.profile).toBe("molten");expect(cloth.profileMix.value).toBe(0);
    const molten={color:cloth.material.color.clone(),metalness:cloth.material.metalness,roughness:cloth.material.roughness,clearcoat:cloth.material.clearcoat,anisotropy:cloth.material.anisotropy};
    cloth.setProfile("membrane");
    expect(cloth.profile).toBe("membrane");expect(cloth.profileMix.value).toBe(1);
    expect(cloth.material.color.equals(molten.color)).toBe(false);
    expect(molten.metalness-cloth.material.metalness).toBeGreaterThan(.2);
    expect(cloth.material.roughness).toBeLessThan(molten.roughness);
    expect(cloth.material.clearcoat).toBeGreaterThan(molten.clearcoat);
    expect(cloth.material.anisotropy).toBeLessThan(molten.anisotropy);
    expect(cloth.geometry).toBe(geometry);
    cloth.setProfile("molten");expect(cloth.profileMix.value).toBe(0);
    expect(cloth.material.metalness).toBe(molten.metalness);cloth.dispose();
  });

  it("bounds the new sculpture without replacing its mesh or accepting nonfinite values",()=>{
    const cloth=new SpatialCloth(true),geometry=cloth.geometry,positions=geometry.attributes.position.array,copy=positions.slice();
    for(const [input,expected] of [[-.5,0],[.65,.65],[4,1],[NaN,0],[Infinity,0]]){
      cloth.setSculpture(input);expect(cloth.sculpture.value).toBe(expected);
    }
    expect(cloth.geometry).toBe(geometry);expect(cloth.geometry.attributes.position.array).toBe(positions);
    expect(positions).toEqual(copy);cloth.dispose();
  });

  it("uses the live texture, keeps render and capture dimensions separate, and falls back safely",()=>{
    const cloth=new SpatialCloth(true),texture=background();
    cloth.setOptics(texture,491,1065,.8);
    expect(cloth.background.value).toBe(texture);expect(cloth.renderSize.value.toArray()).toEqual([491,1065]);
    expect(cloth.backgroundSize.value.toArray()).toEqual([24,12]);expect(cloth.refraction.value).toBe(.8);
    cloth.setOptics(texture,-7,0,8);expect(cloth.renderSize.value.toArray()).toEqual([1,1]);expect(cloth.refraction.value).toBe(1);
    cloth.setOptics(texture,NaN,Infinity,NaN);expect(cloth.renderSize.value.toArray()).toEqual([1,1]);expect(cloth.refraction.value).toBe(0);
    cloth.setOptics(texture,393,852,-2);expect(cloth.refraction.value).toBe(0);
    cloth.setOptics(null,393,852,1);expect(cloth.background.value).toBeNull();expect(cloth.refraction.value).toBe(0);
    expect(cloth.backgroundSize.value.toArray()).toEqual([1,1]);cloth.dispose();texture.dispose();
  });

  it("changes geometry only across quality segment counts and never owns the background texture",()=>{
    const cloth=new SpatialCloth(true),texture=background(),textureDisposed=vi.spyOn(texture,"dispose"),compact=cloth.geometry,compactDisposed=vi.spyOn(compact,"dispose");
    cloth.setOptics(texture,393,852,1);cloth.setProfile("membrane");cloth.setQuality(true,false);cloth.setQuality(true,true);
    expect(cloth.geometry).toBe(compact);expect(compactDisposed).not.toHaveBeenCalled();
    cloth.setQuality(false,false);const desktop=cloth.geometry;
    expect(desktop).not.toBe(compact);expect(compactDisposed).toHaveBeenCalledTimes(1);
    cloth.setProfile("molten");cloth.setQuality(false,false);expect(cloth.geometry).toBe(desktop);
    expect(textureDisposed).not.toHaveBeenCalled();cloth.dispose();
    expect(cloth.background.value).toBeNull();expect(cloth.refraction.value).toBe(0);
    expect(textureDisposed).not.toHaveBeenCalled();texture.dispose();
  });

  it("freezes reduced-motion impulses while retaining the authored profile and sculpture",()=>{
    const cloth=new SpatialCloth(true);cloth.setProfile("membrane");cloth.setSculpture(.8);
    cloth.setHover(.3,.7,1);cloth.grab(.3,.7,.2,-.1);cloth.touch(.3,.7,.1);cloth.update(.2);
    cloth.setQuality(true,true);cloth.setHover(.9,.1,1);cloth.grab(.9,.1,.2,.2);cloth.touch(.9,.1,.3);cloth.update(8);
    expect(cloth.motion.value).toBe(0);expect(cloth.hover.value.z).toBe(0);
    expect(cloth.drag.value.z).toBe(0);expect(cloth.drag.value.w).toBe(0);expect(cloth.hits.value.every(hit=>hit.w===0)).toBe(true);
    expect(cloth.profileMix.value).toBe(1);expect(cloth.sculpture.value).toBe(.8);
    const shader=assembledShader(cloth);
    expect(shader.uniforms).toMatchObject({uClothProfile:cloth.profileMix,uClothSculpture:cloth.sculpture,uClothMotion:cloth.motion});
    expect(shader.vertexShader).toContain("uClothTime*uClothMotion");cloth.dispose();
  });

  it("assembles live refraction once before tone mapping and preserves the authored vertex output",()=>{
    const cloth=new SpatialCloth(false),texture=background();cloth.setOptics(texture,1800,1125,.7);
    const shader=assembledShader(cloth),vertex=shader.vertexShader,fragment=shader.fragmentShader;
    expect(shader.uniforms).toMatchObject({uClothBackground:cloth.background,uClothRenderSize:cloth.renderSize,uClothBackgroundSize:cloth.backgroundSize,uClothRefraction:cloth.refraction,uClothProfile:cloth.profileMix,uClothSculpture:cloth.sculpture});
    expect(vertex.match(/vec3 clothSurface\(/g)).toHaveLength(1);
    expect(vertex.match(/transformed=clothPoint/g)).toHaveLength(1);
    expect(vertex).toContain("objectNormal=normalize(cross(clothU,clothV))");
    expect(vertex).toContain("mix(metalFold,membraneFold,uClothProfile)*uClothSculpture");
    const sampled=fragment.indexOf("texture2D(uClothBackground,sampleUv)"),output=fragment.indexOf("#include <opaque_fragment>"),tone=fragment.indexOf("#include <tonemapping_fragment>");
    expect(sampled).toBeGreaterThan(-1);expect(output).toBeGreaterThan(sampled);expect(tone).toBeGreaterThan(output);
    expect(fragment.match(/texture2D\(uClothBackground,/g)).toHaveLength(1);
    expect(fragment.match(/#include <opaque_fragment>/g)).toHaveLength(1);
    expect(fragment.match(/#include <tonemapping_fragment>/g)).toHaveLength(1);
    expect(fragment).toContain("gl_FragCoord.xy/max(uClothRenderSize");
    expect(fragment).toContain("refract(-eye,normal");
    expect(fragment).toContain("if(cloth.x<.26)discard");
    cloth.dispose();texture.dispose();
  });

  it("limits the bend diagnostic to background UV displacement without changing the optical finish or form",()=>{
    const cloth=new SpatialCloth(false),texture=background();cloth.setProfile("membrane");cloth.setSculpture(.8);cloth.setOptics(texture,1800,1125,.7);
    const geometry=cloth.geometry,positions=geometry.attributes.position.array;
    const material=()=>({color:cloth.material.color.toArray(),metalness:cloth.material.metalness,roughness:cloth.material.roughness,clearcoat:cloth.material.clearcoat,anisotropy:cloth.material.anisotropy,iridescence:cloth.material.iridescence});
    const before=assembledShader(cloth),finish=material();expect(cloth.bendStrength.value).toBe(1);
    cloth.bendStrength.value=0;const straight=assembledShader(cloth);
    expect(straight.uniforms).toMatchObject({uClothBend:cloth.bendStrength});expect(cloth.bendStrength.value).toBe(0);
    expect(straight.vertexShader).toBe(before.vertexShader);expect(straight.fragmentShader).toBe(before.fragmentShader);
    expect(cloth.geometry).toBe(geometry);expect(cloth.geometry.attributes.position.array).toBe(positions);expect(material()).toEqual(finish);
    expect(cloth.profile).toBe("membrane");expect(cloth.sculpture.value).toBe(.8);expect(cloth.refraction.value).toBe(.7);expect(cloth.background.value).toBe(texture);
    const fragment=straight.fragmentShader,displacement=fragment.split("\n").find(line=>line.includes("displacement*=")&&line.includes("uClothBend"))!,coating=fragment.split("\n").find(line=>line.includes("float coating="))!;
    expect(fragment.match(/\buClothBend\b/g)).toHaveLength(2);expect(straight.vertexShader).not.toContain("uClothBend");
    expect(displacement).toContain("clamp(uClothBend,0.,1.)");expect(coating).toContain("1.-coatingFresnel");expect(coating).not.toContain("Bend");
    expect(fragment).not.toContain("bendVisibility");expect(cloth.material.customProgramCacheKey()).toContain("optical-path-cloth-v4");
    cloth.dispose();texture.dispose();
  });

  it("updates actual camera projection, full view-space backing plane and CSS size per render",()=>{
    const cloth=new SpatialCloth(true),camera=new PerspectiveCamera(36,393/852,.1,100),css=new Vector2(393,852);
    camera.position.set(1,2,17.8);camera.lookAt(.2,-.3,0);camera.rotateZ(.2);camera.updateMatrixWorld(true);
    cloth.position.set(1,-7,4.4);cloth.scale.set(5,7,3);cloth.rotation.set(.1,-.15,.05);cloth.updateMatrixWorld(true);
    cloth.setOptics(background(),491,1065,.8);cloth.setOpticalBackgroundDepth(-12.5);beforeRender(cloth,camera,css);
    const expected=new Plane(new Vector3(0,0,1),12.5).applyMatrix4(camera.matrixWorldInverse);
    expect(cloth.cssSize.value.toArray()).toEqual([393,852]);expect(cloth.renderSize.value.toArray()).toEqual([491,1065]);
    expect(cloth.opticalProjection.value.equals(camera.projectionMatrix)).toBe(true);expect(cloth.opticalProjection.value).not.toBe(camera.projectionMatrix);
    expect(cloth.opticalExitPlane.value.x).toBeCloseTo(expected.normal.x,12);expect(cloth.opticalExitPlane.value.y).toBeCloseTo(expected.normal.y,12);
    expect(cloth.opticalExitPlane.value.z).toBeCloseTo(expected.normal.z,12);expect(cloth.opticalExitPlane.value.w).toBeCloseTo(expected.constant,12);
    camera.fov=41;camera.aspect=430/932;camera.updateProjectionMatrix();css.set(430,932);beforeRender(cloth,camera,css);
    expect(cloth.cssSize.value.toArray()).toEqual([430,932]);expect(cloth.opticalProjection.value.equals(camera.projectionMatrix)).toBe(true);
    cloth.setOpticalBackgroundDepth(null);beforeRender(cloth,camera,css);const fallback=cloth.opticalExitPlane.value.clone();
    for(const invalid of [NaN,Infinity]){cloth.setOpticalBackgroundDepth(invalid);beforeRender(cloth,camera,css);expect(cloth.opticalExitPlane.value.toArray()).toEqual(fallback.toArray());}
    expect(fallback.toArray().every(Number.isFinite)).toBe(true);
    const shader=assembledShader(cloth);expect(shader.uniforms).toMatchObject({uClothCssSize:cloth.cssSize,uClothProjection:cloth.opticalProjection,uClothExitPlane:cloth.opticalExitPlane});
    const texture=cloth.background.value;cloth.dispose();texture?.dispose();
  });

  it.each([[393,852,36],[1440,900,38]])("has a stronger bounded physical optical path at %ix%i",(width,height,fov)=>{
    const cloth=new SpatialCloth(true),camera=new PerspectiveCamera(fov,width/height,.1,100),css=new Vector2(width,height);
    camera.position.set(0,0,17.8);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
    cloth.setOpticalBackgroundDepth(-12.5);beforeRender(cloth,camera,css);
    const point=new Vector3(0,0,4.4).applyMatrix4(camera.matrixWorldInverse),projection=cloth.opticalProjection.value,plane=cloth.opticalExitPlane.value;
    expect(opticalPixels(point,new Vector3(0,0,1),plane,projection,css,1.24).length()).toBeLessThan(1e-10);
    const tilt=(degrees:number)=>new Vector3(Math.sin(degrees*Math.PI/180),0,Math.cos(degrees*Math.PI/180));
    expect(opticalPixels(point,tilt(5),plane,projection,css,1.24).length()).toBeGreaterThan(6);
    for(const angle of [5,10,20,40,80]){
      const shifted=opticalPixels(point,tilt(angle),plane,projection,css,1.24);
      expect(shifted.toArray().every(Number.isFinite)).toBe(true);expect(shifted.length()).toBeLessThanOrEqual(24+1e-10);
    }
    expect(opticalPixels(point,tilt(40),plane,projection,css,1.24).length()).toBeCloseTo(24,10);
    expect(opticalPixels(point,tilt(40),plane,projection,css,1.24,0).length()).toBe(0);
    cloth.dispose();
  });

  it("bounds the analytical molten ray shift at the recorded 393px phone camera pose",()=>{
    // Runtime-QA pose values: this is a CPU projection calculation, not a
    // pixel-displacement measurement from the captured browser video.
    const cloth=new SpatialCloth(true),camera=new PerspectiveCamera(38,393/852,.1,100),css=new Vector2(393,852),cutoff=.858;
    camera.position.set(0,0,19.6);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
    cloth.setProfile("molten");cloth.setOpticalBackgroundDepth(cutoff-2.5);beforeRender(cloth,camera,css);
    const point=new Vector3(0,0,4.4).applyMatrix4(camera.matrixWorldInverse),tilt=(degrees:number)=>new Vector3(Math.sin(degrees*Math.PI/180),0,Math.cos(degrees*Math.PI/180));
    const projected=(degrees:number)=>opticalPixels(point,tilt(degrees),cloth.opticalExitPlane.value,cloth.opticalProjection.value,css,1.42).length();
    expect(projected(0)).toBeLessThan(1e-10);
    expect(projected(5)).toBeGreaterThan(8.9);expect(projected(5)).toBeLessThan(9.3);
    expect(projected(10)).toBeGreaterThan(18);expect(projected(10)).toBeLessThan(18.6);
    expect(projected(15)).toBeCloseTo(24,10);
    const normal=tilt(5),incident=new Vector3(0,0,-1),eta=1/1.42,dot=normal.dot(incident),ray=incident.multiplyScalar(eta).addScaledVector(normal,-eta*dot-Math.sqrt(1-eta*eta*(1-dot*dot)));
    const oldApproximation=Math.abs(ray.x/ray.z)*.075*852;
    expect(oldApproximation).toBeGreaterThan(1.6);expect(oldApproximation).toBeLessThan(1.7);expect(projected(5)).toBeGreaterThan(oldApproximation*5);
    cloth.dispose();
  });

  it("uses smooth fold normals and projected ray exits while retaining the exact 692 authored form",()=>{
    const cloth=new SpatialCloth(false),shader=assembledShader(cloth),fragment=shader.fragmentShader,form=shader.vertexShader.match(/vec3 clothSurface\(vec2 p\) \{[\s\S]*?\n  \}/)?.[0];
    expect(form).toBeDefined();expect(createHash("sha256").update(form!).digest("hex")).toBe("41eae2b87e406a07a3a0d86fa0db39bcdef665fbe0e3b35ebba66e7e84eb4312");
    expect(fragment).toContain("opticalRay=refract(-eye,normalize(nonPerturbedNormal)");expect(fragment).toContain("vec3 point=-vViewPosition");
    expect(fragment).toContain("dot(uClothExitPlane,vec4(point,1.))");expect(fragment).toContain("uClothProjection*vec4(point+opticalRay*bentTravel,1.)");
    expect(fragment).toContain("bentClip.xy/bentClip.w-straightClip.xy/straightClip.w");
    expect(fragment).toContain("mix(originalDisplacement,projectedDisplacement,clamp(uClothSculpture,0.,1.))");
    expect(fragment).toContain("length(displacement*max(uClothCssSize,vec2(1.)))");expect(fragment).toContain("24./max(cssTravel,.001)");
    expect(fragment).toContain("bentDenominator<-.08&&straightDenominator<-.08&&planeDistance>0.");
    expect(fragment.match(/texture2D\(uClothBackground,/g)).toHaveLength(1);cloth.dispose();
  });
});
