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
    // A suspended tension wave carries a broad bulge and an offset trough
    // through the LAB. The second profile reverses that volume into an open
    // lattice bowl. Neither depends on the old fixed diagonal crease field.
    float clock=uClothTime*uClothMotion;
    vec2 center=vec2(.46+sin(clock*.25)*.10,.48+sin(clock*.36)*.15);
    vec2 domeDelta=(p-center)*vec2(2.8,2.3);
    vec2 troughDelta=(p-center-vec2(.28,-.12))*vec2(3.5,2.8);
    float dome=exp(-dot(domeDelta,domeDelta));
    float trough=exp(-dot(troughDelta,troughDelta));
    float suspension=smoothstep(0.,.22,free);
    float tension=sin((p.y-center.y)*5.8-clock*.32+sin(p.x*3.141593)*.7)*loose;
    float rollingHem=hem*hem*(.18+sin(clock*.38+p.x*3.8)*.12);
    float metalFold=(dome*.52-trough*.32)*suspension+tension*.16+rollingHem;
    float membraneFold=(-dome*.36+trough*.52)*suspension-tension*.21+rollingHem*.85;
    float labZ=mix(metalFold,membraneFold,uClothProfile);
    labZ+=(breath*.65+response*loose*1.7)*uClothMotion;
    float waist=exp(-pow((p.y-center.y)*3.2,2.));
    float labX=(p.x-.5)*(1.-waist*mix(.10,.18,uClothProfile));
    labX+=sin(free*3.1+.2)*.045*free+sin(free*3.8-clock*.25)*.045*free;
    float labY=p.y-.5-pow(sin(p.x*3.141593),2.)*free*.045;
    labY+=hem*hem*(.10+sin(clock*.31+p.x*3.2)*.055);
    x=mix(x,labX,uClothSculpture);y=mix(y,labY,uClothSculpture);z=mix(z,labZ,uClothSculpture);
    float opening=smoothstep(0.,1.,uClothEntrance);
    x*=mix(.08,1.,opening);
    z+=sin((p.x-.5)*6.283185)*.16*(1.-opening);
    y+=sin(p.x*3.141593)*.08*(1.-opening);
    vec2 grabDelta=(p-uClothDrag.xy)*vec2(.86,1.);
    float grab=exp(-dot(grabDelta,grabDelta)*12.)*loose*uClothMotion;
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
  uniform sampler2D uClothDepth;
  uniform vec2 uClothDepthRange;
  uniform float uClothDepthReady;
  uniform vec2 uClothRenderSize,uClothBackgroundSize,uClothCssSize;
  uniform mat4 uClothProjection;
  uniform vec4 uClothExitPlane;
  uniform float uClothRefraction,uClothProfile,uClothBend,uClothSculpture;
  // Staggered, shallow overlapping facets articulate the continuous metal skin.
  // Each face has one planar tilt, not a rounded dimple or a cut-out grid. The
  // membrane remains an independent open-weave material for comparison.
  vec4 clothWeave(vec2 uv) {
    if(uClothProfile<.5) {
      vec2 grid=uv*vec2(22.,30.);
      float footprint=max(fwidth(grid.x),fwidth(grid.y));
      float row=floor(grid.y);
      grid.x+=mod(row,2.)*.5;
      vec2 tile=floor(grid),cell=fract(grid)-.5;
      float detail=1.-smoothstep(.65,1.35,footprint);
      float border=min(.5-abs(cell.x),.5-abs(cell.y));
      float seam=1.-smoothstep(.018,.055,border);
      // A three-course cadence varies local face orientation without noise.
      float turn=(tile.x+row*2.)*2.094395;
      vec2 tilt=vec2(cos(turn)*.48,sin(turn+1.1)*.38);
      float face=.52+dot(cell,tilt);
      float bevel=smoothstep(.018,.105,border);
      float lap=smoothstep(.25,.46,cell.y)*(1.-smoothstep(.46,.5,cell.y));
      float relief=mix(.20,face,bevel)+lap*.10;
      // The metal backing remains closed through every seam and under paint.
      return vec4(1.,mix(.52,relief,detail),seam*detail,detail);
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
    float ridge=relief*mix(.026,.023,uClothProfile)*detail;
    vec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);
    vec3 a=cross(dy,n),b=cross(n,dx);
    float determinant=dot(dx,a);
    vec3 gradient=dFdx(ridge)*a+dFdy(ridge)*b;
    return normalize(abs(determinant)*n-sign(determinant)*gradient);
  }
`;

/** r170 packing helpers are included immediately before these functions. */
const depthOptics=`
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
      color:0x657881,metalness:1,roughness:.34,side:THREE.DoubleSide,envMapIntensity:1.08,transparent:true,depthWrite:false,
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
      shader.uniforms.uClothTime=this.time;shader.uniforms.uClothMotion=this.motion;shader.uniforms.uClothEntrance=this.entrance;
      shader.uniforms.uClothHits=this.hits;shader.uniforms.uClothHover=this.hover;
      shader.uniforms.uClothDrag=this.drag;shader.uniforms.uClothMark=this.mark;
      shader.uniforms.uClothSculpture=this.sculpture;shader.uniforms.uClothProfile=this.profileMix;
      shader.uniforms.uClothBackground=this.background;shader.uniforms.uClothRenderSize=this.renderSize;
      shader.uniforms.uClothBackgroundSize=this.backgroundSize;shader.uniforms.uClothRefraction=this.refraction;
      shader.uniforms.uClothBend=this.bendStrength;
      shader.uniforms.uClothCssSize=this.cssSize;shader.uniforms.uClothProjection=this.opticalProjection;
      shader.uniforms.uClothExitPlane=this.opticalExitPlane;
      shader.uniforms.uClothDepth=this.depthBackground;shader.uniforms.uClothDepthRange=this.depthRange;
      shader.uniforms.uClothDepthReady=this.depthReady;
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
        .replace("#include <packing>","#include <packing>\n"+depthOptics)
        .replace("#include <color_fragment>",`#include <color_fragment>
          vec4 cloth=clothWeave(vClothUv);
          float mark=texture2D(uClothMark,vClothUv).a;
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
            float backingTravel=8.;
            if(uClothSculpture>.001&&bentDenominator<-.08&&straightDenominator<-.08&&planeDistance>0.) {
              float bentTravel=-planeDistance/bentDenominator;
              float straightTravel=-planeDistance/straightDenominator;
              backingTravel=max(bentTravel,straightTravel);
              if(bentTravel>0.&&straightTravel>0.) {
                vec4 bentClip=uClothProjection*vec4(point+opticalRay*bentTravel,1.);
                vec4 straightClip=uClothProjection*vec4(point-eye*straightTravel,1.);
                if(bentClip.w>.001&&straightClip.w>.001)
                  projectedDisplacement=(bentClip.xy/bentClip.w-straightClip.xy/straightClip.w)*.5;
              }
            }
            if(uClothDepthReady>.5&&uClothSculpture>.001) {
              float farTravel=max(0.,(uClothDepthRange.y+point.z)/max(-opticalRay.z,.1));
              float traceLimit=min(farTravel,min(32.,max(8.,backingTravel+12.)));
              vec2 depthUv=vec2(0.);
              if(traceLimit>.1&&clothTraceDepth(point,opticalRay,traceLimit,depthUv))
                projectedDisplacement=depthUv-screenUv;
            }
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
            float coating=uClothRefraction*mix(.6,.78,uClothProfile)*(1.-coatingFresnel)*(1.-mark*.96)*screenEdge;
            // Same-frame scene colour is displaced by the deformed normal.
            // The finish transmits at the front and retains grazing reflection.
            vec3 reflection=outgoingLight;
            outgoingLight=mix(reflection,transmitted*vec3(.88,.97,1.),coating);
          }
          #include <opaque_fragment>`);
    };
    this.material.customProgramCacheKey=()=>"blackcrown-faceted-depth-tension-surface-v8";
    this.applyProfileMaterial();
  }
  get profile(){return this.currentProfile;}
  setProfile(profile:SpatialClothProfile){this.currentProfile=profile;this.profileMix.value=profile==="membrane"?1:0;this.applyProfileMaterial();}
  setSculpture(amount:number){this.sculpture.value=THREE.MathUtils.clamp(Number.isFinite(amount)?amount:0,0,1);}
  setOpticalBackgroundDepth(worldZ:number|null){this.opticalBackgroundDepth=worldZ!==null&&Number.isFinite(worldZ)?worldZ:null;}
  setDepthOptics(texture:THREE.Texture|null,near:number,far:number) {
    const valid=!!texture&&Number.isFinite(near)&&Number.isFinite(far)&&near>0&&far>near;
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
    this.material.color.set(membrane?0x35444a:0x303b3e);
    this.material.metalness=membrane?.64:.90;this.material.roughness=membrane?.22:.28;
    this.material.envMapIntensity=membrane?1.15:1.1;
    this.material.clearcoat=membrane?.12:.16;this.material.clearcoatRoughness=membrane?.22:.24;
    this.material.anisotropy=(membrane?.24:.42)*(this.compact?.85:1);
    this.material.iridescence=0;
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
  dispose(){this.background.value=null;this.depthBackground.value=null;this.depthReady.value=0;this.refraction.value=0;this.mark.value.dispose();this.geometry.dispose();this.material.dispose();this.removeFromParent();}
}
