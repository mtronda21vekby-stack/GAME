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
    float response=0.,touchTurn=0.;
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
      touchTurn+=sin(age*2.)*exp(-age*1.3)*h.w*.08;
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
    // One deep, asymmetric shell, not a rectangular fabric sample. The cross
    // section turns back into itself while its long axis counter-twists. Its
    // silhouette and negative space carry the design before any surface grain.
    float clock=uClothTime*uClothMotion;
    float u=(p.x-.5)*2.,v=p.y-.5;
    float sweep=u*2.35+v*.92+sin(clock*.16)*.10;
    sweep+=(uClothDrag.z*.8+touchTurn)*uClothMotion;
    float shoulder=.74+.26*cos(v*4.8);
    float curl=cos(sweep)*shoulder;
    float keel=sin(v*5.2-clock*.2)*.085;
    float labX=sin(sweep)*(.40+.075*cos(v*4.1));
    labX+=sin(v*4.4+clock*.15)*.09+v*.16;
    float labY=v*1.18+u*.10+cos(u*2.6+v*1.7)*.075;
    // The two finishes share the same architectural silhouette, but the open
    // profile has a deeper concavity. Motion is a slow coherent torsion.
    float labZ=(-curl*.54+.20+keel)*mix(1.,1.28,uClothProfile);
    labZ+=sin(v*4.5+clock*.22)*.065;
    labZ+=breath*.3*uClothMotion;
    x=mix(x,labX,uClothSculpture);y=mix(y,labY,uClothSculpture);z=mix(z,labZ,uClothSculpture);
    float opening=smoothstep(0.,1.,uClothEntrance);
    x*=mix(.08,1.,opening);
    z+=sin((p.x-.5)*6.283185)*.16*(1.-opening);
    y+=sin(p.x*3.141593)*.08*(1.-opening);
    vec2 grabDelta=(p-uClothDrag.xy)*vec2(.86,1.);
    float grab=exp(-dot(grabDelta,grabDelta)*12.)*loose*uClothMotion*(1.-uClothSculpture);
    x+=uClothDrag.z*grab;y+=uClothDrag.w*grab;
    z-=length(uClothDrag.zw)*.5*grab*mix(1.,mix(1.7,2.1,uClothProfile),uClothSculpture);
    // A conservative capture cutoff can now enclose every profile and gesture.
    x=clamp(x,-.86,.86);y=clamp(y,-.86,.86);z=clamp(z,-1.15,1.15);
    return vec3(x,y,z);
  }
`;

const weave=`
  varying vec2 vClothUv;
  uniform sampler2D uClothMark;
  uniform sampler2D uClothBackground;
  uniform vec2 uClothRenderSize,uClothBackgroundSize,uClothCssSize;
  uniform mat4 uClothProjection;
  uniform vec4 uClothExitPlane;
  uniform float uClothRefraction,uClothProfile,uClothBend,uClothSculpture;
  // Directional micro-etching follows the continuous shell. There are no
  // tile boundaries, staggered courses, bricks or screen-sized checkerboards.
  vec4 clothWeave(vec2 uv) {
    if(uClothProfile<.5) {
      float flow=uv.x*76.+sin(uv.y*7.2)*3.8+sin(uv.y*17.+uv.x*3.)*.65;
      float footprint=fwidth(flow);
      float detail=1.-smoothstep(.35,1.2,footprint);
      float grain=.5+.5*sin(flow*6.283185);
      float crossGrain=.5+.5*sin(uv.y*229.+sin(uv.x*19.)*1.2);
      float relief=.5+(grain-.5)*.13+(crossGrain-.5)*.035;
      return vec4(1.,mix(.5,relief,detail),0.,detail);
    }
    vec2 grid=uv*vec2(12.,18.),cell=fract(grid)-.5;
    float footprint=max(fwidth(grid.x),fwidth(grid.y));
    float detail=1.-smoothstep(.65,1.35,footprint);
    float width=.17,aa=max(footprint*.7,.012);
    float vertical=1.-smoothstep(width-aa,width+aa,abs(cell.x));
    float horizontal=1.-smoothstep(width-aa,width+aa,abs(cell.y));
    float coverage=max(vertical,horizontal);
    float crossing=.5+.5*cos((grid.x-.5)*3.141593)*cos((grid.y-.5)*3.141593);
    float verticalCrown=max(0.,1.-pow(cell.x/width,2.));
    float horizontalCrown=max(0.,1.-pow(cell.y/width,2.));
    float verticalLevel=vertical*(.28+verticalCrown*.72)*mix(.42,1.,crossing);
    float horizontalLevel=horizontal*(.28+horizontalCrown*.72)*mix(1.,.42,crossing);
    float relief=max(verticalLevel,horizontalLevel);
    float edge=max((1.-verticalCrown)*vertical,(1.-horizontalCrown)*horizontal);
    float fill=1.-pow(1.-width*2.,2.);
    return vec4(mix(fill,coverage,detail),relief*detail,edge*detail,detail);
  }
  vec3 clothWeaveNormal(vec3 n,float relief,float detail) {
    float ridge=relief*mix(.006,.023,uClothProfile)*detail;
    vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);
    vec3 a=cross(dy,n),b=cross(n,dx);
    float determinant=dot(dx,a);
    vec3 gradient=dFdx(ridge)*a+dFdy(ridge)*b;
    return normalize(abs(determinant)*n-sign(determinant)*gradient);
  }
`;

/** r170 packing helpers are included immediately before these functions. */
const depthOptics=`
  uniform sampler2D uClothDepth;
  uniform vec2 uClothDepthRange;
  uniform float uClothDepthReady;
  bool clothDepthCross(vec3 origin,vec3 ray,float travel,out vec2 sampleUv) {
    vec3 candidate=origin+ray*travel;
    vec4 clip=uClothProjection*vec4(candidate,1.);
    if(clip.w<=.001)return false;
    sampleUv=clip.xy/clip.w*.5+.5;
    if(any(lessThan(sampleUv,vec2(0.)))||any(greaterThan(sampleUv,vec2(1.))))return false;
    float windowDepth=unpackRGBAToDepth(texture2D(uClothDepth,sampleUv));
    if(windowDepth>=.9999)return false;
    float sceneDepth=-perspectiveDepthToViewZ(windowDepth,uClothDepthRange.x,uClothDepthRange.y);
    return sceneDepth>-origin.z+.06&&-candidate.z>=sceneDepth;
  }
  bool clothTraceDepth(vec3 origin,vec3 ray,float limit,out vec2 hitUv) {
    float previous=0.;
    for(int i=0;i<6;i++) {
      float fraction=float(i+1)/6.;
      float travel=limit*fraction*fraction;
      vec2 candidateUv=vec2(0.);
      if(clothDepthCross(origin,ray,travel,candidateUv)) {
        float low=previous,high=travel;
        hitUv=candidateUv;
        for(int refine=0;refine<2;refine++) {
          float middle=(low+high)*.5;
          vec2 refinedUv=vec2(0.);
          if(clothDepthCross(origin,ray,middle,refinedUv)){high=middle;hitUv=refinedUv;}
          else low=middle;
        }
        return true;
      }
      previous=travel;
    }
    return false;
  }
`;

export type SpatialClothProfile="molten"|"membrane";

/** One continuous, counter-twisted metallic shell. Its silhouette survives reduced motion;
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
  readonly cssSize={value:new THREE.Vector2(1,1)};
  readonly opticalProjection={value:new THREE.Matrix4()};
  readonly opticalExitPlane={value:new THREE.Vector4(0,0,1,0)};
  readonly refraction={value:0};
  readonly depthBackground={value:null as THREE.Texture|null};
  readonly depthRange={value:new THREE.Vector2(.1,100)};
  readonly depthReady={value:0};
  /** Diagnostic control: zero isolates straight transmission at identical light. */
  readonly bendStrength={value:1};
  private currentProfile:SpatialClothProfile="molten";
  private compact:boolean;
  private opticalBackgroundDepth:number|null=null;
  private readonly planeTransform=new THREE.Matrix4();
  private readonly dragX=new DampedScalar(0,580);
  private readonly dragY=new DampedScalar(0,580);
  private readonly dragTarget=new THREE.Vector2();
  private readonly hoverTarget=new THREE.Vector3(.5,.5,0);
  private nextHit=0;
  constructor(compact:boolean) {
    super(new THREE.PlaneGeometry(1,1,compact?20:32,compact?26:48),new THREE.MeshPhysicalMaterial({
      color:0x657881,metalness:1,roughness:.34,side:THREE.DoubleSide,envMapIntensity:1.08,transparent:true,depthWrite:true,
      clearcoat:.18,clearcoatRoughness:.23,anisotropy:compact?.38:.52,anisotropyRotation:Math.PI*.5,
      iridescence:compact?.12:.2,iridescenceIOR:1.3,iridescenceThicknessRange:[180,300],
    }));
    this.compact=compact;
    this.name="INTERACTIVE_METAL_CLOTH";this.frustumCulled=false;this.visible=false;
    this.onBeforeRender=(renderer,_scene,camera)=>{
      renderer.getSize(this.cssSize.value);
      this.opticalProjection.value.copy(camera.projectionMatrix);
      const m=this.matrixWorld.elements;
      const cutoff=m[14]-(Math.abs(m[2])*.9+Math.abs(m[6])*.9+Math.abs(m[10])*1.2)-.05;
      const depth=this.opticalBackgroundDepth??cutoff-2.5;
      // A world Z plane becomes a full view-space plane under camera pitch/roll.
      const plane=this.opticalExitPlane.value.set(0,0,1,-depth);
      plane.applyMatrix4(this.planeTransform.copy(camera.matrixWorld).transpose());
      const length=Math.hypot(plane.x,plane.y,plane.z);
      if(length>1e-8)plane.multiplyScalar(1/length);
    };
    this.material.onBeforeCompile=shader=>{
      // Compact keeps same-frame colour and the measured backing-plane ray.
      // Omit packed-depth code entirely instead of compiling an inactive loop.
      const useDepth=!this.compact;
      shader.uniforms.uClothTime=this.time;shader.uniforms.uClothMotion=this.motion;shader.uniforms.uClothEntrance=this.entrance;
      shader.uniforms.uClothHits=this.hits;shader.uniforms.uClothHover=this.hover;
      shader.uniforms.uClothDrag=this.drag;shader.uniforms.uClothMark=this.mark;
      shader.uniforms.uClothSculpture=this.sculpture;shader.uniforms.uClothProfile=this.profileMix;
      shader.uniforms.uClothBackground=this.background;shader.uniforms.uClothRenderSize=this.renderSize;
      shader.uniforms.uClothBackgroundSize=this.backgroundSize;shader.uniforms.uClothRefraction=this.refraction;
      shader.uniforms.uClothBend=this.bendStrength;
      shader.uniforms.uClothCssSize=this.cssSize;shader.uniforms.uClothProjection=this.opticalProjection;
      shader.uniforms.uClothExitPlane=this.opticalExitPlane;
      if(useDepth){
        shader.uniforms.uClothDepth=this.depthBackground;shader.uniforms.uClothDepthRange=this.depthRange;
        shader.uniforms.uClothDepthReady=this.depthReady;
      }
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
        .replace("#include <packing>","#include <packing>\n"+(useDepth?depthOptics:""))
        .replace("#include <color_fragment>",`#include <color_fragment>
          vec4 cloth=clothWeave(vClothUv);
          float mark=texture2D(uClothMark,vClothUv).a*(1.-uClothSculpture);
          // Printed metal paint bridges the weave: crown strokes never vanish
          // into apertures or become a transparent optical mask.
          cloth.x=max(cloth.x,mark);
          if(cloth.x<.26)discard;
          diffuseColor.a*=smoothstep(.26,.62,cloth.x);
          float satin=.5+.5*sin(vClothUv.y*19.+sin(vClothUv.x*11.)*1.8);
          diffuseColor.rgb*=mix(mix(.80,.67,uClothProfile),mix(1.08,1.05,uClothProfile),cloth.y)*(1.-cloth.z*mix(.30,.10,uClothProfile));
          diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.48,.57,.59),mark*.94);`)
        .replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
          roughnessFactor=mix(clamp(roughnessFactor+(1.-cloth.y)*mix(.04,.08,uClothProfile)+cloth.z*mix(.08,.035,uClothProfile),.20,.48),.48,mark);`)
        .replace("#include <metalnessmap_fragment>",`#include <metalnessmap_fragment>
          metalnessFactor=mix(metalnessFactor,.15,mark);`)
        .replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
          normal=clothWeaveNormal(normal,cloth.y,cloth.w);`)
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
            float opticalIor=mix(1.42,1.24,uClothProfile);
            vec3 ray=refract(-eye,normal,1./opticalIor);
            vec2 bend=ray.xy/max(abs(ray.z),.25)+eye.xy/max(abs(eye.z),.25);
            vec2 originalDisplacement=clamp(bend,vec2(-.85),vec2(.85))*mix(.075,.1,uClothProfile)*clamp(uClothBend,0.,1.);
            originalDisplacement.x*=uClothRenderSize.y/max(1.,uClothRenderSize.x);
            // Trace the smooth, actually deformed fold to the measured backing
            // plane. Weave grain affects reflection, not the optical ray path.
            vec3 opticalRay=normalize(mix(-eye,refract(-eye,normalize(nonPerturbedNormal),1./opticalIor),clamp(uClothBend,0.,1.)));
            vec3 point=-vViewPosition;
            float planeDistance=dot(uClothExitPlane,vec4(point,1.));
            float bentDenominator=dot(uClothExitPlane.xyz,opticalRay);
            float straightDenominator=dot(uClothExitPlane.xyz,-eye);
            vec2 projectedDisplacement=vec2(0.);
            ${useDepth?"float backingTravel=8.;":""}
            if(uClothSculpture>.001&&bentDenominator<-.08&&straightDenominator<-.08&&planeDistance>0.) {
              float bentTravel=-planeDistance/bentDenominator;
              float straightTravel=-planeDistance/straightDenominator;
              ${useDepth?"backingTravel=max(bentTravel,straightTravel);":""}
              if(bentTravel>0.&&straightTravel>0.) {
                vec4 bentClip=uClothProjection*vec4(point+opticalRay*bentTravel,1.);
                vec4 straightClip=uClothProjection*vec4(point-eye*straightTravel,1.);
                if(bentClip.w>.001&&straightClip.w>.001)
                  projectedDisplacement=(bentClip.xy/bentClip.w-straightClip.xy/straightClip.w)*.5;
              }
            }
            ${useDepth?`if(uClothDepthReady>.5&&uClothSculpture>.001) {
              float farTravel=max(0.,(uClothDepthRange.y+point.z)/max(-opticalRay.z,.1));
              float traceLimit=min(farTravel,min(32.,max(8.,backingTravel+12.)));
              vec2 depthUv=vec2(0.);
              if(traceLimit>.1&&clothTraceDepth(point,opticalRay,traceLimit,depthUv))
                projectedDisplacement=depthUv-screenUv;
            }`:""}
            vec2 displacement=mix(originalDisplacement,projectedDisplacement,clamp(uClothSculpture,0.,1.));
            // This cap is in CSS pixels even when the composer uses another DPR.
            float cssTravel=length(displacement*max(uClothCssSize,vec2(1.)));
            displacement*=min(1.,24./max(cssTravel,.001));
            vec2 texel=1./max(uClothBackgroundSize,vec2(1.));
            float screenEdge=smoothstep(0.,.035,min(min(screenUv.x,screenUv.y),min(1.-screenUv.x,1.-screenUv.y)));
            vec2 sampleUv=clamp(screenUv+displacement*screenEdge,texel,vec2(1.)-texel);
            vec3 transmitted=texture2D(uClothBackground,sampleUv).rgb;
            float facing=abs(dot(normal,eye));
            float coatingF0=pow((opticalIor-1.)/(opticalIor+1.),2.);
            float coatingFresnel=coatingF0+(1.-coatingF0)*pow(1.-facing,5.);
            float coating=uClothRefraction*mix(.24,.78,uClothProfile)*(1.-coatingFresnel)*(1.-mark*.96)*screenEdge;
            // Same-frame scene colour is displaced by the deformed normal.
            // The finish transmits at the front and retains grazing reflection.
            vec3 reflection=outgoingLight;
            outgoingLight=mix(reflection,transmitted*vec3(.88,.97,1.),coating);
          }
          #include <opaque_fragment>`);
    };
    this.material.customProgramCacheKey=()=>`blackcrown-spatial-shell-etched-surface-v9-${this.compact?"plane":"depth"}`;
    this.applyProfileMaterial();
  }
  get profile(){return this.currentProfile;}
  setProfile(profile:SpatialClothProfile){this.currentProfile=profile;this.profileMix.value=profile==="membrane"?1:0;this.applyProfileMaterial();}
  setSculpture(amount:number){this.sculpture.value=THREE.MathUtils.clamp(Number.isFinite(amount)?amount:0,0,1);}
  setOpticalBackgroundDepth(worldZ:number|null){this.opticalBackgroundDepth=worldZ!==null&&Number.isFinite(worldZ)?worldZ:null;}
  setDepthOptics(texture:THREE.Texture|null,near:number,far:number) {
    const valid=!this.compact&&!!texture&&Number.isFinite(near)&&Number.isFinite(far)&&near>0&&far>near;
    this.depthBackground.value=valid?texture:null;this.depthReady.value=valid?1:0;
    if(valid)this.depthRange.value.set(near,far);
  }
  setOptics(texture:THREE.Texture|null,width:number,height:number,strength:number) {
    this.background.value=texture;
    this.renderSize.value.set(Math.max(1,Number.isFinite(width)?width:1),Math.max(1,Number.isFinite(height)?height:1));
    const image=texture?.image as {width?:number;height?:number}|undefined;
    this.backgroundSize.value.set(Math.max(1,image?.width??1),Math.max(1,image?.height??1));
    this.refraction.value=texture?THREE.MathUtils.clamp(Number.isFinite(strength)?strength:0,0,1):0;
  }
  private applyProfileMaterial(){
    const membrane=this.currentProfile==="membrane";
    this.material.color.set(membrane?0x35444a:0x71838a);
    this.material.metalness=membrane?.64:.94;this.material.roughness=membrane?.19:.23;
    this.material.envMapIntensity=membrane?1.15:1.32;
    this.material.clearcoat=membrane?.12:.16;this.material.clearcoatRoughness=membrane?.22:.24;
    this.material.anisotropy=(membrane?.24:.42)*(this.compact?.85:1);
    this.material.iridescence=0;
  }
  setQuality(compact:boolean,reduced:boolean) {
    const changed=this.compact!==compact;
    const columns=compact?20:32,rows=compact?26:48;
    if(this.geometry.parameters.widthSegments!==columns){this.geometry.dispose();this.geometry=new THREE.PlaneGeometry(1,1,columns,rows);}
    this.compact=compact;this.applyProfileMaterial();
    if(changed){
      // The previous program can still reference these shared uniform wrappers.
      // Clear borrowed textures immediately, before the next capture or draw.
      this.depthBackground.value=null;this.depthReady.value=0;
      this.material.needsUpdate=true;
    }
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
  dispose(){this.background.value=null;this.depthBackground.value=null;this.depthReady.value=0;this.refraction.value=0;this.mark.value.dispose();this.geometry.dispose();this.material.dispose();this.removeFromParent();}
}
