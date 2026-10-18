import * as THREE from "three";

/** A continuous folded body and two woven fins, authored as geometry rather than stacked discs. */
function foldedSurface(segments: number, crossSegments: number, fin: number) {
  const positions: number[] = [], indices: number[] = [];
  for (let row = 0; row <= segments; row++) {
    const y = row / segments * 16 - 8;
    const centerX = Math.sin(y * .62) * .24 + Math.sin(y * 1.7) * .09;
    const centerZ = Math.cos(y * .72) * .23;
    for (let column = 0; column <= crossSegments; column++) {
      const v = column / crossSegments;
      if (fin < 0) {
        const angle = v * Math.PI * 2 + y * .42;
        const radius = .57 + Math.sin(y * 2.15 + Math.sin(angle * 2) * .65) * .19 + Math.sin(angle * 3 + y * .75) * .13;
        positions.push(centerX + Math.cos(angle) * radius, y + Math.cos(angle * 2 + y) * .12, centerZ + Math.sin(angle) * radius * .75);
      } else {
        const side = v * 2 - 1, angle = y * 1.55 + fin * Math.PI;
        const radius = .77 + Math.sin(y * 1.6 + fin) * .19 + side * .35;
        positions.push(centerX + Math.cos(angle) * radius, y + side * (.31 + Math.sin(y * 2) * .14), centerZ + Math.sin(angle) * radius * .78 + Math.sin(side * Math.PI) * .15);
      }
      if (row < segments && column < crossSegments) {
        const a = row * (crossSegments + 1) + column, b = a + crossSegments + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

export class OrganicStructure extends THREE.Group {
  private readonly time = { value: 0 };
  private readonly energy = { value: new THREE.Color(0x87cfdd) };

  constructor(compact: boolean) {
    super();
    const material = new THREE.MeshPhysicalMaterial({ color: 0x90a9b8, metalness: .82, roughness: .27, iridescence: 1, iridescenceIOR: 1.38, iridescenceThicknessRange: [110, 470], clearcoat: .85, clearcoatRoughness: .24, side: THREE.DoubleSide });
    material.onBeforeCompile = shader => {
      shader.uniforms.uOrganicTime = this.time; shader.uniforms.uOrganicEnergy = this.energy;
      shader.vertexShader = "uniform float uOrganicTime; varying vec3 vOrganicPosition;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
        #include <begin_vertex>
        transformed.x += sin(position.y * .72 + uOrganicTime * .27) * .12;
        transformed.z += cos(position.y * .61 - uOrganicTime * .19) * .1;
        vOrganicPosition = transformed;
      `);
      shader.fragmentShader = "uniform float uOrganicTime; uniform vec3 uOrganicEnergy; varying vec3 vOrganicPosition;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", `
        #include <color_fragment>
        float flow = sin(vOrganicPosition.y * 2.8 + sin(vOrganicPosition.x * 7. + vOrganicPosition.z * 5.) * 1.3 + uOrganicTime * .12);
        float etch = sin(vOrganicPosition.y * 15. + sin(vOrganicPosition.z * 19. + vOrganicPosition.x * 11.) * .8);
        diffuseColor.rgb *= mix(vec3(.27,.43,.48), vec3(1.15,1.05,1.2), smoothstep(-.8,.9,flow));
        diffuseColor.rgb *= .88 + etch * .12;
      `);
      shader.fragmentShader = shader.fragmentShader.replace("#include <emissivemap_fragment>", `
        #include <emissivemap_fragment>
        float channel = pow(max(0., 1. - abs(sin(vOrganicPosition.y * 4.1 + vOrganicPosition.x * 3.4 + sin(vOrganicPosition.z * 6.) + uOrganicTime * .16))), 18.);
        totalEmissiveRadiance += uOrganicEnergy * channel * .38;
      `);
    };
    material.customProgramCacheKey = () => "blackcrown-organic-v1";
    const rows = compact ? 96 : 168;
    this.add(new THREE.Mesh(foldedSurface(rows, compact ? 12 : 22, -1), material));
    for (let fin = 0; fin < 2; fin++) this.add(new THREE.Mesh(foldedSurface(rows, compact ? 5 : 8, fin), material));
  }

  update(time: number, accent: THREE.Color) { this.time.value = time; this.energy.value.copy(accent); }
}
