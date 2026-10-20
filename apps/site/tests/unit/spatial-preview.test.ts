import { describe, expect, it, vi } from "vitest";
import { Group, InstancedMesh, Mesh, MeshStandardMaterial, PerspectiveCamera, Box3, BoxGeometry, Frustum, Matrix4, Texture, Vector3 } from "three";
import { CameraRig } from "../../src/experience/camera/CameraRig";
import { INITIAL_SCROLL_SNAPSHOT } from "../../src/experience/types";
import { disposeModel } from "../../src/components/platform/crownModel";
import { createRibbons, createSpine, createWave } from "../../src/components/spatial/SpatialObjects";
import { SpatialEnvironment } from "../../src/components/spatial/SpatialEnvironment";
import { spatialAxisJourney, spatialScrollWorld } from "../../src/components/spatial/SpatialAxis";
import { isSpatialGameLaunch, nearestOrbitTurn, nextWorldIndex, orbitCardPose, spatialProgress } from "../../src/components/spatial/spatialState";

describe("Spatial preview", () => {
  it("maps native scroll into one bounded camera journey", () => {
    expect(spatialProgress(0, 100, 1800, 900)).toBe(0);
    expect(spatialProgress(550, 100, 1800, 900)).toBeCloseTo(0.5);
    expect(spatialProgress(2000, 100, 1800, 900)).toBe(1);
    expect(Number.isFinite(spatialProgress(10, 0, 0, 900))).toBe(true);
  });

  it.each([320,390,800,1160])("frames the head, descends the axis and clears its tip at %ipx",width=>{
    const compact=width<=760,height=844,slot={x:compact?width/2:width*.73,y:compact?710:422,width:compact?width-40:450,height:compact?300:500};
    const {axisHeight,frames}=spatialAxisJourney({compact,width,height,slot});
    const camera=new PerspectiveCamera(38,width/height,.1,100),rig=new CameraRig(camera,frames,true);
    const snapshot={...INITIAL_SCROLL_SNAPSHOT,viewportWidth:width,viewportHeight:height,reducedMotion:true};
    rig.update(snapshot,{x:0,y:0},0);camera.updateMatrixWorld(true);
    const head=new Vector3(0,axisHeight*.35,0).project(camera);
    expect((head.x+1)*width/2).toBeCloseTo(slot.x,5);expect((1-head.y)*height/2).toBeCloseTo(slot.y,5);
    const bounds=new Box3(new Vector3(-axisHeight*.123,-axisHeight*.5,-axisHeight*.112),new Vector3(axisHeight*.123,axisHeight*.5,axisHeight*.112));
    let previous=camera.position.y;
    for(let step=0;step<=200;step++){
      rig.update({...snapshot,progress:step/200},{x:0,y:0},0);camera.updateMatrixWorld(true);
      expect(camera.position.y).toBeLessThanOrEqual(previous+.0001);previous=camera.position.y;
      if(step/200<=.82)expect(new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)).intersectsBox(bounds)).toBe(true);
    }
    const tip=new Vector3(0,-axisHeight*.5,0).project(camera);
    expect(tip.y).toBeGreaterThan(1);
  });

  it("takes the shortest orbit in both directions and keeps the wrapped card facing forward", () => {
    const previous = nearestOrbitTurn(0, 3, 4);
    expect(previous).toBeCloseTo(-Math.PI / 2);
    const pose = orbitCardPose(3, 4, previous);
    expect(pose.x).toBeCloseTo(0);
    expect(pose.rotation).toBeCloseTo(0);
    expect(nearestOrbitTurn(previous, 0, 4)).toBeCloseTo(0);
    const beforeBack = orbitCardPose(0, 4, Math.PI - 0.001);
    const afterBack = orbitCardPose(0, 4, Math.PI + 0.001);
    expect(Math.abs(afterBack.rotation - beforeBack.rotation)).toBeLessThan(0.01);
  });

  it("reveals the four real worlds in order on descent and in reverse on ascent",()=>{
    const visible=[0,1,2,3],positions=[1000,1250,1500,1750,2000];
    const forward=positions.map(y=>spatialScrollWorld(y,1000,2000,visible));
    expect(forward).toEqual([0,1,2,3,3]);
    expect([...positions].reverse().map(y=>spatialScrollWorld(y,1000,2000,visible))).toEqual([...forward].reverse());
    expect(spatialScrollWorld(1500,1000,2000,[1])).toBe(1);
    expect(spatialScrollWorld(1500,1000,2000,[0,3])).toBe(3);
  });

  it("cycles only actual games in the active genre, including a single-game selection", () => {
    expect(nextWorldIndex(0, -1)).toBe(3);
    expect(nextWorldIndex(3, 1, [0, 3])).toBe(0);
    expect(nextWorldIndex(1, -1, [1])).toBe(1);
  });

  it("leaves mobile triangle headroom for the replaceable GLB and real game media", () => {
    const spine = createSpine(true), wave = createWave(true), ribbons = createRibbons();
    const root = new Group().add(spine, wave.mesh, ribbons, new SpatialEnvironment(true));
    let triangles = 0;
    root.traverse(object => { const mesh = object as Mesh; if (mesh.isMesh) triangles += (mesh.geometry.index?.count ?? mesh.geometry.attributes.position.count) / 3 * (mesh instanceof InstancedMesh ? mesh.count : 1); });
    expect(triangles).toBeLessThan(20000);
    disposeModel(root); wave.mesh.dispose();
  });

  it("identifies game launches without treating catalogue/profile navigation as a game", () => {
    const origin = "https://blackcrown.work";
    expect(isSpatialGameLaunch("/games/ballcrown/", origin)).toBe(true);
    expect(isSpatialGameLaunch("/game/?mode=next", origin)).toBe(true);
    expect(isSpatialGameLaunch("/games/quiet-valley/", origin)).toBe(true);
    expect(isSpatialGameLaunch("/games/", origin)).toBe(false);
    expect(isSpatialGameLaunch("/account", origin)).toBe(false);
    expect(isSpatialGameLaunch("https://example.org/games/ballcrown/", origin)).toBe(false);
  });

  it("disposes shared model resources once, including embedded image bitmaps", () => {
    const image = { close: vi.fn() };
    const texture = new Texture(image);
    const geometry = new BoxGeometry();
    const material = new MeshStandardMaterial({ map: texture });
    const disposeGeometry = vi.spyOn(geometry, "dispose");
    const disposeMaterial = vi.spyOn(material, "dispose");
    const disposeTexture = vi.spyOn(texture, "dispose");
    const root = new Group();
    root.add(new Mesh(geometry, material), new Mesh(geometry, material));
    disposeModel(root);
    expect(disposeGeometry).toHaveBeenCalledTimes(1);
    expect(disposeMaterial).toHaveBeenCalledTimes(1);
    expect(disposeTexture).toHaveBeenCalledTimes(1);
    expect(image.close).toHaveBeenCalledTimes(1);
  });
});
