import { describe, expect, it, vi } from "vitest";
import { DataTexture, ShaderLib, type WebGLRenderer } from "three";
import { SpatialCloth } from "../../src/components/spatial/SpatialCloth";

function background(width=24,height=12) {
  return new DataTexture(new Uint8Array(Math.max(1,width*height*4)),width,height);
}

function assembledShader(cloth:SpatialCloth) {
  const shader={uniforms:{},vertexShader:ShaderLib.physical.vertexShader,fragmentShader:ShaderLib.physical.fragmentShader};
  cloth.material.onBeforeCompile(shader as Parameters<typeof cloth.material.onBeforeCompile>[0],{} as WebGLRenderer);
  return shader;
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
});
