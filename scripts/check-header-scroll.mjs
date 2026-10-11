import test from 'node:test';
import assert from 'node:assert/strict';
import {initHeaderScroll} from '../docs/header-scroll.js';

function page({scroll = 0, reduced = false} = {}) {
  const styles = new Map();
  const attributes = new Map();
  const events = new Map();
  const frames = [];
  let height = 100;
  let sectionTop = 1000;
  let menuClosures = 0;
  let observer;
  const header = {
    style: {setProperty: (key, value) => styles.set(key, value)},
    getBoundingClientRect: () => ({height}),
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: key => attributes.delete(key)
  };
  const motion = {matches: reduced, addEventListener: (_, callback) => {motion.onChange = callback;}};
  globalThis.window = {
    scrollY: scroll,
    matchMedia: () => motion,
    requestAnimationFrame: callback => {frames.push(callback); return frames.length;},
    addEventListener: (type, callback) => events.set(type, callback),
    ResizeObserver: class {constructor(callback) {observer = callback;} observe() {}}
  };
  globalThis.document = {querySelector: selector => ({
    '.siteHeader': header,
    '#pick': {getBoundingClientRect: () => ({top: sectionTop - window.scrollY})},
    '.heroStage': {}
  }[selector])};
  initHeaderScroll(() => menuClosures++);
  return {
    header, attributes,
    shift: () => parseFloat(styles.get('--header-shift')),
    scroll: y => {window.scrollY = y; events.get('scroll')();},
    flush: () => {while (frames.length) frames.shift()();},
    queued: () => frames.length,
    closures: () => menuClosures,
    reflow: (nextHeight, nextTop) => {height = nextHeight; sectionTop = nextTop; observer();},
    pageshow: () => events.get('pageshow')(),
    motion: value => {motion.matches = value; motion.onChange();}
  };
}

test('header retreats through the hero, hides at section 01, and returns at the top', () => {
  const p = page();
  assert.equal(p.shift(), 0);
  p.scroll(488); p.flush();
  assert.equal(p.shift(), -50);
  assert.equal(p.header.inert, false);
  p.scroll(976); p.flush();
  assert.equal(p.shift(), -100);
  assert.equal(p.header.inert, true);
  assert.equal(p.attributes.get('aria-hidden'), 'true');
  p.scroll(3000); p.flush();
  assert.equal(p.shift(), -100);
  p.scroll(488); p.flush();
  assert.equal(p.shift(), -50);
  assert.equal(p.header.inert, false);
  p.scroll(0); p.flush();
  assert.equal(p.shift(), 0);
  assert.equal(p.attributes.has('aria-hidden'), false);
});

test('responsive reflow recalculates both the section boundary and actual header height', () => {
  const p = page({scroll: 488});
  p.reflow(120, 1976); p.flush();
  assert.equal(p.shift(), -30);
  p.scroll(1952); p.flush();
  assert.equal(p.shift(), -120);
  assert.equal(p.header.inert, true);
});

test('restored page positions and overscroll produce the correct initial state', () => {
  const p = page({scroll: 2200});
  assert.equal(p.header.inert, true);
  p.scroll(-40); p.pageshow(); p.flush();
  assert.equal(p.shift(), 0);
  assert.equal(p.header.inert, false);
});

test('scroll work is batched, and scrolling closes the mobile menu', () => {
  const p = page();
  p.scroll(200); p.scroll(488);
  assert.equal(p.queued(), 1);
  p.flush();
  assert.equal(p.shift(), -50);
  assert.equal(p.closures(), 1);
});

test('reduced motion avoids continuous translation and responds to preference changes', () => {
  const p = page({reduced: true});
  p.scroll(488); p.flush();
  assert.equal(p.shift(), 0);
  p.motion(false); p.flush();
  assert.equal(p.shift(), -50);
  p.motion(true); p.scroll(976); p.flush();
  assert.equal(p.shift(), -100);
  assert.equal(p.header.inert, true);
});
