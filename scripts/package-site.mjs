// Sites serves the same checked build from dist/; GitHub Pages serves docs/.
import { cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../docs/', import.meta.url));
const destination = fileURLToPath(new URL('../dist/', import.meta.url));
await rm(destination, { recursive: true, force: true });
await cp(source, destination, { recursive: true });
console.log('Checked static build copied to dist/ for Sites.');
