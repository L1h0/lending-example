import test from 'node:test';
import assert from 'node:assert/strict';
import {initClientRibbon} from '../docs/client-ribbon.js';

function fixture(reduced = false) {
  const classes = new Set();
  const attributes = new Map();
  const events = new Map();
  let click;
  let intersection;
  const duplicate = {setAttribute: (key, value) => attributes.set(key, value)};
  const group = {cloneNode: () => duplicate};
  const copies = [];
  const track = {querySelector: () => group, append: element => copies.push(element)};
  const ribbon = {querySelector: () => track, dataset: {}, classList: {
    toggle: (name, value) => value ? classes.add(name) : classes.delete(name)
  }};
  const button = {setAttribute: (key, value) => attributes.set('button-' + key, value), addEventListener: (_, cb) => {click = cb;}};
  const motion = {matches: reduced, addEventListener: (_, cb) => {motion.change = cb;}};
  globalThis.document = {
    hidden: false,
    querySelector: selector => selector === '.clientsBand' ? ribbon : button,
    addEventListener: (name, cb) => events.set(name, cb)
  };
  globalThis.window = {
    matchMedia: () => motion,
    IntersectionObserver: class {constructor(cb) {intersection = cb;} observe() {}}
  };
  initClientRibbon();
  return {classes, attributes, copies, duplicate, ribbon, button,
    click: () => click(),
    motion: value => {motion.matches = value; motion.change();},
    visible: value => intersection([{isIntersecting: value}]),
    tabHidden: value => {document.hidden = value; events.get('visibilitychange')();}
  };
}

test('loop has one duplicate, hidden from assistive technology and keyboard focus', () => {
  const p = fixture();
  assert.equal(p.copies.length, 1);
  assert.equal(p.attributes.get('aria-hidden'), 'true');
  assert.equal(p.duplicate.inert, true);
  assert.equal(p.classes.has('is-moving'), true);
});

test('pause can be toggled and its visible label reflects the requested state', () => {
  const p = fixture();
  p.click();
  assert.equal(p.ribbon.dataset.paused, 'true');
  assert.equal(p.attributes.get('button-aria-pressed'), 'true');
  assert.equal(p.button.textContent, 'Продолжить движение');
  p.click();
  assert.equal(p.ribbon.dataset.paused, 'false');
  assert.equal(p.button.textContent, 'Приостановить ленту');
});

test('reduced motion uses the complete static group and preserves a manual pause preference', () => {
  const p = fixture(true);
  assert.equal(p.classes.has('is-moving'), false);
  assert.equal(p.button.hidden, true);
  p.motion(false); p.click(); p.motion(true); p.motion(false);
  assert.equal(p.classes.has('is-moving'), true);
  assert.equal(p.button.hidden, false);
  assert.equal(p.ribbon.dataset.paused, 'true');
});

test('animation pauses when outside the viewport or when the tab is hidden', () => {
  const p = fixture();
  p.visible(false); assert.equal(p.classes.has('is-outside'), true);
  p.visible(true); assert.equal(p.classes.has('is-outside'), false);
  p.tabHidden(true); assert.equal(p.classes.has('is-tab-hidden'), true);
  p.tabHidden(false); assert.equal(p.classes.has('is-tab-hidden'), false);
});
