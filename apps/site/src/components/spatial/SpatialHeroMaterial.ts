import { MeshStandardMaterial, type Mesh, type Object3D } from "three";

/** Keep the user's PBR maps; add a restrained quiet graphite finish and a subtle roughness variation. */
export function animateHeroMaterials(root:Object3D,time:{value:number},motion:{value:number}) {
  const visited=new Set<MeshStandardMaterial>();
  root.traverse(object=>{
    const mesh=object as Mesh;if(!mesh.isMesh)return;
    for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]) {
      if(!(material instanceof MeshStandardMaterial)||visited.has(material))continue;
      visited.add(material);material.envMapIntensity=.82;
      material.color.multiplyScalar(material.name.includes("SKULL")?.56:material.name.includes("SPINE")?.75:.88);
      material.roughness*=.86;
      material.onBeforeCompile=shader=>{
        shader.uniforms.uBcTime=time;shader.uniforms.uBcMotion=motion;
        shader.vertexShader=shader.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vBcLocal;")
          .replace("#include <begin_vertex>","#include <begin_vertex>\nvBcLocal=position;");
        shader.fragmentShader=shader.fragmentShader.replace("#include <common>","#include <common>\nvarying vec3 vBcLocal; uniform float uBcTime,uBcMotion;")
          .replace("#include <roughnessmap_fragment>","#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+sin(vBcLocal.y*90.-uBcTime*.32)*.015*uBcMotion,.04,1.);");
      };
      material.customProgramCacheKey=()=>"blackcrown-graphite-v2";
      material.needsUpdate=true;
    }
  });
}
