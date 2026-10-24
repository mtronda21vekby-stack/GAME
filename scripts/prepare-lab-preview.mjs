import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../',import.meta.url)));
const out=path.resolve(process.argv[2]||'');
if(!process.argv[2]||out===root||out.startsWith(root+path.sep))throw new Error('Preview staging must be an explicit directory outside the checkout');
if(fs.existsSync(out)&&fs.readdirSync(out).length)throw new Error('Preview staging must be empty');
const source=path.join(root,'apps/site/dist');
if(!fs.existsSync(path.join(source,'index.html')))throw new Error('Build the site first');
fs.mkdirSync(out,{recursive:true});
fs.cpSync(source,out,{recursive:true,filter:from=>!['games','_redirects','_headers','_worker.js','_routes.json','sw.js'].includes(path.basename(from))});
// Preserve the static catalogue entry, but do not ship any game runtime.
fs.mkdirSync(path.join(out,'games'),{recursive:true});
fs.copyFileSync(path.join(source,'games/index.html'),path.join(out,'games/index.html'));
fs.copyFileSync(path.join(root,'scripts/preview/lab-worker.mjs'),path.join(out,'_worker.js'));
fs.copyFileSync(path.join(root,'scripts/preview/guard.js'),path.join(out,'preview-guard.js'));
for(const file of ['index.html','games/index.html']){const target=path.join(out,file);fs.writeFileSync(target,fs.readFileSync(target,'utf8').replace('<head>','<head>\n    <script src=\"/preview-guard.js\"></script>'));}
fs.writeFileSync(path.join(out,'_routes.json'),JSON.stringify({version:1,include:['/*'],exclude:[]}));
fs.writeFileSync(path.join(out,'_redirects'),'/games /games/index.html 200\n/games/ /games/index.html 200\n/* /index.html 200\n');
fs.writeFileSync(path.join(out,'robots.txt'),'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(out,'preview-build.json'),JSON.stringify({commit:process.env.GITHUB_SHA||process.env.VITE_APP_COMMIT||'local',mode:'static-read-only',production:false}));
const forbidden=['functions','wrangler.toml','.env','.git'];
for(const name of forbidden)if(fs.existsSync(path.join(out,name)))throw new Error(`Forbidden preview input: ${name}`);
console.log('Prepared static-only preview; no production Functions, config, game runtimes or credentials copied.');
