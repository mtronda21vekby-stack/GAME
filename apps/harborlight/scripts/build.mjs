import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const tsc=spawnSync('tsc',['-p',path.join(root,'tsconfig.json')],{cwd:root,stdio:'inherit',shell:process.platform==='win32'});if(tsc.status!==0)process.exit(tsc.status||1);
function copy(dir,dest){fs.mkdirSync(dest,{recursive:true});for(const e of fs.readdirSync(dir,{withFileTypes:true})){const from=path.join(dir,e.name),to=path.join(dest,e.name);if(e.isDirectory())copy(from,to);else if(!e.name.endsWith('.ts'))fs.copyFileSync(from,to);}}
copy(path.join(root,'src'),path.join(out,'src'));copy(path.join(root,'vendor'),path.join(out,'vendor'));fs.copyFileSync(path.join(root,'index.html'),path.join(out,'index.html'));
fs.writeFileSync(path.join(out,'_headers'),'/*\n  X-Content-Type-Options: nosniff\n  Cache-Control: no-cache\n');
console.log('Built independent Harborlight application. No source or shader substitution.');
