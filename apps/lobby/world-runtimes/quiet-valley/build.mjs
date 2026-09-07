import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, "src");
const lobbyRoot = path.resolve(here, "../..");
const outDir = path.join(lobbyRoot, "public/runtime/quiet-valley");
const outFile = path.join(outDir, "index.html");

const read = (name) => fs.readFileSync(path.join(src, name), "utf8");

const BROKEN_SHADOW_COMPARE = "texture(uShadow,s.xy+offset*uShadowTexel).r?.30:1.";
const FIXED_SHADOW_COMPARE = "texture(uShadow,s.xy+offset*uShadowTexel).r ? .30 : 1.";
const MOBILE_SAFE_DETECT = "/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.maxTouchPoints>1&&matchMedia('(pointer: coarse)').matches&&Math.min(screen.width,screen.height)<=1024)";
const MOBILE_RENDERER_REVISION = "mobile-premium-v1";

// Mobile keeps the stable no-shadow/no-post startup path, but restores the visual systems
// that make Quiet Valley feel like a 3D game: foliage motion, animated water, wet soil,
// warm/cool hemispheric light, fresnel, sun glints and subtle material variation.
const MOBILE_VERTEX = `#version 300 es
precision highp float;
layout(location=0) in vec3 aP;
layout(location=1) in vec3 aN;
layout(location=2) in mat4 aM;
layout(location=6) in vec3 aC;
layout(location=7) in vec4 aFX;
uniform mat4 uVP,uLight;
uniform float uTime,uMotion;
out vec3 vN,vC,vP,vLocal;
out vec4 vS;
flat out vec4 vFX;
void main(){
 vec4 world=aM*vec4(aP,1.0);
 vec3 n=normalize(mat3(aM)*aN);
 if(aFX.x>1.5&&aFX.x<2.5){
  float wind=sin(world.x*1.18+world.z*.86+uTime*1.15+aFX.w)*.62+sin(world.z*2.1-uTime*1.72)*.28;
  float bend=clamp(aP.y+.65,0.0,1.35)*aFX.z*.067*uMotion;
  world.x+=wind*bend;
  world.z+=wind*bend*.28;
  n=normalize(n+vec3(wind*bend*.48,0.0,wind*bend*.20));
 }
 if(aFX.x>.5&&aFX.x<1.5){
  float edge=aFX.y>.5?abs(aP.x-.18*sin(aP.z*3.0)):length(aP.xz);
  float bank=1.0-smoothstep(.72,1.0,edge);
  world.y+=(sin(world.x*2.55+uTime*.82)*.022+sin(world.z*3.9-uTime*1.03)*.016)*bank*uMotion;
 }
 vP=world.xyz;
 vLocal=aP;
 vN=n;
 vC=aC;
 vFX=aFX;
 vS=uLight*world;
 gl_Position=uVP*world;
}`;

const MOBILE_FRAGMENT = `#version 300 es
precision highp float;
in vec3 vN,vC,vP,vLocal;
in vec4 vS;
flat in vec4 vFX;
out vec4 outColor;
uniform vec3 uSun,uEye;
uniform float uDay,uAlpha,uTime,uMotion;
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise2(vec2 p){
 vec2 i=floor(p),f=fract(p);
 f=f*f*(3.0-2.0*f);
 return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1)),f.x),f.y);
}
vec3 tonemap(vec3 c){
 c=(c*(2.51*c+.03))/(c*(2.43*c+.59)+.14);
 return pow(clamp(c,0.0,1.0),vec3(1.0/2.2));
}
void main(){
 vec3 n=normalize(vN);
 vec3 viewDir=normalize(uEye-vP);
 float material=vFX.x;
 float daylight=clamp(uDay,0.0,1.0);
 float clock=uTime*uMotion;
 vec3 base=vC;
 float specular=0.0;
 float emissive=0.0;

 if(material>.5&&material<1.5){
  vec2 w=vP.xz;
  float radius=vFX.y>.5?abs(vLocal.x-.18*sin(vLocal.z*3.0)):length(vLocal.xz);
  n=normalize(vec3(-.105*cos(w.x*2.7+clock*.88)-.042*cos((w.x+w.y)*4.5-clock*.71),1.0,-.105*cos(w.y*4.0-clock*.96)-.042*cos((w.x+w.y)*4.5-clock*.71)));
  float fresnel=.045+.72*pow(1.0-max(dot(n,viewDir),0.0),3.0);
  vec3 deep=vec3(.035,.20,.25);
  vec3 shallow=vec3(.16,.45,.39);
  base=mix(deep,shallow,smoothstep(.25,.98,radius));
  float ripple=.5+.5*sin(w.x*3.75+sin(w.y*3.1+clock*.61)*1.55-clock*.64);
  float caustic=pow(ripple,7.0)*(.5+.5*sin(w.y*5.2-w.x*2.25+clock*.73));
  base+=vec3(.055,.095,.058)*caustic;
  vec3 sky=mix(vec3(.16,.31,.42),vec3(.55,.72,.70),clamp(n.y,0.0,1.0));
  base=mix(base,sky,fresnel*.58);
  float glint=pow(max(dot(n,normalize(uSun+viewDir)),0.0),72.0);
  specular=(glint*.72+caustic*.045)*daylight;
 } else if(material>2.5&&material<3.5){
  float grain=noise2(vP.xz*19.0);
  base*=.84+grain*.23;
  float wet=clamp(vFX.y,0.0,1.0);
  base=mix(base,base*vec3(.40,.47,.44),wet);
  specular+=wet*pow(max(dot(n,normalize(uSun+viewDir)),0.0),24.0)*.26*daylight;
 } else if(material>1.5&&material<2.5){
  float leafNoise=noise2(vP.xz*8.0+vP.yy*1.7);
  base*=.88+leafNoise*.20;
  float back=max(dot(-n,uSun),0.0);
  base+=vec3(.045,.075,.025)*back*daylight;
 } else if(material>3.5&&material<4.5){
  float meadow=noise2(vP.xz*6.0);
  base*=.91+meadow*.14;
 } else if(material>4.5&&material<5.5){
  emissive=(1.0-daylight)*.70;
 } else if(material>5.5&&material<6.5){
  base=mix(base,vec3(.44,.78,.92),.35);
  specular=.22;
 }

 float lambert=max(dot(n,uSun),0.0);
 float up=clamp(n.y*.5+.5,0.0,1.0);
 vec3 skyAmbient=mix(vec3(.18,.22,.19),vec3(.55,.65,.68),up);
 vec3 warmSun=vec3(1.0,.90,.70);
 vec3 bounce=vec3(.20,.26,.17)*(1.0-up);
 vec3 dayLight=skyAmbient*.70+warmSun*lambert*.78+bounce*.30;
 vec3 nightLight=vec3(.095,.13,.20)+vec3(.10,.13,.17)*up;
 vec3 light=mix(nightLight,dayLight,daylight);

 // Cheap contact-depth cue replaces the expensive mobile shadow map.
 float groundAO=mix(.78,1.0,smoothstep(.12,1.65,vP.y));
 float facingAO=mix(.83,1.0,smoothstep(-.05,.72,n.y));
 vec3 c=base*light*groundAO*facingAO;
 c+=specular*vec3(1.0,.93,.77);
 c+=emissive*vec3(.88,.57,.24);

 float rim=pow(1.0-max(dot(n,viewDir),0.0),3.0);
 c+=rim*vec3(.025,.035,.028)*daylight;
 float fog=smoothstep(38.0,82.0,length(vP.xz));
 c=mix(c,vec3(.50,.61,.55),fog*.20);
 outColor=vec4(tonemap(c),uAlpha);
}`;

const MOBILE_UI_CSS = `
@media(max-width:800px){
  :root{--glass:rgba(250,247,226,.82);--shadow:0 14px 42px rgba(24,47,31,.18)}
  body{background:#9fbea0}
  #ui{z-index:10}
  #world{background:radial-gradient(ellipse at 50% 26%,#dce5c4,#adc99e 58%,#87ad92)}
  .bc-world-badge{display:none!important}
  .bc-world-return{transform:scale(.86);transform-origin:top left;backdrop-filter:blur(16px);background:rgba(35,55,48,.88)!important}
  .topbar{left:auto;right:10px;top:max(10px,env(safe-area-inset-top));width:auto;max-width:calc(100% - 178px)}
  .topbar .brand{display:none}
  .resources{gap:5px;justify-content:flex-end}
  .resource,.top-action{min-height:38px;padding:7px 9px;border-radius:12px;background:rgba(255,251,232,.86);box-shadow:0 8px 22px rgba(32,54,39,.12)}
  .resource b{font-size:13px}.resource small{display:none}
  .resources .resource:nth-child(3){display:none}
  .top-action{font-size:0;min-width:42px;padding:7px 8px}
  .top-action::first-letter{font-size:16px}
  #open-orders{font-size:0}#open-orders::before{content:'📦';font-size:16px}#open-orders #orders-ready{font-size:10px;margin-left:2px}
  #open-lease{font-size:0}#open-lease::before{content:'🏠';font-size:16px}#open-lease #lease-dot{font-size:10px;margin-left:2px}
  .left-stack{left:10px;top:82px;width:154px;gap:6px}
  .hud-card{padding:10px 11px;border-radius:15px;background:rgba(255,251,232,.78);box-shadow:0 10px 28px rgba(32,54,39,.12);backdrop-filter:blur(14px)}
  .hud-card small{font-size:7px}.hud-card h2{font-size:14px;margin:5px 0}.hud-card p{display:none}
  .hud-actions{margin-top:7px;gap:5px}.hud-actions button{padding:7px 5px;font-size:8px}
  .left-stack .hud-card:nth-child(2),.left-stack .hud-card:nth-child(3){min-height:40px;padding:7px 9px}
  .left-stack .hud-card:nth-child(2) small,.left-stack .hud-card:nth-child(2) h2,.left-stack .hud-card:nth-child(2) p{display:none}
  .left-stack .hud-card:nth-child(2) .hud-actions{margin:0}.left-stack .hud-card:nth-child(2) .hud-actions button{width:100%;padding:8px;font-size:0}.left-stack .hud-card:nth-child(2) .hud-actions button::before{content:'📖  История';font-size:9px}
  .left-stack .hud-card:nth-child(3) small,.left-stack .hud-card:nth-child(3) p{display:none}.left-stack .hud-card:nth-child(3) h2{margin:0;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .right-stack{right:9px;top:82px;gap:6px}.round-action{width:36px;height:36px;border-radius:12px;background:rgba(255,251,232,.82);box-shadow:0 8px 20px rgba(32,54,39,.12)}
  .bottom-wrap{bottom:max(9px,env(safe-area-inset-bottom));width:calc(100% - 18px)}
  .toolbar{padding:6px;border-radius:18px;background:rgba(255,251,232,.88);box-shadow:0 16px 38px rgba(31,52,37,.21);backdrop-filter:blur(18px)}
  .tool{height:50px}.tool span{font-size:17px}.tool b{font-size:7.5px}.tool.active{background:#496f52;box-shadow:0 5px 16px rgba(42,76,51,.24)}
  .world-label{min-width:25px;height:25px;padding:0 6px;border-radius:9px;font-size:10px;box-shadow:0 4px 12px rgba(38,60,42,.16)}
  .weather-layer{z-index:2}.weather-layer.rain{opacity:.46;background:repeating-linear-gradient(105deg,transparent 0 34px,rgba(159,203,216,.16) 35px 36px);mix-blend-mode:multiply}
  #details{bottom:77px;max-height:35dvh;background:rgba(255,251,232,.94)}
  #toast{bottom:72px}
}
@media(max-width:430px){
  .left-stack{width:142px}.resource{padding-left:8px;padding-right:8px}.toolbar{gap:2px}.tool b{font-size:7px}
}
`;

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Quiet Valley build blocked: compatibility anchor missing (${label}).`);
  }
  return source.replace(search, replacement);
}

function prepareEngine(source) {
  let next = replaceRequired(source, BROKEN_SHADOW_COMPARE, FIXED_SHADOW_COMPARE, "shadow compare");

  const fragmentAnchor = " const frag=`#version 300 es";
  const mobileDeclarations = ` const mobileVertex=${JSON.stringify(MOBILE_VERTEX)};\n const mobileFrag=${JSON.stringify(MOBILE_FRAGMENT)};\n const mobileRendererRevision=${JSON.stringify(MOBILE_RENDERER_REVISION)};\n`;
  next = replaceRequired(next, fragmentAnchor, `${mobileDeclarations}${fragmentAnchor}`, "mobile shaders");

  next = replaceRequired(
    next,
    "this.program=this.compile(vertex,frag);this.depth=this.compile(vertex,depthFrag);",
    `this.mobileSafe=${MOBILE_SAFE_DETECT};this.mobileRendererRevision=this.mobileSafe?mobileRendererRevision:'desktop-full';this.program=this.compile(this.mobileSafe?mobileVertex:vertex,this.mobileSafe?mobileFrag:frag);this.depth=this.mobileSafe?null:this.compile(vertex,depthFrag);`,
    "renderer program init",
  );

  next = replaceRequired(
    next,
    "this.warnings=[];try{this.post=this.compile(screenVertex,screenFrag);}catch(e){this.post=null;this.warnings.push('Постобработка отключена: '+e.message);}",
    "this.warnings=[];if(this.mobileSafe){this.post=null;this.warnings.push('Mobile premium renderer');}else{try{this.post=this.compile(screenVertex,screenFrag);}catch(e){this.post=null;this.warnings.push('Постобработка отключена: '+e.message);}}",
    "postprocess init",
  );

  next = replaceRequired(
    next,
    "this.setQuality(Object.hasOwn(QUALITY,setting)?setting:'balanced',false);",
    "if(this.mobileSafe){QUALITY.low.shadow=256;QUALITY.low.dpr=Math.min(1.3,devicePixelRatio||1);QUALITY.low.post=false;QUALITY.low.pcf=0;QUALITY.low.interval=12;}this.setQuality(this.mobileSafe?'low':(Object.hasOwn(QUALITY,setting)?setting:'balanced'),false);if(this.mobileSafe){this.shadowOK=false;this.postOK=false;this.motion=.82;}",
    "mobile quality init",
  );

  next = replaceRequired(
    next,
    "if(this.shadowOK&&this.frameCount++%this.settings.interval===0){",
    "if(this.depth&&this.shadowOK&&this.frameCount++%this.settings.interval===0){",
    "shadow draw guard",
  );

  return next;
}

function prepareMain(source) {
  let next = source.replaceAll("0.5.0-blackcrown.1", "0.5.2-blackcrown.3");
  next = next.replaceAll("0.5.1-blackcrown.2", "0.5.2-blackcrown.3");

  next = replaceRequired(
    next,
    "renderer.camera.pitch = 0.78;\n    renderer.camera.size = innerWidth < 700 ? 18 : 15.8;",
    "renderer.camera.pitch = renderer.mobileSafe ? 0.67 : 0.78;\n    renderer.camera.size = renderer.mobileSafe ? (innerWidth < 430 ? 14.4 : 13.8) : (innerWidth < 700 ? 18 : 15.8);",
    "mobile camera framing",
  );

  next = replaceRequired(
    next,
    "const text = status === 'ready' ? '✓' : status === 'dry' ? '💧' : !plot.crop ? '+' : '…';",
    "if (renderer.mobileSafe) {\n        if (activeTool === 'inspect' && status !== 'ready' && status !== 'dry') continue;\n        if (activeTool === 'plant' && plot.crop) continue;\n        if (activeTool === 'water' && status !== 'dry') continue;\n        if (activeTool === 'harvest' && status !== 'ready') continue;\n      }\n      const text = status === 'ready' ? '✓' : status === 'dry' ? '💧' : !plot.crop ? '+' : '…';",
    "mobile plot label filtering",
  );

  next = replaceRequired(
    next,
    "if (!model?.g.visible) continue;\n        const point = renderer.project([model.g.p[0], 1.65, model.g.p[2]]);",
    "if (!model?.g.visible) continue;\n        if (renderer.mobileSafe && animal.stock === 0 && animal.hunger > 35) continue;\n        const point = renderer.project([model.g.p[0], 1.65, model.g.p[2]]);",
    "mobile animal label filtering",
  );

  next = replaceRequired(
    next,
    "if (!valleyWorld.featureVisible(feature, state) || !feature.node.visible) continue;\n      const point = renderer.project([feature.pos[0], feature.pos[1] + 0.7, feature.pos[2]]);",
    "if (!valleyWorld.featureVisible(feature, state) || !feature.node.visible) continue;\n      if (renderer.mobileSafe && feature.kind === 'person') continue;\n      const point = renderer.project([feature.pos[0], feature.pos[1] + 0.7, feature.pos[2]]);",
    "mobile feature label filtering",
  );

  // Preserve the non-blocking boot contract introduced in 0.5.1.
  if (!next.includes("setTimeout(() => startRenderLoop(), 16)")) {
    next = replaceRequired(
      next,
      "exposeRuntimeInspection();\n    startRenderLoop();\n    setTimeout(() => window.QuietValleyLaunch?.ready(), 100);",
      "exposeRuntimeInspection();\n    window.QuietValleyLaunch?.setStage('Интерфейс готов');\n    window.QuietValleyLaunch?.ready();\n    setTimeout(() => startRenderLoop(), 16);",
      "non-blocking render-loop startup",
    );
  }
  return next;
}

function prepareSource(name, source) {
  if (name === "engine.js") return prepareEngine(source);
  if (name === "main.js") return prepareMain(source);
  return source;
}

// Each source module executes in a private lexical scope. Only the explicit runtime API
// below is published on globalThis. This prevents helper-name collisions ($, esc, clamp,
// etc.) and gives future modules a deliberate dependency boundary instead of one giant
// shared script scope.
const modules = [
  ["engine.js", "F"],
  ["simulation.js", "FarmSim"],
  ["expansion.js", "FarmExpansion"],
  ["gameplay.js", "ValleyGameplay"],
  ["models.js", "FarmArt"],
  ["world.js", "ValleyWorld"],
  ["valley-ui.js", "ValleyUI"],
  ["gameplay-ui.js", "GameplayUI"],
  ["picking.js", "FarmPick"],
  ["watering.js", "FarmWater"],
  ["main.js", null],
];

const scripts = modules
  .map(([name, exportName]) => {
    const source = prepareSource(name, read(name));
    const publish = exportName ? `\n;globalThis.${exportName} = ${exportName};` : "";
    return `/* module: ${name} */\n(() => {\n${source}${publish}\n})();`;
  })
  .join("\n\n");

if (scripts.includes(BROKEN_SHADOW_COMPARE)) {
  throw new Error("Quiet Valley build blocked: invalid GLSL shadow comparison survived source normalization.");
}
if (!scripts.includes("this.mobileSafe") || !scripts.includes("setTimeout(() => startRenderLoop(), 16)")) {
  throw new Error("Quiet Valley build blocked: mobile-safe startup contract missing.");
}
if (!scripts.includes(MOBILE_RENDERER_REVISION)) {
  throw new Error("Quiet Valley build blocked: premium mobile renderer revision missing.");
}

const css = ["[hidden]{display:none!important}", read("style.css"), read("valley.css"), read("blackcrown.css"), MOBILE_UI_CSS].join("\n");
const boot = read("boot.js")
  .replace("boot.stage = 'Первый кадр готов';", "boot.stage = 'Интерфейс готов';")
  .replace("Quiet Valley 0.3.0", "Quiet Valley 0.5.2");
const bridge = read("blackcrown-bridge.js").replace("const VERSION='0.5.0';", "const VERSION='0.5.2';");

const html = read("index.template.html")
  .replaceAll("0.5.0-blackcrown.1", "0.5.2-blackcrown.3")
  .replaceAll("0.5.1-blackcrown.2", "0.5.2-blackcrown.3")
  .replaceAll("0.5.0 · ALPHA", "0.5.2 · ALPHA")
  .replaceAll("0.5.1 · ALPHA", "0.5.2 · ALPHA")
  .replace("/*__CSS__*/", css)
  .replace("/*__BOOT__*/", boot)
  .replace("/*__SCRIPTS__*/", scripts)
  .replace("/*__BRIDGE__*/", bridge);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, html, "utf8");
console.log(`quiet-valley runtime: ${path.relative(lobbyRoot, outFile)} (${Buffer.byteLength(html).toLocaleString()} bytes) · ${MOBILE_RENDERER_REVISION}`);
