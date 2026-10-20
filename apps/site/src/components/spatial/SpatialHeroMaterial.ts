import { MeshStandardMaterial, type Mesh, type Object3D } from "three";

/** Original PBR maps, satin bone contours and rough, genuinely recessed orbits. */
export function finishHeroMaterials(root:Object3D) {
  const visited=new Set<MeshStandardMaterial>();
  root.traverse(object=>{
    const mesh=object as Mesh;if(!mesh.isMesh)return;
    for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]) {
      if(!(material instanceof MeshStandardMaterial)||visited.has(material))continue;
      visited.add(material);
      const skull=material.name.includes("SKULL"),spine=material.name.includes("SPINE");
      material.envMapIntensity=skull?1.1:spine?1.15:1.35;
      material.color.multiplyScalar(skull?.62:spine?.68:.83);
      material.roughness*=skull?1.18:spine?.98:.92;
      material.onBeforeCompile=shader=>{
        shader.fragmentShader=shader.fragmentShader.replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
          roughnessFactor=clamp(roughnessFactor,${skull?".38,.76":spine?".29,.58":".19,.46"});
          #if defined(USE_COLOR) || defined(USE_COLOR_ALPHA)
            roughnessFactor=mix(roughnessFactor,.88,clamp((1.-vColor.r)*1.2,0.,1.));
          #endif`);
      };
      material.customProgramCacheKey=()=>"blackcrown-sculpt-satin-v3-"+(skull?"skull":spine?"spine":"crown");
      material.needsUpdate=true;
    }
  });
}
