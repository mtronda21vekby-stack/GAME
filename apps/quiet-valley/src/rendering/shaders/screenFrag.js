// GLSL ES 3.00, source-owned; the build never changes shader code.
export default `#version 300 es
 precision highp float;in vec2 vUV;out vec4 outColor;
 uniform highp sampler2D uScene;uniform vec2 uPixel;
 vec3 bright(vec2 uv){vec4 c=texture(uScene,uv);float l=dot(c.rgb,vec3(.2126,.7152,.0722));return c.rgb*smoothstep(.72,.98,l)*c.a;}
 void main(){vec4 c=texture(uScene,vUV);
  // Small edge-aware resolve keeps the offscreen high-quality pass from adding stair steps.
  vec4 north=texture(uScene,vUV+vec2(0.,uPixel.y)),south=texture(uScene,vUV-vec2(0.,uPixel.y));
  vec4 east=texture(uScene,vUV+vec2(uPixel.x,0.)),west=texture(uScene,vUV-vec2(uPixel.x,0.));
  vec3 lum=vec3(.2126,.7152,.0722);float l=dot(c.rgb,lum);
  float contrast=max(max(abs(dot(north.rgb,lum)-l),abs(dot(south.rgb,lum)-l)),max(abs(dot(east.rgb,lum)-l),abs(dot(west.rgb,lum)-l)));
  c=mix(c,(c*4.+north+south+east+west)/8.,smoothstep(.10,.28,contrast)*.60);
  vec3 b=vec3(0.);
  b+=bright(vUV+uPixel*vec2(3.,0.));b+=bright(vUV-uPixel*vec2(3.,0.));b+=bright(vUV+uPixel*vec2(0.,3.));b+=bright(vUV-uPixel*vec2(0.,3.));
  b+=bright(vUV+uPixel*vec2(5.,5.));b+=bright(vUV+uPixel*vec2(-5.,5.));b+=bright(vUV+uPixel*vec2(5.,-5.));b+=bright(vUV-uPixel*vec2(5.,5.));
  c.rgb+=b*.0125*c.a;float vignette=1.-smoothstep(.38,.82,length(vUV-.5))*.065;c.rgb*=vignette;outColor=c;
 }`;
