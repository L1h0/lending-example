import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import postcss from 'postcss';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'docs');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
// Only whitespace/comments are removed from CSS; selectors, declarations and order stay intact.
function compactCss(source) {
  const tree = postcss.parse(source);
  tree.walkComments((comment) => comment.remove());
  tree.walk((node) => {
    node.raws.before = '';
    if (node.type === 'decl') node.raws.between = ':';
    else if (node.nodes) node.raws.between = '';
    if (node.nodes) {
      node.raws.after = '';
      node.raws.semicolon = false;
    }
  });
  tree.raws.after = '';
  return tree.toString();
}
const stylesheetNames = ['styles.css', 'home.css', 'work.css', 'sections.css'];
const styles = await Promise.all(
  stylesheetNames.map((file) => readFile(path.join(root, file), 'utf8')),
);
await writeFile(path.join(output, 'styles.css'), compactCss(styles.join('\n')));
await writeFile(path.join(output, 'legal.css'), compactCss(styles[0]));
for (const file of ['index.html', 'privacy.html']) {
  const source = await readFile(path.join(root, file), 'utf8');
  const html = source.replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/g, (link) => {
    if (!/href="\.\/styles\.css"/.test(link)) return '';
    return file === 'privacy.html' ? link.replace('./styles.css', './legal.css') : link;
  });
  await writeFile(path.join(output, file), html);
}
await build({
  entryPoints: [path.join(root, 'script.js')],
  outfile: path.join(output, 'script.js'),
  bundle: true,
  minify: true,
  format: 'esm',
  charset: 'utf8',
  target: 'es2022',
  legalComments: 'none',
});
await cp(path.join(root, 'public'), output, { recursive: true });
console.log('GitHub Pages files built in docs/.');
