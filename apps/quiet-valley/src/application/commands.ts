import type { Command,CommandDraft } from '../ports/contracts.js';

const ids = new Set(['water','harvest','unlock','feed','pet','collect','plantTree','waterTree','harvestTree','removeDecor','deliverOrder','claimStory','collectCraft']);
const keys = new Set(['clear','upgrade','claim','buyMaterial','talkCharacter','buildWorkshop','craft']);
const simple = new Set(['collectHoney','refreshOrders','payRent','markIntroSeen','deliverFestival']);
const names: Readonly<Record<string, readonly string[]>> = {
  crop:['carrot','wheat','pumpkin'], species:['cow','sheep','chicken'], region:['farm','orchard','river','forest'],
};
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const token = (v: unknown): v is string => typeof v === 'string' && /^[a-z][a-zA-Z0-9_:.-]{0,63}$/.test(v);
const integer = (v: unknown, min=0, max=1e9): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;

/** Parse untrusted DOM/bridge input into a closed command vocabulary. Unknown fields are rejected. */
export function parseCommand(input: unknown): Command {
  if (!record(input) || typeof input.type !== 'string') throw new Error('Некорректная команда');
  const raw=input;
  const c: CommandDraft = {type:input.type}; const allowed=new Set(['type']);
  function id(){ if(!integer(raw.id))throw new Error('Некорректный идентификатор');c.id=raw.id;allowed.add('id'); }
  function key(){ if(!token(raw.key))throw new Error('Некорректный ключ');c.key=raw.key;allowed.add('key'); }
  function choice(field:'crop'|'species'|'region'){
    const v=raw[field];if(typeof v!=='string'||!names[field]?.includes(v))throw new Error('Неизвестное значение: '+field);
    c[field]=v;allowed.add(field);
  }
  if(ids.has(c.type))id();
  else if(keys.has(c.type)){key();if(c.type==='buyMaterial'&&raw.qty!==undefined){if(!integer(raw.qty,1,999))throw new Error('Некорректное количество');c.qty=raw.qty;allowed.add('qty');}}
  else if(c.type==='plant'){id();choice('crop');}
  else if(c.type==='buyAnimal')choice('species');
  else if(c.type==='travel')choice('region');
  else if(c.type==='sell'){
    if(raw.key!==undefined)key();
    if(raw.qty!==undefined){if(!integer(raw.qty,1,1e6))throw new Error('Некорректное количество');c.qty=raw.qty;allowed.add('qty');}
  }else if(c.type==='placeDecor'){
    key();choice('region');
    if(!integer(raw.x,-100,100)||!integer(raw.z,-100,100)||!integer(raw.rotation,0,3))throw new Error('Некорректное размещение');
    c.x=raw.x;c.z=raw.z;c.rotation=raw.rotation;allowed.add('x');allowed.add('z');allowed.add('rotation');
  }else if(!simple.has(c.type))throw new Error('Неизвестная команда: '+c.type);
  // Presentation historically supplied crop for water/harvest; it must now send only the actual command fields.
  for(const field of Object.keys(raw))if(!allowed.has(field))throw new Error('Лишнее поле команды: '+field);
  return c as Command;
}
