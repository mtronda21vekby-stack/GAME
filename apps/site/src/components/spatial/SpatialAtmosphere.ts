import * as THREE from "three";

export const SPATIAL_ATMOSPHERE_QUALITY = {
  desktop: { particles: 1800, hazeLayers: 2, shafts: 2, bloom: true, dpr: 1.5 },
  mobile: { particles: 480, hazeLayers: 1, shafts: 1, bloom: false, dpr: 1.25 },
} as const;

const dustVertex = `
  uniform float uTime, uDpr, uOpacity, uTravel, uAxisHeight, uArrival, uDeparture, uHeadY, uDetail, uLab;
  uniform vec3 uAccent;
  attribute float aSeed;
  attribute vec3 aTint;
  varying vec3 vTint;
  varying float vAlpha, vSpark, vDefocus;
  varying float vWorldZ;
  void main() {
    vec3 p = position;
    p.y = (mod(p.y+uTime*(.025+aSeed*.055)+18.,36.)-18.)*uAxisHeight/26.;
    float radius=length(position.xz),angle=aSeed*62.83+p.y*.26+uTime*.035+uTravel*.2;
    p.x = cos(angle)*radius+sin(uTime*.11+aSeed*19.)*.16;
    p.z = sin(angle)*radius;
    float boneT=clamp((.26986-p.y/uAxisHeight)/.76973,0.,1.);
    float envelope=pow(sin(boneT*3.141593),2.);
    p.x+=uAxisHeight*.02167*sin(boneT*6.283185)*envelope;
    p.z+=uAxisHeight*.035*sin(boneT*6.283185-.35)*envelope;
    float travel=fract(aSeed+uArrival*.72+uTime*.012);
    vec3 stream=vec3(cos(angle)*radius*1.3,uHeadY+sin(angle)*radius*.6+(travel-.5)*.8,mix(-7.,14.,travel));
    float streamFade=smoothstep(0.,.12,travel)*(1.-smoothstep(.88,1.,travel));
    p=mix(stream,p,uArrival);
    p.x=mix(p.x,p.x*.55,uDeparture);
    p.z+=uDeparture*3.;
    // The same grains travel behind the entire LAB volume. Previously their
    // forward travel left nearly all of them outside the background snapshot.
    p.z-=uLab*(10.+uDeparture*3.);
    vec4 mv = modelViewMatrix*vec4(p,1.);
    vWorldZ=(modelMatrix*vec4(p,1.)).z;
    gl_Position = projectionMatrix*mv;
    vec2 lensCenter=vec2(sin(uTime*.17)*.4,cos(uTime*.13)*.35);
    vec2 lensDelta=gl_Position.xy/gl_Position.w-lensCenter;
    float lens=exp(-pow(length(lensDelta)/.36,4.))*uDetail;
    gl_Position.xy+=normalize(lensDelta+vec2(.0001))*.075*lens*gl_Position.w;
    float screenX = gl_Position.x/gl_Position.w*.5+.5;
    float distanceFade = smoothstep(2.,7.,-mv.z)*(1.-smoothstep(mix(25.,32.,uLab),mix(42.,55.,uLab),-mv.z));
    vSpark = step(.988,aSeed);
    vDefocus = 1.-smoothstep(11.,19.,-mv.z);
    gl_PointSize = clamp((11.+aSeed*31.+vSpark*20.)*(1.+vDefocus*2.8)*uDpr/max(1.,-mv.z),1.,10.*uDpr);
    gl_PointSize=mix(gl_PointSize,(3.+aSeed*9.)*uDpr,uDetail);
    gl_PointSize*=mix(1.,1.65,uLab);
    // Recolour the existing grains without making brighter worlds emit more light.
    vec3 luminanceWeights=vec3(.2126,.7152,.0722);
    float tintEnergy=dot(aTint,luminanceWeights);
    vec3 worldTint=uAccent/max(.001,dot(uAccent,luminanceWeights))*tintEnergy;
    vTint = mix(aTint,worldTint,.3*(1.-vSpark*.7));
    float focusFade=mix(1.,.23,vDefocus);
    vec2 headDelta=vec2(p.x/(uAxisHeight*.17),(p.y-uHeadY)/(uAxisHeight*.15));
    float foreground=smoothstep(.4,3.4,p.z);
    float subjectClear=1.-(1.-smoothstep(.7,1.45,length(headDelta)))*foreground*.88*(1.-uDeparture);
    vAlpha = uOpacity*distanceFade*focusFade*(.45+.55*smoothstep(.1,.7,screenX))*mix(streamFade,1.,uArrival)*(1.-lens*.92)*subjectClear;
  }
`;
const dustFragment = `
  varying vec3 vTint;
  varying float vAlpha, vSpark, vDefocus;
  varying float vWorldZ;
  uniform vec2 uBackgroundClip;
  void main() {
    if(uBackgroundClip.x>.5&&vWorldZ>uBackgroundClip.y)discard;
    vec2 q = gl_PointCoord-.5;
    q.y *= mix(1.,.28,vSpark);
    float light = pow(1.-smoothstep(0.,.25,dot(q,q)),mix(2.,1.2,vDefocus));
    if(light<.015) discard;
    gl_FragColor = vec4(vTint,light*vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const hazeVertex = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vWorldZ;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += sin(p.y*.35+uTime*.09)*.12;
    vWorldZ=(modelMatrix*vec4(p,1.)).z;
    gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.);
  }
`;
const hazeFragment = `
  uniform float uTime, uOpacity, uShaft, uLab;
  uniform vec3 uTint;
  varying vec2 vUv;
  varying float vWorldZ;
  uniform vec2 uBackgroundClip;
  float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p) {
    vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
  }
  void main() {
    if(uBackgroundClip.x>.5&&vWorldZ>uBackgroundClip.y)discard;
    vec2 drift=vec2(uTime*.012,-uTime*.008);
    float cloud=noise(vUv*vec2(2.4,3.1)+drift)*.66+noise(vUv*vec2(6.,7.)-drift*.5)*.34;
    float vertical=smoothstep(0.,.16,vUv.y)*(1.-smoothstep(.73,1.,vUv.y));
    float edge=pow(max(0.,sin(vUv.x*3.141593)),1.8)*vertical;
    float sweep=vUv.x-.47+(vUv.y-.5)*.25;
    // Narrow the existing pair of shaft gradients in LAB, so their live edges
    // are recognisable when a fold refracts them. This is the same light plane.
    float beam=(exp(-pow(sweep*mix(5.2,14.,uLab),2.))*mix(.68,.28,uLab)+exp(-pow((sweep-mix(.2,.14,uLab))*mix(12.,26.,uLab),2.))*mix(.24,.82,uLab))*vertical;
    vec2 pocketDelta=(vUv-vec2(.57,.58))*vec2(3.1,1.7);
    float pocket=.12+.88*exp(-dot(pocketDelta,pocketDelta));
    float alpha=mix(edge*pocket,beam,uShaft)*(.18+.82*cloud)*uOpacity;
    vec3 tint=mix(uTint*vec3(.78,.7,1.12),uTint,smoothstep(.2,.75,vUv.x));
    gl_FragColor=vec4(tint,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const random = (i: number) => { const n=Math.sin(i*127.1+311.7)*43758.5453; return n-Math.floor(n); };
const luminance = (color:THREE.Color) => color.r*.2126+color.g*.7152+color.b*.0722;
function tintField(target:THREE.Color,base:number,accent:THREE.Color,accentLuminance:number,scratch:THREE.Color,mix:number,strength=1) {
  target.set(base).multiplyScalar(strength);
  scratch.copy(accent).multiplyScalar(luminance(target)/accentLuminance);
  target.lerp(scratch,mix);
}

/** Real 3D geometry and GPU vertex-animated dust. Haze/shafts approximate scattering;
 * they are depth-tested shader planes, not a volumetric raymarch or fluid simulation. */
export class SpatialAtmosphere extends THREE.Group {
  readonly time = { value: 0 };
  readonly motion = { value: 1 };
  readonly backgroundClip = { value:new THREE.Vector2(0,0) };
  readonly lab = { value:0 };
  readonly dust: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  readonly facets:THREE.Mesh<THREE.InstancedBufferGeometry,THREE.ShaderMaterial>;
  private readonly haze: THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>[] = [];
  private readonly shafts: THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>[] = [];
  private readonly worldTint = new THREE.Color();
  private compact: boolean;
  private reduced = false;
  private captureDpr:number|null=null;
  private backgroundPointerX=0;

  constructor(compact: boolean) {
    super(); this.name="BLACKCROWN_ATMOSPHERE"; this.compact=compact;
    const positions:number[]=[], seeds:number[]=[], colors:number[]=[];
    for(let i=0;i<SPATIAL_ATMOSPHERE_QUALITY.desktop.particles;i++) {
      const seed=random(i*4+3);
      const radius=seed>.9?3.8+random(i*4)*2.6:.85+Math.pow(random(i*4),1.4)*2.7,angle=random(i*4+2)*Math.PI*2;
      positions.push(Math.cos(angle)*radius,(random(i*4+1)-.5)*36,Math.sin(angle)*radius);
      seeds.push(seed);
      const color=new THREE.Color(i%11===0?0xa6a0cb:i%4===0?0xb4ced3:0x7eacb9);
      color.multiplyScalar(seed>.988?2.1:.68); colors.push(color.r,color.g,color.b);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute("aSeed",new THREE.Float32BufferAttribute(seeds,1));
    geometry.setAttribute("aTint",new THREE.Float32BufferAttribute(colors,3));
    this.dust=new THREE.Points(geometry,new THREE.ShaderMaterial({
      uniforms:{uTime:this.time,uDpr:{value:1},uOpacity:{value:.6},uTravel:{value:0},uAxisHeight:{value:26},uArrival:{value:1},uDeparture:{value:0},uHeadY:{value:9},uDetail:{value:0},uAccent:{value:new THREE.Color(0x9edfe6)},uBackgroundClip:this.backgroundClip,uLab:this.lab},
      vertexShader:dustVertex,fragmentShader:dustFragment,transparent:true,
      blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true,
    }));
    // Depth comes from the sculpture and atmospheric layers, without a fake floor,
    // orbit ring or foreground rails crossing the actual interface.
    this.dust.name="GPU_DUST_VOLUME"; this.dust.frustumCulled=false; this.add(this.dust);
    const tetra=new THREE.TetrahedronGeometry(.035,0),facetGeometry=new THREE.InstancedBufferGeometry();
    facetGeometry.index=tetra.index;facetGeometry.attributes.position=tetra.attributes.position;facetGeometry.attributes.normal=tetra.attributes.normal;
    facetGeometry.setAttribute("aAnchor",new THREE.InstancedBufferAttribute(new Float32Array(positions.slice(0,360*3)),3));
    facetGeometry.setAttribute("aSeed",new THREE.InstancedBufferAttribute(new Float32Array(seeds.slice(0,360)),1));
    facetGeometry.setAttribute("aTint",new THREE.InstancedBufferAttribute(new Float32Array(colors.slice(0,360*3)),3));
    const facetVertex=dustVertex.replace("attribute float aSeed;","attribute vec3 aAnchor; attribute float aSeed; varying vec3 vFacetNormal;")
      .replace("vec3 p = position;","vec3 p = aAnchor;").replace("length(position.xz)","length(aAnchor.xz)")
      .replace("vec4 mv = modelViewMatrix*vec4(p,1.);","float turn=aSeed*6.283185+uTime*.045;mat2 r=mat2(cos(turn),-sin(turn),sin(turn),cos(turn));vec3 facet=position*(.55+aSeed);facet.xz=r*facet.xz;p+=facet;vec3 n=normal;n.xz=r*n.xz;vFacetNormal=normalize(normalMatrix*n);vec4 mv=modelViewMatrix*vec4(p,1.);");
    this.facets=new THREE.Mesh(facetGeometry,new THREE.ShaderMaterial({uniforms:this.dust.material.uniforms,vertexShader:facetVertex,fragmentShader:`varying vec3 vTint,vFacetNormal;varying float vAlpha,vSpark,vWorldZ;uniform vec2 uBackgroundClip;void main(){if(uBackgroundClip.x>.5&&vWorldZ>uBackgroundClip.y)discard;float light=.35+.65*max(0.,dot(normalize(vFacetNormal),normalize(vec3(-.4,.8,1.))));gl_FragColor=vec4(vTint*light*(1.+vSpark),vAlpha*.8);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
    this.facets.name="GPU_METAL_GRAINS";this.facets.frustumCulled=false;this.add(this.facets);
    [-10,-3,3].forEach((z,i)=>{
      const mesh=this.makeHaze(false);mesh.position.set(i-1,-1+i*.6,z);mesh.scale.set(23,15,1);mesh.rotation.z=-.17+i*.14;
      this.haze.push(mesh);this.add(mesh);
    });
    [[2.4,1,-6,-.28],[.2,1,1.6,-.4]].forEach(([x,y,z,tilt])=>{
      const mesh=this.makeHaze(true);mesh.position.set(x,y,z);mesh.scale.set(6.4,19,1);mesh.rotation.z=tilt;
      this.shafts.push(mesh);this.add(mesh);
    });
    this.setQuality(compact,false);this.setAxisHeight(compact?15.8:26);
  }

  private makeHaze(shaft:boolean) {
    return new THREE.Mesh(new THREE.PlaneGeometry(1,1,1,8),new THREE.ShaderMaterial({
      uniforms:{uTime:this.time,uOpacity:{value:0},uShaft:{value:shaft?1:0},uTint:{value:new THREE.Color(shaft?0x8dc5d3:0x587c90).multiplyScalar(shaft?1.55:1)},uBackgroundClip:this.backgroundClip,uLab:this.lab},
      vertexShader:hazeVertex,fragmentShader:hazeFragment,transparent:true,depthWrite:false,depthTest:true,
      side:THREE.DoubleSide,blending:shaft?THREE.AdditiveBlending:THREE.NormalBlending,
    }));
  }

  setQuality(compact:boolean,reduced:boolean) {
    this.compact=compact;this.reduced=reduced;
    const quality=SPATIAL_ATMOSPHERE_QUALITY[compact?"mobile":"desktop"];
    this.dust.geometry.setDrawRange(0,reduced?Math.min(quality.particles,compact?160:500):quality.particles);
    this.facets.geometry.instanceCount=reduced?(compact?24:80):(compact?96:360);
    this.haze.forEach((mesh,i)=>{mesh.visible=i<quality.hazeLayers;});
    this.shafts.forEach((mesh,i)=>{mesh.visible=i<quality.shafts;});
    this.motion.value=reduced?0:1;
  }

  /** Clip only the background snapshot to content conservatively behind the
   * entire deformed sheet. Null restores the unchanged final atmosphere draw. */
  setBackgroundCapture(maxWorldZ:number|null,dpr?:number) {
    const capturing=maxWorldZ!==null&&Number.isFinite(maxWorldZ);
    if(capturing&&dpr!==undefined&&Number.isFinite(dpr)&&dpr>0){
      if(this.captureDpr===null)this.captureDpr=this.dust.material.uniforms.uDpr.value as number;
      this.dust.material.uniforms.uDpr.value=dpr;
    }else if(!capturing&&this.captureDpr!==null){
      this.dust.material.uniforms.uDpr.value=this.captureDpr;this.captureDpr=null;
    }
    this.backgroundClip.value.set(maxWorldZ!==null&&Number.isFinite(maxWorldZ)?1:0,maxWorldZ!==null&&Number.isFinite(maxWorldZ)?maxWorldZ:0);
  }

  /** Recompose the existing light field just behind the measured whole sheet.
   * Scale and translate about the camera to preserve the projected footprint.
   * Call after update() and the cloth world-matrix update; return the same backing
   * plane used by the material's projected optical path. No new geometry. */
  setLabDepth(cutoff:number,cameraZ:number,cameraY?:number):number {
    const lab=this.lab.value;
    if(!Number.isFinite(cutoff)||!Number.isFinite(cameraZ)||lab<=0)return this.position.z+this.shafts[0].position.z;
    const axisHeight=this.dust.material.uniforms.uAxisHeight.value as number;
    const localCameraX=-this.position.x;
    const localCameraY=(Number.isFinite(cameraY)?cameraY!:this.position.y/Math.max(lab,.001))-this.position.y;
    const reflow=(mesh:THREE.Mesh,baseZ:number,targetZ:number,x:number,y:number,width:number,height:number)=>{
      const baseWorldZ=this.position.z+baseZ;
      const worldZ=THREE.MathUtils.lerp(baseWorldZ,targetZ,lab);
      const ratio=THREE.MathUtils.clamp((cameraZ-worldZ)/Math.max(1,cameraZ-baseWorldZ),.15,2);
      mesh.position.set(localCameraX+(x-localCameraX)*ratio,localCameraY+(y-localCameraY)*ratio,worldZ-this.position.z);
      mesh.scale.set(width*ratio,height*ratio,1);
    };
    this.haze.forEach((mesh,i)=>reflow(mesh,[-10,-3,3][i]-lab*8,cutoff-6+i*2,(i-1)*1.1+this.backgroundPointerX*(.15+i*.2),axisHeight*(.22-i*.18),23,axisHeight*1.5*(1+lab*.3)));
    this.shafts.forEach((mesh,i)=>reflow(mesh,(i?1.6:-6)-lab*8,cutoff-2.5-i,THREE.MathUtils.lerp(i?.2:2.4,i?2.2:-1.35,lab),0,6.4*(1+lab*.5),axisHeight*1.7*(1+lab*.35)));
    return this.position.z+this.shafts[0].position.z;
  }

  setAxisHeight(height:number) {
    this.dust.material.uniforms.uAxisHeight.value=height;
    this.dust.material.uniforms.uHeadY.value=height*.35;
    this.haze.forEach((mesh,i)=>{mesh.scale.y=height*1.5;mesh.position.y=height*(.22-i*.18);});
    this.shafts.forEach(mesh=>{mesh.scale.y=height*1.7;mesh.position.y=0;});
  }
  setChoreography(arrival:number,departure:number){
    this.dust.material.uniforms.uArrival.value=this.reduced?1:THREE.MathUtils.clamp(arrival,0,1);
    this.dust.material.uniforms.uDeparture.value=this.reduced?0:THREE.MathUtils.clamp(departure,0,1);
  }

  update(time:number,progress:number,detail:number,pointer:{x:number;y:number},anchor:THREE.Vector3,dpr:number,accent:THREE.Color,lab=0) {
    this.time.value=this.reduced?0:time;this.position.copy(anchor);
    lab=THREE.MathUtils.clamp(Number.isFinite(lab)?lab:0,0,1);this.lab.value=lab;
    this.backgroundPointerX=pointer.x;
    const journey=THREE.MathUtils.smoothstep(progress,.08,.85);
    const opacity=(1-detail*.15)*(1-lab*.24);this.visible=opacity>.005;
    this.dust.material.uniforms.uDetail.value=this.reduced?0:detail;
    this.dust.material.uniforms.uDpr.value=dpr;
    this.dust.material.uniforms.uOpacity.value=opacity*(this.compact?.35:.43);
    this.dust.material.uniforms.uTravel.value=journey*2.5;
    (this.dust.material.uniforms.uAccent.value as THREE.Color).copy(accent);
    const accentLuminance=Math.max(.001,luminance(accent));
    this.haze.forEach((mesh,i)=>{
      mesh.material.uniforms.uOpacity.value=opacity*(.2-journey*.06)*(1-i*.16)*(1+lab*.3);
      tintField(mesh.material.uniforms.uTint.value as THREE.Color,i%2?0x665f82:0x587c90,accent,accentLuminance,this.worldTint,.38);
      mesh.position.x=(i-1)*1.1+pointer.x*(.15+i*.2);
      mesh.position.y=(this.dust.material.uniforms.uAxisHeight.value as number)*(.22-i*.18);
      mesh.position.z=[-10,-3,3][i]-lab*8;
      mesh.scale.x=23;
      mesh.scale.y=(this.dust.material.uniforms.uAxisHeight.value as number)*1.5*(1+lab*.3);
    });
    this.shafts.forEach((mesh,i)=>{
      mesh.material.uniforms.uOpacity.value=opacity*(.17-journey*.035)*(1-i*.24)*(1+lab*2.);
      tintField(mesh.material.uniforms.uTint.value as THREE.Color,0x8dc5d3,accent,accentLuminance,this.worldTint,.4,1.55);
      mesh.position.x=THREE.MathUtils.lerp(i?.2:2.4,i?2.2:-1.35,lab);
      mesh.position.y=0;
      mesh.position.z=(i?1.6:-6)-lab*8;
      mesh.scale.x=6.4*(1+lab*.5);
      mesh.scale.y=(this.dust.material.uniforms.uAxisHeight.value as number)*1.7*(1+lab*.35);
    });
  }

  dispose() {
    const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
    this.traverse(object=>{
      const mesh=object as THREE.Mesh;
      if(mesh.geometry)geometries.add(mesh.geometry);
      if(mesh.material)for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])materials.add(material);
    });
    geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());
    this.removeFromParent();this.clear();
  }
}
