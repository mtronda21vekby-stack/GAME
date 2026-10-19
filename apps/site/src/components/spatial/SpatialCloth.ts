import * as THREE from "three";

const waves=`
  uniform float uClothTime,uClothMotion;
  uniform vec4 uClothHits[4];
  varying vec2 vClothUv;
  float clothHeight(vec2 p) {
    p=clamp(p,vec2(.001),vec2(.999));
    float loose=pow(1.-p.y,.65);
    float z=(sin(p.y*9.+p.x*4.+uClothTime*.32)*.055+sin(p.x*12.-p.y*3.+uClothTime*.22)*.025)*loose;
    for(int i=0;i<4;i++) {
      vec4 h=uClothHits[i];
      float age=max(0.,uClothTime-h.z),r=length((p-h.xy)*vec2(.78,1.));
      float front=r-age*.42;
      z+=sin(front*38.)*exp(-front*front*45.)*exp(-age*1.8)*h.w*.13*loose;
    }
    return z*uClothMotion;
  }
`;
const pattern=`
  varying vec2 vClothUv;
  vec3 clothCell(vec2 uv) {
    vec2 p=uv*vec2(19.,25.),period=vec2(1.73205,1.);
    vec2 a=mod(p,period)-period*.5,b=mod(p-period*.5,period)-period*.5;
    vec2 q=dot(a,a)<dot(b,b)?a:b;
    float edge=max(dot(abs(q),vec2(.866025,.5)),abs(q.y));
    vec2 id=p-q;
    float tint=fract(sin(dot(id,vec2(127.1,311.7)))*43758.5453);
    return vec3(edge,tint,0.);
  }
`;

/** A perforated metallic sheet, with procedural GPU folds and finite tap impulses.
 * This is an analytic ripple field, not a mass/spring cloth physics solver. */
export class SpatialCloth extends THREE.Mesh<THREE.PlaneGeometry,THREE.MeshStandardMaterial> {
  readonly time={value:0};
  readonly motion={value:1};
  readonly hits={value:Array.from({length:4},()=>new THREE.Vector4(.5,.5,-100,0))};
  private nextHit=0;
  constructor(compact:boolean) {
    super(new THREE.PlaneGeometry(1,1,compact?20:32,compact?26:48),new THREE.MeshStandardMaterial({
      color:0x788b92,metalness:.94,roughness:.32,side:THREE.DoubleSide,envMapIntensity:1.15,
    }));
    this.name="INTERACTIVE_METAL_CLOTH";this.frustumCulled=false;this.visible=false;
    this.material.onBeforeCompile=shader=>{
      shader.uniforms.uClothTime=this.time;shader.uniforms.uClothMotion=this.motion;shader.uniforms.uClothHits=this.hits;
      shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\n"+waves)
        .replace("#include <beginnormal_vertex>",`#include <beginnormal_vertex>
          float e=.003;
          objectNormal=normalize(vec3(-(clothHeight(uv+vec2(e,0.))-clothHeight(uv-vec2(e,0.)))/(2.*e),-(clothHeight(uv+vec2(0.,e))-clothHeight(uv-vec2(0.,e)))/(2.*e),1.));`)
        .replace("#include <begin_vertex>",`#include <begin_vertex>
          vClothUv=uv;transformed.z+=clothHeight(uv);
          transformed.x+=sin(uv.y*5.+uClothTime*.2)*.035*(1.-uv.y)*uClothMotion;
          transformed.y+=sin(uv.x*6.283+uClothTime*.17)*.02*(1.-uv.y)*uClothMotion;`);
      shader.fragmentShader=shader.fragmentShader.replace("#include <common>","#include <common>\n"+pattern)
        .replace("#include <color_fragment>",`#include <color_fragment>
          vec3 cell=clothCell(vClothUv);
          if(cell.x>.455)discard;
          diffuseColor.rgb*=mix(.55,1.18,cell.y)*(1.-smoothstep(.38,.455,cell.x)*.45);`)
        .replace("#include <roughnessmap_fragment>","#include <roughnessmap_fragment>\nroughnessFactor+=smoothstep(.38,.455,cell.x)*.13;");
    };
    this.material.customProgramCacheKey=()=>"blackcrown-metal-cloth-v1";
  }
  setQuality(compact:boolean,reduced:boolean) {
    const columns=compact?20:32,rows=compact?26:48;
    if(this.geometry.parameters.widthSegments!==columns){this.geometry.dispose();this.geometry=new THREE.PlaneGeometry(1,1,columns,rows);}
    this.motion.value=reduced?0:1;
  }
  touch(u:number,v:number,time:number) {
    this.hits.value[this.nextHit].set(THREE.MathUtils.clamp(u,.02,.98),THREE.MathUtils.clamp(v,.02,.98),time,1);
    this.nextHit=(this.nextHit+1)%this.hits.value.length;
  }
  update(time:number){this.time.value=time;}
  dispose(){this.geometry.dispose();this.material.dispose();this.removeFromParent();}
}
