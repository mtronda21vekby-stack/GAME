// GLSL ES 3.00, source-owned; the build never changes shader code.
export default `#version 300 es
 precision highp float;in vec2 vUV;out vec4 outColor;
 uniform highp sampler2D uScene;uniform vec2 uPixel;
 vec3 bright(vec2 uv){vec4 c=texture(uScene,uv);float l=dot(c.rgb,vec3(.2126,.7152,.0722));return c.rgb*smoothstep(.70,.98,l)*c.a;}
 vec3 grade(vec3 c){
  float l=dot(c,vec3(.2126,.7152,.0722));
  c=mix(vec3(l),c,1.055);
  c=mix(c,c*vec3(1.018,1.005,.978),smoothstep(.52,.92,l));
  c=mix(c,c*vec3(.965,.99,1.025),1.-smoothstep(.12,.48,l));
  return clamp(c,0.,1.2);
 }
 void main(){vec4 c=texture(uScene,vUV);
  // Small edge-aware resolve keeps the offscreen high-quality pass from adding stair steps.
  vec4 north=texture(uScene,vUV+vec2(0.,uPixel.y)),south=texture(uScene,vUV-vec2(0.,uPixel.y));
  vec4 east=texture(uScene,vUV+vec2(uPixel.x,0.)),west=texture(uScene,vUV-vec2(uPixel.x,0.));
  vec3 lum=vec3(.2126,.7152,.0722);float l=dot(c.rgb,lum);
  float contrast=max(max(abs(dot(north.rgb,lum)-l),abs(dot(south.rgb,lum)-l)),max(abs(dot(east.rgb,lum)-l),abs(dot(west.rgb,lum)-l)));
  c=mix(c,(c*4.+north+south+east+west)/8.,smoothstep(.10,.28,contrast)*.52);
  vec3 b=vec3(0.);
  b+=bright(vUV+uPixel*vec2(3.,0.));b+=bright(vUV-uPixel*vec2(3.,0.));b+=bright(vUV+uPixel*vec2(0.,3.));b+=bright(vUV-uPixel*vec2(0.,3.));
  b+=bright(vUV+uPixel*vec2(5.,5.));b+=bright(vUV+uPixel*vec2(-5.,5.));b+=bright(vUV+uPixel*vec2(5.,-5.));b+=bright(vUV-uPixel*vec2(5.,5.));
  c.rgb=grade(c.rgb+b*.015*c.a);
  float vignette=1.-smoothstep(.34,.82,length(vUV-.5))*.075;c.rgb*=vignette;
  // Faint filmic dither prevents smooth sky gradients from banding on mobile panels.
  float d=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;c.rgb+=d/510.;
  outColor=c;
 }`;
