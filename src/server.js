import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppError, Store } from './store.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const MAX_BODY = 10 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function send(res, status, body) {
  const payload = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new AppError(413, 'Requête trop volumineuse.');
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return body && typeof body === 'object' ? body : {};
  } catch {
    throw new AppError(400, 'Le corps de la requête doit être du JSON valide.');
  }
}

/** Table des routes : [méthode, motif, gestionnaire(store, params, body)] */
const routes = [
  ['GET', '/api/teams', (s) => s.listTeams()],
  ['GET', '/api/trash', (s) => s.listTrash()],
  ['POST', '/api/teams', (s, p, b) => s.createTeam(b.name), 201],
  ['GET', '/api/teams/:id', (s, p) => s.getTeam(p.id)],
  ['PATCH', '/api/teams/:id', (s, p, b) => s.renameTeam(p.id, b.name)],
  ['DELETE', '/api/teams/:id', (s, p) => s.deleteTeam(p.id)],
  ['POST', '/api/teams/:id/trash', (s, p) => s.trashTeam(p.id)],
  ['POST', '/api/teams/:id/restore', (s, p) => s.restoreTeam(p.id)],
  ['POST', '/api/teams/:id/members', (s, p, b) => s.addMember(p.id, b.name), 201],
  ['PATCH', '/api/teams/:id/members/:mid', (s, p, b) => s.renameMember(p.id, p.mid, b.name)],
  ['DELETE', '/api/teams/:id/members/:mid', (s, p) => s.removeMember(p.id, p.mid)],
  ['POST', '/api/teams/:id/members/:mid/withdraw', (s, p) => s.withdraw(p.id, p.mid)],
  ['POST', '/api/teams/:id/members/:mid/reinstate', (s, p) => s.reinstate(p.id, p.mid)],
  ['POST', '/api/teams/:id/spin', (s, p) => s.spin(p.id)],
  ['POST', '/api/teams/:id/reset', (s, p) => s.resetCycle(p.id)],
].map(([method, pattern, handler, status = 200]) => {
  const keys = [];
  const regex = new RegExp(`^${pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; })}$`);
  return { method, regex, keys, handler, status };
});

async function handleApi(store, req, res, pathname) {
  let pathMatched = false;
  for (const route of routes) {
    const match = route.regex.exec(pathname);
    if (!match) continue;
    pathMatched = true;
    if (route.method !== req.method) continue;
    const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
    const body = ['POST', 'PATCH'].includes(req.method) ? await readJson(req) : {};
    const result = await route.handler(store, params, body);
    return send(res, route.status, result);
  }
  if (pathMatched) return send(res, 405, { error: 'Méthode non autorisée.' });
  return send(res, 404, { error: 'Ressource introuvable.' });
}

async function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }
  const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
  const filePath = path.resolve(PUBLIC_DIR, relative);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const content = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Introuvable');
  }
}

export async function createApp({ dataFile } = {}) {
  const store = await new Store(dataFile ?? path.join(ROOT, 'data', 'db.json')).load();
  const server = createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    try {
      if (pathname.startsWith('/api/')) await handleApi(store, req, res, pathname);
      else await serveStatic(req, res, pathname);
    } catch (err) {
      if (err instanceof AppError) return send(res, err.status, { error: err.message });
      console.error(err);
      send(res, 500, { error: 'Erreur interne du serveur.' });
    }
  });
  return { server, store };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000);
  const { server } = await createApp({ dataFile: process.env.DATA_FILE });
  server.listen(port, () => {
    console.log(`Roue de la chance disponible sur http://localhost:${port}`);
  });
}
