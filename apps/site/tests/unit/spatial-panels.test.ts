import React from "react";
import { describe, expect, it } from "vitest";
import { Matrix4, PerspectiveCamera, Vector3 } from "three";
import { renderToStaticMarkup } from "react-dom/server";
import { CameraRig } from "../../src/experience/camera/CameraRig";
import { INITIAL_SCROLL_SNAPSHOT } from "../../src/experience/types";
import { GamePanel } from "../../src/components/spatial/GamePanel";
import { panelCSSMatrix, panelFrontWidth, panelScrollOffset, panelStyle } from "../../src/components/spatial/panelProjection";
import { MOBILE_SPATIAL_CAMERA, ORBIT_CARD_WIDTH } from "../../src/components/spatial/spatialState";
import { platformGames } from "../../src/lib/platformGames";

describe("Live spatial interface panels", () => {
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
    new CameraRig(camera, MOBILE_SPATIAL_CAMERA).update({ ...INITIAL_SCROLL_SNAPSHOT, progress: 0.5, viewportWidth, viewportHeight }, { x: 0, y: 0 }, 0);
    camera.updateMatrixWorld();
    const width = panelFrontWidth(camera, viewportWidth, ORBIT_CARD_WIDTH, new Vector3(0, 0.8, 3.6)), height = 430;
    const world = new Matrix4().makeTranslation(0, 0.8, 3.85);
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
    const html = renderToStaticMarkup(React.createElement(GamePanel, { game, index: 0, selected: true, onSelect: () => {}, onOpen: () => {} }));
    expect(html).toContain(game.title);
    expect(html).toContain(game.description);
    expect(html).toContain(game.status);
    expect(html).toContain(`href="${game.href}"`);
    expect(html).toContain("<button");
    expect(html).not.toContain("<canvas");
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
