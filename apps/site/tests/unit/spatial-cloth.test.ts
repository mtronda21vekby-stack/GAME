import { describe, expect, it } from "vitest";
import { ShaderLib, type WebGLRenderer } from "three";
import { SpatialCloth } from "../../src/components/spatial/SpatialCloth";

/** Execute the actual scalar field from the assembled vertex shader. This small
 * adapter translates only the known UV/vector differences and GLSL scalar
 * declarations/builtins. An unfamiliar vector expression fails explicitly;
 * this is not a GPU shader compiler or a replacement for visual QA. */
function actualSurface(cloth:SpatialCloth) {
  const shader={uniforms:{},vertexShader:ShaderLib.physical.vertexShader,fragmentShader:ShaderLib.physical.fragmentShader};
  cloth.material.onBeforeCompile(shader as Parameters<typeof cloth.material.onBeforeCompile>[0],{} as WebGLRenderer);
  const field=shader.vertexShader.match(/vec3 clothSurface\(vec2 p\) \{([\s\S]*?)\n  \}/)?.[1];
  if(!field)throw new Error("Actual clothSurface field missing");
  const body=field.replace("p=clamp(p,vec2(0.),vec2(1.));","p={x:clamp(p.x,0,1),y:clamp(p.y,0,1)};")
    .replace(/vec2 center=vec2\(([^,]+),([^;]+)\);/g,"let center={x:$1,y:$2};")
    .replace(/vec2 (\w+)=\(p-(\w+)-vec2\(([-\d.]+),([-\d.]+)\)\)\*vec2\(([-\d.]+),([-\d.]+)\);/g,"let $1={x:(p.x-$2.x-($3))*$5,y:(p.y-$2.y-($4))*$6};")
    .replace(/vec2 (\w+)=\(p-(\w+)\)\*vec2\(([-\d.]+),([-\d.]+)\);/g,"let $1={x:(p.x-$2.x)*$3,y:(p.y-$2.y)*$4};")
    .replace(/vec2 (\w+)=\(p-(\w+)\.xy\)\*vec2\(([\d.]+),([\d.]+)\);/g,"let $1={x:(p.x-$2.x)*$3,y:(p.y-$2.y)*$4};")
    .replaceAll("length(uClothDrag.zw)","Math.hypot(uClothDrag.z,uClothDrag.w)")
    .replace(/\b(?:float|vec4|int)\s+/g,"let ").replaceAll("vec3(","vector(");
  if(/\b(?:vec[234]|float|int)\b/.test(body))throw new Error("Unsupported GLSL expression in CPU field adapter");
  const scalar=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
  const math={sin:Math.sin,cos:Math.cos,pow:Math.pow,exp:Math.exp,abs:Math.abs,max:Math.max,min:Math.min,sqrt:Math.sqrt,sign:Math.sign,
    clamp:scalar,mix:(a:number,b:number,t:number)=>a+(b-a)*t,smoothstep:(a:number,b:number,value:number)=>{const t=scalar((value-a)/(b-a),0,1);return t*t*(3-2*t);},
    length:(value:{x:number;y:number})=>Math.hypot(value.x,value.y),dot:(a:{x:number;y:number},b:{x:number;y:number})=>a.x*b.x+a.y*b.y,vector:(...values:number[])=>values};
  const evaluate=new Function("p","uniforms","math",`const {uClothTime,uClothMotion,uClothEntrance,uClothProfile,uClothSculpture,uClothHits,uClothHover,uClothDrag}=uniforms;const {sin,cos,pow,exp,abs,max,min,sqrt,sign,clamp,mix,smoothstep,length,dot,vector}=math;${body}`);
  return (x:number,y:number):number[]=>evaluate({x,y},{uClothTime:cloth.time.value,uClothMotion:cloth.motion.value,uClothEntrance:cloth.entrance.value,uClothProfile:cloth.profileMix.value,uClothSculpture:cloth.sculpture.value,uClothHits:cloth.hits.value,uClothHover:cloth.hover.value,uClothDrag:cloth.drag.value},math);
}

describe("Spatial cloth interaction clock",()=>{
  it("bounds a grab, holds on pause and returns to rest without replacing vertices",()=>{
    const cloth=new SpatialCloth(true),positions=cloth.geometry.attributes.position.array;
    cloth.grab(.5,.4,5,-4);for(let i=1;i<=30;i++)cloth.update(i/60);
    expect(cloth.drag.value.z).toBeGreaterThan(.2);expect(cloth.drag.value.z).toBeLessThanOrEqual(.26);
    const held=cloth.drag.value.clone();cloth.release();for(let i=0;i<30;i++)cloth.update(.5);expect(cloth.drag.value.equals(held)).toBe(true);
    for(let i=1;i<=120;i++)cloth.update(.5+i/60);
    expect(Math.abs(cloth.drag.value.z)+Math.abs(cloth.drag.value.w)).toBeLessThan(.0001);expect(cloth.geometry.attributes.position.array).toBe(positions);
    cloth.setQuality(true,true);cloth.grab(.5,.5,.2,.2);cloth.update(3);expect(cloth.drag.value.z).toBe(0);cloth.dispose();
  });
  it("holds the pointer indentation when scene time is paused and settles it after release",()=>{
    const cloth=new SpatialCloth(false);
    cloth.setHover(2,-2,1);
    cloth.update(.095);
    expect(cloth.hover.value.z).toBeGreaterThan(.6);
    expect(cloth.hover.value.x).toBeLessThanOrEqual(.98);
    expect(cloth.hover.value.y).toBeGreaterThanOrEqual(.02);
    const held=cloth.hover.value.clone();
    cloth.setHover(.5,.5,0);
    for(let i=0;i<60;i++)cloth.update(.095);
    expect(cloth.hover.value.equals(held)).toBe(true);
    for(let i=1;i<=60;i++)cloth.update(.095+i/60);
    expect(cloth.hover.value.z).toBeLessThan(.0001);
    cloth.dispose();
  });

  it("clears old impulses and suppresses new pointer/tap movement in reduced motion",()=>{
    const cloth=new SpatialCloth(true);
    cloth.setHover(.4,.3,1);cloth.update(.1);cloth.touch(.4,.3,.1);
    expect(cloth.hover.value.z).toBeGreaterThan(0);
    expect(cloth.hits.value.some(hit=>hit.w>0)).toBe(true);
    cloth.setQuality(true,true);
    cloth.setHover(.9,.9,1);cloth.touch(.9,.9,.2);cloth.update(8);
    expect(cloth.motion.value).toBe(0);
    expect(cloth.hover.value.z).toBe(0);
    expect(cloth.hits.value.every(hit=>hit.w===0)).toBe(true);
    cloth.setQuality(true,false);cloth.update(8.1);
    expect(cloth.hover.value.z).toBe(0);
    expect(cloth.hits.value.every(hit=>hit.w===0)).toBe(true);
    cloth.dispose();
  });

  it("recovers the published b89 rest surface at sculpture zero for both profiles",()=>{
    // Numeric fixtures evaluated from b89ae8a's actual clothSurface with no hit,
    // hover or grab. The new LAB field may change while this rest shape stays.
    const fixtures=[
      {uv:[0,0],time:0,xyz:[-.5102534701193112,-.42,.4432186277409206]},
      {uv:[.5,0],time:0,xyz:[-.011347220119311163,-.45999999999999824,.2699722226926732]},
      {uv:[.25,.4],time:0,xyz:[-.21079696783607776,-.1225000038971148,-.10134562131314422]},
      {uv:[.5,1],time:0,xyz:[0,.5,0]},
      {uv:[0,0],time:3,xyz:[-.5061403821860863,-.42,.4279602997317755]},
      {uv:[.5,0],time:3,xyz:[-.007234132186086257,-.45999999999999824,.2635321290081628]},
      {uv:[.25,.4],time:3,xyz:[-.2115517350588211,-.1225000038971148,-.10116542485421902]},
      {uv:[.5,1],time:3,xyz:[0,.5,0]},
    ];
    const cloth=new SpatialCloth(true),surface=actualSurface(cloth);cloth.setSculpture(0);
    for(const profile of ["molten","membrane"] as const){
      cloth.setProfile(profile);
      for(const fixture of fixtures){cloth.time.value=fixture.time;surface(...fixture.uv as [number,number]).forEach((value,axis)=>expect(value).toBeCloseTo(fixture.xyz[axis],11));}
    }
    cloth.dispose();
  });

  it.each([true,false])("keeps the actual moving surface finite and bounded without changing tessellation compact=%s",compact=>{
    const cloth=new SpatialCloth(compact),surface=actualSurface(cloth),geometry=cloth.geometry,buffer=geometry.attributes.position.array,copy=buffer.slice();
    expect([geometry.parameters.widthSegments,geometry.parameters.heightSegments]).toEqual(compact?[20,26]:[32,48]);
    const profilePoses:number[][][]=[];
    for(const profile of ["molten","membrane"] as const){
      cloth.setProfile(profile);
      for(const sculpture of [0,.5,1]){cloth.setSculpture(sculpture);
        for(const time of [0,.9,3,8]){cloth.time.value=time;
          for(let y=0;y<=12;y++)for(let x=0;x<=12;x++){
            const point=surface(x/12,y/12);expect(point.every(Number.isFinite)).toBe(true);
            expect(Math.abs(point[0])).toBeLessThanOrEqual(.86);expect(Math.abs(point[1])).toBeLessThanOrEqual(.86);expect(Math.abs(point[2])).toBeLessThanOrEqual(1.15);
          }
        }
      }
      cloth.setSculpture(1);cloth.time.value=0;const start=Array.from({length:9},(_,index)=>surface((index%3+1)/4,(Math.floor(index/3)+1)/4));
      cloth.time.value=3;const moved=Array.from({length:9},(_,index)=>surface((index%3+1)/4,(Math.floor(index/3)+1)/4));
      expect(Math.max(...moved.map((point,index)=>Math.hypot(...point.map((value,axis)=>value-start[index][axis]))))).toBeGreaterThan(.08);profilePoses.push(start);
    }
    expect(Math.max(...profilePoses[0].map((point,index)=>Math.hypot(...point.map((value,axis)=>value-profilePoses[1][index][axis]))))).toBeGreaterThan(.08);
    expect(cloth.geometry).toBe(geometry);expect(geometry.attributes.position.array).toBe(buffer);expect(buffer).toEqual(copy);cloth.dispose();
  });

  it("keeps the real field's hit and grab response local and freezes it in reduced motion",()=>{
    const cloth=new SpatialCloth(true),surface=actualSurface(cloth);cloth.update(.13);
    const before=surface(.5,.4),far=surface(.05,.98);cloth.touch(.5,.4,.1);
    const hit=surface(.5,.4),farHit=surface(.05,.98),localDelta=Math.abs(hit[2]-before[2]),farDelta=Math.abs(farHit[2]-far[2]);
    expect(localDelta).toBeGreaterThan(.001);expect(localDelta).toBeGreaterThan(farDelta*5);
    cloth.hits.value.forEach(hit=>{hit.w=0;});cloth.time.value=.7;const rest=surface(.5,.4),farRest=surface(.05,.98);
    cloth.grab(.5,.4,.2,-.1);cloth.update(1.4);
    // Compare at the same clock to separate local input from the authored wave.
    const grabbed=surface(.5,.4),farGrabbed=surface(.05,.98),drag=cloth.drag.value.clone();cloth.drag.value.z=cloth.drag.value.w=0;
    const ungrabbed=surface(.5,.4),farUngrabbed=surface(.05,.98);cloth.drag.value.copy(drag);
    expect(Math.hypot(grabbed[0]-ungrabbed[0],grabbed[1]-ungrabbed[1])).toBeGreaterThan(.025);
    expect(Math.hypot(farGrabbed[0]-farUngrabbed[0],farGrabbed[1]-farUngrabbed[1])).toBeLessThan(.001);
    expect([...rest,...farRest].every(Number.isFinite)).toBe(true);
    cloth.setQuality(true,true);cloth.time.value=2;const held=surface(.5,.4);cloth.time.value=20;expect(surface(.5,.4)).toEqual(held);
    cloth.dispose();
  });
});
