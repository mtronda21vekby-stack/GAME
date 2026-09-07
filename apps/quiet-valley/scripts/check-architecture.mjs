import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../src');
const allowed={domain:['domain'],ports:['ports'],application:['application','ports'],infrastructure:['infrastructure','ports'],rendering:['rendering'],scene:['scene','rendering'],input:['input'],presentation:['presentation'],app:['app','domain','application','ports','infrastructure','rendering','scene','input','presentation']};
let count=0;
function visit(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory()){visit(f);continue;}if(!/\.[jt]s$/.test(f))continue;
 const source=fs.readFileSync(f,'utf8'),layer=path.relative(root,f).split(path.sep)[0];
 if(/\b(?:eval\s*\(|new\s+Function\b|globalThis\.Farm)/.test(source))throw Error('Forbidden runtime patch/global/device-art switch: '+f);
 if(['scene','rendering'].includes(layer)&&source.includes('navigator.userAgent'))throw Error('Device-specific art override in '+f);
 if(['domain','application','rendering'].includes(layer)&&/\b(?:localStorage|sessionStorage|fetch)\b/.test(source))throw Error('Persistence/network leaked into '+f);
 if(['domain','application'].includes(layer)&&/\b(?:document|window|WebGL|requestAnimationFrame)\b/.test(source.replace(/\/\*[\s\S]*?\*\//g,'')))throw Error('Browser dependencies in '+f);
 for(const [,spec]of source.matchAll(/\b(?:from\s*|import\s*\(\s*|import\s*)['"](\.\.?\/[^'"]+)['"]/g)){
  const target=path.resolve(path.dirname(f),spec),toLayer=path.relative(root,target).split(path.sep)[0];
  if(!target.startsWith(root+path.sep)||!allowed[layer]?.includes(toLayer))throw Error(`Dependency violation: ${layer} -> ${toLayer} in ${f}`);
  if(!fs.existsSync(target)&&!fs.existsSync(target.replace(/\.js$/,'.ts')))throw Error('Missing import '+spec+' in '+f);
 }
 if(f.endsWith('.js')){const r=spawnSync(process.execPath,['--check',f],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);}
 count++;
}}
visit(root);
const html=fs.readFileSync(path.join(root,'../index.html'),'utf8');if(/<script>(?!\s*<)/.test(html))throw Error('HTML must not contain game source');
console.log(`Architecture: ${count} source modules; explicit imports, source-owned shaders, no domain/browser/storage coupling.`);
