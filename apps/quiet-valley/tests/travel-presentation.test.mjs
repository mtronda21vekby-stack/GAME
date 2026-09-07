import test from 'node:test';
import assert from 'node:assert/strict';
import {createInteractions} from '../src/input/interactions.js';

function harness(t, {rejectTravel = false} = {}) {
 const makeElement = () => {
  const classes = new Set();
  return {dataset: {}, hidden: false, textContent: '', classList: {
   add: name => classes.add(name), remove: name => classes.delete(name),
   contains: name => classes.has(name)
  }};
 };
 const elements = new Map();
 const element = selector => {
  if (!elements.has(selector)) elements.set(selector, makeElement());
  return elements.get(selector);
 };
 const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
 Object.defineProperty(globalThis, 'document', {configurable: true, value: {
  body: makeElement(), querySelectorAll: () => [],
  getElementById: id => element('#' + id)
 }});
 t.after(() => {
  if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
  else delete globalThis.document;
 });
 let state = {world: {region: 'farm'}, plots: [], animals: []};
 const timers = [], noop = () => {};
 const ports = {
  state, selected: null, buildType: null, modalKind: null, tool: 'inspect',
  $: element, session: {
   dispatch: action => {
    if (rejectTravel) return {ok: false, message: 'Travel blocked'};
    state = {...state, world: {...state.world, region: action.region}};
    return {ok: true, message: 'Travelled', effect: 'travel'};
   }, snapshot: () => state
  },
  lifetime: {timeout: (callback, delay) => timers.push({callback, delay})},
  world: {sync: noop, setPlacement: noop}, art: {updateCrops: noop},
  waterFX: {animate: noop}, gameNow: () => 1000,
  toast: noop, closeModal: noop, defaultCamera: noop, updateSelection: noop,
  renderDetails: noop, chime: noop, save: noop, updateUI: noop, updateLabels: noop
 };
 return {run: createInteractions(ports).run, shade: element('#location-shade'), timers, ports};
}

test('travel keeps the scene covered until the presentation controller finishes', t => {
 const h = harness(t);
 assert.equal(h.run({type: 'travel', region: 'river'}).ok, true);
 assert.equal(h.ports.state.world.region, 'river');
 assert.equal(h.shade.classList.contains('active'), true);
 assert.equal(h.timers.length, 0, 'travel must not schedule an early veil-removal timer');
});

test('same-region travel cannot cover an already presented scene indefinitely', t => {
 const h = harness(t);
 h.run({type: 'travel', region: 'farm'});
 assert.equal(h.shade.classList.contains('active'), false);
 assert.equal(h.timers.length, 0);
});

test('same-region commands do not uncover a frame that is still pending', t => {
 const h = harness(t);
 h.shade.classList.add('active');
 h.run({type: 'travel', region: 'farm'});
 assert.equal(h.shade.classList.contains('active'), true);
 assert.equal(h.timers.length, 0);
});

test('rejected travel leaves presentation and location untouched', t => {
 const h = harness(t, {rejectTravel: true});
 assert.equal(h.run({type: 'travel', region: 'river'}).ok, false);
 assert.equal(h.ports.state.world.region, 'farm');
 assert.equal(h.shade.classList.contains('active'), false);
 assert.equal(h.timers.length, 0);
});
