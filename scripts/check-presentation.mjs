import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { capture, hash } from './presentation-contract.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = JSON.parse(
  await readFile(path.join(root, 'references/presentation-contract.json'), 'utf8'),
);
const directory = path.join(root, 'docs');
const actual = await capture(directory);
assert.deepEqual(
  actual.pages,
  baseline.pages,
  'Page text, structure or non-image attributes changed.',
);
assert.deepEqual(
  actual.styleCascade,
  baseline.styleCascade,
  'CSS declarations, selectors or their cascade order changed.',
);
for (const [file, expected] of Object.entries(baseline.originalAssets)) {
  assert.equal(
    hash(await readFile(path.join(directory, file))),
    expected,
    'Original asset changed: ' + file,
  );
}
console.log('Presentation preserved: page structure/text, CSS cascade and original assets.');
