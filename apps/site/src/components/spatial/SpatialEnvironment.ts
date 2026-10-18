import * as THREE from "three";
import { CatmullRomCurve3 } from "three/src/extras/curves/CatmullRomCurve3.js";
import { TubeGeometry } from "three/src/geometries/TubeGeometry.js";

const waterVertex = `
  uniform float uTime;
  varying vec3 vWater;
  void main() {
    vec3 p = position;
    p.z += sin(p.x * 1.15 + uTime * .33) * .11 + cos(p.y * 1.4 - uTime * .26) * .08;
    vWater = p;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.);
  }
`;
const waterFragment = `
  uniform float uTime;
  uniform vec3 uAccent;
  varying vec3 vWater;
  void main() {
    vec2 p = vWater.xy;
    float ripple = sin(p.x * 3.8 + sin(p.y * 1.65 + uTime * .24) * 1.6 + uTime * .28);
    float grain = sin(p.y * 23. + sin(p.x * 7. + uTime * .3) * 2.1);
    float narrow = exp(-abs(p.x - sin(p.y * .45 + uTime * .13) * .4) * 1.3);
    float bank = exp(-abs(p.x + 3.5) * .6);
    float crest = pow(max(0.,ripple),12.) * (.35 + grain * .18);
    vec3 color = vec3(.012,.026,.036) + uAccent * narrow * (.055 + crest * .22) + vec3(.06,.035,.12) * bank * (.3 + crest);
    color += vec3(.12,.17,.19) * pow(max(0.,grain),20.) * narrow * .25;
    float edge = 1. - smoothstep(10.,18.,length(p));
    gl_FragColor = vec4(color, edge * .92);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const mistVertex = `varying vec2 vMist; void main(){ vMist=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;
const mistFragment = `
  uniform float uTime;
  uniform vec3 uAccent;
  varying vec2 vMist;
  void main() {
    vec2 p=(vMist-.5)*2.;
    float cloud=exp(-dot(p*vec2(.85,1.25),p*vec2(.85,1.25))*3.2);
    float strata=.65+.18*sin(p.y*5.+sin(p.x*4.+uTime*.06)*1.3)+.12*cos(p.x*8.-uTime*.08);
    vec3 tint=mix(vec3(.14,.08,.25),uAccent,smoothstep(-.7,.6,p.x));
    float edge=1.-smoothstep(.7,1.,max(abs(p.x),abs(p.y)));
    gl_FragColor=vec4(tint,cloud*strata*edge*.18);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/** A bounded chamber: parallax ribs, layered mist and a rippled light field, with no remote assets. */
export class SpatialEnvironment extends THREE.Group {
  private readonly time = { value: 0 };
  private readonly accent = { value: new THREE.Color(0x8bbdca) };
  readonly water: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private readonly ribs = new THREE.Group();
  private readonly haze = new THREE.Group();

  constructor(compact: boolean) {
    super();
    const segments = compact ? 28 : 48;
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(36,36,segments,segments), new THREE.ShaderMaterial({ uniforms:{uTime:this.time,uAccent:this.accent}, vertexShader:waterVertex,fragmentShader:waterFragment,transparent:true,depthWrite:false,side:THREE.DoubleSide }));
    this.water.rotation.x=-Math.PI/2; this.water.position.set(0,-4.4,-2);
    this.add(this.water,this.ribs,this.haze);
    const metal = new THREE.MeshStandardMaterial({ color:0x233640,metalness:.9,roughness:.35 });
    const ribCount = compact ? 3 : 5;
    for(let index=0;index<ribCount;index++) {
      const angle=index/(ribCount-1)*Math.PI+Math.PI;
      const radius=5.8;
      const path=new CatmullRomCurve3([
        new THREE.Vector3(Math.cos(angle)*radius,-4.4,Math.sin(angle)*radius-3),
        new THREE.Vector3(Math.cos(angle)*(radius+.65),0,Math.sin(angle)*(radius+.65)-3),
        new THREE.Vector3(Math.cos(angle)*3,5.4,Math.sin(angle)*3-3),
        new THREE.Vector3(Math.cos(angle)*1.1,8.5,Math.sin(angle)*1.1-3),
      ]);
      this.ribs.add(new THREE.Mesh(new TubeGeometry(path,compact?32:48,.055,5,false),metal));
    }
    const ring=new THREE.Mesh(new THREE.TorusGeometry(5.8,.045,5,compact?56:90),metal);
    ring.rotation.x=Math.PI/2; ring.position.set(0,-4.25,-3); this.ribs.add(ring);
    const mistMaterial=new THREE.ShaderMaterial({uniforms:{uTime:this.time,uAccent:this.accent},vertexShader:mistVertex,fragmentShader:mistFragment,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
    const mistGeometry=new THREE.PlaneGeometry(25,20);
    for(let layer=0;layer<(compact?2:3);layer++) {
      const mist=new THREE.Mesh(mistGeometry,mistMaterial);
      mist.position.set(layer%2===0?-3:4,layer*.6,-7-layer*4);
      mist.rotation.y=(layer-1)*.2; this.haze.add(mist);
    }
  }

  update(time:number,accent:THREE.Color,journey:number,detail:number) {
    this.time.value=time; this.accent.value.copy(accent);
    this.haze.rotation.z=Math.sin(time*.035)*.035;
    this.ribs.rotation.y=Math.sin(time*.025)*.045;
    this.water.position.y=-4.4+detail*.8;
    this.water.rotation.z=Math.sin(time*.03)*.015;
    this.ribs.visible=journey<.94;
  }
}
