// GLSL ES 3.00, source-owned; the build never changes shader code.
export default `#version 300 es
 precision highp float;
 in vec3 vN,vC,vP,vLocal;in vec4 vS;flat in vec4 vFX;out vec4 outColor;
 uniform highp sampler2D uShadow;uniform vec3 uSun,uEye;
 uniform float uDay,uAlpha,uShadowEnabled,uShadowTexel,uTime,uQuality,uMotion;
 float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1)),f.x),f.y);}
 float compareDepth(vec3 s,vec2 offset,float bias){return s.z-bias>texture(uShadow,s.xy+offset*uShadowTexel).r ? 0.30 : 1.0;}
 float shadow(vec3 n){
  if(uShadowEnabled<.5)return 1.;vec3 s=vS.xyz/vS.w*.5+.5;
  if(any(lessThan(s,vec3(0)))||any(greaterThan(s,vec3(1))))return 1.;
  float bias=max(.0010*(1.-max(dot(n,uSun),0.)),.0005);
  if(uQuality<.5)return compareDepth(s,vec2(0),bias);
  if(uQuality<1.5)return (compareDepth(s,vec2(-.65,-.65),bias)+compareDepth(s,vec2(.65,-.65),bias)+compareDepth(s,vec2(-.65,.65),bias)+compareDepth(s,vec2(.65,.65),bias))*.25;
  float sum=0.;for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)sum+=compareDepth(s,vec2(float(x),float(y))*1.25,bias);return sum/9.;
 }
 vec3 tonemap(vec3 c){c=(c*(2.51*c+.03))/(c*(2.43*c+.59)+.14);return pow(clamp(c,0.,1.),vec3(1./2.2));}
 void main(){
  vec3 n=normalize(vN),viewDir=normalize(uEye-vP);float material=vFX.x;
  vec3 base=vC;float shine=0.,alpha=uAlpha;
  float sh=shadow(n);float daylight=clamp(uDay,0.,1.);float clock=uTime*uMotion;
  if(material>.5&&material<1.5){
   // Analytic wave normal, procedural caustics and sky Fresnel (not SSR).
   vec2 w=vP.xz;float radius=vFX.y>.5?abs(vLocal.x-.18*sin(vLocal.z*3.)):length(vLocal.xz);
   n=normalize(vec3(-.13*cos(w.x*2.7+clock*.9)-.055*cos((w.x+w.y)*5.-clock*.8),1.,-.13*cos(w.y*4.2-clock*1.1)-.055*cos((w.x+w.y)*5.-clock*.8)));
   float fresnel=.05+.80*pow(1.-max(dot(n,viewDir),0.),3.);
   vec3 deep=vec3(.045,.235,.255),shallow=vec3(.23,.53,.42);
   base=mix(deep,shallow,smoothstep(.30,.95,radius));
   float ripple=.5+.5*sin(w.x*4.1+sin(w.y*3.4+clock*.65)*1.8-clock*.7);
   float caustic=pow(ripple,8.)*(.5+.5*sin(w.y*6.1-w.x*2.7+clock*.8));
   base+=vec3(.075,.105,.065)*caustic;
   vec3 sky=mix(vec3(.23,.39,.49),vec3(.61,.77,.75),clamp(n.y,0.,1.));
   base=mix(base,sky,fresnel);
   float shore=smoothstep(.928,.991,radius)*(1.-smoothstep(1.015,1.05,radius));
   base=mix(base,vec3(.72,.83,.62),shore*(.44+.16*sin(radius*95.-clock*1.8)));
   float sunGlint=pow(max(dot(n,normalize(uSun+viewDir)),0.),100.);
   shine=(sunGlint*.92+caustic*.055)*daylight;
  } else if(material>2.5&&material<3.5){
   float grain=noise2(vP.xz*22.);base*=.86+grain*.23;
   float wet=clamp(vFX.y,0.,1.);base=mix(base,base*vec3(.40,.48,.49),wet);
   shine=wet*pow(max(dot(n,normalize(uSun+viewDir)),0.),32.)*.23*daylight;
   // Fine droplets catch the sun on freshly watered ridges.
   shine+=wet*smoothstep(.83,.96,grain)*pow(max(dot(n,normalize(uSun+viewDir)),0.),8.)*.025;
  } else if(material>3.5&&material<4.5){
   float patches=noise2(vP.xz*.52)*.65+noise2(vP.xz*2.3)*.35;
   base*=mix(.78,1.13,patches);base=mix(base,base*vec3(1.04,1.08,.86),noise2(vP.xz*17.)*.13);
  } else if(material>1.5&&material<2.5){base*=.87+.13*sin(vP.y*2.+vP.x*.5);float rim=pow(1.-max(dot(n,viewDir),0.),3.);shine+=rim*.018*daylight;}
  float lambert=max(dot(n,uSun),0.);
  vec3 hemi=mix(vec3(.24,.27,.17),vec3(.53,.64,.73),clamp(n.y*.5+.5,0.,1.));
  float contact=mix(.78,1.,smoothstep(-.55,.45,vLocal.y));
  vec3 light=hemi*.56*contact+vec3(1.,.86,.64)*lambert*sh*1.02;
  if(material>1.5&&material<2.5)light+=vec3(.24,.32,.12)*pow(max(dot(-uSun,viewDir),0.),2.)*.32;
  light=mix(vec3(.13,.19,.30)+light*.22,light,daylight);
  vec3 c=base*light+vec3(1.,.92,.76)*shine*sh;
  if(material>4.5&&material<5.5)c+=vec3(1.2,.66,.18)*(1.-daylight)*1.7;
  if(material>5.5){c=base*(.9+daylight*.35)+vec3(.14,.24,.28);}
  float fog=smoothstep(26.,75.,length(vP.xz));c=mix(c,vec3(.70,.76,.62),fog*.65);
  outColor=vec4(tonemap(c),alpha);
 }`;
