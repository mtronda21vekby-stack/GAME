/* Radial estate placement layer.
 * Keeps legacy saves valid while allowing player decor and structures on purchased shoreline rings.
 */
'use strict';
export function createRadialEstate(X, clock){
 const S=X.sim,base={validate:S.validate,act:S.act};
 const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const integer=(n,a,b)=>Math.floor(Math.max(a,Math.min(b,Number.isFinite(+n)?+n:a)));
 const bounds={
  1:{rx:14.75,rz:11.5},
  2:{rx:18.0,rz:14.5},
  3:{rx:21.0,rz:17.0},
  4:{rx:24.0,rz:19.5}
 };
 const structures={
  garden_shed:{name:'Садовый сарай',icon:'🛖',price:85,tier:2,structure:true},
  gazebo:{name:'Беседка',icon:'🏕️',price:120,tier:2,structure:true},
  storage_hut:{name:'Складской домик',icon:'🏚️',price:150,tier:3,structure:true},
  field_greenhouse:{name:'Полевая теплица',icon:'🏡',price:190,tier:3,structure:true},
  workshop:{name:'Мастерская',icon:'🛠️',price:260,tier:4,structure:true}
 };
 Object.assign(X.decor,structures);
 const core=bounds[1];
 const tierOf=s=>Math.max(1,Math.min(4,s?.world?.estate?.tier||1));
 const even=(x,z)=>Number.isInteger(x)&&Number.isInteger(z)&&x%2===0&&z%2===0;
 function insideEllipse(x,z,b,margin=.82){return x*x/(b.rx*b.rx)+z*z/(b.rz*b.rz)<margin;}
 function radialCell(s,region,x,z){
  if(region!=='farm'||!even(x,z))return false;
  const tier=tierOf(s);if(tier<2)return false;
  if(!insideEllipse(x,z,bounds[tier],.83))return false;
  return !insideEllipse(x,z,core,.91);
 }
 function radialPlacementCheck(s,region,x,z,ignoreId=null){
  if(!radialCell(s,region,x,z))return 'Здесь нельзя строить: эта земля ещё не входит в расширенный остров.';
  if(s.world.decor.some(d=>d.region===region&&d.x===x&&d.z===z&&d.id!==ignoreId))return 'Эта клетка уже занята. Сначала уберите установленный предмет.';
  return '';
 }
 function structureCheck(s,key){
  const d=structures[key];if(!d)return '';
  if(tierOf(s)<d.tier)return 'Это сооружение откроется на уровне острова '+d.tier;
  const cap={1:0,2:2,3:4,4:7}[tierOf(s)];
  const used=s.world.decor.filter(a=>structures[a.type]).length;
  if(used>=cap)return 'На этом уровне закончились места под дополнительные сооружения';
  return '';
 }
 function restoreRadialDecor(raw,s){
  const source=Array.isArray(raw?.world?.decor)?raw.world.decor:[];
  const seen=new Set(s.world.decor.map(d=>d.id));
  for(const d of source){
   if(!d||!Number.isSafeInteger(d.id)||d.id<1||seen.has(d.id)||!own(X.decor,d.type)||d.region!=='farm')continue;
   const candidate={id:d.id,type:d.type,region:'farm',x:+d.x,z:+d.z,rotation:integer(d.rotation,0,3)};
   if(radialPlacementCheck(s,'farm',candidate.x,candidate.z))continue;
   if(structures[candidate.type]&&tierOf(s)<structures[candidate.type].tier)continue;
   if(s.world.decor.filter(a=>a.region==='farm').length>=64)break;
   s.world.decor.push(candidate);seen.add(candidate.id);
  }
  s.world.nextDecorId=Math.max(s.world.nextDecorId||1,1,...s.world.decor.map(d=>d.id+1));
 }
 S.validate=function(raw,now=clock.now()){
  const s=base.validate(raw,now);restoreRadialDecor(raw,s);return s;
 };
 S.act=function(s,a,now=clock.now()){
  if(a?.type==='placeDecor'&&a.region==='farm'){
   const d=own(X.decor,a.key)?X.decor[a.key]:null;if(!d)return {ok:false,message:'Неизвестный предмет'};
   const structureError=structureCheck(s,a.key);if(structureError)return {ok:false,message:structureError};
   if(radialCell(s,'farm',a.x,a.z)){
    const error=radialPlacementCheck(s,'farm',a.x,a.z);if(error)return {ok:false,message:error};
    if(s.coins<d.price)return {ok:false,message:'Недостаточно монет'};
    s.coins-=d.price;s.world.decor.push({id:s.world.nextDecorId++,type:a.key,region:'farm',x:a.x,z:a.z,rotation:integer(a.rotation,0,3)});
    return {ok:true,message:d.name+' установлен на новой земле',effect:'build'};
   }
  }
  return base.act(s,a,now);
 };
 return {...X,sim:S,estateBounds:bounds,radialEstateCell:radialCell,radialEstatePlacementCheck:radialPlacementCheck,radialStructures:structures};
}
