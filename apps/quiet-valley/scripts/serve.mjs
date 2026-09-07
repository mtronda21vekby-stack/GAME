import http from 'node:http';import fs from 'node:fs';import path from 'node:path';import{fileURLToPath}from'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist'),prefix='/games/quiet-valley/';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
http.createServer((req,res)=>{let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}if(name==='/'){res.writeHead(302,{Location:prefix}).end();return;}if(!name.startsWith(prefix)){res.writeHead(404).end();return;}
 const relative=name.slice(prefix.length)||'index.html',file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}if(!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404).end();return;}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);
}).listen(Number(process.env.PORT)||4188,'127.0.0.1',()=>console.log('Quiet Valley: http://127.0.0.1:4188'+prefix));
