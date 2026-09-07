import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';import assert from 'node:assert/strict';import{spawnSync}from'node:child_process';
const lobby=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),game=path.resolve(lobby,'../quiet-valley');
for(const script of ['check-architecture.mjs','build.mjs']){
 const run=spawnSync(process.execPath,[path.join(game,'scripts',script)],{cwd:game,stdio:'inherit'});if(run.status!==0)process.exit(run.status??1);
}
const manifest=JSON.parse(fs.readFileSync(path.join(game,'dist/manifest.json'),'utf8'));
const metadata=JSON.parse(fs.readFileSync(path.join(lobby,'public/worlds/quiet-valley/manifest.json'),'utf8'));
const catalog=fs.readFileSync(path.join(lobby,'src/worlds/catalog.ts'),'utf8');
assert.equal(manifest.id,'quiet-valley');assert.equal(manifest.schemaVersion,1);
assert.equal(manifest.bridge,'blackcrown.world.v1');assert.equal(manifest.saveNamespace,'bc.world.quiet-valley.v1');
assert.equal(manifest.version,metadata.version);assert.ok(catalog.includes(manifest.version));
assert.ok(catalog.includes(metadata.runtime));assert.ok(catalog.includes(metadata.preview));
assert.ok(manifest.modules>=35&&manifest.bytes<650000);
const html=fs.readFileSync(path.join(game,'dist/index.html'),'utf8');
assert.match(html,/<script type="module" src="\.\/assets\//);assert.match(html,/href="\/games\/"/);
assert.ok(!html.includes('/*__'));
console.log('World catalog + independent Quiet Valley ESM application validated:',manifest.version,manifest.sourceHash);
