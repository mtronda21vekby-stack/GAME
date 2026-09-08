import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.join(root,'dist');
const files={};function walk(d){for(const f of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,f.name);if(f.isDirectory())walk(p);else if(f.name.endsWith('.js'))files['/'+path.relative(dist,p).replaceAll('\\','/')]=fs.readFileSync(p,'utf8');}}walk(dist);
let html=fs.readFileSync(path.join(dist,'index.html'),'utf8');html=html.replace('<link rel="stylesheet" href="./src/ui/style.css">',()=>'<style>'+fs.readFileSync(path.join(dist,'src/ui/style.css'),'utf8')+'</style>');
const loader=`
const sources=${JSON.stringify(files).replaceAll('<','\\u003c')};
const modules=new Map();
function resolve(from,relative){const a=from.split('/');a.pop();for(const p of relative.split('/')){if(p==='..')a.pop();else if(p!=='.')a.push(p);}return a.join('/');}
function makeModule(name){
 if(modules.has(name))return modules.get(name);
 let s=sources[name];if(s===undefined)throw Error('Missing module: '+name);
 s=s.replace(/\\b(from\\s*|import\\s*)['"]([^'"]+)['"]/g,(all,head,spec)=>{
  if(!spec.startsWith('.'))return all;
  const url=makeModule(resolve(name,spec));return head+JSON.stringify(url);
 });
 const url=URL.createObjectURL(new Blob([s],{type:'text/javascript'}));modules.set(name,url);return url;
}
try{await import(makeModule('/src/application/main.js'));}catch(error){document.getElementById('loading').hidden=true;const n=document.getElementById('error');n.hidden=false;n.querySelector('p').textContent=error.message;console.error(error);}
`;
html=html.replace('<script type="module" src="./src/application/main.js"></script>',()=>'<script type="module">'+loader+'</script>');
const target=path.join(root,'Harborlight.html');fs.writeFileSync(target,html);console.log('Offline distribution:',target,Buffer.byteLength(html),'bytes');
