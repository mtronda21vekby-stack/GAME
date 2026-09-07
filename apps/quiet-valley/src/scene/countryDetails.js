/** Authored view-only set dressing. Shared geometry and fixed-size animation pools.
 * Coordinates respect the original buildings, plot footprints and livestock paddock. */
export function createCountryDetails(R,world){
 const root=R.group([0,0,0],[1,1,1],[0,0,0],world.roots.farm);
 const box=(p,s,c,parent=root)=>{const n=R.add('bevelBox',p,s,c,[0,0,0],parent);n.fx=[7,0,0,0];return n;};
 const leaf=(p,s,c,parent=root)=>{const n=R.add('sphere',p,s,c,[0,0,0],parent);n.fx=[2,0,.2,p[0]+p[2]];return n;};
 const lanterns=[];
 // Cottage entrance: three shallow steps, stone foundation and hanging lanterns.
 for(let i=0;i<3;i++)box([-7.05,.31+i*.095,-4.62-i*.20],[1.22,.12,.40],'#b9ac8e');
 for(const x of [-8.05,-4.92]){
  box([x,1.12,-5.12],[.14,1.78,.14],'#a17a52');
  const lantern=box([x,1.95,-5.11],[.21,.32,.20],'#e4c278');lantern.fx=[5,0,0,0];lanterns.push(lantern);
  box([x,2.17,-5.11],[.31,.075,.28],'#587566');
 }
 // Hand-built shutters and corner climbing leaves frame, rather than cover, windows.
 for(const home of [{x:-6.5,z:-6.8,w:4.05,d:3,h:2.15},{x:-1.15,z:-7.85,w:2.8,d:2.5,h:1.8}]){
  const wx=home.x+home.w*.27,wy=.2+home.h*.56,wz=home.z+home.d/2+.24;
  for(const sign of [-1,1]){
   box([wx+sign*.61,wy,wz],[.25,.93,.075],'#648571');
   for(let i=0;i<5;i++)box([wx+sign*.61,wy-.32+i*.16,wz+.04],[.24,.035,.035],'#8ba084');
  }
  for(let i=0;i<8;i++){
   const x=home.x-home.w/2+.13+Math.sin(i*.8)*.14,y=.65+i*.20,z=home.z+home.d/2+.15;
   leaf([x,y,z],[.12,.085,.075],i%2?'#5d8554':'#7d9b5b');
   if(i%3===0)leaf([x+.09,y+.04,z+.02],[.043,.038,.036],'#c08baa');
  }
 }
 // The garden has actual tools and seed sacks, not additional floating UI.
 const shovel=R.group([-8.63,.32,-1.77],[1,1,1],[.1,0,-.12],root);
 box([0,.65,0],[.045,1.05,.045],'#a98050',shovel);box([0,.12,0],[.21,.26,.055],'#758176',shovel);
 R.add('ring',[0,1.21,0],[.1,.1,.13],'#a98050',[Math.PI/2,0,0],shovel);
 for(let i=0;i<2;i++)leaf([-9.03+i*.38,.52,-2.2],[.18,.24,.18],'#c7b58e');
 // Two butterflies; fixed geometry pool, no particles allocated during the render loop.
 const butterflies=[];
 for(let i=0;i<2;i++){
  const g=R.group([0,0,0],[.18,.18,.18],[0,0,0],root),wings=[];
  for(const sign of [-1,1]){const wing=R.add('sphere',[sign*.42,0,0],[.48,.055,.36],i?'#b78055':'#d2b25c',[0,0,0],g);wings.push({wing,sign});}
  box([0,0,0],[.10,.13,.47],'#6c6046',g);butterflies.push({g,wings,phase:i*2.9});
 }
 return {animate(t){
  for(const b of butterflies){b.g.visible=R.motion>0;b.g.p=[-9+Math.sin(t*.22+b.phase)*.8,1.35+Math.sin(t*.8+b.phase)*.23,-5+Math.cos(t*.17+b.phase)*1.8];b.g.r[1]=-t*.2;for(const w of b.wings)w.wing.r[2]=w.sign*Math.sin(t*12+b.phase)*.8;}
 },inspect:()=>({lanterns:lanterns.length,butterflies:butterflies.length})};
}
