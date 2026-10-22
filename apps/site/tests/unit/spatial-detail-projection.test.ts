import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Matrix4, PerspectiveCamera, Vector3 } from "three";
import { DETAIL_REST, detailPlaneStyle, detailProjectQuad, detailQuadPose, detailRectQuad, detailSettledPose, detailSurfaceQuad, type MediaQuad, type MediaRect } from "../../src/components/spatial/detailTransition";
import { panelCSSMatrix, panelStyle } from "../../src/components/spatial/panelProjection";
import { SurfaceMotion } from "../../src/components/spatial/spatialMotion";
import { ORBIT_CARD_WIDTH } from "../../src/components/spatial/spatialState";
import { GameDetail } from "../../src/components/spatial/GameDetail";
import { platformGames } from "../../src/lib/platformGames";
import { spatialCaseIndex } from "../../src/components/spatial/spatialHistory";

function matrixValues(style:string) {return style.slice(9,-1).split(",").map(Number);}
function expectQuad(actual:MediaQuad,expected:MediaQuad,precision=7) {
  actual.forEach((point,index)=>{expect(point.x).toBeCloseTo(expected[index].x,precision);expect(point.y).toBeCloseTo(expected[index].y,precision);});
}
function expectReadable(quad:MediaQuad) {
  expect(quad.every(point=>Number.isFinite(point.x)&&Number.isFinite(point.y))).toBe(true);
  quad.forEach((point,index)=>{
    const next=quad[(index+1)%4],after=quad[(index+2)%4];
    expect(Math.hypot(next.x-point.x,next.y-point.y)).toBeGreaterThan(1);
    expect((next.x-point.x)*(after.y-next.y)-(next.y-point.y)*(after.x-next.x)).toBeGreaterThan(1e-5);
  });
}
function expectHomography(box:MediaRect,pose:readonly number[]) {
  const values=matrixValues(detailPlaneStyle(box,pose)),matrix=new Matrix4().fromArray(values),expected=detailSurfaceQuad(box,pose);
  expect(values).toHaveLength(16);expect(values.every(Number.isFinite)).toBe(true);expect(values[15]).toBe(1);
  detailRectQuad({left:0,top:0,width:box.width,height:box.height}).forEach((point,index)=>{
    expect(values[3]*point.x+values[7]*point.y+values[15]).toBeGreaterThan(1e-5);
    const projected=new Vector3(point.x,point.y,0).applyMatrix4(matrix);
    // Nine-decimal CSS serialization may amplify homogeneous coefficient
    // rounding slightly; remain below one thousandth of a CSS pixel.
    expect(Math.abs(projected.x+box.left-expected[index].x)).toBeLessThan(.001);expect(Math.abs(projected.y+box.top-expected[index].y)).toBeLessThan(.001);
  });
}
function nativeBox(width:number):MediaRect {
  const mediaWidth=Math.min(width-48,960);return {left:(width-mediaWidth)/2,top:150,width:mediaWidth,height:mediaWidth*9/16};
}
function panelFixture(width:number,height:number) {
  const camera=new PerspectiveCamera(38,width/height,.1,100);camera.position.set(.4,-1,19.6);camera.lookAt(.4,-1,0);camera.updateMatrixWorld();
  const world=new Matrix4().makeRotationY(-.3).multiply(new Matrix4().makeRotationX(.08)).multiply(new Matrix4().makeRotationZ(.045));world.setPosition(-.2,-1,4.2);
  const raw=panelCSSMatrix(camera,world,width,height,264,260,ORBIT_CARD_WIDTH),normalized=matrixValues(panelStyle(raw)),local={left:0,top:32,width:264,height:165},anchor={left:22,top:140};
  const quad=detailProjectQuad(normalized,local,anchor)!;expect(quad).not.toBeNull();
  return {raw,normalized,local,anchor,quad};
}

function returnTrackingFixture() {
  const source=readFileSync(new URL("../../src/components/spatial/GameDetail.tsx",import.meta.url),"utf8");
  const body=(name:string)=>{const match=source.match(new RegExp(`function ${name}\\([^\\n]*\\) \{([\\s\\S]*?)\\n  \}`));if(!match)throw new Error(`Missing actual ${name}`);return match[1];};
  const inline=(name:string)=>{const match=source.match(new RegExp(`function ${name}\\(\\) ?\{([^\\n]*)\}`));if(!match)throw new Error(`Missing actual ${name}`);return match[1];};
  let transform=`matrix3d(${new Matrix4().elements.join(",")})`;
  const styleWrites=vi.fn(),layoutReads=vi.fn(()=>{throw new Error("Per-frame layout read");});
  const style={get transform(){return transform;},set transform(value:string){styleWrites(value);transform=value;},setProperty:styleWrites,removeProperty:styleWrites};
  const element={isConnected:true,style,getBoundingClientRect:layoutReads};
  const local={left:0,top:0,width:262,height:160},anchor={left:24,top:500},box=nativeBox(393);
  class DOMMatrixReadOnly {
    values:number[];
    constructor(value?:string){if(value&&!value.startsWith("matrix3d("))throw new Error("Invalid matrix");this.values=value?matrixValues(value):new Matrix4().elements.slice();}
    toFloat64Array(){return new Float64Array(this.values);}
  }
  const projection={element,local,anchor,scrollX:0,scrollY:1290,viewportWidth:393,viewportHeight:852,gameId:"ballcrown"};
  const destination=detailQuadPose(detailRectQuad({...local,...anchor}),box,1,0)!;
  const surface=new SurfaceMotion(DETAIL_REST),move=vi.spyOn(surface,"moveTo"),queue:{id:number;callback:(now:number)=>void}[]=[],tags:string[]=[];
  let nextId=0;
  const env={returnProjection:{current:projection as typeof projection|null},mediaBox:{current:box},paintedGame:{current:{id:"ballcrown"}},innerWidth:393,innerHeight:852,scrollX:0,scrollY:1290,DOMMatrixReadOnly,detailProjectQuad,detailQuadPose,detailSurfaceQuad,returnDestination:{current:destination as number[]|null},returnDeadline:{current:1040},connectedHandoff:{current:true},surface,spatialCaseIndex,window:{location:{hash:""}},phase:{current:"closing"},epoch:{current:0},frame:{current:0},paintSurface:vi.fn(),setArrived:vi.fn(),setClosingVisual:vi.fn(),clearSource:vi.fn(),
    frameLoop:{request:(callback:(now:number)=>void,tag:string)=>{const id=++nextId;queue.push({id,callback});tags.push(tag);return id;},cancel:(id:number)=>{const index=queue.findIndex(item=>item.id===id);if(index>=0)queue.splice(index,1);}},
    liveReturnPose:()=>null as number[]|null,trackReturn:(_now:number)=>{},clearReturnTracking:()=>{},finishGhost:()=>{},restoreSourceThenFinish:()=>{},schedule:(_token=0)=>{}};
  // Execute the actual integration methods, with only browser objects replaced.
  const execute=(code:string,extra:Record<string,unknown>={})=>{const bindings={...env,...extra};return new Function(...Object.keys(bindings),code)(...Object.values(bindings));};
  env.liveReturnPose=()=>execute(body("liveReturnPose")) as number[]|null;
  env.trackReturn=now=>execute(body("trackReturn"),{now});
  env.clearReturnTracking=()=>execute(inline("clearReturnTracking"));
  env.finishGhost=()=>execute(body("finishGhost"));
  env.restoreSourceThenFinish=()=>execute(body("restoreSourceThenFinish"));
  env.schedule=(token=env.epoch.current)=>execute(body("schedule"),{token});
  const cancel=()=>execute(inline("cancelFrame"));
  const matrix=(offset=0)=>{const value=new Matrix4();value.elements[0]=280/262*(1+.0001*262);value.elements[1]=.025;value.elements[3]=.0001;value.elements[5]=1.03;value.elements[12]=offset;transform=`matrix3d(${value.elements.join(",")})`;};
  surface.moveTo(destination,1040,0);move.mockClear();
  return {env,surface,move,queue,tags,matrix,cancel,layoutReads,styleWrites,setTransform:(value:string)=>{transform=value;}};
}

describe("Projective detail media continuity",()=>{
  it.each([[393,852],[430,932],[1440,900]])("reads actual rotated panel corners in native viewport coordinates at %ix%i",(width,height)=>{
    const {raw,normalized,local,anchor,quad}=panelFixture(width,height),expected=detailRectQuad(local).map(point=>{
      const projected=new Vector3(point.x,point.y,0).applyMatrix4(raw);return {x:anchor.left+projected.x,y:anchor.top+projected.y};
    }) as unknown as MediaQuad;
    expectReadable(quad);expectQuad(quad,expected,6);expect(normalized[15]).toBe(1);
    expect(Math.abs(normalized[3])+Math.abs(normalized[7])).toBeGreaterThan(1e-6);
    const shifted=detailProjectQuad(normalized,local,{left:anchor.left+17,top:anchor.top-43})!;
    expectQuad(shifted,quad.map(point=>({x:point.x+17,y:point.y-43})) as unknown as MediaQuad);
    const box=nativeBox(width),pose=detailQuadPose(quad,box,1,0)!;
    expect(pose).toHaveLength(14);expectQuad(detailSurfaceQuad(box,pose),quad);expectHomography(box,pose);
  });

  it("keeps the captured WebKit unit-W projection equivalent to its original homogeneous matrix",()=>{
    const raw=new Matrix4().fromArray([20.457893,-.200432,.00144,-.001438,.023677,20.685309,-.000265,.000264,-3.257048,-2.626752,.018878,-.01884,228.528458,417.24223,-23.206809,23.360242]);
    const local={left:0,top:32,width:264,height:165},anchor={left:22,top:500},original=raw.elements.slice(),normalized=matrixValues(panelStyle(raw));
    expectQuad(detailProjectQuad(normalized,local,anchor)!,detailProjectQuad(original,local,anchor)!,7);
    expect(normalized[15]).toBe(1);expect(raw.elements).toEqual(original);
  });

  it("rejects horizon crossings, reflected or degenerate planes and nonfinite source input",()=>{
    const rect={left:0,top:0,width:100,height:60},anchor={left:20,top:30},identity=new Matrix4().elements;
    expect(detailProjectQuad(identity,rect,anchor)).toEqual(detailRectQuad({left:20,top:30,width:100,height:60}));
    const horizon=identity.slice();horizon[3]=-.02;
    const behind=identity.slice();behind[15]=-1;
    const invalid=identity.slice();invalid[4]=NaN;
    expect(detailProjectQuad(horizon,rect,anchor)).toBeNull();expect(detailProjectQuad(behind,rect,anchor)).toBeNull();
    expect(detailProjectQuad(new Matrix4().makeScale(-1,1,1).elements,rect,anchor)).toBeNull();expect(detailProjectQuad(invalid,rect,anchor)).toBeNull();
    expect(detailProjectQuad(identity.slice(1),rect,anchor)).toBeNull();expect(detailProjectQuad(identity,{...rect,width:0},anchor)).toBeNull();
    expect(detailProjectQuad(identity,{...rect,left:NaN},anchor)).toBeNull();expect(detailProjectQuad(identity,rect,{left:Infinity,top:30})).toBeNull();
  });

  it("rejects unreadable corner residuals and keeps the flat fallback finite and exact",()=>{
    const box=nativeBox(393),flat=detailRectQuad(box),reflected=[flat[0],flat[3],flat[2],flat[1]] as MediaQuad;
    const crossed=[flat[0],flat[2],flat[1],flat[3]] as MediaQuad,invalid=flat.map((point,index)=>index?point:{x:NaN,y:point.y}) as unknown as MediaQuad;
    const diamond=[{x:100,y:0},{x:200,y:100},{x:100,y:200},{x:0,y:100}] as const;
    for(const quad of [reflected,crossed,invalid,diamond])expect(detailQuadPose(quad,box)).toBeNull();
    expect(detailQuadPose(flat,{...box,width:0})).toBeNull();expect(DETAIL_REST).toHaveLength(14);
    const rest=detailSettledPose();expect(rest).toEqual(DETAIL_REST);expect(rest).not.toBe(DETAIL_REST);
    expect(detailSettledPose(reflected)).toEqual(DETAIL_REST);expectQuad(detailSurfaceQuad(box,rest),flat);expectHomography(box,rest);
    rest[0]=10;expect(DETAIL_REST[0]).toBe(0);
  });

  it.each([[393,852],[1440,900]])("retains the measured orientation inside the settled %ipx media box",(width,height)=>{
    const {quad}=panelFixture(width,height),box=nativeBox(width),rest=detailSettledPose(quad),settled=detailSurfaceQuad(box,rest);
    expect(rest.slice(0,6)).toEqual(DETAIL_REST.slice(0,6));expect(rest.slice(6).some(value=>Math.abs(value)>.001)).toBe(true);
    expect(rest.slice(6).every(value=>Math.abs(value)<=.09)).toBe(true);expectReadable(settled);expectHomography(box,rest);
    expect(Math.sign(settled[1].y-settled[0].y)).toBe(Math.sign(quad[1].y-quad[0].y));
    settled.forEach(point=>{expect(point.x).toBeGreaterThanOrEqual(box.left-1e-8);expect(point.x).toBeLessThanOrEqual(box.left+box.width+1e-8);expect(point.y).toBeGreaterThanOrEqual(box.top-1e-8);expect(point.y).toBeLessThanOrEqual(box.top+box.height+1e-8);});
  });

  it.each([[393,852,430],[1440,900,1280]])("keeps 14-channel open/reverse/reopen motion convex and exactly rebases resized %ipx media",(width,height,resizedWidth)=>{
    const {quad}=panelFixture(width,height),box=nativeBox(width),source=detailQuadPose(quad,box,1,0)!,rest=detailSettledPose(quad),motion=new SurfaceMotion(source);
    const inspect=(currentBox:MediaRect,now:number)=>{motion.sample(now);expect(motion.value).toHaveLength(14);expect(motion.value.every(Number.isFinite)).toBe(true);const current=detailSurfaceQuad(currentBox,motion.value);expectReadable(current);expectHomography(currentBox,motion.value);return current;};
    motion.moveTo(rest,1280,0);for(let now=0;now<=360;now+=12)inspect(box,now);
    const opening=inspect(box,360);motion.moveTo(source,1040,360);expectQuad(inspect(box,360),opening);
    for(let now=372;now<=540;now+=12)inspect(box,now);
    const closing=inspect(box,540);motion.moveTo(rest,1280,540);expectQuad(inspect(box,540),closing);
    for(let now=552;now<=876;now+=12)inspect(box,now);
    const beforeResize=inspect(box,880),resized=nativeBox(resizedWidth),rebased=detailQuadPose(beforeResize,resized,motion.value[4],motion.value[5])!;
    expect(rebased).not.toBeNull();motion.rebase(rebased,true);expectQuad(detailSurfaceQuad(resized,motion.value),beforeResize);
    motion.moveTo(rest,900,880);expectQuad(inspect(resized,880),beforeResize);
    for(let now=892;now<=1780;now+=12)inspect(resized,now);
    inspect(resized,1780);expectQuad(detailSurfaceQuad(resized,motion.value),detailSurfaceQuad(resized,rest));expect(motion.active).toBe(false);
    const resizedSource=detailQuadPose(quad,resized,1,0)!;motion.moveTo(resizedSource,1040,1800);
    for(let now=1800;now<=2840;now+=13)inspect(resized,now);
    inspect(resized,2840);expectQuad(detailSurfaceQuad(resized,motion.value),quad);expect(motion.active).toBe(false);
  });

  it("captures the live 200px-scrolled dialog anchor before close and preserves it through reopen rebasing",()=>{
    // Execute the actual small integration readers with a controlled native
    // rectangle; the rest remains the real projective/motion implementation.
    const integration=readFileSync(new URL("../../src/components/spatial/GameDetail.tsx",import.meta.url),"utf8");
    const body=(name:string)=>{const match=integration.match(new RegExp(`function ${name}\\(\\) \\{([\\s\\S]*?)\\n  \\}`));expect(match).not.toBeNull();return match![1];};
    const native=nativeBox(393),mediaBox={current:{...native}},source=detailQuadPose(panelFixture(393,852).quad,native,1,0)!,motion=new SurfaceMotion(source);
    motion.moveTo(detailSettledPose(panelFixture(393,852).quad),1280,0);motion.sample(600);
    let live={...native,top:native.top-200},reads=0;
    const media={style:{transform:"matrix3d(previous-painted-transform)"},getBoundingClientRect:()=>{reads++;expect(media.style.transform).toBe("none");return live;}};
    const measure=new Function("mediaRef",body("baseRect")),painted=new Function("baseRect","mediaBox","surface","detailSurfaceQuad",body("paintedQuad"));
    const readPainted=()=>painted(()=>measure({current:media}),mediaBox,motion,detailSurfaceQuad) as MediaQuad;
    const stale=detailSurfaceQuad(mediaBox.current,motion.value),beforeClose=readPainted();
    expectQuad(beforeClose,detailSurfaceQuad(live,motion.value));beforeClose.forEach((point,index)=>expect(point.y-stale[index].y).toBeCloseTo(-200,9));
    expect(media.style.transform).toBe("matrix3d(previous-painted-transform)");
    // dialog.close()/page release changes the native box back; retain the
    // already painted viewport quad rather than jumping to its stale anchor.
    live={...native};mediaBox.current=measure({current:media});
    const closePose=detailQuadPose(beforeClose,mediaBox.current,motion.value[4],motion.value[5])!;motion.rebase(closePose,true);
    expectQuad(detailSurfaceQuad(mediaBox.current,motion.value),beforeClose);expectHomography(mediaBox.current,motion.value);
    motion.moveTo(source,1040,600);motion.sample(760);const beforeReopen=readPainted();
    // showModal()/scrollTo(0) remeasures the native slot before applying the
    // interrupted plane. Both opening and closing use the same live reader.
    live={...native};mediaBox.current=measure({current:media});
    motion.rebase(detailQuadPose(beforeReopen,mediaBox.current,motion.value[4],motion.value[5])!,true);
    expectQuad(detailSurfaceQuad(mediaBox.current,motion.value),beforeReopen);expectReadable(beforeReopen);expect(reads).toBe(4);
  });

  it("amplifies the captured shallow perspective while bounding tiny, frontal and strong inputs",()=>{
    const matrix=[20.457893,-.200432,.00144,-.001438,.023677,20.685309,-.000265,.000264,-3.257048,-2.626752,.018878,-.01884,228.528458,417.24223,-23.206809,23.360242];
    const quad=detailProjectQuad(matrix,{left:0,top:32,width:264,height:165},{left:22,top:500})!,xs=quad.map(point=>point.x),ys=quad.map(point=>point.y);
    const bounds={left:Math.min(...xs),top:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)},source=detailQuadPose(quad,bounds)!.slice(6),settled=detailSettledPose(quad).slice(6),sourceMax=Math.max(...source.map(Math.abs));
    expect(sourceMax).toBeGreaterThan(.009);expect(sourceMax).toBeLessThan(.012);expect(Math.max(...settled.map(Math.abs))).toBeCloseTo(.045,10);
    source.forEach((value,index)=>{if(Math.abs(value)>1e-9){expect(Math.sign(settled[index])).toBe(Math.sign(value));expect(settled[index]/value).toBeGreaterThan(1.5);expect(settled[index]/value).toBeLessThanOrEqual(6);}});
    const tiny=[{x:0,y:.1},{x:100,y:0},{x:100,y:100},{x:0,y:99.9}] as const;
    expect(Math.max(...detailSettledPose(tiny).slice(6).map(Math.abs))).toBeCloseTo(.006,10);
    const strong=[{x:0,y:0},{x:100,y:10},{x:95,y:100},{x:5,y:90}] as const,strongPose=detailSettledPose(strong);
    expect(Math.max(...strongPose.slice(6).map(Math.abs))).toBeCloseTo(.09,10);expect(strongPose.slice(6).every(value=>Math.abs(value)<=.09)).toBe(true);
    expect(detailSettledPose(detailRectQuad({left:0,top:0,width:100,height:100})).slice(6)).toEqual(Array(8).fill(0));
    expectReadable(detailSurfaceQuad(nativeBox(393),detailSettledPose(quad)));expectHomography(nativeBox(393),strongPose);
  });

  it("keeps native case copy and controls in the body with the projected media outside it",()=>{
    const game=platformGames[0],noop=()=>{},html=renderToStaticMarkup(React.createElement(GameDetail,{game,open:false,canCycle:true,paused:false,onClose:noop,onRequestClose:noop,onSearch:noop,onPrevious:noop,onNext:noop,onTogglePause:noop}));
    const marker=html.indexOf('class="spatialDetailBody"');expect(marker).toBeGreaterThan(-1);
    const start=html.lastIndexOf("<div",marker),tail=html.slice(start);let nesting=0,end=-1;
    for(const tag of tail.matchAll(/<\/?div\b[^>]*>/g)){nesting+=tag[0].startsWith("</")?-1:1;if(nesting===0){end=tag.index!+tag[0].length;break;}}
    expect(end).toBeGreaterThan(0);const body=tail.slice(0,end);
    expect(html.indexOf('class="spatialDetailMedia"')).toBeLessThan(start);expect(body).not.toContain('class="spatialDetailMedia"');
    for(const className of ["spatialDetailCopy","spatialDetailInformation","spatialDetailLinks","spatialDetailBottom","spatialCaseSearch"])expect(body).toContain(`class="${className}"`);
    expect(body).toContain(`href="${game.href}"`);expect(body).toContain('id="spatial-detail-title"');expect(body).toContain('<button');
  });

  it("tracks the live 262→280px source and camera drift without jumping or restarting unchanged motion",()=>{
    const f=returnTrackingFixture(),{env,surface}=f,box=env.mediaBox.current;
    expect(detailSurfaceQuad(box,env.liveReturnPose()!)[1].x-detailSurfaceQuad(box,env.liveReturnPose()!)[0].x).toBeCloseTo(262,8);
    surface.sample(300);const painted=detailSurfaceQuad(box,surface.value),velocity=[...surface.velocity];f.matrix();env.trackReturn(300);
    expectQuad(detailSurfaceQuad(box,surface.value),painted);expect(surface.velocity).toEqual(velocity);expect(env.returnDeadline.current).toBe(1040);expect(f.move).toHaveBeenCalledTimes(1);
    const fresh=detailSurfaceQuad(box,env.returnDestination.current!);expect(Math.max(...fresh.map(p=>p.x))-Math.min(...fresh.map(p=>p.x))).toBeCloseTo(280,8);
    env.trackReturn(300);f.matrix(.3);env.trackReturn(300);expect(f.move).toHaveBeenCalledTimes(1);
    f.matrix(1.1);env.trackReturn(300);expect(f.move).toHaveBeenCalledTimes(2);expectQuad(detailSurfaceQuad(box,surface.value),painted);
    env.scrollY+=23;const scrolled=detailSurfaceQuad(box,env.liveReturnPose()!);expect(scrolled[0].y).toBeCloseTo(fresh[0].y-23,8);
    env.window.location.hash="#game/ballcrown";env.trackReturn(400);expect(f.move).toHaveBeenCalledTimes(2);
    expect(f.layoutReads).not.toHaveBeenCalled();expect(f.styleWrites).not.toHaveBeenCalled();
  });

  it("lands on the latest exact quad at its fixed deadline and drains the release frame",()=>{
    const f=returnTrackingFixture(),{env,surface}=f;f.matrix();env.schedule();
    let now=0;while(f.queue.length&&now<1040){f.queue.shift()!.callback(now);now+=16;}
    // A sub-threshold final source change still becomes the exact endpoint.
    f.matrix(.4);const latest=detailSurfaceQuad(env.mediaBox.current,env.liveReturnPose()!);
    f.queue.shift()!.callback(1040);expect(surface.active).toBe(false);expectQuad(detailSurfaceQuad(env.mediaBox.current,surface.value),latest);
    expect(env.returnDeadline.current).toBe(1040);expect(f.queue).toHaveLength(1);expect(f.tags.at(-1)).toBe("case-return-release");
    f.queue.shift()!.callback(1056);expect(f.queue).toHaveLength(0);expect(env.phase.current).toBe("closed");expect(env.frame.current).toBe(0);
    expect(env.returnProjection.current).toBeNull();expect(env.returnDestination.current).toBeNull();expect(env.returnDeadline.current).toBe(0);
    expect(f.layoutReads).not.toHaveBeenCalled();expect(f.styleWrites).not.toHaveBeenCalled();
  });

  it("fades a disconnected source by the original deadline and cancellation clears tracking and its queue",()=>{
    const f=returnTrackingFixture(),{env,surface}=f;surface.sample(300);const before=[...surface.value];env.returnProjection.current!.element.isConnected=false;
    expect(env.liveReturnPose()).toBeNull();env.trackReturn(300);expect(env.returnProjection.current).toBeNull();expect(env.connectedHandoff.current).toBe(false);expect(env.returnDestination.current![4]).toBe(0);
    expect(surface.value).toEqual(before);expect(f.move).toHaveBeenLastCalledWith(env.returnDestination.current,740,300);expect(env.returnDeadline.current).toBe(1040);
    surface.sample(1040);env.trackReturn(1040);expect(surface.active).toBe(false);expect(surface.value[4]).toBe(0);
    env.schedule();expect(f.queue).toHaveLength(1);f.cancel();expect(f.queue).toHaveLength(0);expect(env.frame.current).toBe(0);expect(env.epoch.current).toBe(1);
    expect(env.returnProjection.current).toBeNull();expect(env.returnDestination.current).toBeNull();expect(env.returnDeadline.current).toBe(0);
  });

  it("preserves a closing plane through Forward's 1290→1779 scroll restoration until its case reopens",()=>{
    const integration=readFileSync(new URL("../../src/components/spatial/GameDetail.tsx",import.meta.url),"utf8"),scrollBody=integration.match(/const scroll=\(\)=>\{([\s\S]*?)\n    \};/)?.[1];
    expect(scrollBody).toBeDefined();
    const scroll=new Function("phase","closeScroll","scrollY","window","spatialCaseIndex","settle",scrollBody!);
    const phase={current:"closing"},closeScroll={current:1290};let settled=0,sourceHeld=true;
    const settle=()=>{settled++;sourceHeld=false;};
    scroll(phase,closeScroll,1779,{location:{hash:"#game/ballcrown"}},spatialCaseIndex,settle);
    expect(settled).toBe(0);expect(phase.current).toBe("closing");expect(sourceHeld).toBe(true);
    const native=nativeBox(393),quad=panelFixture(393,852).quad,source=detailQuadPose(quad,native,1,0)!,motion=new SurfaceMotion(detailSettledPose(quad));
    motion.moveTo(source,1040,0);motion.sample(300);const painted=detailSurfaceQuad({...native,top:native.top-200},motion.value);
    motion.rebase(detailQuadPose(painted,native,motion.value[4],motion.value[5])!,true);motion.moveTo(detailSettledPose(quad),1280,300);motion.sample(300);
    expectQuad(detailSurfaceQuad(native,motion.value),painted);expectHomography(native,motion.value);
    for(const hash of ["","#game/__missing__","#game/%E0%A4%A"]){settled=0;scroll(phase,closeScroll,1779,{location:{hash}},spatialCaseIndex,settle);expect(settled).toBe(1);}
    for(const game of platformGames){settled=0;scroll(phase,closeScroll,1779,{location:{hash:`#game/${game.id}`}},spatialCaseIndex,settle);expect(settled).toBe(0);}
    // A different valid hash suppresses only premature scroll cancellation.
    // If no reopen command follows, the actual normal finish still releases
    // the source and drains its final return frame without a persistent loop.
    const functionBody=(pattern:RegExp)=>{const value=integration.match(pattern)?.[1];expect(value).toBeDefined();return value!;};
    const scheduleBody=functionBody(/function schedule\(token=epoch\.current\) \{([\s\S]*?)\n  \}/),releaseBody=functionBody(/function restoreSourceThenFinish\(\) \{([\s\S]*?)\n  \}/);
    const scheduleFunction=new Function("token","epoch","frame","frameLoop","surface","paintSurface","phase","restoreSourceThenFinish","setArrived","schedule","trackReturn",scheduleBody),releaseFunction=new Function("epoch","clearSource","frame","frameLoop","phase","finishGhost",releaseBody);
    const queue:((now:number)=>void)[]=[],tags:string[]=[],epoch={current:0},frame={current:0},closing=new SurfaceMotion(detailSettledPose(quad));let finished=0;
    const frameLoop={request:(callback:(now:number)=>void,tag:string)=>{queue.push(callback);tags.push(tag);return tags.length;}};
    sourceHeld=true;phase.current="closing";closing.moveTo(source,1040,0);closing.sample(300);
    const release=()=>releaseFunction(epoch,()=>{sourceHeld=false;},frame,frameLoop,phase,()=>{phase.current="closed";finished++;});
    const schedule=(token=epoch.current)=>scheduleFunction(token,epoch,frame,frameLoop,closing,()=>{},phase,release,()=>{},schedule,()=>{});
    settled=0;scroll(phase,closeScroll,1779,{location:{hash:`#game/${platformGames[1].id}`}},spatialCaseIndex,settle);expect(settled).toBe(0);schedule();
    let ticks=0;while(queue.length&&ticks<200){queue.shift()!(300+ticks*16);ticks++;}
    expect(ticks).toBeLessThan(200);expect(queue).toHaveLength(0);expect(finished).toBe(1);expect(phase.current).toBe("closed");expect(sourceHeld).toBe(false);expect(frame.current).toBe(0);expect(tags.at(-1)).toBe("case-return-release");
  });
});
