// Fullscreen is requested only by the user's DOM button gesture.
// iOS preview views may expose an API yet reject it; standalone is separate.
export function installScreenMode({button,help,helpText,close,release,layout,environment=globalThis}) {
 const w=environment,d=w.document,root=d.documentElement;
 const media=w.matchMedia?.('(display-mode: standalone)');
 const active=()=>!!(d.fullscreenElement||d.webkitFullscreenElement);
 const standalone=()=>!!(w.navigator?.standalone||media?.matches);
 const supported=()=>!!(root.requestFullscreen||root.webkitRequestFullscreen)&&(d.fullscreenEnabled!==false||d.webkitFullscreenEnabled===true);
 const state={supported:supported(),fullscreen:active(),standalone:standalone(),lastError:''};
 let lastScreen;
 function sync(){state.supported=supported();state.fullscreen=active();state.standalone=standalone();d.body.classList.toggle('standalone',state.standalone);button.textContent=state.fullscreen?'⤢':'⛶';button.setAttribute('aria-label',state.fullscreen?'Выйти из полного экрана':'Полный экран');button.title=state.fullscreen?'Выйти из полного экрана':'Полный экран';button.style.display=state.standalone?'none':lastScreen==='game'&&!w.razePlayableState?.paused?'none':'block'}
 function explain(){helpText.textContent=/iPhone|iPad|iPod/.test(w.navigator?.userAgent||'')?'Для игры без панелей Safari откройте игру в Safari, выберите «Поделиться» → «На экран Домой» и запускайте созданный значок. Предпросмотр в редакторе — отдельный режим.':'Полный экран недоступен в этом окне. Откройте игру в обычном браузере или запускайте её из установленного значка.';help.hidden=false;close.focus?.()}
 async function toggle(){
  release?.();
  try{
   if(active()){const exit=d.exitFullscreen||d.webkitExitFullscreen;await exit?.call(d)}
   else if(supported()){const request=root.requestFullscreen||root.webkitRequestFullscreen;await request.call(root,{navigationUI:'hide'})}
   else explain();
   state.lastError='';
  }catch(error){state.lastError=error?.name||String(error);explain()}
  sync();layout?.();
 }
 function changed(){release?.();sync();layout?.();w.requestAnimationFrame?.(()=>layout?.())}
 button.addEventListener('click',toggle);close.addEventListener('click',()=>{help.hidden=true;button.focus?.()});
 d.addEventListener('fullscreenchange',changed);d.addEventListener('webkitfullscreenchange',changed);
 w.addEventListener('raze-frame',event=>{lastScreen=event.detail?.uiScreen;sync()});media?.addEventListener?.('change',changed);
 sync();return{state,toggle,dispose(){button.removeEventListener('click',toggle);d.removeEventListener('fullscreenchange',changed);d.removeEventListener('webkitfullscreenchange',changed)}};
}
