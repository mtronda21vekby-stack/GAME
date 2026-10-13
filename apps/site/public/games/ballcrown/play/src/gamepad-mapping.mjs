/** Standard Gamepad API -> the pinned Ruffle 0.7.1 DOM input listeners.
 * Ruffle's canvas listens for PointerEvent; its window keyboard listeners require
 * focus on the player. Neither path rejects untrusted events in the pinned build.
 * Keep Ruffle gamepadButtonMapping:{}: this adapter owns the complete mapping.
 */
export const DEFAULT_GAMEPAD_OPTIONS = Object.freeze({enabled:true, deadzone:0.18, sensitivity:1, invertY:false});
export const KEY_BINDINGS = Object.freeze({
  KeyA:{key:'a',keyCode:65}, KeyD:{key:'d',keyCode:68},
  KeyS:{key:'s',keyCode:83}, KeyW:{key:'w',keyCode:87},
  KeyR:{key:'r',keyCode:82}, KeyQ:{key:'q',keyCode:81},
  KeyE:{key:'e',keyCode:69}, Tab:{key:'Tab',keyCode:9}
});
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
const axis = value => Number.isFinite(value) ? clamp(value,-1,1) : 0;

export function validateGamepadOptions(input = {}) {
  const next = {...DEFAULT_GAMEPAD_OPTIONS,...input};
  for(const name of ['enabled','invertY']) if(typeof next[name] !== 'boolean') throw new TypeError(`Неверная настройка геймпада: ${name}`);
  if(!Number.isFinite(next.deadzone) || next.deadzone < 0 || next.deadzone > 0.6) throw new RangeError('Мёртвая зона должна быть от 0 до 0.6.');
  if(!Number.isFinite(next.sensitivity) || next.sensitivity < 0.25 || next.sensitivity > 3) throw new RangeError('Чувствительность должна быть от 0.25 до 3.');
  return {enabled:next.enabled,deadzone:next.deadzone,sensitivity:next.sensitivity,invertY:next.invertY};
}

export function radialDeadzone(x,y,deadzone = DEFAULT_GAMEPAD_OPTIONS.deadzone) {
  x = axis(x); y = axis(y);
  if(!Number.isFinite(deadzone) || deadzone < 0 || deadzone >= 1) throw new RangeError('Неверная мёртвая зона.');
  const length = Math.hypot(x,y);
  if(length <= deadzone) return {x:0,y:0};
  const scaled = (Math.min(1,length)-deadzone)/(1-deadzone);
  return {x:x/length*scaled,y:y/length*scaled};
}

function pressed(button,threshold = 0.5) {
  return !!button && (button.pressed === true || (Number.isFinite(button.value) && button.value > threshold));
}

/** No controller-name heuristics: the browser must expose the standard layout. */
export function mapStandardGamepad(gamepad,options = DEFAULT_GAMEPAD_OPTIONS) {
  const config = validateGamepadOptions(options);
  const empty = {supported:false,keys:[],aim:{x:0,y:0},fire:false,menuClick:false,pause:false,activity:false};
  if(!gamepad || gamepad.connected === false || gamepad.mapping !== 'standard' || !gamepad.axes || !gamepad.buttons || gamepad.axes.length < 4 || gamepad.buttons.length < 16) return empty;
  const buttons = gamepad.buttons;
  const b = index => pressed(buttons[index]);
  const move = radialDeadzone(gamepad.axes[0],gamepad.axes[1],config.deadzone);
  const aim = radialDeadzone(gamepad.axes[2],gamepad.axes[3],config.deadzone);
  if(config.invertY) aim.y = -aim.y;
  const left = move.x < -0.15 || b(14), right = move.x > 0.15 || b(15);
  const keys = [];
  // Opposing directions cancel rather than changing direction every frame.
  if(left !== right) keys.push(left ? 'KeyA' : 'KeyD');
  if(move.y > 0.45 || b(1) || b(13)) keys.push('KeyS');
  if(b(0) || b(12)) keys.push('KeyW');
  if(b(2)) keys.push('KeyR');
  if(b(4)) keys.push('KeyQ');
  if(b(5)) keys.push('KeyE');
  if(b(8)) keys.push('Tab');
  const fire = pressed(buttons[7],0.2), menuClick = b(3), pause = b(9);
  return {supported:true,keys,aim,fire,menuClick,pause,activity:keys.length > 0 || fire || menuClick || pause || aim.x !== 0 || aim.y !== 0};
}

