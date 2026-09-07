import type {Command} from '../ports/contracts.js';
const specs:Record<string,readonly string[]>={
 plant:['id','crop'],water:['id'],harvest:['id'],unlock:['id'],feed:['id'],pet:['id'],collect:['id'],
 buyAnimal:['species'],sell:[],sellSurplus:[],claim:['key'],travel:['region'],upgrade:['key'],clear:['key'],
 plantTree:['id'],waterTree:['id'],harvestTree:['id'],collectHoney:[],placeDecor:['key','region','x','z','rotation'],removeDecor:['id'],buyMaterial:['key','qty'],
 expandEstate:[],buildEstate:['key'],moveEstate:['key','x','z','rotation'],hireStaff:['key'],dismissStaff:['key'],
 markIntroSeen:[],talkCharacter:['key'],payRent:[],deliverOrder:['id'],refreshOrders:[],claimStory:['id'],
 buildWorkshop:['key'],craft:['key'],collectCraft:['id'],deliverFestival:[]
};
const values:Record<string,readonly string[]>={crop:['carrot','wheat','pumpkin'],species:['cow','sheep','chicken'],region:['farm','river','orchard','forest']};
export function parseCommand(raw:unknown):Command {
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Некорректное действие');
 const r=raw as Record<string,unknown>;
 if(typeof r.type!=='string'||!Object.hasOwn(specs,r.type))throw Error('Неизвестное действие');
 const required=specs[r.type]!;const allowed=new Set(['type',...required,...(r.type==='sell'?['key','qty']:r.type==='buildEstate'?['x','z','rotation']:[])]);
 for(const key of Object.keys(r))if(!allowed.has(key))throw Error('Лишнее поле: '+key);
 for(const key of required)if(r[key]===undefined)throw Error('Отсутствует поле: '+key);
 if(r.type==='buildEstate'&&['x','z','rotation'].some(k=>r[k]!==undefined)&&['x','z','rotation'].some(k=>r[k]===undefined))throw Error('Укажите координаты и поворот здания');
 for(const key of ['id','qty','rotation','x','z'])if(r[key]!==undefined){const v=r[key];const min=['x','z'].includes(key)?-100:key==='qty'?1:0;const max=['x','z'].includes(key)?100:key==='rotation'?3:1000000;if(typeof v!=='number'||!Number.isSafeInteger(v)||v<min||v>max)throw Error('Некорректное число: '+key);}
 if(r.key!==undefined&&(typeof r.key!=='string'||!(/^[a-z][\w:.-]{0,63}$/).test(r.key)))throw Error('Некорректный ключ');
 for(const [key,list] of Object.entries(values))if(r[key]!==undefined&&!list.includes(String(r[key])))throw Error('Неизвестное значение: '+key);
 return {...r} as unknown as Command;
}
