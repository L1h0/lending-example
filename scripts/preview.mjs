import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../docs/', import.meta.url));
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const port = Number(portIndex >= 0 ? args[portIndex + 1] : process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
};
http
  .createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/__qa') {
        const width = Math.max(320, Math.min(1400, Number(url.searchParams.get('width')) || 375));
        const text = url.searchParams.get('text') === '200' ? '&text=200' : '';
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(
          `<!doctype html><html><head><title>Responsive verification</title><style>body{margin:0;padding:16px;background:#d7dcd5;font:16px Arial}nav{padding:8px 0 18px}a{margin-right:24px;color:#17211b}iframe{display:block;height:900px;border:1px solid #7c897e;background:white}</style></head><body><nav aria-label="Размер тестового экрана"><a href="/__qa?width=320">320 px</a><a href="/__qa?width=375">375 px</a><a href="/__qa?width=768">768 px</a><a href="/__qa?width=1280">1280 px</a><a href="/__qa?width=375&text=200">375 px · текст 200%</a></nav><iframe title="Проверяемая страница" src="/index.html?qa=true${text}" style="width:${width}px"></iframe></body></html>`,
        );
        return;
      }
      const name =
        decodeURIComponent(url.pathname) === '/'
          ? 'index.html'
          : decodeURIComponent(url.pathname).slice(1);
      const file = path.resolve(root, name);
      if (!file.startsWith(root)) {
        response.writeHead(403);
        response.end();
        return;
      }
      let data = await readFile(file);
      if (
        url.searchParams.get('qa') === 'true' &&
        url.searchParams.get('text') === '200' &&
        name === 'index.html'
      ) {
        data = Buffer.from(
          data.toString().replace('</head>', '<style>html{font-size:200%}</style></head>'),
        );
      }
      response.writeHead(200, {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      response.end(data);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  })
  .listen(port, '0.0.0.0', () => console.log('Local Site preview ready'));
