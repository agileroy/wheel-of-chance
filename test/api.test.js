import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createApp } from '../src/server.js';

let server;
let base;

before(async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'wheel-api-'));
  ({ server } = await createApp({ dataFile: path.join(dir, 'db.json') }));
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

async function api(method, url, body) {
  const res = await fetch(base + url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

describe('API', () => {
  it('parcourt le cycle complet d\'une équipe', async () => {
    const created = await api('POST', '/api/teams', { name: 'Produit' });
    assert.equal(created.status, 201);
    const id = created.body.id;

    await api('POST', `/api/teams/${id}/members`, { name: 'Julie' });
    const added = await api('POST', `/api/teams/${id}/members`, { name: 'Marc' });
    assert.equal(added.status, 201);
    assert.equal(added.body.members.length, 2);

    const spun = await api('POST', `/api/teams/${id}/spin`);
    assert.equal(spun.status, 200);
    const winner = spun.body.winnerId;
    assert.ok(spun.body.team.members.some((m) => m.id === winner));

    const first = await api('POST', `/api/teams/${id}/members/${winner}/withdraw`);
    assert.equal(first.body.cycleReset, false);

    const other = added.body.members.find((m) => m.id !== winner).id;
    const last = await api('POST', `/api/teams/${id}/members/${other}/withdraw`);
    assert.equal(last.body.cycleReset, true);
  });

  it('renvoie des erreurs lisibles', async () => {
    await api('POST', '/api/teams', { name: 'Tech' });
    const dup = await api('POST', '/api/teams', { name: 'tech' });
    assert.equal(dup.status, 409);
    assert.match(dup.body.error, /existe déjà/);

    const empty = await api('POST', '/api/teams', { name: '' });
    assert.equal(empty.status, 400);

    const missing = await api('GET', '/api/teams/inconnue');
    assert.equal(missing.status, 404);
  });

  it('gère la corbeille', async () => {
    const { body: team } = await api('POST', '/api/teams', { name: 'Design' });
    assert.equal((await api('DELETE', `/api/teams/${team.id}`)).status, 409);
    await api('POST', `/api/teams/${team.id}/trash`);
    const trash = await api('GET', '/api/trash');
    assert.ok(trash.body.some((t) => t.id === team.id));
    const restored = await api('POST', `/api/teams/${team.id}/restore`);
    assert.equal(restored.body.deletedAt, null);
    await api('POST', `/api/teams/${team.id}/trash`);
    assert.equal((await api('DELETE', `/api/teams/${team.id}`)).status, 200);
  });

  it('refuse un JSON invalide et une méthode inconnue', async () => {
    const res = await fetch(`${base}/api/teams`, { method: 'POST', body: '{oops' });
    assert.equal(res.status, 400);
    assert.equal((await api('PUT', '/api/teams')).status, 405);
  });

  it('sert la page et bloque la sortie du dossier public', async () => {
    const page = await fetch(`${base}/`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type'), /text\/html/);
    const escape = await fetch(`${base}/..%2Fpackage.json`);
    assert.notEqual(escape.status, 200);
  });
});
