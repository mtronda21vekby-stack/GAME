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
 vP=world.xyz;
 vLocal=aP;
 vN=normalize(mat3(aM)*aN);
 vC=aC;
 vFX=aFX;
 vS=uLight*world;
 gl_Position=uVP*world;
}`;

const MOBILE_FRAGMENT = `#version 300 es
precision mediump float;
in vec3 vN,vC,vP,vLocal;
in vec4 vS;
flat in vec4 vFX;
out vec4 outColor;
uniform vec3 uSun,uEye;
uniform float uDay,uAlpha,uTime,uMotion;
vec3 tonemap(vec3 c){
 c=(c*(2.51*c+.03))/(c*(2.43*c+.59)+.14);
 return pow(clamp(c,0.0,1.0),vec3(1.0/2.2));
}
void main(){
 vec3 n=normalize(vN);
 float material=vFX.x;
 float daylight=clamp(uDay,0.0,1.0);
 vec3 base=vC;
 if(material>.5&&material<1.5){
  float ripple=.5+.5*sin((vP.x+vP.z)*2.0+uTime*.55);
  base=mix(vec3(.055,.22,.25),vec3(.18,.45,.37),.44+.10*ripple);
 }else if(material>2.5&&material<3.5){
  base=mix(base,base*vec3(.48,.53,.50),clamp(vFX.y,0.0,1.0));
 }else if(material>1.5&&material<2.5){
  base*=.96;
 }
 float lambert=max(dot(n,uSun),0.0);
 vec3 hemi=mix(vec3(.27,.31,.23),vec3(.58,.67,.69),clamp(n.y*.5+.5,0.0,1.0));
 vec3 light=hemi*.72+vec3(1.0,.91,.72)*lambert*.70;
 light=mix(vec3(.13,.18,.27),light,daylight);
 vec3 c=base*light;
 if(material>4.5&&material<5.5)c+=vec3(.68,.39,.10)*(1.0-daylight);
 float fog=smoothstep(30.0,75.0,length(vP.xz));
 c=mix(c,vec3(.68,.74,.62),fog*.52);
 outColor=vec4(tonemap(c),uAlpha);
}`;

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Quiet Valley build blocked: compatibility anchor missing (${label}).`);
  }
  return source.replace(search, replacement);
}

function prepareEngine(source) {
  let next = replaceRequired(source, BROKEN_SHADOW_COMPARE, FIXED_SHADOW_COMPARE, "shadow compare");

  const fragmentAnchor = " const frag=`#version 300 es";
  const mobileDeclarations = ` const mobileVertex=${JSON.stringify(MOBILE_VERTEX)};\n const mobileFrag=${JSON.stringify(MOBILE_FRAGMENT)};\n`;
  next = replaceRequired(next, fragmentAnchor, `${mobileDeclarations}${fragmentAnchor}`, "mobile shaders");

  next = replaceRequired(
    next,
    "this.program=this.compile(vertex,frag);this.depth=this.compile(vertex,depthFrag);",
    `this.mobileSafe=${MOBILE_SAFE_DETECT};this.program=this.compile(this.mobileSafe?mobileVertex:vertex,this.mobileSafe?mobileFrag:frag);this.depth=this.mobileSafe?null:this.compile(vertex,depthFrag);`,
    "renderer program init",
  );

  next = replaceRequired(
    next,
    "this.warnings=[];try{this.post=this.compile(screenVertex,screenFrag);}catch(e){this.post=null;this.warnings.push('Постобработка отключена: '+e.message);}",
    "this.warnings=[];if(this.mobileSafe){this.post=null;this.warnings.push('Mobile safe renderer');}else{try{this.post=this.compile(screenVertex,screenFrag);}catch(e){this.post=null;this.warnings.push('Постобработка отключена: '+e.message);}}",
    "postprocess init",
  );

  next = replaceRequired(
    next,
    "this.setQuality(Object.hasOwn(QUALITY,setting)?setting:'balanced',false);",
    "if(this.mobileSafe){QUALITY.low.shadow=256;QUALITY.low.dpr=1;QUALITY.low.post=false;QUALITY.low.pcf=0;QUALITY.low.interval=12;}this.setQuality(this.mobileSafe?'low':(Object.hasOwn(QUALITY,setting)?setting:'balanced'),false);if(this.mobileSafe){this.shadowOK=false;this.postOK=false;this.motion=.35;}",
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
  let next = source.replaceAll("0.5.0-blackcrown.1", "0.5.1-blackcrown.2");
  next = replaceRequired(
    next,
    "exposeRuntimeInspection();\n    startRenderLoop();\n    setTimeout(() => window.QuietValleyLaunch?.ready(), 100);",
    "exposeRuntimeInspection();\n    window.QuietValleyLaunch?.setStage('Интерфейс готов');\n    window.QuietValleyLaunch?.ready();\n    setTimeout(() => startRenderLoop(), 16);",
    "non-blocking render-loop startup",
  );
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

const css = ["[hidden]{display:none!important}", read("style.css"), read("valley.css"), read("blackcrown.css")].join("\n");
const boot = read("boot.js")
  .replace("boot.stage = 'Первый кадр готов';", "boot.stage = 'Интерфейс готов';")
  .replace("Quiet Valley 0.3.0", "Quiet Valley 0.5.1");
const bridge = read("blackcrown-bridge.js").replace("const VERSION='0.5.0';", "const VERSION='0.5.1';");

const html = read("index.template.html")
  .replaceAll("0.5.0-blackcrown.1", "0.5.1-blackcrown.2")
  .replaceAll("0.5.0 · ALPHA", "0.5.1 · ALPHA")
  .replace("/*__CSS__*/", css)
  .replace("/*__BOOT__*/", boot)
  .replace("/*__SCRIPTS__*/", scripts)
  .replace("/*__BRIDGE__*/", bridge);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, html, "utf8");
console.log(`quiet-valley runtime: ${path.relative(lobbyRoot, outFile)} (${Buffer.byteLength(html).toLocaleString()} bytes)`);
