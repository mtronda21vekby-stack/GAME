/** Read-only, static visual preview. Never receives the production Functions tree. */
export const PREVIEW_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self' data:; connect-src 'self'; worker-src 'none'; object-src 'none'; frame-ancestors 'self'; base-uri 'self'; form-action 'none'";
const common={"Content-Security-Policy":PREVIEW_CSP,"X-Robots-Tag":"noindex, nofollow, noarchive","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","X-Blackcrown-Preview":"static-read-only"};
export function deniedPath(path){
  return /^\/api(?:\/|$)/i.test(path)||/^\/(?:account|profile|admin|checkout|cart|login|auth|store|game|lobby)(?:\/|$)/i.test(path)||/^\/games\/(?:ballcrown|quiet-valley|crown-front)(?:\/|$)/i.test(path)||path==='/sw.js';
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    let path;try{path=decodeURIComponent(url.pathname);}catch{return new Response('Bad path',{status:400,headers:common});}
    if(!['GET','HEAD'].includes(request.method)||deniedPath(path))return new Response(JSON.stringify({ok:false,reason:'visual_preview_only'}),{status:403,headers:{...common,'Content-Type':'application/json; charset=utf-8'}});
    // ASSETS is the only binding referenced. No database, KV, tokens, cookies,
    // auth code or network fetch can enter the preview's execution path.
    const clean=new Request(request.url,{method:request.method,headers:{Accept:request.headers.get('Accept')||'*/*',Range:request.headers.get('Range')||''}});
    const response=await env.ASSETS.fetch(clean);
    const headers=new Headers(response.headers);
    for(const [key,value] of Object.entries(common))headers.set(key,value);
    headers.delete('Set-Cookie');
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  }
};
