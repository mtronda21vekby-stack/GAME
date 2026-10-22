import { describe, expect, it } from "vitest";
import { Color, ShaderMaterial, Vector3, type BufferGeometry, type Object3D } from "three";
import { SpatialAtmosphere } from "../../src/components/spatial/SpatialAtmosphere";

type AtmosphereObject=Object3D&{material:ShaderMaterial;geometry:BufferGeometry&{instanceCount?:number}};
function renderables(atmosphere:SpatialAtmosphere) {
  const objects:AtmosphereObject[]=[];
  atmosphere.traverse(object=>{if((object as AtmosphereObject).material instanceof ShaderMaterial)objects.push(object as AtmosphereObject);});
  return objects;
}

function finalState(atmosphere:SpatialAtmosphere) {
  return {visible:atmosphere.visible,position:atmosphere.position.toArray(),motion:atmosphere.motion.value,time:atmosphere.time.value,objects:renderables(atmosphere).map(object=>({
    visible:object.visible,position:object.position.toArray(),rotation:object.rotation.toArray(),scale:object.scale.toArray(),
    drawRange:{...object.geometry.drawRange},instances:object.geometry.instanceCount,
    uniforms:Object.fromEntries(Object.entries(object.material.uniforms).filter(([name])=>name!=="uBackgroundClip").map(([name,uniform])=>{
      const value=uniform.value;return [name,value&&typeof value.toArray==="function"?value.toArray():value];
    })),
  }))};
}

describe("Capture-only atmospheric foreground rejection",()=>{
  it("shares one temporary world-Z clip across dust, facets, haze and shafts",()=>{
    const atmosphere=new SpatialAtmosphere(false),objects=renderables(atmosphere);
    expect(objects).toContain(atmosphere.dust);expect(objects).toContain(atmosphere.facets);
    expect(objects.filter(object=>object.material.uniforms.uShaft?.value===0)).toHaveLength(3);
    expect(objects.filter(object=>object.material.uniforms.uShaft?.value===1)).toHaveLength(2);
    for(const object of objects)expect(object.material.uniforms.uBackgroundClip).toBe(atmosphere.backgroundClip);
    atmosphere.setBackgroundCapture(2.75);
    for(const object of objects)expect(object.material.uniforms.uBackgroundClip.value.toArray()).toEqual([1,2.75]);
    atmosphere.setBackgroundCapture(null);
    for(const object of objects)expect(object.material.uniforms.uBackgroundClip.value.toArray()).toEqual([0,0]);
    atmosphere.dispose();
  });

  it("accepts finite world thresholds and disables capture clipping for null or nonfinite values",()=>{
    const atmosphere=new SpatialAtmosphere(true),uniform=atmosphere.backgroundClip,value=uniform.value;
    for(const threshold of [-3,0,4.4]){
      atmosphere.setBackgroundCapture(threshold);expect(value.toArray()).toEqual([1,threshold]);
    }
    for(const threshold of [null,NaN,Infinity,-Infinity]){
      atmosphere.setBackgroundCapture(2);atmosphere.setBackgroundCapture(threshold);
      expect(atmosphere.backgroundClip).toBe(uniform);expect(uniform.value).toBe(value);expect(value.toArray()).toEqual([0,0]);
    }
    atmosphere.dispose();
  });

  it("temporarily scales captured particles and restores the original final DPR across repeated calls",()=>{
    const atmosphere=new SpatialAtmosphere(true),dpr=atmosphere.dust.material.uniforms.uDpr;
    expect(atmosphere.facets.material.uniforms.uDpr).toBe(dpr);
    dpr.value=1.25;
    atmosphere.setBackgroundCapture(3,.625);expect(dpr.value).toBe(.625);
    atmosphere.setBackgroundCapture(2,.5);expect(dpr.value).toBe(.5);
    for(const invalid of [0,-1,NaN,Infinity]){
      atmosphere.setBackgroundCapture(2,invalid);expect(dpr.value).toBe(.5);
    }
    atmosphere.setBackgroundCapture(null);expect(dpr.value).toBe(1.25);
    atmosphere.setBackgroundCapture(null);expect(dpr.value).toBe(1.25);
    // A later viewport/DPR change becomes the original for the next capture;
    // the previous capture's saved value must not leak into a subsequent entry.
    dpr.value=1.5;atmosphere.setBackgroundCapture(2);expect(dpr.value).toBe(1.5);
    atmosphere.setBackgroundCapture(2,.75);expect(dpr.value).toBe(.75);
    atmosphere.setBackgroundCapture(null);expect(dpr.value).toBe(1.5);
    for(const invalidClip of [NaN,Infinity,-Infinity]){
      atmosphere.setBackgroundCapture(2,.6);expect(dpr.value).toBe(.6);
      atmosphere.setBackgroundCapture(invalidClip,.25);
      expect(dpr.value).toBe(1.5);expect(atmosphere.backgroundClip.value.toArray()).toEqual([0,0]);
    }
    atmosphere.dispose();
  });

  it.each([[false,false],[true,false],[false,true],[true,true]])("preserves final visibility, quality and pointer updates compact=%s reduced=%s",(compact,reduced)=>{
    const clipped=new SpatialAtmosphere(compact),control=new SpatialAtmosphere(compact),geometries=renderables(clipped).map(object=>object.geometry),buffers=geometries.map(geometry=>geometry.attributes.position.array);
    clipped.setQuality(compact,reduced);control.setQuality(compact,reduced);
    const update=(atmosphere:SpatialAtmosphere,time:number)=>{
      atmosphere.setChoreography(.7,.6);atmosphere.update(time,.8,.2,{x:.33,y:-.2},new Vector3(1,-8,.4),1.25,new Color(0xaebbdd),.6);
    };
    update(clipped,3);update(control,3);const before=finalState(clipped);
    clipped.setBackgroundCapture(1.25);expect(finalState(clipped)).toEqual(before);
    update(clipped,4);update(control,4);expect(finalState(clipped)).toEqual(finalState(control));
    clipped.setBackgroundCapture(null);expect(finalState(clipped)).toEqual(finalState(control));
    renderables(clipped).forEach((object,index)=>{expect(object.geometry).toBe(geometries[index]);expect(object.geometry.attributes.position.array).toBe(buffers[index]);});
    clipped.dispose();control.dispose();
  });

  it("clips using each shader's transformed animated world position, never local or stale vertex Z",()=>{
    const atmosphere=new SpatialAtmosphere(false),objects=renderables(atmosphere);
    for(const object of objects){
      const vertex=object.material.vertexShader,fragment=object.material.fragmentShader;
      const inline=vertex.match(/vWorldZ\s*=\s*\(modelMatrix\*vec4\(p,1\.\)\)\.z/g)??[];
      const shared=vertex.match(/vec4 world=modelMatrix\*vec4\(p,1\.\);\s*vWorldZ=world\.z/g)??[];
      // Haze also uses the exact same transformed position for its continuous
      // field. Accept that shared value, not an unrelated/stale world variable.
      expect(inline.length+shared.length).toBe(1);
      expect(fragment).toContain("uniform vec2 uBackgroundClip");
      expect(fragment).toContain("if(uBackgroundClip.x>.5&&vWorldZ>uBackgroundClip.y)discard");
      const worldZ=vertex.indexOf(inline[0]??shared[0]);
      if(object===atmosphere.dust||object===atmosphere.facets){
        expect(worldZ).toBeGreaterThan(vertex.indexOf("p.z+=uDeparture*3."));
        if(object===atmosphere.facets)expect(worldZ).toBeGreaterThan(vertex.indexOf("p+=facet"));
      }else expect(worldZ).toBeGreaterThan(vertex.indexOf("p.z += sin"));
      expect(fragment.indexOf("vWorldZ>uBackgroundClip.y")).toBeLessThan(fragment.indexOf("gl_FragColor"));
    }
    atmosphere.dispose();
  });
});
