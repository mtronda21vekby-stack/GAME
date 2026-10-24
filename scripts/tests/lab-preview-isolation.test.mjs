import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import worker,{PREVIEW_CSP} from '../preview/lab-worker.mjs';

test('preview only serves GET/HEAD static requests and never touches any production binding',async()=>{
  const calls=[];
  const env=new Proxy({ASSETS:{fetch:async request=>{calls.push(request);return new Response('asset',{headers:{'Set-Cookie':'forbidden=1'}});}}},{get(target,key){if(key!=='ASSETS')throw new Error('Non-asset binding access');return target[key];}});
  for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS'])assert.equal((await worker.fetch(new Request('https://preview.invalid/',{method}),env)).status,403);
  for(const url of ['/api/me','/api/auth/guest','/account','/admin/content','/checkout','/store','/game/','/lobby/','/games/ballcrown/','/games/quiet-valley/','/games/crown-front/','/sw.js','/%61pi/me'])assert.equal((await worker.fetch(new Request('https://preview.invalid'+url),env)).status,403);
  assert.equal(calls.length,0);
  const response=await worker.fetch(new Request('https://preview.invalid/art/platform/ballcrown-menu.webp',{headers:{Cookie:'private=secret',Authorization:'Bearer secret'}}),env);
  assert.equal(response.status,200);assert.equal(calls.length,1);
  assert.equal(calls[0].headers.has('Cookie'),false);assert.equal(calls[0].headers.has('Authorization'),false);
  assert.equal(response.headers.has('Set-Cookie'),false);
  assert.equal(response.headers.get('Content-Security-Policy'),PREVIEW_CSP);
  assert.match(PREVIEW_CSP,/connect-src 'self'/);assert.match(PREVIEW_CSP,/worker-src 'none'/);
});

test('preview workflow is exact-feature-branch-only and does not invoke production deploy/build',()=>{
  const text=fs.readFileSync(new URL('../../.github/workflows/preview-lab.yml',import.meta.url),'utf8');
  assert.match(text,/branches: \[work\/lab-spatial-cloud-20261024\]/);
  assert.match(text,/github.ref == 'refs\/heads\/work\/lab-spatial-cloud-20261024'/);
  assert.match(text,/--branch=lab-spatial-cloud-20261024/);
  assert.doesNotMatch(text,/--branch=main|workflow_dispatch|pull_request_target|build:prod|environment:/);
});
