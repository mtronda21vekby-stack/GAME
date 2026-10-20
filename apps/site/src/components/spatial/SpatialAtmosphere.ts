import * as THREE from "three";

export const SPATIAL_ATMOSPHERE_QUALITY = {
  desktop: { particles: 1800, hazeLayers: 2, shafts: 2, bloom: true, dpr: 1.5 },
  mobile: { particles: 480, hazeLayers: 1, shafts: 1, bloom: false, dpr: 1.25 },
} as const;

const dustVertex = `
  uniform float uTime, uDpr, uOpacity, uTravel, uAxisHeight, uArrival, uDeparture, uHeadY, uDetail;
  attribute float aSeed;
  attribute vec3 aTint;
  varying vec3 vTint;
  varying float vAlpha, vSpark;
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
    vec4 mv = modelViewMatrix*vec4(p,1.);
    gl_Position = projectionMatrix*mv;
    vec2 lensCenter=vec2(sin(uTime*.17)*.4,cos(uTime*.13)*.35);
    vec2 lensDelta=gl_Position.xy/gl_Position.w-lensCenter;
    float lens=exp(-pow(length(lensDelta)/.36,4.))*uDetail;
    gl_Position.xy+=normalize(lensDelta+vec2(.0001))*.075*lens*gl_Position.w;
    float screenX = gl_Position.x/gl_Position.w*.5+.5;
    float distanceFade = smoothstep(2.,7.,-mv.z)*(1.-smoothstep(25.,42.,-mv.z));
    vSpark = step(.982,aSeed);
    gl_PointSize = clamp((12.+aSeed*35.+vSpark*22.)*uDpr/max(1.,-mv.z),1.,10.*uDpr);
    gl_PointSize=mix(gl_PointSize,(3.+aSeed*9.)*uDpr,uDetail);
    vTint = aTint;
    vAlpha = uOpacity*distanceFade*(.22+.78*smoothstep(.12,.6,screenX))*mix(streamFade,1.,uArrival)*(1.-lens*.92);
  }
`;
const dustFragment = `
  varying vec3 vTint;
  varying float vAlpha, vSpark;
  void main() {
    vec2 q = gl_PointCoord-.5;
    q.y *= mix(1.,.28,vSpark);
    float light = pow(1.-smoothstep(0.,.25,dot(q,q)),2.);
    if(light<.015) discard;
    gl_FragColor = vec4(vTint,light*vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const hazeVertex = `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += sin(p.y*.35+uTime*.09)*.12;
    gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.);
  }
`;
const hazeFragment = `
  uniform float uTime, uOpacity, uShaft;
  uniform vec3 uTint;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
  float noise(vec2 p) {
    vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
  }
  void main() {
    vec2 drift=vec2(uTime*.012,-uTime*.008);
    float cloud=noise(vUv*vec2(4.,3.)+drift)*.7+noise(vUv*vec2(9.,6.)-drift*.5)*.3;
    float edge=pow(max(0.,sin(vUv.x*3.141593)),1.6)*smoothstep(0.,.18,vUv.y)*(1.-smoothstep(.65,1.,vUv.y));
    float beam=exp(-pow((vUv.x-.5)*4.5,2.))*smoothstep(0.,.15,vUv.y)*(1.-smoothstep(.7,1.,vUv.y));
    float alpha=mix(edge,beam,uShaft)*smoothstep(.15,.9,cloud)*uOpacity;
    gl_FragColor=vec4(uTint,alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const random = (i: number) => { const n=Math.sin(i*127.1+311.7)*43758.5453; return n-Math.floor(n); };

/** Real 3D geometry and GPU vertex-animated dust. Haze/shafts approximate scattering;
 * they are depth-tested shader planes, not a volumetric raymarch or fluid simulation. */
export class SpatialAtmosphere extends THREE.Group {
  readonly time = { value: 0 };
  readonly motion = { value: 1 };
  readonly dust: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  readonly facets:THREE.Mesh<THREE.InstancedBufferGeometry,THREE.ShaderMaterial>;
  private readonly haze: THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>[] = [];
  private readonly shafts: THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>[] = [];
  private compact: boolean;
  private reduced = false;

  constructor(compact: boolean) {
    super(); this.name="BLACKCROWN_ATMOSPHERE"; this.compact=compact;
    const positions:number[]=[], seeds:number[]=[], colors:number[]=[];
    for(let i=0;i<SPATIAL_ATMOSPHERE_QUALITY.desktop.particles;i++) {
      const radius=.85+Math.pow(random(i*4),1.4)*2.7,angle=random(i*4+2)*Math.PI*2;
      positions.push(Math.cos(angle)*radius,(random(i*4+1)-.5)*36,Math.sin(angle)*radius);
      const seed=random(i*4+3); seeds.push(seed);
      const color=new THREE.Color(i%37===0?0xb7aed4:i%4===0?0xc4dce0:0x88b4c1);
      color.multiplyScalar(seed>.982?2.8:.55); colors.push(color.r,color.g,color.b);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute("aSeed",new THREE.Float32BufferAttribute(seeds,1));
    geometry.setAttribute("aTint",new THREE.Float32BufferAttribute(colors,3));
    this.dust=new THREE.Points(geometry,new THREE.ShaderMaterial({
      uniforms:{uTime:this.time,uDpr:{value:1},uOpacity:{value:.6},uTravel:{value:0},uAxisHeight:{value:26},uArrival:{value:1},uDeparture:{value:0},uHeadY:{value:9},uDetail:{value:0}},
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
    this.facets=new THREE.Mesh(facetGeometry,new THREE.ShaderMaterial({uniforms:this.dust.material.uniforms,vertexShader:facetVertex,fragmentShader:`varying vec3 vTint,vFacetNormal;varying float vAlpha,vSpark;void main(){float light=.35+.65*max(0.,dot(normalize(vFacetNormal),normalize(vec3(-.4,.8,1.))));gl_FragColor=vec4(vTint*light*(1.+vSpark),vAlpha*.8);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}`,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
    this.facets.name="GPU_METAL_GRAINS";this.facets.frustumCulled=false;this.add(this.facets);
    [-10,-3,3].forEach((z,i)=>{
      const mesh=this.makeHaze(false);mesh.position.set(i-1,-1+i*.6,z);mesh.scale.set(22,15,1);mesh.rotation.z=-.12+i*.1;
      this.haze.push(mesh);this.add(mesh);
    });
    [[2.4,1,-6,-.28],[.2,1,1.6,-.4]].forEach(([x,y,z,tilt])=>{
      const mesh=this.makeHaze(true);mesh.position.set(x,y,z);mesh.scale.set(4,19,1);mesh.rotation.z=tilt;
      this.shafts.push(mesh);this.add(mesh);
    });
    this.setQuality(compact,false);this.setAxisHeight(compact?15.8:26);
  }

  private makeHaze(shaft:boolean) {
    return new THREE.Mesh(new THREE.PlaneGeometry(1,1,1,8),new THREE.ShaderMaterial({
      uniforms:{uTime:this.time,uOpacity:{value:0},uShaft:{value:shaft?1:0},uTint:{value:new THREE.Color(shaft?0x9dd6e1:0x436d7a).multiplyScalar(shaft?1.7:1)}},
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
    const journey=THREE.MathUtils.smoothstep(progress,.08,.85);
    const opacity=(1-detail*.15)*(1-lab*.32);this.visible=opacity>.005;
    this.dust.material.uniforms.uDetail.value=this.reduced?0:detail;
    this.dust.material.uniforms.uDpr.value=dpr;
    this.dust.material.uniforms.uOpacity.value=opacity*(this.compact?.32:.43);
    this.dust.material.uniforms.uTravel.value=journey*2.5;
    this.haze.forEach((mesh,i)=>{
      mesh.material.uniforms.uOpacity.value=opacity*(.11-journey*.055)*(1-i*.12);
      (mesh.material.uniforms.uTint.value as THREE.Color).set(0x436d7a).lerp(accent,.1);
      mesh.position.x=(i-1)*1.1+pointer.x*(.15+i*.2);
    });
    this.shafts.forEach((mesh,i)=>{mesh.material.uniforms.uOpacity.value=opacity*(.15-journey*.05)*(1-i*.2);});
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
