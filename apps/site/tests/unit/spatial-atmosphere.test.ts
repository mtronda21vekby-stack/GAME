import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { Color, Group, Mesh, Vector3 } from "three";
import { SpatialAtmosphere } from "../../src/components/spatial/SpatialAtmosphere";
import { createOrbitCard } from "../../src/components/spatial/SpatialObjects";
import { SpatialCloth } from "../../src/components/spatial/SpatialCloth";
import { SPATIAL_BRAND_MODEL } from "../../src/components/spatial/brandModel";

function asset(name:string) {
  const bytes=readFileSync(new URL(`../../public/experience/blackcrown-skull/${name}`,import.meta.url));
  expect(bytes.toString("ascii",0,4)).toBe("glTF");
  expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  return {bytes,json:JSON.parse(bytes.toString("utf8",20,20+bytes.readUInt32LE(12)))};
}

describe("Spatial atmosphere and authored hero budgets",()=>{
  it("preserves the desktop source and leaves the complete mobile scene below 30k triangles",()=>{
    const source=asset("blackcrown-skull-desktop.glb"),sourceMobile=asset("blackcrown-skull-mobile.glb");
    expect(createHash("sha256").update(source.bytes).digest("hex")).toBe("7c1d400b5c8a91c3e3383c7d34fa07757e43a9bcdcbde3c3031c0a110e4c53a4");
    expect(createHash("sha256").update(sourceMobile.bytes).digest("hex")).toBe("8478540437c68bcf3bb1ac584f07a21dd08941b4aa4314b0c6f2ee5fca40d508");
    const desktop=asset(SPATIAL_BRAND_MODEL.url.replace("/experience/blackcrown-skull/",""));
    const mobile=asset(SPATIAL_BRAND_MODEL.mobileUrl.replace("/experience/blackcrown-skull/",""));
    const desktopTriangles=desktop.json.meshes.flatMap((mesh:any)=>mesh.primitives).reduce((n:number,p:any)=>n+desktop.json.accessors[p.indices].count/3,0);
    expect(desktopTriangles).toBe(80310);expect(desktop.json.meshes).toHaveLength(6);expect(mobile.json.meshes).toHaveLength(6);
    for(const model of [desktop,mobile]){
      const face=model.json.meshes.find((mesh:any)=>mesh.name==="SKULL_FACE");
      expect(face.primitives[0].attributes.COLOR_0).toBeTypeOf("number");
    }
    const triangles=mobile.json.meshes.flatMap((mesh:any)=>mesh.primitives).reduce((total:number,primitive:any)=>{
      expect(primitive.mode??4).toBe(4);
      expect(primitive.attributes.TEXCOORD_0).toBeTypeOf("number");
      return total+mobile.json.accessors[primitive.indices].count/3;
    },0);
    const atmosphere=new SpatialAtmosphere(true),cloth=new SpatialCloth(true),root=new Group().add(atmosphere,cloth,...Array.from({length:4},()=>createOrbitCard().group));
    let background=0;root.traverse(object=>{const mesh=object as Mesh;if(mesh.isMesh)background+=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3;});
    expect(triangles).toBeLessThanOrEqual(27200);expect(triangles+background).toBeLessThan(30000);
    expect(mobile.bytes.length).toBeLessThan(2.2*1024*1024);
    expect(mobile.json.images).toHaveLength(6);expect(mobile.json.materials).toHaveLength(3);
    expect(mobile.json.images.every((image:any)=>Number.isInteger(image.bufferView)&&!image.uri)).toBe(true);
    expect(mobile.json.buffers.every((buffer:any)=>!buffer.uri)).toBe(true);
    atmosphere.dispose();cloth.dispose();
  });

  it("keeps repeated cloth taps finite and bounded without rewriting the mesh buffer",()=>{
    const cloth=new SpatialCloth(true),positions=cloth.geometry.attributes.position.array,copy=positions.slice();
    for(let i=0;i<20;i++){cloth.touch(i/10,-i/10,i);cloth.update(i+.5);}
    expect(cloth.hits.value).toHaveLength(4);
    expect(cloth.hits.value.every(hit=>hit.x>=.02&&hit.x<=.98&&hit.y>=.02&&hit.y<=.98&&hit.toArray().every(Number.isFinite))).toBe(true);
    expect(cloth.geometry.attributes.position.array).toBe(positions);expect(positions).toEqual(copy);
    cloth.setQuality(true,true);expect(cloth.motion.value).toBe(0);cloth.dispose();
  });

  it("updates GPU uniforms without rewriting or reallocating particle position buffers",()=>{
    const atmosphere=new SpatialAtmosphere(false),positions=atmosphere.dust.geometry.attributes.position;
    const buffer=positions.array,copy=buffer.slice(),anchor=new Vector3(2,1,0),accent=new Color(0x9edfe6);
    atmosphere.update(0,0,0,{x:0,y:0},anchor,1.5,accent);
    atmosphere.update(45,.4,0,{x:.3,y:.1},anchor,1.5,accent);
    expect(positions.array).toBe(buffer);expect(positions.array).toEqual(copy);
    expect(atmosphere.time.value).toBe(45);expect(atmosphere.dust.geometry.drawRange.count).toBe(1800);
    expect(atmosphere.dust.material.depthTest).toBe(true);
    atmosphere.setQuality(true,false);expect(atmosphere.dust.geometry.drawRange.count).toBe(480);
    atmosphere.dispose();
  });

  it("holds static shader time in reduced motion and disposes GPU point resources once",()=>{
    const atmosphere=new SpatialAtmosphere(true),geometry=vi.spyOn(atmosphere.dust.geometry,"dispose"),material=vi.spyOn(atmosphere.dust.material,"dispose");
    atmosphere.setQuality(true,true);
    atmosphere.update(40,.5,0,{x:0,y:0},new Vector3(),1,new Color());
    atmosphere.update(80,.5,0,{x:0,y:0},new Vector3(),1,new Color());
    expect(atmosphere.time.value).toBe(0);expect(atmosphere.motion.value).toBe(0);
    expect(atmosphere.dust.geometry.drawRange.count).toBe(160);
    atmosphere.dispose();expect(geometry).toHaveBeenCalledTimes(1);expect(material).toHaveBeenCalledTimes(1);
  });
});
