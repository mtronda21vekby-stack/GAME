// GLSL ES 3.00 source; compiled by the renderer, never patched by the build.
export default `#version 300 es
 precision highp float;out vec2 vUV;
 void main(){vUV=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(vUV*2.-1.,0.,1.);}`;
