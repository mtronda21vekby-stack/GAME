import {mapStandardGamepad,DEFAULT_GAMEPAD_OPTIONS} from './gamepad-mapping.mjs';

// Retains the v4 standard-layout mapping. Routes to the native game's ordinary
// browser input adapter; no SWF or Ruffle is used by this controller.
export class NativeGamepad {
 constructor({canvas,isReady,isPaused,onPause,onStatus,onInput,getSettings,isActive,getUIState,environment=globalThis}) {
  Object.assign(this,{canvas,isReady,isPaused,onPause,onStatus,onInput,getSettings,isActive,getUIState,environment});
  this.options={...DEFAULT_GAMEPAD_OPTIONS};this.keys=new Set();this.fire=false;
  this.position={x:.65,y:.5};this.last=null;this.pauseHeld=false;this.menuHeld=false;
  this.neutral=true;this.blurred=false;this.running=false;this.context=null;this.confirmHeld=false;this.backHeld=false;this.direction=0;this.repeatAt=0;
  this.blur=()=>{this.blurred=true;this.reset()};this.focus=()=>{this.blurred=false};
  this.hidden=()=>{if(environment.document.hidden)this.reset()};this.disconnect=()=>this.reset();
 }
 key(type,code){if(this.onInput){this.onInput('key',{code:({KeyA:65,KeyD:68,KeyW:87,KeyS:83,KeyR:82,KeyQ:81,KeyE:69,Tab:9})[code],down:type==='keydown'});return}this.environment.dispatchEvent(new this.environment.KeyboardEvent(type,{code,bubbles:true,cancelable:true}))}
 pointer(type){
  if(this.onInput){this.onInput(type==='pointermove'?'pointer':'shoot',type==='pointermove'?{x:this.position.x,y:this.position.y,normalized:true}:{down:type==='pointerdown'});return}
  const r=this.canvas.getBoundingClientRect();
  this.canvas.dispatchEvent(new this.environment.PointerEvent(type,{clientX:r.left+this.position.x*r.width,clientY:r.top+this.position.y*r.height,button:type==='pointermove'?-1:0,buttons:this.fire?1:0,isPrimary:true,pointerType:'mouse',bubbles:true,cancelable:true}));
 }
 setKeys(next){const wanted=new Set(next);for(const code of this.keys)if(!wanted.has(code))this.key('keyup',code);for(const code of wanted)if(!this.keys.has(code))this.key('keydown',code);this.keys=wanted}
 setFire(value){if(value!==this.fire){this.fire=value;this.pointer(value?'pointerdown':'pointerup')}}
 reset(){this.setKeys([]);this.setFire(false);this.neutral=true;this.pauseHeld=true;this.menuHeld=true;this.confirmHeld=this.backHeld=true;this.direction=0;this.repeatAt=0;this.last=null;if(this.menuUsed){this.onInput?.('menu',{code:0});this.menuUsed=false}}
 start(){
  if(this.running)return;this.running=true;
  this.environment.addEventListener('blur',this.blur);this.environment.addEventListener('focus',this.focus);
  this.environment.addEventListener('gamepaddisconnected',this.disconnect);this.environment.document.addEventListener('visibilitychange',this.hidden);
  this.tick=time=>{if(!this.running)return;this.poll(time);this.frame=this.environment.requestAnimationFrame(this.tick)};
  this.frame=this.environment.requestAnimationFrame(this.tick);
 }
 stop(){this.running=false;this.environment.cancelAnimationFrame(this.frame);this.reset();this.environment.removeEventListener('blur',this.blur);this.environment.removeEventListener('focus',this.focus);this.environment.removeEventListener('gamepaddisconnected',this.disconnect);this.environment.document.removeEventListener('visibilitychange',this.hidden)}
 sendMenu(code){this.menuUsed=true;this.onInput?.('menu',{code})}
 menuInput(pad){
  const b=i=>!!pad.buttons[i]&&(pad.buttons[i].pressed||pad.buttons[i].value>.5);
  const move=mapStandardGamepad(pad,this.options);
  const axis=i=>Number.isFinite(pad.axes[i])?pad.axes[i]:0;
  const threshold=Math.max(.45,this.options.deadzone+.1);
  let x=(b(15)?1:0)-(b(14)?1:0),y=(b(13)?1:0)-(b(12)?1:0);
  if(!x&&!b(14)&&!b(15)&&Math.abs(axis(0))>threshold)x=Math.sign(axis(0));
  if(!y&&!b(12)&&!b(13)&&Math.abs(axis(1))>threshold)y=Math.sign(axis(1));
  const direction=x&&y?(Math.abs(axis(0))>Math.abs(axis(1))?(x<0?37:39):(y<0?38:40)):x?(x<0?37:39):y?(y<0?38:40):0;
  return {direction,confirm:b(0)||b(3),back:b(1),pause:b(9),activity:move.activity||direction!==0||b(0)||b(1)};
 }
 poll(time){
  const dt=this.last===null?0:Math.max(0,Math.min(.064,(time-this.last)/1000));this.last=time;
  if(!this.environment.isSecureContext||!this.environment.navigator?.getGamepads){this.reset();this.onStatus('Геймпад: требуется localhost или HTTPS');return}
  let pads;try{pads=Array.from(this.environment.navigator.getGamepads()).filter(Boolean)}catch{this.reset();this.onStatus('Геймпад: доступ браузера недоступен');return}
  const pad=pads.find(p=>mapStandardGamepad(p,this.options).supported);
  if(!pad){this.reset();this.onStatus('Геймпад: подключите контроллер и нажмите кнопку');return}
  const settings=this.getSettings?.();if(settings){this.options.deadzone=Math.max(0,Math.min(.6,settings.gamepadDeadzone??.18));this.options.sensitivity=Math.max(.25,Math.min(8,settings.gamepadSensitivity??1));this.options.aimCurve=Math.max(.5,Math.min(2.5,settings.gamepadAimCurve??1));this.options.invertY=!!settings.gamepadInvertY}
  const input=mapStandardGamepad(pad,this.options),menuInput=this.menuInput(pad);
  const ui=this.getUIState?.(),context=ui?(ui.key+':'+!!ui.active):null;
  if(this.context!==context){this.reset();this.context=context}
  const owns=this.isActive?this.isActive():true;
  if(this.wasOwner&&!owns){this.reset()}this.wasOwner=owns;
  if(this.blurred||this.environment.document.hidden){this.reset();this.onStatus('Геймпад: вернитесь в окно игры');return}
  if(this.neutral){this.pauseHeld=input.pause;this.menuHeld=input.menuClick;this.confirmHeld=menuInput.confirm;this.backHeld=menuInput.back;if(input.activity||menuInput.activity){this.onStatus('Геймпад: отпустите кнопки и стики');return}this.neutral=false}
  const pause=input.pause&&!this.pauseHeld;this.pauseHeld=input.pause;
  if(ui?.active){
   this.setKeys([]);this.setFire(false);
   const confirm=menuInput.confirm&&!this.confirmHeld,back=menuInput.back&&!this.backHeld;
   this.confirmHeld=menuInput.confirm;this.backHeld=menuInput.back;
   if(pause&&this.isReady()){if(ui.screen==='game')this.onPause();else this.sendMenu(13);return}
   if(back){this.sendMenu(27);return}
   if(confirm){this.sendMenu(13);return}
   if(menuInput.direction!==this.direction){this.direction=menuInput.direction;this.repeatAt=time+360;if(this.direction)this.sendMenu(this.direction)}
   else if(this.direction&&time>=this.repeatAt){this.repeatAt=time+160;this.sendMenu(this.direction)}
   this.onStatus('Геймпад: D-pad / левый стик — выбор · A — подтвердить · B — назад · Start — пауза');return;
  }
  if(pause&&this.isReady()){this.setKeys([]);this.setFire(false);this.onPause();return}
  if(!this.isReady()||this.isPaused()){this.setKeys([]);this.setFire(false);this.onStatus('Геймпад: Start — продолжить');return}
  const menu=input.menuClick&&!this.menuHeld;this.menuHeld=input.menuClick;
  if(!owns&&!input.activity){this.setKeys([]);this.setFire(false);return}
  if(input.activity){if(!owns){this.keys.clear();this.fire=false}this.onInput?.('activity',{});this.wasOwner=this.isActive?this.isActive():true;if(!this.wasActivity)this.canvas.focus({preventScroll:true})}this.wasActivity=input.activity;
  const r=this.canvas.getBoundingClientRect(),speed=Math.min(r.width,r.height)*this.options.sensitivity;
  this.position.x=Math.max(.002,Math.min(.998,this.position.x+input.aim.x*speed*dt/r.width));
  this.position.y=Math.max(.002,Math.min(.998,this.position.y+input.aim.y*speed*dt/r.height));
  if(this.onInput){
   // The existing cursor speed/sensitivity chooses a heading; neutral retains it as the player/camera moves.
   // The native renderer and ordinary firing source use the same current pivot.
   if(input.aim.x||input.aim.y)this.pointer('pointermove');
  }else if(input.aim.x||input.aim.y||input.fire||menu)this.pointer('pointermove');
  this.setKeys(input.keys);this.setFire(input.fire);
  if(menu&&!input.fire){this.setFire(true);this.setFire(false)}
  this.onStatus('Геймпад: левый стик — движение · правый — прицел · A — прыжок · RT — огонь · X — перезарядка · Start — пауза');
 }
}
