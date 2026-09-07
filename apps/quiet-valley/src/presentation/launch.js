/* First-frame diagnostics, independent of the game bundle. Never report ready on a timer. */
export function createLaunchDiagnostics(lifetime){
 'use strict';
 const loading=document.getElementById('loading');
 const panel=document.getElementById('error');
 const hint=document.getElementById('launch-hint');
 const stage=document.getElementById('launch-stage');
 const boot={failed:false,firstFrame:false,stage:'Подготовка материалов',startedAt:performance.now()};
 let timer;
 hint.hidden=true;
 function fail(error){
  if(boot.failed)return;boot.failed=true;clearTimeout(timer);loading.hidden=true;
  document.getElementById('ui').hidden=true;panel.hidden=false;panel.replaceChildren();
  const title=document.createElement('h2');title.textContent='Ферма не смогла запуститься';
  const message=document.createElement('p');message.textContent=error?.message||String(error||'Неизвестная ошибка');
  const detail=document.createElement('textarea');detail.readOnly=true;detail.setAttribute('aria-label','Диагностика запуска');
  detail.value='Quiet Valley 0.6.2-restored.1\nЭтап: '+boot.stage+'\nОшибка: '+message.textContent+'\nБраузер: '+navigator.userAgent;
  const retry=document.createElement('button');retry.className='primary';retry.textContent='Повторить запуск';retry.onclick=()=>location.reload();
  const back=document.createElement('a');back.href='/games/';back.textContent='Вернуться к играм BLACKCROWN';back.style.display='block';back.style.marginTop='12px';
  const note=document.createElement('p');note.textContent='Ваше сохранение не удаляется. Доступны лёгкие настройки графики; никаких изменений в настройках безопасности браузера не требуется.';
  panel.append(title,message,detail,retry,back,note);
 }
 boot.fail=fail;
 boot.setStage=value=>{boot.stage=value;if(stage)stage.textContent=value;};
 boot.ready=()=>{
  if(boot.failed||boot.firstFrame)return;
  boot.firstFrame=true;boot.firstFrameMs=Math.round(performance.now()-boot.startedAt);boot.stage='Первый кадр отрисован';
  clearTimeout(timer);loading.hidden=true;document.body.dataset.runtimeReady='true';
 };
 function watch(){
  if(boot.firstFrame||boot.failed)return;
  if(document.hidden){timer=lifetime.timeout(watch,15000);return;}
  fail(new Error('Не получен первый кадр. Этап: '+boot.stage));
 }
 timer=lifetime.timeout(watch,25000);
 lifetime.on(window,'error',event=>{if(event.error||event.message)fail(event.error||event.message);});
 lifetime.on(window,'unhandledrejection',event=>fail(event.reason));
 lifetime.on(document.getElementById('world'),'webglcontextlost',event=>{event.preventDefault();fail('Графический контекст потерян. Повторный запуск восстановит сцену из сохранения.');});
 
return boot;
}