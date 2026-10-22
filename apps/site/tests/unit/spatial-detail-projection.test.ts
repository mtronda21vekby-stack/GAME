import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Matrix4, PerspectiveCamera, Vector3 } from "three";
import { DETAIL_REST, detailPlaneStyle, detailProjectQuad, detailQuadPose, detailRectQuad, detailSettledPose, detailSurfaceQuad, type MediaQuad, type MediaRect } from "../../src/components/spatial/detailTransition";
import { panelCSSMatrix, panelStyle } from "../../src/components/spatial/panelProjection";
import { SurfaceMotion } from "../../src/components/spatial/spatialMotion";
import { ORBIT_CARD_WIDTH } from "../../src/components/spatial/spatialState";
import { GameDetail } from "../../src/components/spatial/GameDetail";
import { platformGames } from "../../src/lib/platformGames";

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
});
