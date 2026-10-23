import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createTeamUpdate, renameTeamUpdate, trashTeamUpdate, restoreTeamUpdate, purgeTeamUpdate,
  addMemberUpdate, renameMemberUpdate, removeMemberUpdate, withdrawUpdate, reinstateUpdate, resetUpdate,
  findTeam, newId, nameKey,
} from '../site/js/wheel-core.js';

const rules = JSON.parse(readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8')).rules;
const branch = rules.wheelOfChance;

/**
 * Suit un chemin dans l'arbre des règles et renvoie le nœud atteint.
 * Échoue si le chemin tombe sur un `$other` refusé ou sur rien.
 */
function ruleFor(path) {
  let node = branch;
  for (const segment of path.split('/')) {
    if (node[segment]) { node = node[segment]; continue; }
    const wildcard = Object.keys(node).find((k) => k.startsWith('$') && k !== '$other');
    if (wildcard) { node = node[wildcard]; continue; }
    if (node.$other) throw new Error(`« ${path} » tombe sur $other (${segment})`);
    // Pas de règle plus profonde : le nœud parent valide l'objet entier.
    return node;
  }
  return node;
}

/** Vrai si une règle `.write` existe sur le chemin ou un de ses parents. */
function hasWriteRule(path) {
  let node = branch;
  if (node['.write']) return true;
  for (const segment of path.split('/')) {
    const next = node[segment] ?? node[Object.keys(node).find((k) => k.startsWith('$') && k !== '$other')];
    if (!next) return false;
    if (next['.write']) return true;
    node = next;
  }
  return false;
}

test('le fichier de règles garde les branches des autres outils', () => {
  assert.ok(rules.room, 'poker planning');
  assert.ok(rules.skillMatrix, 'matrice de compétences');
  assert.equal(rules['.read'], false);
  assert.equal(rules['.write'], false);
});

test('la roue est lisible par tout navigateur connecté, et seulement lui', () => {
  assert.equal(branch['.read'], 'auth != null');
  assert.equal(branch['.write'], undefined);
});

test('chaque écriture de l\'application a une règle d\'écriture et de validation', () => {
  const teamId = newId();
  const memberA = newId();
  const memberB = newId();
  const raw = {
    teams: {
      [teamId]: {
        name: 'Produit',
        createdAt: 1,
        deletedAt: 5,
        members: {
          [memberA]: { name: 'Julie', withdrawn: true, createdAt: 1 },
          [memberB]: { name: 'Marc', withdrawn: false, createdAt: 2 },
        },
      },
    },
  };
  const team = findTeam(raw, teamId);
  const updates = [
    createTeamUpdate(teamId, 'Produit'),
    renameTeamUpdate(team, 'Produit & Design'),
    trashTeamUpdate(teamId),
    restoreTeamUpdate(teamId),
    purgeTeamUpdate(team),
    addMemberUpdate(teamId, newId(), 'Léa'),
    renameMemberUpdate(team, team.members[0], 'Juliette'),
    removeMemberUpdate(team, memberA).update,
    withdrawUpdate(team, memberB).update,
    reinstateUpdate(teamId, memberA),
    resetUpdate(team),
  ];
  for (const update of updates) {
    for (const path of Object.keys(update)) {
      assert.doesNotThrow(() => ruleFor(path), path);
      assert.ok(hasWriteRule(path), `aucune règle .write pour ${path}`);
    }
  }
});

test('les identifiants et clés générés respectent les règles', () => {
  const teamPattern = /^[a-z0-9]{12}$/;
  assert.match(branch.teams.$teamId['.validate'], /\[a-z0-9\]\{12\}/);
  for (let i = 0; i < 20; i++) assert.match(newId(), teamPattern);
  assert.ok(nameKey('x'.repeat(50)).length <= 200);
});
