/** A single model factory shared by placed structures and construction previews. */
export function makeEstateModel(R,key,parent=null){
 const group=(p=[0,0,0],parent=null,s=[1,1,1])=>R.group(p,s,[0,0,0],parent);
 const box=(p,s,c,parent,r=[0,0,0])=>R.add('bevelBox',p,s,c,r,parent);
 const ball=(p,s,c,parent)=>R.add('sphere',p,s,c,[0,0,0],parent);
 const cyl=(p,s,c,parent,r=[0,0,0])=>R.add('cylinder',p,s,c,r,parent);
  function cottage(parent,p,scale=1,roof='#79917d'){
   const g=group(p,parent,[scale,scale,scale]);
   box([0,1,0],[2.7,2,2.15],'#decda9',g);
   for(const side of [-1,1])box([side*.66,2.17,0],[1.65,.18,2.55],roof,g,[0,0,-side*.43]);
   box([-.55,.72,1.1],[.65,1.35,.08],'#64816e',g);box([.62,1.18,1.12],[.72,.72,.07],'#7ca5a3',g);return g;
  }
  function shed(parent,p){const g=group(p,parent);box([0,.85,0],[2.45,1.7,1.85],'#b39365',g);for(const side of [-1,1])box([side*.62,1.9,0],[1.55,.16,2.2],'#647966',g,[0,0,-side*.43]);box([0,.63,.96],[.82,1.25,.08],'#6a775f',g);return g;}
  function greenhouse(parent,p){const g=group(p,parent);box([0,.12,0],[3.2,.22,2.25],'#b8a989',g);for(const x of [-1.45,0,1.45])cyl([x,1.05,0],[.07,2.0,.07],'#748b7c',g);for(const z of [-1.0,1.0])box([0,1.95,z],[3.05,.08,.07],'#748b7c',g);for(const side of [-1,1]){const roof=box([side*.75,2.2,0],[1.7,.07,2.3],'#b9d5c8',g,[0,0,-side*.48]);roof.a=.65;}for(let i=0;i<8;i++)ball([-1.15+i%4*.75,.55,-.55+Math.floor(i/4)*1.1],[.28,.42,.28],i%2?'#6f9a61':'#88a66a',g);return g;}
  function depot(parent,p){const g=group(p,parent);box([0,.18,0],[3.6,.32,2.7],'#9d8d72',g);for(let x=-1.3;x<=1.3;x+=1.3)box([x,.72,0],[.18,1.45,.18],'#7f6b4e',g);box([0,1.48,0],[3.25,.15,2.45],'#6f7d68',g);for(let i=0;i<5;i++)box([-1.25+i*.62,.45,.65],[.5,.5,.72],i%2?'#ae8d5f':'#8e7653',g);return g;}


 const p=[0,.28,0];
 switch(key){
  case 'tool_shed': case 'honey_house':return shed(parent,p);
  case 'bunkhouse':return cottage(parent,p,.78,'#8c9e83');
  case 'staff_house':return cottage(parent,p,.92,'#9b8274');
  case 'greenhouse':return greenhouse(parent,p);
  case 'works_depot':return depot(parent,p);
  default:throw Error('Unknown estate model: '+key);
 }
}
