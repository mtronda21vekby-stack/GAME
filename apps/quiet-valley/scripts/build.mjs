import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const compiled=path.join(root,'.compiled');fs.rmSync(compiled,{recursive:true,force:true});
const tsc=spawnSync('tsc',['-p',path.join(root,'tsconfig.json')],{cwd:root,encoding:'utf8',shell:process.platform==='win32'});
if(tsc.status!==0){process.stderr.write(tsc.stdout+tsc.stderr);process.exit(tsc.status??1);}
const files=new Map();
function collect(base,relative=''){for(const e of fs.readdirSync(path.join(base,relative),{withFileTypes:true})){const file=path.join(relative,e.name);if(e.isDirectory())collect(base,file);else if(/\.(js|css)$/.test(e.name))files.set(file.replaceAll('\\','/'),fs.readFileSync(path.join(base,file)));}}
collect(path.join(root,'src'));collect(compiled);
const sum=crypto.createHash('sha256');for(const [file,bytes]of [...files].sort(([a],[b])=>a.localeCompare(b)))sum.update(file).update(bytes);
const hash=sum.digest('hex').slice(0,16),out=path.join(root,'dist'),prefix='assets/'+hash;
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
for(const[file,bytes]of files){const dst=path.join(out,prefix,file);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,bytes);}
// HTML is a shell only. Modules and GLSL are copied byte-for-byte, without runtime code substitutions.
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replaceAll('./src/','./'+prefix+'/');fs.writeFileSync(path.join(out,'index.html'),html);
const total=[...files.values()].reduce((n,b)=>n+b.length,0);if(total>650000)throw Error('Quiet Valley source budget exceeded');
const {VERSION}=await import('../src/app/version.js');
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({schemaVersion:1,id:'quiet-valley',title:'Quiet Valley',version:VERSION,sourceHash:hash,runtime:'/games/quiet-valley/',bridge:'blackcrown.world.v1',saveNamespace:'bc.world.quiet-valley.v1',persistence:'local',modules:files.size,bytes:total},null,2));
fs.rmSync(compiled,{recursive:true,force:true});console.log(`Quiet Valley ${VERSION}: ${files.size} modules/styles, ${total} bytes, source ${hash}`);
