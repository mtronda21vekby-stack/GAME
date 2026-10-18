import { describe, expect, it, vi } from "vitest";
import { Group, InstancedMesh, Mesh, MeshStandardMaterial, PerspectiveCamera, Box3, BoxGeometry, Texture, Vector3 } from "three";
import { CameraRig } from "../../src/experience/camera/CameraRig";
import { INITIAL_SCROLL_SNAPSHOT } from "../../src/experience/types";
import { disposeModel } from "../../src/components/platform/crownModel";
import { createRibbons, createSpine, createWave } from "../../src/components/spatial/SpatialObjects";
import { SpatialEnvironment } from "../../src/components/spatial/SpatialEnvironment";
import { adaptSpatialBrand } from "../../src/components/spatial/SpatialBrandAdapter";
import { DESKTOP_SPATIAL_CAMERA, MOBILE_SPATIAL_CAMERA, isSpatialGameLaunch, nearestOrbitTurn, nextWorldIndex, orbitCardPose, spatialProgress } from "../../src/components/spatial/spatialState";

describe("Spatial preview", () => {
  it("maps native scroll into one bounded camera journey", () => {
    expect(spatialProgress(0, 100, 1800, 900)).toBe(0);
    expect(spatialProgress(550, 100, 1800, 900)).toBeCloseTo(0.5);
    expect(spatialProgress(2000, 100, 1800, 900)).toBe(1);
    expect(Number.isFinite(spatialProgress(10, 0, 0, 900))).toBe(true);
  });

  it("moves the physical camera from the brand object to the orbital gallery", () => {
    const camera = new PerspectiveCamera();
    const rig = new CameraRig(camera, DESKTOP_SPATIAL_CAMERA);
    const snapshot = { ...INITIAL_SCROLL_SNAPSHOT, viewportWidth: 1440, viewportHeight: 900 };
    rig.update(snapshot, { x: 0, y: 0 }, 0);
    const start = camera.position.clone();
    rig.update({ ...snapshot, progress: 0.5 }, { x: 0, y: 0 }, 0);
    expect(camera.position.distanceTo(start)).toBeGreaterThan(2);
    expect(camera.position.z).toBeCloseTo(12.7);
    expect(camera.projectionMatrix.elements.every(Number.isFinite)).toBe(true);
  });

  it.each([320, 390])("keeps the mobile crown inside a %ipx camera frame", width => {
    const camera = new PerspectiveCamera(37, width / 844, 0.1, 100);
    const rig = new CameraRig(camera, MOBILE_SPATIAL_CAMERA);
    rig.update({ ...INITIAL_SCROLL_SNAPSHOT, viewportWidth: width, viewportHeight: 844, reducedMotion: true }, { x: 0, y: 0 }, 0);
    camera.updateMatrixWorld(true);
    // Existing temporary Crown B, normalised by the replaceable model contract.
    for (const x of [-1.18, 1.18]) for (const y of [-0.995, 0.995]) {
      const screen = new Vector3(1.3 + x * 1.55, 0.1 + y * 1.55, 0.41 * 1.55).project(camera);
      expect(Math.abs(screen.x)).toBeLessThan(1);
      expect(Math.abs(screen.y)).toBeLessThan(1);
    }
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

  it.each([320, 390])("fits a tall replacement GLB below the mobile copy at %ipx without a rig", width => {
    const source = new Group().add(new Mesh(new BoxGeometry(2, 12, 1), new MeshStandardMaterial()));
    source.position.set(4, 7, -2);
    const adapted = adaptSpatialBrand(source, 2.36);
    expect(adapted.portrait).toBe(true);
    adapted.group.position.set(1.3, .6, 0);
    adapted.group.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(adapted.group);
    const camera = new PerspectiveCamera(36, width / 844, .1, 100);
    new CameraRig(camera, MOBILE_SPATIAL_CAMERA).update({ ...INITIAL_SCROLL_SNAPSHOT, viewportWidth:width, viewportHeight:844, reducedMotion:true }, {x:0,y:0}, 0);
    camera.updateMatrixWorld(true);
    for (const x of [bounds.min.x,bounds.max.x]) for (const y of [bounds.min.y,bounds.max.y]) for (const z of [bounds.min.z,bounds.max.z]) {
      const screen = new Vector3(x,y,z).project(camera);
      expect(Math.abs(screen.x)).toBeLessThan(1);
      expect(screen.y).toBeGreaterThan(-1);
      expect(screen.y).toBeLessThan(-.05);
    }
    disposeModel(adapted.group);
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
