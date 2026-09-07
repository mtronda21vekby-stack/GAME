import assert from 'node:assert/strict';
import {VERSION} from '../src/app/version.js';
const root=(process.argv[2]||'https://blackcrown.work').replace(/\/$/,'')+'/games/quiet-valley/';
async function read(url){const r=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache'}});assert.equal(r.status,200,url);return {body:await r.text(),type:r.headers.get('content-type')||''};}
let last;
for(let attempt=0;attempt<12;attempt++){
 try{
  const manifest=JSON.parse((await read(root+'manifest.json?release='+encodeURIComponent(VERSION))).body);assert.equal(manifest.version,VERSION);
  const page=await read(root+'?release='+encodeURIComponent(VERSION));assert.ok(page.type.includes('text/html'));
  const entry=page.body.match(/<script type="module" src="([^"]+)"/)[1];assert.ok(entry.includes(manifest.sourceHash));
  const pending=[new URL(entry,root).href],seen=new Set();
  while(pending.length){const url=pending.pop();if(seen.has(url))continue;seen.add(url);const response=await read(url);assert.match(response.type,/(java|ecma)script/,url+' returned non-JS');
   for(const match of response.body.matchAll(/\b(?:from\s*|import\s*\(\s*|import\s*)(['"])(\.\.?\/[^'"]+)\1/g)){const child=new URL(match[2],url).href;assert.ok(child.startsWith(root+'assets/'));pending.push(child);}}
  assert.ok(seen.size>=35);console.log('Verified deployed release',VERSION,manifest.sourceHash,seen.size,'served ES modules. HTTP verification, not a physical-device playtest.');process.exit(0);
 }catch(error){last=error;console.log('Awaiting matching release',attempt+1,error.message);await new Promise(r=>setTimeout(r,5000));}
}
throw last;
