// GLSL ES 3.00, source-owned; the build never changes shader code.
// Stylized countryside material stack: soft PCF shadows, animated cloud shade,
// foliage translucency, wet soil, tiled roofs, wood grain, plaster, emissive windows.
export default `#version 300 es
 precision highp float;
 in vec3 vN,vC,vP,vLocal;in vec4 vS;flat in vec4 vFX;out vec4 outColor;
 uniform highp sampler2D uShadow;uniform vec3 uSun,uEye;
 uniform float uDay,uAlpha,uShadowEnabled,uShadowTexel,uTime,uQuality,uMotion,uRain;
 float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1)),f.x),f.y);}
 float compareDepth(vec3 s,vec2 offset,float bias){return s.z-bias>texture(uShadow,s.xy+offset*uShadowTexel).r ? 0.28 : 1.0;}
 float shadow(vec3 n){
  if(uShadowEnabled<.5)return 1.;vec3 s=vS.xyz/vS.w*.5+.5;
  if(any(lessThan(s,vec3(0)))||any(greaterThan(s,vec3(1))))return 1.;
  float bias=max(.0010*(1.-max(dot(n,uSun),0.)),.00045);
  if(uQuality<.5)return compareDepth(s,vec2(0),bias);
  if(uQuality<1.5){
   float a=compareDepth(s,vec2(-.70,-.35),bias)+compareDepth(s,vec2(.55,-.72),bias)+compareDepth(s,vec2(-.45,.68),bias)+compareDepth(s,vec2(.72,.44),bias);
   return a*.25;
  }
  vec2 k[9]=vec2[9](vec2(-1.2,-.8),vec2(0.,-1.3),vec2(1.1,-.7),vec2(-1.3,.1),vec2(0.,0.),vec2(1.25,.15),vec2(-.8,1.15),vec2(.15,1.25),vec2(1.0,.9));
  float sum=0.;for(int i=0;i<9;i++)sum+=compareDepth(s,k[i],bias);return sum/9.;
 }
 vec3 tonemap(vec3 c){c=(c*(2.51*c+.03))/(c*(2.43*c+.59)+.14);return pow(clamp(c,0.,1.),vec3(1./2.2));}
 void main(){
  vec3 n=normalize(vN),viewDir=normalize(uEye-vP);float material=vFX.x;
  vec3 base=vC;float shine=0.,alpha=uAlpha;
  float sh=shadow(n);float daylight=clamp(uDay,0.,1.);float dayMix=smoothstep(.16,.74,daylight);float clock=uTime*uMotion;
  if(material>9.5&&material<10.5){outColor=vec4(vec3(.025,.038,.030),alpha);return;}

  // Slow cloud bands move independently of geometry and keep large grass areas from reading flat.
  float cloudA=noise2(vP.xz*.055+vec2(clock*.018,-clock*.011));
  float cloudB=noise2(vP.xz*.115+vec2(-clock*.013,clock*.016));
  float cloudShade=mix(.82,1.0,smoothstep(.28,.76,cloudA*.67+cloudB*.33));

  if(material>6.5&&material<7.5){
   float grain=.5+.5*sin(vLocal.y*88.+sin(vLocal.x*12.+vLocal.z*6.5)*2.3);
   float knots=noise2(vP.xz*2.4+vP.yy*.8);
   base*=.89+grain*.085+knots*.08;
   shine+=pow(max(dot(n,normalize(uSun+viewDir)),0.),26.)*.035*dayMix;
  } else if(material>7.5&&material<8.5){
   vec2 tile=vec2(vP.z*3.05,vP.y*5.2);tile.x+=mod(floor(tile.y),2.)*.5;
   vec2 edge=abs(fract(tile)-.5);vec2 width=max(fwidth(tile),vec2(.025));
   float seam=max(smoothstep(.435-width.x,.49,edge.x),smoothstep(.435-width.y,.49,edge.y));
   base*=.91+.085*hash21(floor(tile));base*=1.-seam*.14;
   shine+=pow(max(dot(n,normalize(uSun+viewDir)),0.),34.)*.065*dayMix*(1.-seam);
  } else if(material>8.5&&material<9.5){
   float plaster=noise2(vP.xy*16.+vP.zz*2.);base*=.94+.075*plaster;
   shine+=pow(max(dot(n,normalize(uSun+viewDir)),0.),48.)*.018*dayMix;
  } else if(material>.5&&material<1.5){
   // Analytic wave normal, shoreline tint, procedural caustics and sky Fresnel.
   vec2 w=vP.xz;float radius=vFX.y>.5?abs(vLocal.x-.18*sin(vLocal.z*3.)):length(vLocal.xz);
   n=normalize(vec3(-.13*cos(w.x*2.7+clock*.9)-.055*cos((w.x+w.y)*5.-clock*.8),1.,-.13*cos(w.y*4.2-clock*1.1)-.055*cos((w.x+w.y)*5.-clock*.8)));
   float fresnel=.045+.84*pow(1.-max(dot(n,viewDir),0.),3.);
   vec3 deep=mix(vec3(.025,.105,.17),vec3(.045,.235,.255),dayMix),shallow=mix(vec3(.08,.19,.22),vec3(.23,.53,.42),dayMix);
   base=mix(deep,shallow,smoothstep(.30,.95,radius));
   float ripple=.5+.5*sin(w.x*4.1+sin(w.y*3.4+clock*.65)*1.8-clock*.7);
   float caustic=pow(ripple,8.)*(.5+.5*sin(w.y*6.1-w.x*2.7+clock*.8));
   base+=vec3(.075,.105,.065)*caustic*dayMix;
   vec3 sky=mix(vec3(.08,.12,.20),vec3(.61,.77,.75),clamp(n.y*dayMix,0.,1.));
   base=mix(base,sky,fresnel*.86);
   float shore=smoothstep(.928,.991,radius)*(1.-smoothstep(1.015,1.05,radius));
   base=mix(base,vec3(.72,.83,.62),shore*(.42+.15*sin(radius*95.-clock*1.8))*dayMix);
   float sunGlint=pow(max(dot(n,normalize(uSun+viewDir)),0.),92.);
   shine=(sunGlint*.98+caustic*.055)*dayMix;
  } else if(material>2.5&&material<3.5){
   float grain=noise2(vP.xz*22.);base*=.84+grain*.25;
   float wet=clamp(vFX.y,0.,1.);base=mix(base,base*vec3(.34,.42,.40),wet);
   shine=wet*pow(max(dot(n,normalize(uSun+viewDir)),0.),30.)*.29*dayMix;
   shine+=wet*smoothstep(.83,.96,grain)*pow(max(dot(n,normalize(uSun+viewDir)),0.),8.)*.03;
  } else if(material>3.5&&material<4.5){
   float patches=noise2(vP.xz*.52)*.65+noise2(vP.xz*2.3)*.35;
   base*=mix(.76,1.15,patches);base=mix(base,base*vec3(1.04,1.09,.84),noise2(vP.xz*17.)*.15);
  } else if(material>1.5&&material<2.5){
   base*=.84+.16*sin(vP.y*2.+vP.x*.5);
   float rim=pow(1.-max(dot(n,viewDir),0.),3.);shine+=rim*.025*dayMix;
   // Cheap leaf translucency gives tree crowns a warm sun-facing edge.
   float back=max(dot(-n,uSun),0.);base+=vec3(.10,.12,.035)*back*.28*dayMix;
  }

  float rain=clamp(uRain,0.,1.);
  if((material>3.5&&material<4.5)||(material>6.5&&material<9.5)){
   base=mix(base,base*vec3(.68,.76,.74),rain*.34);
   shine+=rain*pow(max(dot(n,normalize(uSun+viewDir)),0.),18.)*.055*dayMix;
  }
  float lambert=max(dot(n,uSun),0.);
  vec3 daySky=mix(vec3(.22,.25,.18),vec3(.48,.61,.73),clamp(n.y*.5+.5,0.,1.));
  vec3 nightSky=mix(vec3(.055,.075,.12),vec3(.12,.17,.27),clamp(n.y*.5+.5,0.,1.));
  vec3 hemi=mix(nightSky,daySky,dayMix);
  float contact=mix(.74,1.,smoothstep(-.55,.48,vLocal.y));
  vec3 warmSun=vec3(1.08,.82,.54)*lambert*sh*cloudShade*(.22+.86*dayMix);
  vec3 light=hemi*(.54+.10*dayMix)*contact+warmSun;
  if(material>1.5&&material<2.5)light+=vec3(.22,.31,.12)*pow(max(dot(-uSun,viewDir),0.),2.)*.32*dayMix;
  vec3 c=base*light+vec3(1.,.92,.76)*shine*sh;
  if(material>4.5&&material<5.5)c+=vec3(1.36,.72,.22)*pow(1.-dayMix,1.25)*2.05;
  if(material>5.5&&material<6.5)c=base*(.76+dayMix*.46)+vec3(.11,.23,.30);
  float rim=pow(1.-max(dot(n,viewDir),0.),4.);c+=vec3(.05,.07,.09)*rim*(.25+.45*dayMix);
  float fog=smoothstep(30.,78.,length(vP.xz));vec3 fogColor=mix(vec3(.10,.14,.22),vec3(.70,.76,.62),dayMix);c=mix(c,fogColor,fog*(.28+.30*dayMix));
  outColor=vec4(tonemap(c),alpha);
 }`;
