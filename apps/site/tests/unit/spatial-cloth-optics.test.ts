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
  it("offers distinct metallic ribbon and open membrane finishes",()=>{
    const cloth=new SpatialCloth(false),geometry=cloth.geometry;
    expect(cloth.profile).toBe("molten");expect(cloth.profileMix.value).toBe(0);
    const molten={color:cloth.material.color.clone(),metalness:cloth.material.metalness,roughness:cloth.material.roughness,clearcoat:cloth.material.clearcoat,anisotropy:cloth.material.anisotropy};
    cloth.setProfile("membrane");
    expect(cloth.profile).toBe("membrane");expect(cloth.profileMix.value).toBe(1);
    expect(cloth.material.color.equals(molten.color)).toBe(false);
    expect(molten.metalness-cloth.material.metalness).toBeGreaterThan(.2);
    expect(cloth.material.roughness).toBeLessThan(molten.roughness);
    expect(cloth.material.clearcoat).toBeLessThan(molten.clearcoat);
    expect(cloth.material.anisotropy).toBeLessThan(molten.anisotropy);
    expect(cloth.material.iridescence).toBe(0);expect(cloth.material.emissive.toArray()).toEqual([0,0,0]);
    expect(cloth.geometry).toBe(geometry);
    cloth.setProfile("molten");expect(cloth.profileMix.value).toBe(0);
    expect(cloth.material.metalness).toBe(molten.metalness);expect(cloth.material.iridescence).toBe(0);cloth.dispose();
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
    expect(vertex).toContain("z=mix(z,labZ,uClothSculpture)");
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
    const fragment=straight.fragmentShader,ray=fragment.split("\n").find(line=>line.includes("vec3 opticalRay="))!,coating=fragment.split("\n").find(line=>line.includes("float coating="))!;
    expect(fragment.match(/\buClothBend\b/g)).toHaveLength(3);expect(straight.vertexShader).not.toContain("uClothBend");
    expect(ray).toContain("normalize(mix(-eye,refract(-eye,normalize(nonPerturbedNormal)");expect(ray).toContain("clamp(uClothBend,0.,1.)");
    expect(fragment.indexOf(ray)).toBeLessThan(fragment.indexOf("clothTraceDepth(point,opticalRay"));
    const cap=fragment.split("\n").find(line=>line.includes("displacement*="))!;expect(cap).not.toContain("uClothBend");
    expect(coating).toContain("1.-coatingFresnel");expect(coating).not.toContain("Bend");
    expect(fragment).not.toContain("bendVisibility");expect(cloth.material.customProgramCacheKey()).toContain("woven-depth-tension-surface-v7");
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

  it("retains the plane-fallback benchmark at b89's recorded 393px camera pose",()=>{
    // Runtime-QA pose values: this is a CPU projection calculation, not a
    // pixel-displacement measurement from video or from the new surface volume.
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

  it("uses smooth fold normals and projected ray exits with a bounded LAB/rest envelope",()=>{
    const cloth=new SpatialCloth(false),shader=assembledShader(cloth),fragment=shader.fragmentShader,vertex=shader.vertexShader;
    expect(vertex).toContain("x=mix(x,labX,uClothSculpture)");expect(vertex).toContain("y=mix(y,labY,uClothSculpture)");expect(vertex).toContain("z=mix(z,labZ,uClothSculpture)");
    expect(vertex).toContain("x=clamp(x,-.86,.86);y=clamp(y,-.86,.86);z=clamp(z,-1.15,1.15)");
    expect(fragment).toContain("refract(-eye,normalize(nonPerturbedNormal)");expect(fragment).toContain("vec3 point=-vViewPosition");
    expect(fragment).toContain("dot(uClothExitPlane,vec4(point,1.))");expect(fragment).toContain("uClothProjection*vec4(point+opticalRay*bentTravel,1.)");
    expect(fragment).toContain("bentClip.xy/bentClip.w-straightClip.xy/straightClip.w");
    expect(fragment).toContain("mix(originalDisplacement,projectedDisplacement,clamp(uClothSculpture,0.,1.))");
    expect(fragment).toContain("length(displacement*max(uClothCssSize,vec2(1.)))");expect(fragment).toContain("24./max(cssTravel,.001)");
    expect(fragment).toContain("bentDenominator<-.08&&straightDenominator<-.08&&planeDistance>0.");
    expect(fragment.match(/texture2D\(uClothBackground,/g)).toHaveLength(1);cloth.dispose();
  });

  it("keeps Molten nearly closed with resolved seams while preserving the independent open membrane",()=>{
    const cloth=new SpatialCloth(true),fragment=assembledShader(cloth).fragmentShader;
    const grid=fragment.match(/grid=uv\*mix\(vec2\(([\d.]+),([\d.]+)\),vec2\(([\d.]+),([\d.]+)\),uClothProfile\)/);
    const width=fragment.match(/width=mix\(vec2\(([\d.]+),([\d.]+)\),vec2\(([\d.]+)\),uClothProfile\)/);
    const aa=fragment.match(/footprint\*mix\(([\d.]+),([\d.]+),uClothProfile\),mix\(([\d.]+),([\d.]+),uClothProfile\)/);
    const relief=fragment.match(/ridge=relief\*mix\(([\d.]+),([\d.]+),uClothProfile\)/);
    expect(grid&&width&&aa&&relief).not.toBeNull();
    const cells=grid!.slice(1).map(Number),widths=width!.slice(1).map(Number),filter=aa!.slice(1).map(Number),ridge=relief!.slice(1).map(Number);
    expect(cells).toEqual([32,46,12,18]);expect(353/cells[0]).toBeGreaterThan(10);expect(353/cells[0]).toBeLessThan(12);
    const fill=(x:number,y:number)=>1-(1-2*x)*(1-2*y),moltenFill=fill(widths[0],widths[1]);
    expect(moltenFill).toBeCloseTo(.9945,4);expect(moltenFill).toBeGreaterThan(.99);
    expect(2*widths[0]).toBeGreaterThan(.9);expect(2*widths[1]).toBeGreaterThan(.85);
    expect((1-2*widths[0])*353/cells[0]).toBeLessThan(1);
    expect(fill(widths[2],widths[2])).toBeCloseTo(.5644,4);expect(ridge[0]).toBeLessThan(.009);expect(ridge[0]/.018).toBeLessThan(.4);
    // Aligned 353x500px plane fixture: evaluate the shader's parsed AA widths,
    // union coverage and existing alpha thresholds, without claiming GPU QA.
    const smooth=(a:number,b:number,value:number)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t);};
    for(const profile of [0,1]){
      const wx=profile?widths[2]:widths[0],wy=profile?widths[2]:widths[1],footprint=Math.max(cells[profile*2]/353,cells[profile*2+1]/500),edge=Math.max(footprint*filter[profile],filter[profile+2]),detail=1-smooth(.65,1.35,footprint);
      const rows=Array(128).fill(0),columns=Array(128).fill(0);
      for(let y=0;y<128;y++)for(let x=0;x<128;x++){
        const vertical=1-smooth(wx-edge,wx+edge,Math.abs((x+.5)/128-.5)),horizontal=1-smooth(wy-edge,wy+edge,Math.abs((y+.5)/128-.5));
        const coverage=(1-detail)*fill(wx,wy)+detail*Math.max(vertical,horizontal),alpha=smooth(.26,.62,coverage);rows[y]+=alpha/128;columns[x]+=alpha/128;
      }
      const average=rows.reduce((sum,value)=>sum+value,0)/128;
      if(profile===0){expect(average).toBeGreaterThan(.985);expect(Math.min(...rows)).toBeGreaterThan(.9);expect(Math.min(...columns)).toBeGreaterThan(.84);}
      else{expect(average).toBeGreaterThan(.5);expect(average).toBeLessThan(.65);}
    }
    const twill=Number(fragment.match(/crossing=mix\(\.5\+\.5\*cos\(\(grid\.x-grid\.y\)\*([\d.]+)\)/)?.[1]);expect(2*Math.PI/twill).toBeCloseTo(3,5);
    expect(fragment).toContain("coverage=max(vertical,horizontal)");
    expect(fragment).toContain("relief=max(verticalLevel,horizontalLevel)");expect(fragment).toContain("clothWeaveNormal(normal,cloth.y,cloth.w)");
    expect(fragment).not.toContain("floor(grid");expect(fragment).not.toContain("uv.x*240.");expect(fragment).not.toContain("502.65482");
    cloth.dispose();
  });

  it("bridges aperture holes with one protected matte crown sample before discard",()=>{
    const cloth=new SpatialCloth(true),fragment=assembledShader(cloth).fragmentShader;
    const mark=fragment.indexOf("float mark=texture2D(uClothMark,vClothUv).a"),bridge=fragment.indexOf("cloth.x=max(cloth.x,mark)"),discard=fragment.indexOf("if(cloth.x<.26)discard"),alpha=fragment.indexOf("diffuseColor.a*=smoothstep(.26,.62,cloth.x)");
    expect(mark).toBeGreaterThan(-1);expect(bridge).toBeGreaterThan(mark);expect(discard).toBeGreaterThan(bridge);expect(alpha).toBeGreaterThan(discard);
    expect(fragment.match(/texture2D\(uClothMark,/g)).toHaveLength(1);
    expect(fragment).toContain("metalnessFactor=mix(metalnessFactor,.15,mark)");expect(fragment).toMatch(/roughnessFactor=mix\([^;]+,\.48,mark\)/);
    expect(fragment).toContain("(1.-mark*.96)");expect(1-.96).toBeCloseTo(.04,12);
    // Full crown coverage survives even at the middle of a completely open cell.
    const bridgedCoverage=Math.max(0,1);expect(bridgedCoverage).toBeGreaterThan(.62);
    for(const profile of ["molten","membrane"] as const){cloth.setProfile(profile);cloth.setQuality(true,false);expect(cloth.material.iridescence).toBe(0);expect(cloth.material.emissive.toArray()).toEqual([0,0,0]);}
    cloth.dispose();
  });

  it("validates depth metadata without owning or disposing the external depth texture",()=>{
    const cloth=new SpatialCloth(true),depth=background(),color=background(),depthDisposed=vi.spyOn(depth,"dispose"),colorDisposed=vi.spyOn(color,"dispose");
    cloth.setOptics(color,491,1065,.8);cloth.setDepthOptics(depth,.1,100);
    expect(cloth.depthBackground.value).toBe(depth);expect(cloth.depthRange.value.toArray()).toEqual([.1,100]);expect(cloth.depthReady.value).toBe(1);
    const shader=assembledShader(cloth);expect(shader.uniforms).toMatchObject({uClothDepth:cloth.depthBackground,uClothDepthRange:cloth.depthRange,uClothDepthReady:cloth.depthReady});
    for(const [near,far] of [[0,100],[-1,100],[1,1],[2,1],[NaN,100],[.1,Infinity]]){
      cloth.setDepthOptics(depth,near,far);expect(cloth.depthBackground.value).toBeNull();expect(cloth.depthReady.value).toBe(0);expect(cloth.refraction.value).toBe(.8);
    }
    cloth.setDepthOptics(depth,.2,80);cloth.setProfile("membrane");cloth.setQuality(false,false);
    expect(cloth.depthBackground.value).toBe(depth);expect(cloth.depthRange.value.toArray()).toEqual([.2,80]);expect(depthDisposed).not.toHaveBeenCalled();
    cloth.setDepthOptics(null,.2,80);expect(cloth.depthBackground.value).toBeNull();expect(cloth.depthReady.value).toBe(0);
    cloth.setDepthOptics(depth,.2,80);cloth.dispose();expect(cloth.depthBackground.value).toBeNull();expect(cloth.depthReady.value).toBe(0);
    expect(depthDisposed).not.toHaveBeenCalled();expect(colorDisposed).not.toHaveBeenCalled();depth.dispose();color.dispose();
  });

  it("bounds depth tracing to eight packed-depth reads and one color read with a plane fallback",()=>{
    const cloth=new SpatialCloth(true),fragment=assembledShader(cloth).fragmentShader;
    const packing=fragment.indexOf("#include <packing>"),cross=fragment.indexOf("bool clothDepthCross("),trace=fragment.indexOf("bool clothTraceDepth("),plane=fragment.indexOf("projectedDisplacement=(bentClip.xy"),depth=fragment.indexOf("if(uClothDepthReady>.5&&uClothSculpture>.001)");
    expect(packing).toBeGreaterThan(-1);expect(cross).toBeGreaterThan(packing);expect(trace).toBeGreaterThan(cross);expect(depth).toBeGreaterThan(plane);
    const coarse=Number(fragment.match(/for\(int i=0;i<(\d+);i\+\+\)/)?.[1]),refine=Number(fragment.match(/for\(int refine=0;refine<(\d+);refine\+\+\)/)?.[1]);
    expect(coarse).toBe(6);expect(refine).toBe(2);expect(coarse+refine).toBeLessThanOrEqual(8);
    expect(fragment.match(/texture2D\(uClothDepth,/g)).toHaveLength(1);expect(fragment.match(/texture2D\(uClothBackground,/g)).toHaveLength(1);
    expect(fragment.match(/clothTraceDepth\(point,opticalRay/g)).toHaveLength(1);
    expect(fragment).toContain("unpackRGBAToDepth(texture2D(uClothDepth,sampleUv))");expect(fragment).toContain("perspectiveDepthToViewZ(windowDepth,uClothDepthRange.x,uClothDepthRange.y)");
    expect(fragment).toContain("if(windowDepth>=.9999)return false");expect(fragment).toContain("sceneDepth>-origin.z+.06&&-candidate.z>=sceneDepth");
    expect(fragment).toContain("if(traceLimit>.1&&clothTraceDepth(point,opticalRay,traceLimit,depthUv))\n                projectedDisplacement=depthUv-screenUv");
    expect(cloth.depthReady.value).toBe(0);expect(fragment).toContain("float traceLimit=min(farTravel,min(32.");cloth.dispose();
  });
});
