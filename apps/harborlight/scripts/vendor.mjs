import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
try{
 const require=createRequire(import.meta.url),entry=require.resolve('three');const dir=path.resolve(path.dirname(entry),'..');
 fs.mkdirSync(path.join(root,'vendor'),{recursive:true});
 fs.copyFileSync(path.join(dir,'build/three.module.min.js'),path.join(root,'vendor/three.js'));
 fs.copyFileSync(path.join(dir,'LICENSE'),path.join(root,'vendor/LICENSE'));
 // Official r170 module is self-contained; retain only it and its license.
 for(const f of fs.readdirSync(path.join(root,'vendor')))if(f.startsWith('nexus-three'))fs.rmSync(path.join(root,'vendor',f));
 console.log('Pinned official Three.js r170 copied for offline distribution.');
}catch(error){if(!fs.existsSync(path.join(root,'vendor/three.js')))throw new Error('Run npm install to obtain pinned Three.js. '+error.message);console.log('Using the already vendored r170 renderer.');}
