import {cp, mkdir, readdir, rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'docs');
await rm(output, {recursive: true, force: true});
await mkdir(output, {recursive: true});
for (const entry of await readdir(root, {withFileTypes: true})) {
  if (entry.isFile() && /\.(html|css|js)$/.test(entry.name)) {
    await cp(path.join(root, entry.name), path.join(output, entry.name));
  }
}
await cp(path.join(root, 'public'), output, {recursive: true});
console.log('GitHub Pages files built in docs/.');
