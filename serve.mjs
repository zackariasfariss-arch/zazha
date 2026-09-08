import { createServer } from 'http';
import { readFile, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // POST /upload-image — spara uppladdad bild till images/
  if (req.method === 'POST' && req.url === '/upload-image') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { filename, data } = JSON.parse(body);
        const base64 = data.replace(/^data:image\/[^;]+;base64,/, '');
        const buf = Buffer.from(base64, 'base64');
        await writeFile(join(__dirname, 'images', filename), buf);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, path: '/images/' + filename }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: String(e) }));
      }
    });
    return;
  }

  // POST /export-changes  — spara ändringar från editorn
  if (req.method === 'POST' && req.url === '/export-changes') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      const page = JSON.parse(body).page;
      const filename = page ? `editor-changes-${page}.json` : 'editor-changes.json';
      await writeFile(join(__dirname, filename), body, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    });
    return;
  }

  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = join(__dirname, urlPath);
  const ext = extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found: ' + urlPath);
  }
}).listen(PORT, () => {
  console.log(`ZAZHA server running at http://localhost:${PORT}`);
});
