import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { hash } from './presentation-contract.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'docs');
const variants = JSON.parse(
  await readFile(path.join(root, 'references/image-variants.json'), 'utf8'),
);
const { document } = new JSDOM(await readFile(path.join(directory, 'index.html'), 'utf8')).window;
for (const image of document.querySelectorAll('img[src*="photos/"]')) {
  const source = image.getAttribute('src');
  const entry = variants[path.basename(source)];
  assert.ok(entry, 'Missing image manifest: ' + source);
  assert.equal(Number(image.getAttribute('width')), entry.width);
  assert.equal(Number(image.getAttribute('height')), entry.height);
  const expected = entry.candidates.map((item) => `${item.path} ${item.width}w`);
  expected.push(`${source} ${entry.width}w`);
  assert.deepEqual(
    image
      .getAttribute('srcset')
      .split(',')
      .map((value) => value.trim().replace(/\s+/g, ' ')),
    expected,
  );
  assert.ok(image.getAttribute('sizes'), 'Missing responsive size: ' + source);
  for (const candidate of entry.candidates) {
    const bytes = await readFile(path.join(directory, candidate.path));
    assert.equal(bytes.length, candidate.bytes);
    assert.equal(hash(bytes), candidate.sha256, 'Image candidate changed: ' + candidate.path);
    assert.ok(
      bytes.length < entry.original_bytes,
      'Candidate is larger than original: ' + candidate.path,
    );
  }
}
console.log('Responsive photo candidates, descriptors and unchanged originals verified.');
