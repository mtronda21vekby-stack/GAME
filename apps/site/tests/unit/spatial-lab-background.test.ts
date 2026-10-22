import { describe, expect, it } from "vitest";
import { Color, PerspectiveCamera, ShaderMaterial, Vector3, type BufferGeometry, type Object3D } from "three";
import { SpatialAtmosphere } from "../../src/components/spatial/SpatialAtmosphere";

type Layer=Object3D&{material:ShaderMaterial;geometry:BufferGeometry};
function layers(atmosphere:SpatialAtmosphere) {
  const result:Layer[]=[];
  atmosphere.traverse(object=>{if((object as Layer).material instanceof ShaderMaterial)result.push(object as Layer);});
  return result;
}
function planes(atmosphere:SpatialAtmosphere,shaft:boolean) {
  return layers(atmosphere).filter(layer=>layer.material.uniforms.uShaft?.value===(shaft?1:0));
}
function update(atmosphere:SpatialAtmosphere,lab:number,time=0) {
  atmosphere.setChoreography(1,lab);
  atmosphere.update(time,.9,0,{x:0,y:0},new Vector3(),1.25,new Color(0xa8c4d3),lab);
}
function transforms(atmosphere:SpatialAtmosphere) {
  return layers(atmosphere).map(layer=>({position:layer.position.toArray(),rotation:layer.rotation.toArray(),scale:layer.scale.toArray(),visible:layer.visible}));
}
/** Uses the actual haze vertex warp before modelMatrix, without any GPU draw. */
function worldVertices(layer:Layer,time:number) {
  const position=layer.geometry.attributes.position,result:Vector3[]=[];
  for(let i=0;i<position.count;i++){
    const point=new Vector3().fromBufferAttribute(position,i);
    point.z+=Math.sin(point.y*.35+time*.09)*.12;
    result.push(point.applyMatrix4(layer.matrixWorld));
  }
  return result;
}

describe("LAB background depth and reverse continuity",()=>{
  it.each([false,true])("moves existing layers behind the conservative LAB cut without adding geometry compact=%s",compact=>{
    const atmosphere=new SpatialAtmosphere(compact),objects=layers(atmosphere),geometries=objects.map(layer=>layer.geometry),buffers=geometries.map(geometry=>geometry.attributes.position.array),counts=geometries.map(geometry=>[geometry.attributes.position.count,geometry.index?.count]);
    const haze=planes(atmosphere,false),shafts=planes(atmosphere,true);
    expect(objects).toHaveLength(7);expect(haze).toHaveLength(3);expect(shafts).toHaveLength(2);
    update(atmosphere,0);expect(haze.map(layer=>layer.position.z)).toEqual([-10,-3,3]);expect(shafts.map(layer=>layer.position.z)).toEqual([-6,1.6]);
    update(atmosphere,1);atmosphere.updateMatrixWorld(true);
    expect(haze.map(layer=>layer.position.z)).toEqual([-18,-11,-5]);expect(shafts.map(layer=>layer.position.z)).toEqual([-14,-6.4]);
    expect(shafts[0].position.x).toBeCloseTo(-1.35,12);expect(shafts[0].scale.x).toBeCloseTo(9.6,12);
    const deep=[...haze.filter(layer=>layer.visible),shafts[0]];
    for(const layer of deep)expect(Math.max(...worldVertices(layer,0).map(point=>point.z))).toBeLessThan(-10);
    layers(atmosphere).forEach((layer,index)=>{
      expect(layer).toBe(objects[index]);expect(layer.geometry).toBe(geometries[index]);expect(layer.geometry.attributes.position.array).toBe(buffers[index]);
      expect([layer.geometry.attributes.position.count,layer.geometry.index?.count]).toEqual(counts[index]);
    });
    atmosphere.dispose();
  });

  it.each([false,true])("retraces the original hero layer transforms exactly after a forward/reverse LAB passage compact=%s",compact=>{
    const atmosphere=new SpatialAtmosphere(compact),haze=planes(atmosphere,false),shafts=planes(atmosphere,true);
    update(atmosphere,0);const hero=transforms(atmosphere);
    expect(haze.map(layer=>layer.position.z)).toEqual([-10,-3,3]);expect(shafts.map(layer=>[layer.position.x,layer.position.z,layer.scale.x])).toEqual([[2.4,-6,6.4],[.2,1.6,6.4]]);
    for(const [index,lab] of [.1,.4,.8,1,.7,.25,0].entries())update(atmosphere,lab,index*.2);
    expect(transforms(atmosphere)).toEqual(hero);expect(atmosphere.lab.value).toBe(0);
    for(const layer of layers(atmosphere))expect(layer.material.uniforms.uLab).toBe(atmosphere.lab);
    atmosphere.dispose();
  });

  it.each([[393,852,true],[1440,900,false]])("keeps the deep LAB shaft's perspective footprint usable at %ix%i",(width,height,compact)=>{
    const atmosphere=new SpatialAtmosphere(compact),camera=new PerspectiveCamera(compact?36:38,width/height,.1,100);
    camera.position.set(0,0,17.8);camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
    update(atmosphere,1);atmosphere.updateMatrixWorld(true);
    const shaft=planes(atmosphere,true)[0],pixels=worldVertices(shaft,0).map(point=>point.project(camera)).map(point=>({x:(point.x+1)*width/2,y:(1-point.y)*height/2}));
    const left=Math.max(0,Math.min(...pixels.map(point=>point.x))),right=Math.min(width,Math.max(...pixels.map(point=>point.x)));
    const top=Math.max(0,Math.min(...pixels.map(point=>point.y))),bottom=Math.min(height,Math.max(...pixels.map(point=>point.y)));
    expect(pixels.every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y))).toBe(true);
    expect(right-left).toBeGreaterThan(width*.25);expect(bottom-top).toBeGreaterThan(height*.4);
    expect((right-left)*(bottom-top)).toBeGreaterThan(width*height*.12);
    atmosphere.dispose();
  });

  it("retains the deep LAB background in reduced motion while shader time stays static",()=>{
    const atmosphere=new SpatialAtmosphere(true);atmosphere.setQuality(true,true);
    update(atmosphere,1,3);const held=transforms(atmosphere);update(atmosphere,1,9);
    expect(atmosphere.time.value).toBe(0);expect(atmosphere.motion.value).toBe(0);expect(atmosphere.lab.value).toBe(1);
    expect(transforms(atmosphere)).toEqual(held);expect(planes(atmosphere,false)[0].position.z).toBe(-18);expect(planes(atmosphere,true)[0].position.z).toBe(-14);
    for(const layer of layers(atmosphere))expect(layer.material.uniforms.uLab).toBe(atmosphere.lab);
    atmosphere.dispose();
  });

  it("applies LAB particle depth before animated world-Z clipping, including instanced facets",()=>{
    const atmosphere=new SpatialAtmosphere(false);
    for(const particle of [atmosphere.dust,atmosphere.facets]){
      const vertex=particle.material.vertexShader,departure=vertex.indexOf("p.z+=uDeparture*3."),depth=vertex.search(/p\.z\s*-=\s*uLab\s*\*\s*\(10\.\s*\+\s*uDeparture\s*\*\s*3\.\s*\)/),world=vertex.indexOf("vWorldZ=(modelMatrix*vec4(p,1.)).z");
      expect(departure).toBeGreaterThan(-1);expect(depth).toBeGreaterThan(departure);expect(world).toBeGreaterThan(depth);
      expect(particle.material.uniforms.uLab).toBe(atmosphere.lab);
      expect(particle.material.fragmentShader).toContain("if(uBackgroundClip.x>.5&&vWorldZ>uBackgroundClip.y)discard");
    }
    atmosphere.dispose();
  });
});
