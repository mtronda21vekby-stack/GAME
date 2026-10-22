import * as THREE from "three";
import { DampedScalar } from "./spatialMotion";

function brandMark(){
  if(typeof document==="undefined")return new THREE.DataTexture(new Uint8Array([0,0,0,0]),1,1);
  const canvas=document.createElement("canvas");canvas.width=canvas.height=512;const ctx=canvas.getContext("2d")!;
  ctx.strokeStyle="#e5eee9";ctx.lineWidth=7;ctx.lineJoin="round";ctx.beginPath();ctx.moveTo(171,198);ctx.lineTo(202,223);ctx.lineTo(256,163);ctx.lineTo(310,223);ctx.lineTo(341,198);ctx.lineTo(327,274);ctx.lineTo(185,274);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(190,294);ctx.lineTo(322,294);ctx.stroke();ctx.fillStyle="#e5eee9";ctx.textAlign="center";ctx.font="18px ui-monospace,monospace";ctx.fillText("BLACKCROWN",256,340);ctx.font="12px ui-monospace,monospace";ctx.fillText("MATERIAL / LAB",256,365);
  return new THREE.CanvasTexture(canvas);
}

const folds=`
  uniform float uClothTime,uClothMotion,uClothEntrance,uClothProfile,uClothSculpture;
  uniform vec4 uClothHits[4];
  uniform vec3 uClothHover;
  uniform vec4 uClothDrag;
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
    // The unsupported hem curls toward the lens, keeping an open, sculptural
    // silhouette rather than a uniformly flat hanging rectangle.
    float hem=smoothstep(.62,1.,free);
    z+=hem*hem*(.18+sin(p.x*4.8+.8)*.065);
    y+=hem*hem*(.08+sin(p.x*3.141593)*.035);
    x-=pow(p.x,5.)*free*.035;
    x+=sin(p.y*4.+uClothTime*.18)*free*.008*uClothMotion;
    // Two different volumes: focused black-metal saddle and a broad travelling
    // membrane. Sculpture0 recovers the original bounded outro rest shape.
    float clock=uClothTime*uClothMotion;
    float metalFold=sin(p.x*7.4+free*3.2-clock*.42)*.22*loose;
    metalFold+=sin(p.x*3.7-free*5.2+clock*.23)*.11*free;
    metalFold+=(p.x-.5)*(p.y-.5)*.48;
    float membraneFold=sin(p.x*4.8+free*3.5-clock*.34)*.34*loose;
    membraneFold+=sin(p.x*8.3-free*2.5+clock*.19)*.115*free;
    z+=mix(metalFold,membraneFold,uClothProfile)*uClothSculpture;
    float waist=pow(sin(p.y*3.141593),2.);
    x*=1.-uClothSculpture*waist*mix(.11,.24,uClothProfile);
    x+=uClothSculpture*sin(free*4.6+clock*.2)*free*mix(.035,.085,uClothProfile);
    y+=uClothSculpture*sin(p.x*6.283185-clock*.26)*free*mix(.025,.055,uClothProfile);
    float opening=smoothstep(0.,1.,uClothEntrance);
    x*=mix(.08,1.,opening);
    z+=sin((p.x-.5)*6.283185)*.16*(1.-opening);
    y+=sin(p.x*3.141593)*.08*(1.-opening);
    vec2 grabDelta=(p-uClothDrag.xy)*vec2(.86,1.);
    float grab=exp(-dot(grabDelta,grabDelta)*12.)*loose*uClothMotion;
    x+=uClothDrag.z*grab;y+=uClothDrag.w*grab;
    z-=length(uClothDrag.zw)*.5*grab*mix(1.,1.38,uClothProfile*uClothSculpture);
    // A conservative capture cutoff can now enclose every profile and gesture.
    x=clamp(x,-.86,.86);y=clamp(y,-.86,.86);z=clamp(z,-1.15,1.15);
    return vec3(x,y,z);
  }
`;

const weave=`
  varying vec2 vClothUv;
  uniform sampler2D uClothMark;
  uniform sampler2D uClothBackground;
  uniform vec2 uClothRenderSize,uClothBackgroundSize;
  uniform float uClothRefraction,uClothProfile;
  // Fine crossing steel ribbons. Filter the apertures and the brushed grain
  // separately so a receding fold becomes satin instead of a flickering grid.
  vec4 clothWeave(vec2 uv) {
    vec2 grid=uv*mix(vec2(76.,108.),vec2(52.,78.),uClothProfile),cell=fract(grid)-.5;
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
    float brushDetail=1.-smoothstep(.45,1.1,fwidth(uv.x*240.));
    float ridge=(cos(uv.x*502.65482)*.65+cos(uv.y*703.71675)*.35)*.0011*detail;
    ridge+=cos(uv.x*1507.9645+sin(uv.y*18.)*.3)*.00016*brushDetail;
    vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);
    vec3 a=cross(dy,n),b=cross(n,dx);
    float determinant=dot(dx,a);
    vec3 gradient=dFdx(ridge)*a+dFdy(ridge)*b;
    return normalize(abs(determinant)*n-sign(determinant)*gradient);
  }
`;

export type SpatialClothProfile="molten"|"membrane";

/** One draped metallic weave. Its authored folds stay visible in reduced motion;
 * hover indentation and tap ripples are bounded analytic fields, not a cloth solver. */
export class SpatialCloth extends THREE.Mesh<THREE.PlaneGeometry,THREE.MeshPhysicalMaterial> {
  readonly time={value:0};
  readonly motion={value:1};
  readonly entrance={value:1};
  readonly hits={value:Array.from({length:4},()=>new THREE.Vector4(.5,.5,-100,0))};
  readonly hover={value:new THREE.Vector3(.5,.5,0)};
  readonly drag={value:new THREE.Vector4(.5,.5,0,0)};
  readonly mark={value:brandMark()};
  readonly sculpture={value:1};
  readonly profileMix={value:0};
  readonly background={value:null as THREE.Texture|null};
  readonly renderSize={value:new THREE.Vector2(1,1)};
  readonly backgroundSize={value:new THREE.Vector2(1,1)};
  readonly refraction={value:0};
  private currentProfile:SpatialClothProfile="molten";
  private compact:boolean;
  private readonly dragX=new DampedScalar(0,580);
  private readonly dragY=new DampedScalar(0,580);
  private readonly dragTarget=new THREE.Vector2();
  private readonly hoverTarget=new THREE.Vector3(.5,.5,0);
  private nextHit=0;
  constructor(compact:boolean) {
    super(new THREE.PlaneGeometry(1,1,compact?20:32,compact?26:48),new THREE.MeshPhysicalMaterial({
      color:0x657881,metalness:1,roughness:.34,side:THREE.DoubleSide,envMapIntensity:1.08,transparent:true,depthWrite:false,
      clearcoat:.18,clearcoatRoughness:.23,anisotropy:compact?.38:.52,anisotropyRotation:Math.PI*.5,
      iridescence:compact?.12:.2,iridescenceIOR:1.3,iridescenceThicknessRange:[180,300],
    }));
    this.compact=compact;
    this.name="INTERACTIVE_METAL_CLOTH";this.frustumCulled=false;this.visible=false;
    this.material.onBeforeCompile=shader=>{
      shader.uniforms.uClothTime=this.time;shader.uniforms.uClothMotion=this.motion;shader.uniforms.uClothEntrance=this.entrance;
      shader.uniforms.uClothHits=this.hits;shader.uniforms.uClothHover=this.hover;
      shader.uniforms.uClothDrag=this.drag;shader.uniforms.uClothMark=this.mark;
      shader.uniforms.uClothSculpture=this.sculpture;shader.uniforms.uClothProfile=this.profileMix;
      shader.uniforms.uClothBackground=this.background;shader.uniforms.uClothRenderSize=this.renderSize;
      shader.uniforms.uClothBackgroundSize=this.backgroundSize;shader.uniforms.uClothRefraction=this.refraction;
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
          if(cloth.x<.26)discard;
          diffuseColor.a*=smoothstep(.26,.62,cloth.x);
          float satin=.5+.5*sin(vClothUv.y*19.+sin(vClothUv.x*11.)*1.8);
          diffuseColor.rgb*=mix(.82,1.02,cloth.y)*(1.-cloth.z*.13)*mix(.94,1.,satin);
          diffuseColor.rgb*=mix(vec3(1.),vec3(.9,.98,1.),cloth.z*.2);`)
        .replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
          float mark=texture2D(uClothMark,vClothUv).a;
          roughnessFactor=mix(clamp(roughnessFactor+cloth.z*.065-cloth.y*.035+satin*.025,.12,.42),.5,mark);
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.42,.51,.54),mark*.85);`)
        .replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
          normal=clothWeaveNormal(normal,vClothUv,cloth.w);`)
        .replace("#include <clearcoat_normal_fragment_maps>",`#include <clearcoat_normal_fragment_maps>
          #ifdef USE_CLEARCOAT
            clearcoatNormal=normalize(mix(nonPerturbedNormal,normal,.28));
          #endif`)
        .replace("#include <lights_physical_fragment>",`#include <lights_physical_fragment>
          #ifdef USE_CLEARCOAT
            material.clearcoat*=mix(1.,.35,mark);
            material.clearcoatRoughness=clamp(material.clearcoatRoughness+cloth.z*.045-cloth.y*.025,.07,.3);
          #endif
          #ifdef USE_ANISOTROPY
            material.anisotropy*=mix(.8,1.,cloth.y);
            material.alphaT=mix(pow2(material.roughness),1.,pow2(material.anisotropy));
          #endif
          #ifdef USE_IRIDESCENCE
            // Thin-film reflection remains separate from live background optics.
            float grazing=1.-abs(dot(normal,normalize(vViewPosition)));
            material.iridescence*=smoothstep(.03,.45,grazing)*mix(.25,1.,satin)*(1.-mark*.8);
            material.iridescenceThickness=mix(180.,300.,satin);
          #endif`)
        .replace("#include <opaque_fragment>",`
          if(uClothRefraction>.001) {
            vec2 screenUv=gl_FragCoord.xy/max(uClothRenderSize,vec2(1.));
            vec3 eye=normalize(vViewPosition);
            vec3 ray=refract(-eye,normal,1./mix(1.42,1.24,uClothProfile));
            vec2 bend=ray.xy/max(abs(ray.z),.25)+eye.xy/max(abs(eye.z),.25);
            vec2 displacement=clamp(bend,vec2(-.85),vec2(.85))*mix(.055,.085,uClothProfile);
            displacement.x*=uClothRenderSize.y/max(1.,uClothRenderSize.x);
            vec2 texel=1./max(uClothBackgroundSize,vec2(1.));
            float screenEdge=smoothstep(0.,.035,min(min(screenUv.x,screenUv.y),min(1.-screenUv.x,1.-screenUv.y)));
            vec2 sampleUv=clamp(screenUv+displacement*screenEdge,texel,vec2(1.)-texel);
            vec3 transmitted=texture2D(uClothBackground,sampleUv).rgb;
            float facing=abs(dot(normal,eye));
            float coating=uClothRefraction*mix(.46,.7,uClothProfile)*mix(.4,1.,facing)*(1.-mark*.92)*screenEdge;
            // Same-frame scene colour is displaced by the deformed normal.
            // Keep reflected bands instead of turning the metal into clear glass.
            vec3 reflection=outgoingLight;
            outgoingLight=mix(outgoingLight,transmitted*vec3(.88,.97,1.),coating);
            outgoingLight+=reflection*pow(1.-facing,2.)*coating*.35;
          }
          #include <opaque_fragment>`);
    };
    this.material.customProgramCacheKey=()=>"blackcrown-sculptural-refraction-cloth-v1";
    this.applyProfileMaterial();
  }
  get profile(){return this.currentProfile;}
  setProfile(profile:SpatialClothProfile){this.currentProfile=profile;this.profileMix.value=profile==="membrane"?1:0;this.applyProfileMaterial();}
  setSculpture(amount:number){this.sculpture.value=THREE.MathUtils.clamp(Number.isFinite(amount)?amount:0,0,1);}
  setOptics(texture:THREE.Texture|null,width:number,height:number,strength:number) {
    this.background.value=texture;
    this.renderSize.value.set(Math.max(1,Number.isFinite(width)?width:1),Math.max(1,Number.isFinite(height)?height:1));
    const image=texture?.image as {width?:number;height?:number}|undefined;
    this.backgroundSize.value.set(Math.max(1,image?.width??1),Math.max(1,image?.height??1));
    this.refraction.value=texture?THREE.MathUtils.clamp(Number.isFinite(strength)?strength:0,0,1):0;
  }
  private applyProfileMaterial(){
    const membrane=this.currentProfile==="membrane";
    this.material.color.set(membrane?0x284650:0x17282e);
    this.material.metalness=membrane?.36:.92;this.material.roughness=membrane?.14:.18;
    this.material.envMapIntensity=membrane?1.18:1.4;
    this.material.clearcoat=membrane?.82:.48;this.material.clearcoatRoughness=membrane?.08:.1;
    this.material.anisotropy=(membrane?.22:.64)*(this.compact?.85:1);
    this.material.iridescence=(membrane?.26:.11)*(this.compact?.8:1);
  }
  setQuality(compact:boolean,reduced:boolean) {
    const columns=compact?20:32,rows=compact?26:48;
    if(this.geometry.parameters.widthSegments!==columns){this.geometry.dispose();this.geometry=new THREE.PlaneGeometry(1,1,columns,rows);}
    this.compact=compact;this.applyProfileMaterial();
    this.motion.value=reduced?0:1;
    if(reduced){this.hover.value.z=this.hoverTarget.z=0;for(const hit of this.hits.value)hit.w=0;this.dragTarget.set(0,0);this.dragX.snap(0);this.dragY.snap(0);this.drag.value.z=this.drag.value.w=0;}
  }
  setHover(u:number,v:number,strength:number) {
    this.hoverTarget.set(
      THREE.MathUtils.clamp(Number.isFinite(u)?u:.5,.02,.98),
      THREE.MathUtils.clamp(Number.isFinite(v)?v:.5,.02,.98),
      this.motion.value?THREE.MathUtils.clamp(Number.isFinite(strength)?strength:0,0,1):0,
    );
  }
  setEntrance(progress:number){this.entrance.value=THREE.MathUtils.clamp(Number.isFinite(progress)?progress:1,0,1);}
  grab(u:number,v:number,x:number,y:number){
    if(!this.motion.value)return;
    this.drag.value.x=THREE.MathUtils.clamp(u,.05,.95);this.drag.value.y=THREE.MathUtils.clamp(v,.05,.95);
    this.dragTarget.set(THREE.MathUtils.clamp(x,-.26,.26),THREE.MathUtils.clamp(y,-.2,.2));
  }
  release(){this.dragTarget.set(0,0);}
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
    this.drag.value.z=this.dragX.update(this.dragTarget.x,delta*1000);this.drag.value.w=this.dragY.update(this.dragTarget.y,delta*1000);
    if(this.motion.value)this.hover.value.lerp(this.hoverTarget,-Math.expm1(-Math.min(delta,.1)/.095));
  }
  dispose(){this.background.value=null;this.refraction.value=0;this.mark.value.dispose();this.geometry.dispose();this.material.dispose();this.removeFromParent();}
}
