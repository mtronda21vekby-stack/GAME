const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
test('renderer keeps explicit procedural material channels for water foliage soil and windows',()=>{const engine=read('engine.js');for(const marker of ['Material IDs','uShadow','caustic','material>2.5','material>4.5'])assert.ok(engine.includes(marker),marker);});
test('procedural model layer owns twenty-four plot slots and multiple animal species',()=>{const models=read('models.js');assert.ok(models.includes('for(let id=0;id<24;id++)'));for(const species of ["type==='cow'","type==='sheep'","type==='chicken'"])assert.ok(models.includes(species),species);});
