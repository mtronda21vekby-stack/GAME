import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {VERSION} from '../src/app/version.js';
const root=(process.argv[2]||'https://blackcrown.work').replace(/\/$/,'')+'/games/quiet-valley/';
// Compare against the artifact actually being released, not an equally versioned old deployment.
const candidates=[new URL('../../../dist/games/quiet-valley/manifest.json',import.meta.url),new URL('../dist/manifest.json',import.meta.url)];
const expectedPath=candidates.find(p=>existsSync(p));assert.ok(expectedPath,'Build/download the release artifact before production verification');
const expected=JSON.parse(readFileSync(expectedPath,'utf8'));assert.equal(expected.version,VERSION);assert.match(expected.sourceHash,/^[a-f0-9]{16}$/);
// Keep CDN/access failures fatal; never substitute a preview host for production.
const headers={'Accept':'*/*','Cache-Control':'no-cache','Pragma':'no-cache','User-Agent':'BLACK-CROWN-OPS/production-smoke-v44'};
async function read(url){
 const r=await fetch(url,{signal:AbortSignal.timeout(20000),headers});
 const body=await r.text();
 assert.equal(r.status,200,`${url} returned HTTP ${r.status}; type=${r.headers.get('content-type')||'unknown'}; mitigation=${r.headers.get('cf-mitigated')||'none'}; ${r.status===200?'':body.slice(0,240).replace(/\s+/g,' ')}`);
 return {body,type:r.headers.get('content-type')||''};
}
let last;
for(let attempt=0;attempt<12;attempt++){
 try{
  const manifest=JSON.parse((await read(root+'manifest.json?release='+expected.sourceHash)).body);assert.equal(manifest.version,VERSION);
  assert.equal(manifest.sourceHash,expected.sourceHash,'Production serves a different source artifact');
  const page=await read(root+'?release='+expected.sourceHash);assert.ok(page.type.includes('text/html'));
  assert.ok(page.body.includes('data-estate-layout="radial-v2"'),'Old non-radial HTML shell');
  const entry=page.body.match(/<script type="module" src="([^"]+)"/)[1];assert.ok(entry.includes(expected.sourceHash));
  const pending=[new URL(entry,root).href],seen=new Set();
  while(pending.length){const url=pending.pop();if(seen.has(url))continue;seen.add(url);const response=await read(url);assert.match(response.type,/(java|ecma)script/,url+' returned non-JS');
   for(const match of response.body.matchAll(/\b(?:from\s*|import\s*\(\s*|import\s*)(['"])(\.\.?\/[^'"]+)\1/g)){const child=new URL(match[2],url).href;assert.ok(child.startsWith(root+'assets/'));pending.push(child);}}
  assert.ok(seen.size>=35);console.log('Verified deployed release',VERSION,expected.sourceHash,seen.size,'served ES modules; radial HTML matches the built artifact. HTTP verification, not a physical-device playtest.');process.exit(0);
 }catch(error){last=error;console.log('Awaiting matching release',attempt+1,error.message);await new Promise(r=>setTimeout(r,5000));}
}
throw last;
