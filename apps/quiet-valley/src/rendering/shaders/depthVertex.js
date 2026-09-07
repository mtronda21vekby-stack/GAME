// GLSL ES 3.00 source; compiled by the renderer, never patched by the build.
export default `#version 300 es
 precision highp float;
 layout(location=0) in vec3 aP;layout(location=2) in mat4 aM;
 uniform mat4 uVP;
 void main(){gl_Position=uVP*aM*vec4(aP,1.);}`;
