import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { geometry } from '../src/rendering/geometry.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('top visual pass keeps source-owned weather, contact and cinematic material cues', () => {
  const frag = read('src/rendering/shaders/frag.js');
  assert.match(frag, /uniform float[^;]*uRain/);
  assert.match(frag, /cloudShade/);
  assert.match(frag, /material>9\.5&&material<10\.5/);
  assert.match(frag, /wetSpec|rain/);
  assert.doesNotMatch(frag, /iPhone|navigator\.userAgent/);
});

test('contact shadow geometry is finite and cheap', () => {
  const data = geometry('disc');
  assert.ok(data.length > 0);
  assert.equal(data.length % 6, 0);
  assert.ok(data.length / 18 <= 40, 'disc should stay below 40 triangles');
  for (const value of data) assert.ok(Number.isFinite(value));
});

test('farm scene owns authored contact cues and market readiness light', () => {
  const farm = read('src/scene/farm.js');
  assert.match(farm, /R\.add\('disc'/);
  assert.match(farm, /orderLamp/);
  assert.match(farm, /readyOrder/);
});

test('mobile presentation is explicitly low chrome and keeps the playfield visible', () => {
  const css = read('src/presentation/atelier.css');
  assert.match(css, /0\.7 top-tier mobile composition/);
  assert.match(css, /\.weather-chip,\.lease-chip\{display:none!important\}/);
  assert.match(css, /\.view-controls\{display:none!important\}/);
  assert.match(css, /#objective-chip\{top:[^}]+height:40px!important/);
  assert.match(css, /\.toolbar\{[^}]*height:58px!important/);
});
