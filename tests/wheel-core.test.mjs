import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_NAME_LENGTH, SERVER_TIME, MESSAGES, normalizeName, nameKey, validateName, newId,
  buildTeamsView, findTeam, inPlay, alreadyPassed,
  teamNameConflict, createTeamUpdate, renameTeamUpdate, trashTeamUpdate, restoreTeamUpdate, purgeTeamUpdate,
  memberNameConflict, addMemberUpdate, renameMemberUpdate, removeMemberUpdate,
  pickWinner, withdrawUpdate, reinstateUpdate, resetUpdate,
  colorIndexes, targetRotation, segmentAt,
} from '../site/js/wheel-core.js';

// Base simulée, au format de la branche `wheelOfChance`.
const member = (name, withdrawn = false, createdAt = 1) => ({ name, withdrawn, createdAt });
const db = () => ({
  teams: {
    produit000001: {
      name: 'Produit',
      createdAt: 1,
      members: {
        m1: member('Julie', false, 1),
        m2: member('Marc', false, 2),
        m3: member('Sami', false, 3),
      },
      memberNames: { julie: 'm1', marc: 'm2', sami: 'm3' },
    },
    archive00001: { name: 'Archives', createdAt: 2, deletedAt: 50, members: {} },
  },
  teamNames: { produit: 'produit000001', archives: 'archive00001' },
});

/** Applique une mise à jour multi-chemins comme Firebase (null supprime). */
function apply(raw, update) {
  const next = structuredClone(raw);
  for (const [path, value] of Object.entries(update)) {
    const keys = path.split('/');
    let node = next;
    for (const k of keys.slice(0, -1)) node = node[k] ??= {};
    if (value === null) delete node[keys.at(-1)];
    else node[keys.at(-1)] = structuredClone(value);
  }
  return next;
}

const team = (raw = db()) => findTeam(raw, 'produit000001');
const byName = (t, name) => t.members.find((m) => m.name === name);

// ---------------------------------------------------------------- Noms

test('normalise les espaces en trop', () => {
  assert.equal(normalizeName('  Produit    &   Design '), 'Produit & Design');
  assert.equal(normalizeName(undefined), '');
});

test('clé d\'unicité insensible à la casse, aux accents et aux espaces', () => {
  assert.equal(nameKey(' JULIE '), nameKey('julie'));
  assert.equal(nameKey('Anna'), nameKey('anna'));
  assert.equal(nameKey('Ayé'), nameKey('Aye'));
  assert.equal(nameKey('ÉLODIE'), nameKey('elodie'));
  assert.equal(nameKey('Françoise'), nameKey('francoise'));
  assert.notEqual(nameKey('Léa'), nameKey('Léo'));
});

test('clé utilisable par Firebase', () => {
  assert.equal(nameKey('a.b#c$d[e]f/g%'), 'a%2Eb%23c%24d%5Be%5Df%2Fg%25');
});

test('refuse un nom vide ou trop long', () => {
  assert.deepEqual(validateName('   ', 'team'), { ok: false, error: MESSAGES.teamNameRequired });
  assert.deepEqual(validateName('', 'member'), { ok: false, error: MESSAGES.memberNameRequired });
  assert.equal(validateName('x'.repeat(MAX_NAME_LENGTH + 1), 'team').ok, false);
  assert.deepEqual(validateName(' Julie ', 'member'), { ok: true, name: 'Julie' });
});

test('identifiants de 12 caractères [a-z0-9]', () => {
  for (let i = 0; i < 50; i++) assert.match(newId(), /^[a-z0-9]{12}$/);
});

// ---------------------------------------------------------------- Lecture

test('sépare équipes actives et corbeille', () => {
  const view = buildTeamsView(db());
  assert.deepEqual(view.active.map((t) => t.name), ['Produit']);
  assert.deepEqual(view.trash.map((t) => t.name), ['Archives']);
  assert.deepEqual(buildTeamsView(null), { active: [], trash: [] });
});

test('membres triés par ordre alphabétique, sans tenir compte des accents ni de la casse', () => {
  const raw = db();
  const members = raw.teams.produit000001.members;
  members.m4 = member('élodie', false, 4);
  members.m5 = member('Zoé', false, 5);
  members.m6 = member('Anna', false, 6);
  assert.deepEqual(team(raw).members.map((m) => m.name), ['Anna', 'élodie', 'Julie', 'Marc', 'Sami', 'Zoé']);
});

test('membres en lice et déjà passés séparés', () => {
  const raw = apply(db(), withdrawUpdate(team(), 'm2').update);
  const t = team(raw);
  assert.deepEqual(inPlay(t).map((m) => m.name), ['Julie', 'Sami']);
  assert.deepEqual(alreadyPassed(t).map((m) => m.name), ['Marc']);
});

// ---------------------------------------------------------------- Équipes

test('crée une équipe et réserve son nom', () => {
  const update = createTeamUpdate('tech00000001', 'Tech');
  assert.deepEqual(update['teams/tech00000001'], { name: 'Tech', createdAt: SERVER_TIME });
  assert.equal(update['teamNames/tech'], 'tech00000001');
});

test('nom d\'équipe déjà pris, sans tenir compte de la casse', () => {
  assert.equal(teamNameConflict(db(), ' produit '), MESSAGES.teamTaken('Produit'));
  assert.equal(teamNameConflict(db(), 'Tech'), null);
  assert.equal(teamNameConflict(db(), 'Prôduit'), MESSAGES.teamTaken('Produit'));
});

test('équipes triées par ordre alphabétique sans tenir compte des accents', () => {
  const raw = db();
  raw.teams.ete000000001 = { name: 'Été', createdAt: 3 };
  raw.teams.data00000001 = { name: 'data', createdAt: 4 };
  assert.deepEqual(buildTeamsView(raw).active.map((t) => t.name), ['data', 'Été', 'Produit']);
});

test('un nom dans la corbeille reste réservé', () => {
  assert.equal(teamNameConflict(db(), 'archives'), MESSAGES.teamTakenInTrash('Archives'));
});

test('renommer en changeant seulement la casse garde la réservation', () => {
  assert.equal(teamNameConflict(db(), 'PRODUIT', 'produit000001'), null);
  const update = renameTeamUpdate(team(), 'PRODUIT');
  assert.deepEqual(update, { 'teams/produit000001/name': 'PRODUIT', 'teamNames/produit': 'produit000001' });
});

test('renommer libère l\'ancien nom', () => {
  const raw = apply(db(), renameTeamUpdate(team(), 'Produit & Design'));
  assert.equal(raw.teamNames.produit, undefined);
  assert.equal(raw.teamNames['produit & design'], 'produit000001');
  assert.equal(team(raw).members.length, 3);
});

test('corbeille : mise à la corbeille puis restauration à l\'identique', () => {
  let raw = apply(db(), withdrawUpdate(team(), 'm1').update);
  raw = apply(raw, trashTeamUpdate('produit000001'));
  raw.teams.produit000001.deletedAt = 99; // valeur posée par le serveur
  assert.equal(buildTeamsView(raw).active.length, 0);
  raw = apply(raw, restoreTeamUpdate('produit000001'));
  const t = team(raw);
  assert.equal(t.deletedAt, null);
  assert.equal(byName(t, 'Julie').withdrawn, true);
});

test('suppression définitive : libère le nom', () => {
  const archives = findTeam(db(), 'archive00001');
  const raw = apply(db(), purgeTeamUpdate(archives));
  assert.equal(raw.teams.archive00001, undefined);
  assert.equal(teamNameConflict(raw, 'Archives'), null);
});

// ---------------------------------------------------------------- Membres

test('ajoute un membre en lice et réserve son prénom', () => {
  const update = addMemberUpdate('produit000001', 'm4', 'Léa');
  const t = team(apply(db(), update));
  assert.equal(byName(t, 'Léa').withdrawn, false);
  assert.equal(update['teams/produit000001/memberNames/lea'], 'm4');
});

test('prénom déjà pris dans l\'équipe', () => {
  assert.equal(memberNameConflict(team(), ' julie '), MESSAGES.memberTaken('Julie'));
  assert.equal(memberNameConflict(team(), 'Julie', 'm1'), null);
  assert.equal(memberNameConflict(team(), 'Léa'), null);
  assert.equal(memberNameConflict(team(), 'Sâmi'), MESSAGES.memberTaken('Sami'));
});

test('renommer un membre garde son état dans le tour', () => {
  let raw = apply(db(), withdrawUpdate(team(), 'm1').update);
  raw = apply(raw, renameMemberUpdate(team(raw), byName(team(raw), 'Julie'), 'Juliette'));
  const t = team(raw);
  assert.equal(byName(t, 'Juliette').withdrawn, true);
  assert.equal(raw.teams.produit000001.memberNames.julie, undefined);
  assert.equal(raw.teams.produit000001.memberNames.juliette, 'm1');
});

test('supprimer un membre libère son prénom', () => {
  const { update, cycleReset } = removeMemberUpdate(team(), 'm2');
  const raw = apply(db(), update);
  assert.equal(cycleReset, false);
  assert.equal(byName(team(raw), 'Marc'), undefined);
  assert.equal(raw.teams.produit000001.memberNames.marc, undefined);
});

test('supprimer le dernier en lice relance un tour', () => {
  let raw = apply(db(), withdrawUpdate(team(), 'm1').update);
  raw = apply(raw, withdrawUpdate(team(raw), 'm2').update);
  const { update, cycleReset } = removeMemberUpdate(team(raw), 'm3');
  raw = apply(raw, update);
  assert.equal(cycleReset, true);
  assert.ok(team(raw).members.every((m) => !m.withdrawn));
});

// ---------------------------------------------------------------- Roue

test('ne tire que des membres en lice, et tous à terme', () => {
  const raw = apply(db(), withdrawUpdate(team(), 'm2').update);
  const seen = new Set();
  for (let i = 0; i < 300; i++) seen.add(pickWinner(team(raw)).name);
  assert.deepEqual([...seen].sort(), ['Julie', 'Sami']);
});

test('tirage aux extrêmes de l\'aléa', () => {
  assert.equal(pickWinner(team(), () => 0).name, 'Julie');
  assert.equal(pickWinner(team(), () => 0.9999999).name, 'Sami');
  assert.equal(pickWinner({ members: [] }), null);
});

test('retirer la personne désignée', () => {
  const { update, cycleReset } = withdrawUpdate(team(), 'm1');
  assert.equal(cycleReset, false);
  assert.deepEqual(update, { 'teams/produit000001/members/m1/withdrawn': true });
});

test('retirer le dernier en lice remet tout le monde dans la roue', () => {
  let raw = apply(db(), withdrawUpdate(team(), 'm1').update);
  raw = apply(raw, withdrawUpdate(team(raw), 'm2').update);
  const { update, cycleReset } = withdrawUpdate(team(raw), 'm3');
  raw = apply(raw, update);
  assert.equal(cycleReset, true);
  assert.ok(team(raw).members.every((m) => !m.withdrawn));
});

test('rétablir une personne retirée par erreur', () => {
  let raw = apply(db(), withdrawUpdate(team(), 'm1').update);
  raw = apply(raw, reinstateUpdate('produit000001', 'm1'));
  assert.equal(byName(team(raw), 'Julie').withdrawn, false);
});

test('recommencer le tour', () => {
  let raw = apply(db(), withdrawUpdate(team(), 'm1').update);
  raw = apply(raw, withdrawUpdate(team(raw), 'm3').update);
  raw = apply(raw, resetUpdate(team(raw)));
  assert.ok(team(raw).members.every((m) => !m.withdrawn));
});

// ---------------------------------------------------------------- Dessin

test('la roue s\'arrête toujours sur le segment tiré, après six tours', () => {
  for (let count = 1; count <= 10; count++) {
    let rotation = 0;
    for (let trial = 0; trial < 100; trial++) {
      const index = trial % count;
      const next = targetRotation(rotation, index, count);
      assert.ok(next >= rotation + 6 * 360);
      assert.equal(segmentAt(next, count), index);
      rotation = next;
    }
  }
  for (const r of [0, 0.999999]) assert.equal(segmentAt(targetRotation(123, 3, 7, { random: () => r }), 7), 3);
});

test('deux segments voisins n\'ont jamais la même couleur', () => {
  for (let count = 2; count <= 12; count++) {
    const c = colorIndexes(count);
    for (let i = 0; i < count; i++) assert.notEqual(c[i], c[(i + 1) % count], `${count} segments`);
  }
});
