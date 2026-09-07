import * as T from '../../vendor/three.js';
export function createOcean(scene,map){
 const uniforms={time:{value:0},storm:{value:0},isles:{value:Array.from({length:8},(_,i)=>{const o=map.islands[i];return new T.Vector4(o?.x??100,o?.z??100,o?.r??0,o?.rz??0);})}};
 const mat=new T.MeshStandardMaterial({color:'#388d92',roughness:.38,metalness:.10});
 mat.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,{uOceanTime:uniforms.time,uStorm:uniforms.storm,uIsles:uniforms.isles});
  shader.vertexShader=`uniform float uOceanTime; uniform float uStorm; varying vec3 vOcean;\n`+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    float wave=sin(position.x*.42+uOceanTime*.85)*.095+cos(position.y*.51+uOceanTime*.67)*.06;
    transformed.z+=wave*(1.+uStorm*1.25);
    vOcean=vec3(position.x,transformed.z,-position.y);
  `);
  shader.fragmentShader=`uniform float uOceanTime;uniform float uStorm;uniform vec4 uIsles[8];varying vec3 vOcean;\n`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec2 p=vOcean.xz;
    float coast=30.;
    for(int i=0;i<8;i++){vec4 o=uIsles[i];if(o.z<=0.||o.w<=0.)continue;float d=(length((p-o.xy)/max(o.zw,vec2(.1)))-1.)*min(o.z,o.w);coast=min(coast,d);}
    float streak=sin(p.x*.8+sin(p.y*.66+uOceanTime*.45)*2.4-uOceanTime*.4);
    float caustic=pow(max(0.,streak),10.)*(.5+.5*sin(p.y*1.8+p.x*.54+uOceanTime*.6));
    vec3 deep=vec3(.035,.19,.22),shallow=vec3(.12,.46,.41);
    diffuseColor.rgb=mix(shallow,deep,smoothstep(0.,5.5,coast));
    diffuseColor.rgb+=vec3(.035,.08,.065)*caustic;
    float foam=(1.-smoothstep(.1,.85,coast))*(.52+.45*sin(coast*14.-uOceanTime*1.9+sin(p.x*2.)));
    diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.72,.83,.73),clamp(foam,0.,.65));
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.57,.74,.87),uStorm*.6);
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    vec3 nW=normalize(vec3(-.046*cos(vOcean.x*.42+uOceanTime*.85),1.,.034*sin(vOcean.z*.51-uOceanTime*.67)));
    normal=normalize(mat3(viewMatrix)*nW);
  `);
 };
 const mesh=new T.Mesh(new T.PlaneGeometry(160,160,140,140),mat);mesh.rotation.x=-Math.PI/2;mesh.position.y=.015;mesh.receiveShadow=true;scene.add(mesh);
 return {update(t,storm){uniforms.time.value=t;uniforms.storm.value=storm;},dispose(){scene.remove(mesh);mesh.geometry.dispose();mat.dispose();}};
}
