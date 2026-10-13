import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

export const stylesheets = ['styles.css', 'home.css', 'work.css', 'sections.css'];
export const hash = (value) => createHash('sha256').update(value).digest('hex');

export function usedClasses(pages, scripts) {
  const classes = new Set();
  for (const html of pages) {
    const { document } = new JSDOM(html).window;
    for (const element of document.querySelectorAll('[class]')) {
      for (const name of element.classList) classes.add(name);
    }
  }
  // Retain classes referenced by JavaScript, including transient menu/ribbon states.
  for (const script of scripts)
    for (const token of script.match(/[\w-]+/g) || []) classes.add(token);
  return classes;
}

export function pruneUnusedClasses(tree, classes) {
  let removed = 0;
  tree.walkRules((rule) => {
    const selectors = selectorParser().astSync(rule.selector);
    for (const selector of [...selectors.nodes]) {
      let unused = false;
      selector.walkClasses((node) => {
        if (!classes.has(node.value)) unused = true;
      });
      if (unused) {
        selector.remove();
        removed++;
      }
    }
    if (selectors.nodes.length) rule.selector = selectors.toString();
    else rule.remove();
  });
  tree.walkAtRules((rule) => {
    if (rule.nodes && !rule.nodes.length) rule.remove();
  });
  return removed;
}

function normalize(value) {
  return value
    .replace(/(['"])(.*?)\1/g, (_, quote, text) => JSON.stringify(text))
    .replace(/(^|[\s(,:])(-?)\.(\d)/g, (_, prefix, sign, digit) => prefix + sign + '0.' + digit)
    .replace(
      /(\[[\w-]+[~|^$*]?=)(?:"([^"]*)"|'([^']*)'|([^\]\s]+))\]/g,
      (_, prefix, a, b, c) => prefix + JSON.stringify(a ?? b ?? c) + ']',
    )
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),:>+~/])\s*/g, '$1')
    .trim();
}

export function cssRecords(tree) {
  const declarations = [];
  tree.walkDecls((declaration) => {
    const parents = [];
    for (let node = declaration.parent; node.type !== 'root'; node = node.parent) {
      parents.unshift(
        node.type === 'rule'
          ? normalize(node.selector)
          : '@' + node.name + ' ' + normalize(node.params),
      );
    }
    declarations.push([
      parents,
      declaration.prop,
      normalize(declaration.value),
      !!declaration.important,
    ]);
  });
  return declarations;
}

export function cssSignature(tree) {
  return hash(JSON.stringify(cssRecords(tree)));
}

export function pageSignature(html) {
  const { document } = new JSDOM(html).window;
  function visit(node) {
    if (node.nodeType === 3) return node.textContent.replace(/\s+/g, ' ').trim() || null;
    if (node.nodeType !== 1) return null;
    const attributes = [...node.attributes]
      .filter(({ name }) => !(node.tagName === 'IMG' && ['srcset', 'sizes'].includes(name)))
      .map(({ name, value }) => [name, value])
      .sort(([a], [b]) => a.localeCompare(b));
    return [
      node.tagName,
      attributes,
      [...node.childNodes].map(visit).filter((value) => value !== null),
    ];
  }
  return hash(JSON.stringify(visit(document.body)));
}

export async function capture(directory, classes) {
  const result = { pages: {}, styleCascade: {} };
  for (const file of ['index.html', 'privacy.html']) {
    const html = await readFile(path.join(directory, file), 'utf8');
    result.pages[file] = pageSignature(html);
    const { document } = new JSDOM(html).window;
    const declarations = [];
    for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
      const tree = postcss.parse(
        await readFile(path.join(directory, link.getAttribute('href')), 'utf8'),
      );
      if (classes) pruneUnusedClasses(tree, classes);
      declarations.push(...cssRecords(tree));
    }
    result.styleCascade[file] = hash(JSON.stringify(declarations));
  }
  return result;
}
