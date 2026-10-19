import { MeshStandardMaterial, type Mesh, type Object3D } from "three";

/** Keep the user's PBR maps; add a restrained GPU roughness/highlight sweep. */
export function animateHeroMaterials(root:Object3D,time:{value:number},motion:{value:number}) {
  const visited=new Set<MeshStandardMaterial>();
  root.traverse(object=>{
    const mesh=object as Mesh;if(!mesh.isMesh)return;
    for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]) {
      if(!(material instanceof MeshStandardMaterial)||visited.has(material))continue;
      visited.add(material);material.envMapIntensity=.95;
      material.onBeforeCompile=shader=>{
        shader.uniforms.uBcTime=time;shader.uniforms.uBcMotion=motion;
        shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vBcLocal;")
          .replace("#include <begin_vertex>","#include <begin_vertex>\nvBcLocal=position;");
        shader.fragmentShader=shader.fragmentShader.replace("#include <common>","#include <common>\nvarying vec3 vBcLocal; uniform float uBcTime,uBcMotion;")
          .replace("#include <roughnessmap_fragment>","#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+sin(vBcLocal.y*90.-uBcTime*.32)*.035*uBcMotion,.04,1.);")
          .replace("#include <emissivemap_fragment>","#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(.008,.021,.027)*pow(.5+.5*sin(vBcLocal.y*90.-uBcTime*.32),8.)*uBcMotion;");
      };
      material.customProgramCacheKey=()=>"blackcrown-pbr-sweep-v1";
      material.needsUpdate=true;
    }
  });
}
