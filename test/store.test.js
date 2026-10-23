import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Store } from '../src/store.js';

async function newStore() {
  const dir = await mkdtemp(path.join(tmpdir(), 'wheel-'));
  const file = path.join(dir, 'db.json');
  return { store: await new Store(file).load(), file };
}

const rejectsWith = (promise, status) =>
  assert.rejects(promise, (err) => err.status === status);

async function teamWith(store, teamName, names) {
  let team = await store.createTeam(teamName);
  for (const n of names) team = await store.addMember(team.id, n);
  return team;
}

const byName = (team, name) => team.members.find((m) => m.name === name);

describe('équipes', () => {
  let store;
  beforeEach(async () => ({ store } = await newStore()));

  it('crée une équipe avec une roue vide', async () => {
    const team = await store.createTeam('Produit');
    assert.equal(team.name, 'Produit');
    assert.deepEqual(team.members, []);
    assert.equal(store.listTeams().length, 1);
  });

  it('refuse un nom déjà pris, sans tenir compte de la casse ni des espaces', async () => {
    await store.createTeam('Produit');
    await rejectsWith(store.createTeam('  produit  '), 409);
  });

  it('normalise les espaces multiples', async () => {
    const team = await store.createTeam('  Produit    &   Design ');
    assert.equal(team.name, 'Produit & Design');
  });

  it('refuse un nom vide ou trop long', async () => {
    await rejectsWith(store.createTeam('   '), 400);
    await rejectsWith(store.createTeam(undefined), 400);
    await rejectsWith(store.createTeam('x'.repeat(51)), 400);
  });

  it('renomme en conservant les membres et la roue', async () => {
    const team = await teamWith(store, 'Produit', ['Julie', 'Marc']);
    await store.withdraw(team.id, byName(team, 'Marc').id);
    const renamed = await store.renameTeam(team.id, 'Produit & Design');
    assert.equal(renamed.name, 'Produit & Design');
    assert.equal(byName(renamed, 'Marc').withdrawn, true);
  });

  it('autorise à garder le même nom en changeant la casse', async () => {
    const team = await store.createTeam('produit');
    const renamed = await store.renameTeam(team.id, 'Produit');
    assert.equal(renamed.name, 'Produit');
  });

  it('refuse un renommage vers un nom déjà pris', async () => {
    await store.createTeam('Tech');
    const team = await store.createTeam('Produit');
    await rejectsWith(store.renameTeam(team.id, 'TECH'), 409);
  });
});

describe('corbeille', () => {
  let store;
  beforeEach(async () => ({ store } = await newStore()));

  it('met une équipe à la corbeille', async () => {
    const team = await store.createTeam('Produit');
    await store.trashTeam(team.id);
    assert.equal(store.listTeams().length, 0);
    assert.equal(store.listTrash().length, 1);
    assert.throws(() => store.getTeam(team.id), (err) => err.status === 404);
  });

  it('restaure une équipe à l\'identique', async () => {
    const team = await teamWith(store, 'Produit', ['Julie', 'Marc']);
    await store.withdraw(team.id, byName(team, 'Julie').id);
    await store.trashTeam(team.id);
    const restored = await store.restoreTeam(team.id);
    assert.equal(restored.deletedAt, null);
    assert.equal(byName(restored, 'Julie').withdrawn, true);
    assert.equal(byName(restored, 'Marc').withdrawn, false);
  });

  it('réserve le nom d\'une équipe dans la corbeille', async () => {
    const team = await store.createTeam('Produit');
    await store.trashTeam(team.id);
    await rejectsWith(store.createTeam('Produit'), 409);
  });

  it('supprime définitivement et libère le nom', async () => {
    const team = await store.createTeam('Produit');
    await store.trashTeam(team.id);
    await store.deleteTeam(team.id);
    assert.equal(store.listTrash().length, 0);
    await store.createTeam('Produit');
  });

  it('refuse la suppression définitive d\'une équipe active', async () => {
    const team = await store.createTeam('Produit');
    await rejectsWith(store.deleteTeam(team.id), 409);
  });

  it('refuse de modifier une équipe dans la corbeille', async () => {
    const team = await store.createTeam('Produit');
    await store.trashTeam(team.id);
    await rejectsWith(store.addMember(team.id, 'Julie'), 404);
    await rejectsWith(store.spin(team.id), 404);
  });
});

describe('membres', () => {
  let store;
  beforeEach(async () => ({ store } = await newStore()));

  it('ajoute un membre directement en lice', async () => {
    const team = await teamWith(store, 'Produit', ['Julie']);
    assert.equal(byName(team, 'Julie').withdrawn, false);
  });

  it('refuse un doublon dans la même équipe', async () => {
    const team = await teamWith(store, 'Produit', ['Julie']);
    await rejectsWith(store.addMember(team.id, ' julie '), 409);
  });

  it('accepte le même prénom dans une autre équipe, avec un état indépendant', async () => {
    const produit = await teamWith(store, 'Produit', ['Julie', 'Marc']);
    const tech = await teamWith(store, 'Tech', ['Julie', 'Sami']);
    await store.withdraw(produit.id, byName(produit, 'Julie').id);
    assert.equal(byName(store.getTeam(tech.id), 'Julie').withdrawn, false);
  });

  it('distingue les accents', async () => {
    const team = await teamWith(store, 'Produit', ['Élodie']);
    await store.addMember(team.id, 'Elodie');
  });

  it('renomme en conservant l\'état dans le cycle', async () => {
    const team = await teamWith(store, 'Produit', ['Jluie', 'Marc']);
    const id = byName(team, 'Jluie').id;
    await store.withdraw(team.id, id);
    const renamed = await store.renameMember(team.id, id, 'Julie');
    assert.equal(byName(renamed, 'Julie').withdrawn, true);
  });

  it('supprime un membre de la roue et des déjà passés', async () => {
    const team = await teamWith(store, 'Produit', ['Julie', 'Marc', 'Sami']);
    await store.withdraw(team.id, byName(team, 'Marc').id);
    const { team: after } = await store.removeMember(team.id, byName(team, 'Marc').id);
    assert.equal(byName(after, 'Marc'), undefined);
    assert.equal(after.members.length, 2);
  });

  it('réinitialise si la suppression laisse seulement des déjà passés', async () => {
    const team = await teamWith(store, 'Produit', ['Julie', 'Marc']);
    await store.withdraw(team.id, byName(team, 'Marc').id);
    const { cycleReset, team: after } = await store.removeMember(team.id, byName(team, 'Julie').id);
    assert.equal(cycleReset, true);
    assert.equal(byName(after, 'Marc').withdrawn, false);
  });
});

describe('roue', () => {
  let store;
  beforeEach(async () => ({ store } = await newStore()));

  it('refuse de tourner sans membre', async () => {
    const team = await store.createTeam('Produit');
    await rejectsWith(store.spin(team.id), 409);
  });

  it('ne tire jamais une personne retirée', async () => {
    const team = await teamWith(store, 'Produit', ['Julie', 'Marc', 'Sami']);
    const marc = byName(team, 'Marc').id;
    await store.withdraw(team.id, marc);
    for (let i = 0; i < 200; i++) {
      const { winnerId } = await store.spin(team.id);
      assert.notEqual(winnerId, marc);
    }
  });

  it('tire toutes les personnes en lice à terme', async () => {
    const team = await teamWith(store, 'Produit', ['Julie', 'Marc', 'Sami']);
    const seen = new Set();
    for (let i = 0; i < 200; i++) seen.add((await store.spin(team.id)).winnerId);
    assert.equal(seen.size, 3);
  });

  it('désigne la seule personne en lice', async () => {
    const team = await teamWith(store, 'Produit', ['Julie', 'Marc']);
    await store.withdraw(team.id, byName(team, 'Marc').id);
    const { winnerId } = await store.spin(team.id);
    assert.equal(winnerId, byName(team, 'Julie').id);
  });

  it('ne modifie pas l\'état lors d\'un tirage (garder)', async () => {
    const team = await teamWith(store, 'Produit', ['Julie', 'Marc']);
    await store.spin(team.id);
    assert.ok(store.getTeam(team.id).members.every((m) => !m.withdrawn));
  });

  it('retire la personne désignée', async () => {
    const team = await teamWith(store, 'Produit', ['Julie', 'Marc']);
    const { cycleReset, team: after } = await store.withdraw(team.id, byName(team, 'Julie').id);
    assert.equal(cycleReset, false);
    assert.equal(byName(after, 'Julie').withdrawn, true);
  });

  it('rétablit une personne retirée par erreur', async () => {
    const team = await teamWith(store, 'Produit', ['Julie', 'Marc']);
    await store.withdraw(team.id, byName(team, 'Julie').id);
    const after = await store.reinstate(team.id, byName(team, 'Julie').id);
    assert.equal(byName(after, 'Julie').withdrawn, false);
  });

  it('réinitialise automatiquement quand le dernier est retiré', async () => {
    const team = await teamWith(store, 'Produit', ['Julie', 'Marc']);
    await store.withdraw(team.id, byName(team, 'Marc').id);
    const { cycleReset, team: after } = await store.withdraw(team.id, byName(team, 'Julie').id);
    assert.equal(cycleReset, true);
    assert.ok(after.members.every((m) => !m.withdrawn));
  });

  it('réinitialise manuellement', async () => {
    const team = await teamWith(store, 'Produit', ['Julie', 'Marc', 'Sami']);
    await store.withdraw(team.id, byName(team, 'Marc').id);
    await store.withdraw(team.id, byName(team, 'Sami').id);
    const after = await store.resetCycle(team.id);
    assert.ok(after.members.every((m) => !m.withdrawn));
  });

  it('renvoie 404 pour un membre inconnu', async () => {
    const team = await teamWith(store, 'Produit', ['Julie']);
    await rejectsWith(store.withdraw(team.id, 'inconnu'), 404);
  });
});

describe('persistance', () => {
  it('conserve les données entre deux démarrages', async () => {
    const { store, file } = await newStore();
    const team = await teamWith(store, 'Produit', ['Julie', 'Marc']);
    await store.withdraw(team.id, byName(team, 'Marc').id);
    const reloaded = await new Store(file).load();
    assert.equal(byName(reloaded.getTeam(team.id), 'Marc').withdrawn, true);
  });

  it('n\'enregistre rien quand une opération échoue', async () => {
    const { store, file } = await newStore();
    await store.createTeam('Produit');
    const before = await readFile(file, 'utf8');
    await rejectsWith(store.createTeam('produit'), 409);
    assert.equal(await readFile(file, 'utf8'), before);
    assert.equal(store.listTeams().length, 1);
  });

  it('sérialise les écritures concurrentes', async () => {
    const { store, file } = await newStore();
    const team = await store.createTeam('Produit');
    const names = Array.from({ length: 10 }, (_, i) => `Personne ${i}`);
    await Promise.all(names.map((n) => store.addMember(team.id, n)));
    const reloaded = await new Store(file).load();
    assert.equal(reloaded.getTeam(team.id).members.length, 10);
  });
});
