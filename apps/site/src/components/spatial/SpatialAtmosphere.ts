import * as THREE from "three";

export const SPATIAL_ATMOSPHERE_QUALITY = {
  desktop: { particles: 2800, hazeLayers: 3, shafts: 2, bloom: true, dpr: 1.5 },
  mobile: { particles: 640, hazeLayers: 2, shafts: 1, bloom: false, dpr: 1.25 },
} as const;

const dustVertex = `
  uniform float uTime, uDpr, uOpacity, uTravel, uAxisHeight;
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
    vec4 mv = modelViewMatrix*vec4(p,1.);
    gl_Position = projectionMatrix*mv;
    float screenX = gl_Position.x/gl_Position.w*.5+.5;
    float distanceFade = smoothstep(2.,7.,-mv.z)*(1.-smoothstep(25.,42.,-mv.z));
    vSpark = step(.982,aSeed);
    gl_PointSize = clamp((12.+aSeed*35.+vSpark*22.)*uDpr/max(1.,-mv.z),1.,10.*uDpr);
    vTint = aTint;
    vAlpha = uOpacity*distanceFade*(.22+.78*smoothstep(.12,.6,screenX));
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
  private readonly far = new THREE.Group();
  private readonly near = new THREE.Group();
  private readonly haze: THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>[] = [];
  private readonly shafts: THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>[] = [];
  private readonly floor:THREE.Mesh;
  private readonly arch:THREE.Mesh;
  private compact: boolean;
  private reduced = false;

  constructor(compact: boolean) {
    super(); this.name="BLACKCROWN_ATMOSPHERE"; this.compact=compact;
    const positions:number[]=[], seeds:number[]=[], colors:number[]=[];
    for(let i=0;i<SPATIAL_ATMOSPHERE_QUALITY.desktop.particles;i++) {
      const radius=1.4+random(i*4)*4.4,angle=random(i*4+2)*Math.PI*2;
      positions.push(Math.cos(angle)*radius,(random(i*4+1)-.5)*36,Math.sin(angle)*radius);
      const seed=random(i*4+3); seeds.push(seed);
      const color=new THREE.Color(i%37===0?0xd2b79d:i%4===0?0xc4dce0:0x88b4c1);
      color.multiplyScalar(seed>.982?2.8:.55); colors.push(color.r,color.g,color.b);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute("aSeed",new THREE.Float32BufferAttribute(seeds,1));
    geometry.setAttribute("aTint",new THREE.Float32BufferAttribute(colors,3));
    this.dust=new THREE.Points(geometry,new THREE.ShaderMaterial({
      uniforms:{uTime:this.time,uDpr:{value:1},uOpacity:{value:.6},uTravel:{value:0},uAxisHeight:{value:26}},
      vertexShader:dustVertex,fragmentShader:dustFragment,transparent:true,
      blending:THREE.AdditiveBlending,depthWrite:false,depthTest:true,
    }));
    this.dust.name="GPU_DUST_VOLUME"; this.dust.frustumCulled=false; this.add(this.dust,this.far,this.near);
    const metal=new THREE.MeshStandardMaterial({color:0x1d3038,metalness:.85,roughness:.4});
    const arch=this.arch=new THREE.Mesh(new THREE.TorusGeometry(1,.012,6,72,Math.PI*1.45),metal);
    arch.position.set(-1,-.2,-12); arch.scale.set(9,6.6,9); arch.rotation.set(.18,.15,.26); this.far.add(arch);
    const floor=this.floor=new THREE.Mesh(new THREE.PlaneGeometry(32,32),new THREE.MeshStandardMaterial({color:0x0c171e,metalness:.7,roughness:.56}));
    floor.rotation.x=-Math.PI/2; floor.position.set(0,-4.8,-6); this.far.add(floor);
    const finGeometry=new THREE.BoxGeometry(.13,14,.5);
    [[7.8,.7,3.4,-.16],[-8.8,-.4,4.2,.12]].forEach(([x,y,z,tilt])=>{
      const fin=new THREE.Mesh(finGeometry,metal);fin.position.set(x,y,z);fin.rotation.set(.05,.22,tilt);this.near.add(fin);
    });
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
    this.haze.forEach((mesh,i)=>{mesh.visible=i<quality.hazeLayers;});
    this.shafts.forEach((mesh,i)=>{mesh.visible=i<quality.shafts;});
    this.near.visible=!compact;this.motion.value=reduced?0:1;
  }

  setAxisHeight(height:number) {
    this.dust.material.uniforms.uAxisHeight.value=height;
    this.floor.position.y=-height*.5-1.2;this.arch.position.y=height*.29;
    this.haze.forEach((mesh,i)=>{mesh.scale.y=height*1.5;mesh.position.y=height*(.22-i*.18);});
    this.shafts.forEach(mesh=>{mesh.scale.y=height*1.7;mesh.position.y=0;});
    this.near.scale.y=height/14;
  }

  update(time:number,progress:number,detail:number,pointer:{x:number;y:number},anchor:THREE.Vector3,dpr:number,accent:THREE.Color) {
    this.time.value=this.reduced?0:time;this.position.copy(anchor);
    const journey=THREE.MathUtils.smoothstep(progress,.08,.85);
    const opacity=1-detail*.95;this.visible=opacity>.005;
    this.far.rotation.y=pointer.x*.08+journey*.12;
    this.near.position.x=pointer.x*.8;this.near.rotation.z=pointer.y*.035-journey*.07;
    this.dust.material.uniforms.uDpr.value=dpr;
    this.dust.material.uniforms.uOpacity.value=opacity*(this.compact?.52:.68);
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
