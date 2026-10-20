import React from "react";
import { describe, expect, it, vi } from "vitest";
import { Group, Matrix4, Mesh, MeshBasicMaterial, PerspectiveCamera, Vector3 } from "three";
import { renderToStaticMarkup } from "react-dom/server";
import { CameraRig } from "../../src/experience/camera/CameraRig";
import { INITIAL_SCROLL_SNAPSHOT } from "../../src/experience/types";
import { GamePanel, GamePanelGrid } from "../../src/components/spatial/GamePanel";
import { GameDetail } from "../../src/components/spatial/GameDetail";
import { panelCSSMatrix, panelFrontWidth, panelScreenPosition, panelScrollOffset, panelStyle } from "../../src/components/spatial/panelProjection";
import { ORBIT_CARD_WIDTH } from "../../src/components/spatial/spatialState";
import { spatialAxisJourney } from "../../src/components/spatial/SpatialAxis";
import { platformGames } from "../../src/lib/platformGames";
import { SpatialGalleryStage } from "../../src/components/spatial/SpatialGalleryStage";

describe("Live spatial interface panels", () => {
  it("keeps mobile covers in front and restores world occlusion on cached desktop meshes",()=>{
    vi.stubGlobal("window",{scrollX:0,scrollY:0});
    try {
    const style=()=>({setProperty(){},removeProperty(){}});
    const articles=["evofish","quiet-valley"].map(gameId=>{
      const surface={offsetWidth:264,offsetHeight:260,style:style()};
      return {dataset:{gameId},style:style(),getBoundingClientRect:()=>({left:22,top:200}),
        querySelector:(selector:string)=>selector===".spatialPanelSurface"?surface:selector===".spatialPanelMedia"?{offsetTop:32,offsetHeight:165}:null};
    });
    const stage={querySelectorAll:()=>articles} as unknown as HTMLElement,scene=new Group();
    const gallery=new SpatialGalleryStage(stage,scene);
    gallery.layout(393,710,true,false);
    const group=scene.children[0] as Group,meshes=group.children.slice() as Mesh[],materials=meshes.map(m=>m.material as MeshBasicMaterial);
    expect(meshes).toHaveLength(2);
    expect(materials.every(m=>!m.depthTest&&!m.depthWrite)).toBe(true);
    expect(meshes.every(m=>m.renderOrder>100)).toBe(true);
    expect(meshes[0].renderOrder).toBeLessThan(meshes[1].renderOrder);
    gallery.layout(1440,900,false,false);
    expect(group.children).toEqual(meshes);
    expect(meshes.map(m=>m.material)).toEqual(materials);
    expect(materials.every(m=>m.depthTest&&!m.depthWrite)).toBe(true);
    expect(meshes.every(m=>m.renderOrder===0)).toBe(true);
    gallery.layout(393,710,true,false);
    expect(group.children).toEqual(meshes);
    expect(materials.every(m=>!m.depthTest)).toBe(true);
    expect(meshes.every(m=>m.renderOrder>100)).toBe(true);
    gallery.dispose();
    } finally { vi.unstubAllGlobals(); }
  });
  it("serializes the reported mobile projection with unit W without moving its corners",()=>{
    // Captured at the fourth card on5fcfa05: correct bounds but WebKit mispainted W≈23.36.
    const raw=new Matrix4().fromArray([20.457893,-.200432,.00144,-.001438,.023677,20.685309,-.000265,.000264,-3.257048,-2.626752,.018878,-.01884,228.528458,417.24223,-23.206809,23.360242]);
    const original=raw.elements.slice(),values=panelStyle(raw).slice(9,-1).split(",").map(Number),css=new Matrix4().fromArray(values);
    expect(values.every(Number.isFinite)).toBe(true);expect(css.elements[15]).toBe(1);
    for(const x of [0,264])for(const y of [0,259.75]){
      const a=new Vector3(x,y,0).applyMatrix4(raw),b=new Vector3(x,y,0).applyMatrix4(css);
      expect(b.x).toBeCloseTo(a.x,6);expect(b.y).toBeCloseTo(a.y,6);
    }
    expect(raw.elements).toEqual(original);
  });
  it("projects native HTML corners onto the same pixels as a rotated WebGL surface", () => {
    const camera = new PerspectiveCamera(40, 1440 / 900, 0.1, 100);
    camera.position.set(2, 1, 12); camera.lookAt(0, 0.5, 0); camera.updateMatrixWorld();
    const world = new Matrix4().makeRotationY(-0.45); world.setPosition(-1, 0.8, 2.9);
    const width = 560, height = 410;
    const css = panelCSSMatrix(camera, world, 1440, 900, width, height, ORBIT_CARD_WIDTH);
    for (const x of [0, width]) for (const y of [0, height]) {
      const actual = new Vector3(x, y, 0).applyMatrix4(css);
      const expected = new Vector3((x - width / 2) * ORBIT_CARD_WIDTH / width, -(y - height / 2) * ORBIT_CARD_WIDTH / width, 0).applyMatrix4(world).project(camera);
      expect(actual.x).toBeCloseTo((expected.x + 1) * 720, 6);
      expect(actual.y).toBeCloseTo((1 - expected.y) * 450, 6);
    }
    expect(panelStyle(css)).not.toMatch(/NaN|Infinity/);
  });

  it.each([320, 390])("keeps a 50px action tappable and the selected panel inside a %ipx view", viewportWidth => {
    const viewportHeight = 844, camera = new PerspectiveCamera(36, viewportWidth / viewportHeight, 0.1, 100);
    const {frames}=spatialAxisJourney({compact:true,width:viewportWidth,height:viewportHeight,slot:{x:viewportWidth/2,y:720,width:viewportWidth-40,height:300}});
    new CameraRig(camera, frames,true).update({ ...INITIAL_SCROLL_SNAPSHOT, progress: 0.5, viewportWidth, viewportHeight }, { x: 0, y: 0 }, 0);
    camera.updateMatrixWorld();
    const center=panelScreenPosition(camera,viewportWidth/2,480,viewportWidth,viewportHeight,3.85);
    const width=viewportWidth-40,height=430,scale=width/panelFrontWidth(camera,viewportWidth,ORBIT_CARD_WIDTH,center);
    const world=new Matrix4().makeScale(scale,scale,scale);world.setPosition(center);
    const matrix = panelCSSMatrix(camera, world, viewportWidth, viewportHeight, width, height, ORBIT_CARD_WIDTH);
    for (const x of [0, width]) for (const y of [0, height]) {
      const point = new Vector3(x, y, 0).applyMatrix4(matrix);
      expect(point.x).toBeGreaterThan(0); expect(point.x).toBeLessThan(viewportWidth);
      expect(point.y).toBeGreaterThan(0); expect(point.y).toBeLessThan(viewportHeight);
    }
    const top = new Vector3(20, height - 70, 0).applyMatrix4(matrix), bottom = new Vector3(20, height - 20, 0).applyMatrix4(matrix);
    expect(bottom.distanceTo(top)).toBeGreaterThanOrEqual(48);
  });

  it.each(platformGames)("keeps real text and an actual launch link in the $title panel", game => {
    const html = renderToStaticMarkup(React.createElement(GamePanel, { game, index: 0, selected: true, onOpen: () => {} }));
    expect(html).toContain(game.title);
    expect(html).toContain(game.status);
    expect(html).toContain(`href="${game.href}"`);
    expect(html).toContain("<button");
    expect(html.match(/<button\b/g)).toHaveLength(1);
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-controls="spatial-game-detail"');
    expect(html).toContain('class="spatialPanelLaunch"');
    expect(html).not.toContain("<canvas");
    const detail = renderToStaticMarkup(React.createElement(GameDetail, { game, open: false, canCycle: true, paused: false, onClose: () => {}, onPrevious: () => {}, onNext: () => {}, onTogglePause: () => {} }));
    expect(detail).toContain(game.description);
    expect(detail).toContain(game.detail);
    expect(detail).toContain(`href="${game.href}"`);
    expect(detail).toContain('id="spatial-game-detail"');
  });

  it("shows all four full game panels with direct launches without a preliminary selection",()=>{
    const html=renderToStaticMarkup(React.createElement(GamePanelGrid,{selected:0,visible:[0,1,2,3],onOpen:()=>{}}));
    expect(html.match(/<article\b/g)).toHaveLength(4);
    expect(html.match(/<img\b/g)).toHaveLength(4);
    expect(html.match(/aria-haspopup="dialog"/g)).toHaveLength(4);
    for(const game of platformGames){
      expect(html).toContain(game.title);
      expect(html).toContain(`src="${game.image}"`);
      expect(html).toContain(`href="${game.href}"`);
    }
    expect(html).not.toMatch(/<article\b[^>]*\shidden(?:[=>\s])/);
    const filtered=renderToStaticMarkup(React.createElement(GamePanelGrid,{selected:1,visible:[1,2],onOpen:()=>{}}));
    expect(filtered.match(/<article\b/g)).toHaveLength(2);
    expect(filtered).not.toContain(`href="${platformGames[0].href}"`);
    expect(filtered).toContain(`href="${platformGames[1].href}"`);
  });

  it("moves panels with their document slot while leaving following navigation clear", () => {
    const camera = new PerspectiveCamera(36, 390 / 844, 0.1, 100);
    camera.position.set(0, 2, 22.4); camera.lookAt(0, 1.75, 0.6); camera.updateMatrixWorld();
    for (const target of [250, 480, 700]) {
      const center = new Vector3(0, 0.8, 3.6);
      center.y += panelScrollOffset(camera, center, target, 844);
      const projected = center.project(camera);
      expect((1 - projected.y) * 422).toBeCloseTo(target, 0);
    }
  });
});
