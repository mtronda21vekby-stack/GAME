type FixtureOptions = {
  duplicateNode?: boolean;
  missingSegment?: boolean;
  materialName?: string;
  materialCount?: number;
  triangleAccessorCount?: number;
  primitiveCount?: number;
  externalUri?: string;
};

function pad4(value: number) { return (value + 3) & ~3; }

export function createTestCrownGlb(options: FixtureOptions = {}) {
  const positions = new Float32Array([
    -1, 0, -0.4, 1, 0, -0.4, 1, 2, -0.4, -1, 2, -0.4,
    -1, 0, 0.4, 1, 0, 0.4, 1, 2, 0.4, -1, 2, 0.4,
  ]);
  const indices = new Uint16Array([
    0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0,
  ]);
  const binaryLength = pad4(positions.byteLength + indices.byteLength);
  const binary = new Uint8Array(binaryLength);
  binary.set(new Uint8Array(positions.buffer), 0);
  binary.set(new Uint8Array(indices.buffer), positions.byteLength);

  const materials = Array.from({ length: options.materialCount ?? 1 }, (_, index) => ({
    name: options.materialName ?? (index ? "BC_MAT_INNER_GUNMETAL" : "BC_MAT_SHELL_TITANIUM"),
    pbrMetallicRoughness: { baseColorFactor: [0.08, 0.1, 0.12, 1], metallicFactor: 0.7, roughnessFactor: 0.38 },
  }));
  const primitive = { attributes: { POSITION: 0 }, indices: 1, material: 0 };
  const nodes: Array<Record<string, unknown>> = [
    { name: "BC_CROWN_ROOT", children: [1, 2, 3, 4, 5, 6, 7] },
    { name: "BC_SHELL_ROOT", children: [] as number[] },
    { name: "BC_CORE_ROOT" },
    { name: "BC_PORTAL_ROOT" },
    { name: "BC_RING_INNER" },
    { name: "BC_RING_MIDDLE" },
    { name: "BC_RING_OUTER" },
    { name: "BC_ENERGY_CYAN" },
  ];
  const shellChildren = nodes[1].children as number[];
  const segmentCount = options.missingSegment ? 8 : 9;
  for (let index = 0; index < segmentCount; index += 1) {
    shellChildren.push(nodes.length);
    nodes.push({ name: `BC_SEG_${String(index).padStart(2, "0")}`, mesh: 0, translation: [(index - 4) * 0.28, 0, 0] });
  }
  for (let index = 0; index < 9; index += 1) {
    shellChildren.push(nodes.length);
    nodes.push({ name: `BC_SPIRE_${String(index).padStart(2, "0")}`, mesh: 0, scale: [0.18, 0.3 + (index === 4 ? 0.16 : 0), 0.35], translation: [(index - 4) * 0.28, 0.55, 0] });
  }
  if (options.duplicateNode) {
    (nodes[0].children as number[]).push(nodes.length);
    nodes.push({ name: "BC_CORE_ROOT" });
  }

  const json = {
    asset: { version: "2.0", generator: "BLACKCROWN TEST FIXTURE" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes,
    buffers: [{ byteLength: binaryLength, ...(options.externalUri ? { uri: options.externalUri } : {}) }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positions.byteLength },
      { buffer: 0, byteOffset: positions.byteLength, byteLength: indices.byteLength },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: 8, type: "VEC3", min: [-1, 0, -0.4], max: [1, 2, 0.4] },
      { bufferView: 1, componentType: 5123, count: options.triangleAccessorCount ?? indices.length, type: "SCALAR" },
    ],
    materials,
    meshes: [{ primitives: Array.from({ length: options.primitiveCount ?? 1 }, () => ({ ...primitive })) }],
  };
  const encoded = new TextEncoder().encode(JSON.stringify(json));
  const jsonLength = pad4(encoded.byteLength);
  const total = 12 + 8 + jsonLength + 8 + binaryLength;
  const glb = new Uint8Array(total);
  const view = new DataView(glb.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  view.setUint32(12, jsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  glb.fill(0x20, 20, 20 + jsonLength);
  glb.set(encoded, 20);
  const binaryHeader = 20 + jsonLength;
  view.setUint32(binaryHeader, binaryLength, true);
  view.setUint32(binaryHeader + 4, 0x004e4942, true);
  glb.set(binary, binaryHeader + 8);
  return glb;
}
