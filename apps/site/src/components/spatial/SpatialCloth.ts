import * as THREE from "three";

const folds=`
  uniform float uClothTime,uClothMotion,uClothEntrance;
  uniform vec4 uClothHits[4];
  uniform vec3 uClothHover;
  varying vec2 vClothUv;
  vec3 clothSurface(vec2 p) {
    p=clamp(p,vec2(0.),vec2(1.));
    float free=1.-p.y,loose=pow(free,.7);
    float phase=p.x*9.6+free*2.8;
    // Two hanging diagonals and a turned edge give the sheet an authored rest pose.
    float z=(sin(phase)*(.075+free*.075)+sin(p.x*5.2-free*4.6+.4)*.065)*loose;
    z+=pow(abs(p.x-.5)*2.,3.)*.105*loose;
    float breath=(sin(phase+uClothTime*.24)*.014+sin(p.y*6.-uClothTime*.19)*.01)*loose;
    float response=0.;
    vec2 hoverDelta=(p-uClothHover.xy)*vec2(.86,1.);
    response-=exp(-dot(hoverDelta,hoverDelta)*21.)*uClothHover.z*.065;
    for(int i=0;i<4;i++) {
      vec4 h=uClothHits[i];
      float age=max(0.,uClothTime-h.z);
      vec2 d=(p-h.xy)*vec2(.86,1.);
      float r=length(d),front=r-age*.34;
      float ring=sin(front*25.)*exp(-front*front*48.)*exp(-age*1.65)*smoothstep(0.,.07,age);
      float dent=-exp(-dot(d,d)*68.)*exp(-age*5.);
      response+=(ring+dent)*h.w*.065*(1.-smoothstep(2.,2.8,age));
    }
    z+=(breath+response*loose)*uClothMotion;
    float x=p.x-.5+sin(free*3.1+.2)*.065*free;
    float y=p.y-.5-sin(p.x*3.141593)*sin(p.x*3.141593)*free*.075;
    x+=sin(p.y*4.+uClothTime*.18)*free*.008*uClothMotion;
    float opening=smoothstep(0.,1.,uClothEntrance);
    x*=mix(.08,1.,opening);
    z+=sin((p.x-.5)*6.283185)*.16*(1.-opening);
    y+=sin(p.x*3.141593)*.08*(1.-opening);
    return vec3(x,y,z);
  }
`;

const weave=`
  varying vec2 vClothUv;
  // Rounded apertures between crossing steel ribbons. Screen derivatives fade
  // microstructure before it becomes a subpixel grid on narrow phone screens.
  vec4 clothWeave(vec2 uv) {
    vec2 grid=uv*vec2(44.,62.),cell=fract(grid)-.5;
    float footprint=max(fwidth(grid.x),fwidth(grid.y));
    float detail=1.-smoothstep(.65,1.35,footprint);
    float aperture=length(max(abs(cell)-vec2(.13,.18),vec2(0.)))-.075;
    float aa=max(fwidth(aperture),.018);
    float coverage=smoothstep(-aa,aa,aperture);
    float ribX=pow(.5+.5*cos(grid.x*6.283185),5.);
    float ribY=pow(.5+.5*cos(grid.y*6.283185),5.);
    float crossing=mod(floor(grid.x)+floor(grid.y),2.);
    float ribbon=mix(ribX*.72+ribY*.28,ribX*.28+ribY*.72,crossing);
    float edge=1.-smoothstep(.025,.13,aperture);
    return vec4(mix(1.,coverage,detail),ribbon*detail,edge*detail,detail);
  }
  vec3 clothWeaveNormal(vec3 n,vec2 uv,float detail) {
    float ridge=(cos(uv.x*276.46015)*.65+cos(uv.y*389.55749)*.35)*.0018*detail;
    vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);
    vec3 a=cross(dy,n),b=cross(n,dx);
    float determinant=dot(dx,a);
    vec3 gradient=dFdx(ridge)*a+dFdy(ridge)*b;
    return normalize(abs(determinant)*n-sign(determinant)*gradient);
  }
`;

/** One draped metallic weave. Its authored folds stay visible in reduced motion;
 * hover indentation and tap ripples are bounded analytic fields, not a cloth solver. */
export class SpatialCloth extends THREE.Mesh<THREE.PlaneGeometry,THREE.MeshStandardMaterial> {
  readonly time={value:0};
  readonly motion={value:1};
  readonly entrance={value:1};
  readonly hits={value:Array.from({length:4},()=>new THREE.Vector4(.5,.5,-100,0))};
  readonly hover={value:new THREE.Vector3(.5,.5,0)};
  private readonly hoverTarget=new THREE.Vector3(.5,.5,0);
  private nextHit=0;
  constructor(compact:boolean) {
    super(new THREE.PlaneGeometry(1,1,compact?20:32,compact?26:48),new THREE.MeshStandardMaterial({
      color:0x7d8e97,metalness:1,roughness:.34,side:THREE.DoubleSide,envMapIntensity:1.05,
    }));
    this.name="INTERACTIVE_METAL_CLOTH";this.frustumCulled=false;this.visible=false;
    this.material.onBeforeCompile=shader=>{
      shader.uniforms.uClothTime=this.time;shader.uniforms.uClothMotion=this.motion;shader.uniforms.uClothEntrance=this.entrance;
      shader.uniforms.uClothHits=this.hits;shader.uniforms.uClothHover=this.hover;
      shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\n"+folds)
        .replace("#include <beginnormal_vertex>",`#include <beginnormal_vertex>
          float e=.002;
          vec3 clothPoint=clothSurface(uv);
          vec3 clothU=clothSurface(uv+vec2(e,0.))-clothSurface(uv-vec2(e,0.));
          vec3 clothV=clothSurface(uv+vec2(0.,e))-clothSurface(uv-vec2(0.,e));
          objectNormal=normalize(cross(clothU,clothV));`)
        .replace("#include <begin_vertex>",`#include <begin_vertex>
          vClothUv=uv;transformed=clothPoint;`);
      shader.fragmentShader=shader.fragmentShader.replace("#include <common>","#include <common>\n"+weave)
        .replace("#include <color_fragment>",`#include <color_fragment>
          vec4 cloth=clothWeave(vClothUv);
          if(cloth.x<.35)discard;
          diffuseColor.rgb*=mix(.74,1.08,cloth.y)*(1.-cloth.z*.18);
          diffuseColor.rgb*=mix(vec3(1.),vec3(.88,.98,1.),cloth.z*.24);`)
        .replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
          roughnessFactor=clamp(roughnessFactor+cloth.z*.12-cloth.y*.065,.19,.55);`)
        .replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
          normal=clothWeaveNormal(normal,vClothUv,cloth.w);`);
    };
    this.material.customProgramCacheKey=()=>"blackcrown-metal-cloth-unfold-v3";
  }
  setQuality(compact:boolean,reduced:boolean) {
    const columns=compact?20:32,rows=compact?26:48;
    if(this.geometry.parameters.widthSegments!==columns){this.geometry.dispose();this.geometry=new THREE.PlaneGeometry(1,1,columns,rows);}
    this.motion.value=reduced?0:1;
    if(reduced){this.hover.value.z=this.hoverTarget.z=0;for(const hit of this.hits.value)hit.w=0;}
  }
  setHover(u:number,v:number,strength:number) {
    this.hoverTarget.set(
      THREE.MathUtils.clamp(Number.isFinite(u)?u:.5,.02,.98),
      THREE.MathUtils.clamp(Number.isFinite(v)?v:.5,.02,.98),
      this.motion.value?THREE.MathUtils.clamp(Number.isFinite(strength)?strength:0,0,1):0,
    );
  }
  setEntrance(progress:number){this.entrance.value=THREE.MathUtils.clamp(Number.isFinite(progress)?progress:1,0,1);}
  touch(u:number,v:number,time:number) {
    if(!this.motion.value)return;
    this.hits.value[this.nextHit].set(
      THREE.MathUtils.clamp(Number.isFinite(u)?u:.5,.02,.98),
      THREE.MathUtils.clamp(Number.isFinite(v)?v:.5,.02,.98),
      Number.isFinite(time)?time:this.time.value,1,
    );
    this.nextHit=(this.nextHit+1)%this.hits.value.length;
  }
  update(time:number){
    const next=Number.isFinite(time)?time:this.time.value;
    const delta=Math.max(0,next-this.time.value);
    this.time.value=next;
    if(this.motion.value)this.hover.value.lerp(this.hoverTarget,-Math.expm1(-Math.min(delta,.1)/.095));
  }
  dispose(){this.geometry.dispose();this.material.dispose();this.removeFromParent();}
}
