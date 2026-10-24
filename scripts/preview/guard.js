/** Injected into the isolated preview output only, never the production build. */
(function(){
  const blocked=path=>/^\/(?:api|account|profile|admin|checkout|cart|login|auth|store|game|lobby)(?:\/|$)/i.test(path)||/^\/games\/(?:ballcrown|quiet-valley|crown-front)(?:\/|$)/i.test(path);
  const allowed=value=>{try{const u=new URL(value,location.href);return u.origin===location.origin&&!blocked(decodeURIComponent(u.pathname));}catch{return false;}};
  function notice(){
    let el=document.getElementById('preview-restriction');
    if(!el){el=document.createElement('div');el.id='preview-restriction';el.setAttribute('role','status');el.style.cssText='position:fixed;z-index:2147483647;left:20px;right:20px;bottom:18px;padding:14px 18px;background:#17252d;color:#e5ece8;border:1px solid #718d97;border-radius:8px;font:13px/1.5 system-ui;max-width:480px;margin:auto';document.body.append(el);}
    el.textContent='Тестовая сцена. Игры, профиль и покупки здесь отключены.';clearTimeout(window.__previewNoticeTimer);window.__previewNoticeTimer=setTimeout(()=>el.remove(),3500);
  }
  addEventListener('click',event=>{const link=event.target.closest?.('a[href]');if(link&&!allowed(link.href)){event.preventDefault();event.stopImmediatePropagation();notice();}},true);
  addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();notice();},true);
  const nativeOpen=window.open.bind(window);
  window.open=(url,...options)=>{if(!allowed(String(url??''))){notice();return null;}return nativeOpen(url,...options);};
  const nativeFetch=window.fetch.bind(window);
  window.fetch=(input,init)=>{
    const method=(init?.method||(input instanceof Request?input.method:'GET')).toUpperCase();
    const url=input instanceof Request?input.url:String(input);
    if(!['GET','HEAD'].includes(method)||!allowed(url))return Promise.resolve(new Response(JSON.stringify({ok:false,reason:'visual_preview_only'}),{status:403,headers:{'Content-Type':'application/json'}}));
    return nativeFetch(input,init);
  };
  for(const key of ['pushState','replaceState']){const original=history[key].bind(history);history[key]=(state,title,url)=>{if(url!=null&&!allowed(String(url))){notice();return;}return original(state,title,url);};}
  Object.defineProperty(window,'__BLACKCROWN_VISUAL_PREVIEW__',{value:true});
})();
