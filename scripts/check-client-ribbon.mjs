import test from 'node:test';
import assert from 'node:assert/strict';
import {initClientRibbon} from '../docs/client-ribbon.js';

test('continuous loop initializes without a pause button or motion/visibility listeners', () => {
  const classes = new Set();
  const attributes = new Map();
  const duplicate = {setAttribute: (key, value) => attributes.set(key, value)};
  const group = {cloneNode: () => duplicate};
  const copies = [];
  const track = {querySelector: () => group, append: element => copies.push(element)};
  const ribbon = {querySelector: () => track, classList: {add: name => classes.add(name)}};
  globalThis.document = {
    querySelector: selector => {
      assert.equal(selector, '.clientsBand');
      return ribbon;
    }
  };
  globalThis.window = {};
  initClientRibbon();
  assert.equal(copies.length, 1);
  assert.equal(attributes.get('aria-hidden'), 'true');
  assert.equal(duplicate.inert, true);
  assert.equal(classes.has('is-moving'), true);
});

test('pages without the client ribbon remain unaffected', () => {
  globalThis.document = {querySelector: () => null};
  assert.doesNotThrow(() => initClientRibbon());
});
