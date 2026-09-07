// GLSL ES 3.00 source; compiled by the renderer, never patched by the build.
export default `#version 300 es
 precision highp float;
 layout(location=0) in vec3 aP;layout(location=1) in vec3 aN;
 layout(location=2) in mat4 aM;layout(location=6) in vec3 aC;layout(location=7) in vec4 aFX;
 uniform mat4 uVP,uLight;uniform float uTime,uMotion;
 out vec3 vN,vC,vP,vLocal;out vec4 vS;flat out vec4 vFX;
 void main(){
  vec4 world=aM*vec4(aP,1.);mat3 basis=mat3(aM);
  vec3 n=normalize(mat3(cross(basis[1],basis[2]),cross(basis[2],basis[0]),cross(basis[0],basis[1]))*aN);
  if(aFX.x>1.5&&aFX.x<2.5){
   float wind=sin(world.x*1.43+world.z*.83+uTime*1.35+aFX.w)*.65+sin(world.z*2.4-uTime*2.2)*.35;
   float bend=clamp(aP.y+.7,0.,1.4)*aFX.z*.08*uMotion;
   world.x+=wind*bend;world.z+=wind*bend*.35;n=normalize(n+vec3(wind*bend*.7,0.,wind*bend*.3));
  }
  if(aFX.x>.5&&aFX.x<1.5){
   float edge=aFX.y>.5?abs(aP.x-.18*sin(aP.z*3.)):length(aP.xz);float bank=1.-smoothstep(.75,1.,edge);
   world.y+=(sin(world.x*2.7+uTime*.9)*.025+sin(world.z*4.2-uTime*1.1)*.018)*bank*uMotion;
  }
  vP=world.xyz;vLocal=aP;vN=n;vC=aC;vFX=aFX;vS=uLight*world;gl_Position=uVP*world;
 }`;
