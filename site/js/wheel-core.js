// Logique métier pure de la roue (sans DOM ni Firebase), testée avec Node.js.
// Les écritures sont décrites comme des mises à jour multi-chemins relatives à la
// racine `wheelOfChance` de la base : wheel-store.js les applique en une seule fois.

export const MAX_NAME_LENGTH = 50;

/** Valeur que Firebase remplace par l'heure du serveur (équivalent de serverTimestamp()). */
export const SERVER_TIME = Object.freeze({ '.sv': 'timestamp' });

export const MESSAGES = {
  teamNameRequired: "Le nom de l'équipe est obligatoire.",
  memberNameRequired: 'Le prénom est obligatoire.',
  tooLong: `${MAX_NAME_LENGTH} caractères au maximum.`,
  teamTaken: (name) => `Une équipe « ${name} » existe déjà.`,
  teamTakenInTrash: (name) => `Une équipe « ${name} » existe déjà dans la corbeille.`,
  memberTaken: (name) => `« ${name} » fait déjà partie de cette équipe.`,
  cycleReset: 'Tout le monde est passé : la roue repart pour un tour complet.',
};

// ---------------------------------------------------------------- Noms

/** Supprime les espaces en début et fin, et réduit les espaces multiples à un seul. */
export function normalizeName(raw) {
  return typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ') : '';
}

/**
 * Clé d'unicité d'un nom, utilisable comme clé Firebase : insensible à la casse,
 * aux accents et aux espaces en trop (« Ayé » et « aye » ont la même clé).
 * Les caractères interdits dans une clé Firebase sont encodés.
 */
export function nameKey(raw) {
  return normalizeName(raw)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('fr-FR')
    .replace(/[.#$[\]/%\u0000-\u001f\u007f]/g, (char) =>
      '%' + char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'));
}

/** Vérifie un nom d'équipe (`kind: 'team'`) ou un prénom (`kind: 'member'`). */
export function validateName(raw, kind) {
  const name = normalizeName(raw);
  if (!name) {
    return { ok: false, error: kind === 'team' ? MESSAGES.teamNameRequired : MESSAGES.memberNameRequired };
  }
  if (name.length > MAX_NAME_LENGTH) return { ok: false, error: MESSAGES.tooLong };
  return { ok: true, name };
}

// ---------------------------------------------------------------- Identifiants

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Identifiant de 12 caractères [a-z0-9], comme dans les autres outils de l'équipe. */
export function newId(random = cryptoRandom) {
  let id = '';
  for (let i = 0; i < 12; i++) id += ID_ALPHABET[Math.floor(random() * ID_ALPHABET.length)];
  return id;
}

function cryptoRandom() {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0] / 2 ** 32;
}

// ---------------------------------------------------------------- Lecture

const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });

/** Ordre alphabétique (sans tenir compte de la casse ni des accents), puis ordre d'ajout. */
function byName(a, b) {
  return collator.compare(a.name, b.name) || (a.createdAt ?? 0) - (b.createdAt ?? 0) || a.id.localeCompare(b.id);
}

function toTeam(id, raw) {
  const members = Object.entries(raw?.members ?? {})
    .map(([memberId, m]) => ({
      id: memberId,
      name: String(m?.name ?? ''),
      withdrawn: m?.withdrawn === true,
      createdAt: m?.createdAt ?? 0,
    }))
    .sort(byName);
  return {
    id,
    name: String(raw?.name ?? ''),
    createdAt: raw?.createdAt ?? 0,
    deletedAt: typeof raw?.deletedAt === 'number' ? raw.deletedAt : null,
    members,
  };
}

/** Équipes actives (triées par nom) et équipes de la corbeille (plus récentes d'abord). */
export function buildTeamsView(raw) {
  const teams = Object.entries(raw?.teams ?? {}).map(([id, t]) => toTeam(id, t));
  return {
    active: teams.filter((t) => t.deletedAt === null).sort(byName),
    trash: teams.filter((t) => t.deletedAt !== null)
      .sort((a, b) => b.deletedAt - a.deletedAt),
  };
}

export function findTeam(raw, teamId) {
  const t = raw?.teams?.[teamId];
  return t ? toTeam(teamId, t) : null;
}

export const inPlay = (team) => team.members.filter((m) => !m.withdrawn);
export const alreadyPassed = (team) => team.members.filter((m) => m.withdrawn);

// ---------------------------------------------------------------- Équipes

/** Message d'erreur si le nom est déjà pris par une autre équipe (corbeille comprise), sinon null. */
export function teamNameConflict(raw, name, exceptId = null) {
  // Comparaison sur les noms eux-mêmes : couvre aussi les équipes dont la réservation
  // a été écrite avant le changement de clé (accents alors distincts).
  const key = nameKey(name);
  const taken = Object.entries(raw?.teams ?? {})
    .map(([id, t]) => toTeam(id, t))
    .find((t) => t.id !== exceptId && nameKey(t.name) === key);
  if (!taken) return null;
  return taken.deletedAt === null ? MESSAGES.teamTaken(taken.name) : MESSAGES.teamTakenInTrash(taken.name);
}

export function createTeamUpdate(teamId, name) {
  return {
    [`teams/${teamId}`]: { name, createdAt: SERVER_TIME },
    [`teamNames/${nameKey(name)}`]: teamId,
  };
}

export function renameTeamUpdate(team, name) {
  const update = {
    [`teams/${team.id}/name`]: name,
    [`teamNames/${nameKey(name)}`]: team.id,
  };
  if (nameKey(team.name) !== nameKey(name)) update[`teamNames/${nameKey(team.name)}`] = null;
  return update;
}

export const trashTeamUpdate = (teamId) => ({ [`teams/${teamId}/deletedAt`]: SERVER_TIME });
export const restoreTeamUpdate = (teamId) => ({ [`teams/${teamId}/deletedAt`]: null });

/** Suppression définitive : l'équipe et la réservation de son nom. */
export function purgeTeamUpdate(team) {
  return {
    [`teams/${team.id}`]: null,
    [`teamNames/${nameKey(team.name)}`]: null,
  };
}

// ---------------------------------------------------------------- Membres

export function memberNameConflict(team, name, exceptId = null) {
  const key = nameKey(name);
  const taken = team.members.find((m) => m.id !== exceptId && nameKey(m.name) === key);
  return taken ? MESSAGES.memberTaken(taken.name) : null;
}

export function addMemberUpdate(teamId, memberId, name) {
  return {
    [`teams/${teamId}/members/${memberId}`]: { name, withdrawn: false, createdAt: SERVER_TIME },
    [`teams/${teamId}/memberNames/${nameKey(name)}`]: memberId,
  };
}

export function renameMemberUpdate(team, member, name) {
  const base = `teams/${team.id}`;
  const update = {
    [`${base}/members/${member.id}/name`]: name,
    [`${base}/memberNames/${nameKey(name)}`]: member.id,
  };
  if (nameKey(member.name) !== nameKey(name)) update[`${base}/memberNames/${nameKey(member.name)}`] = null;
  return update;
}

/**
 * Ajoute à `update` la remise en jeu de tous les membres restants quand il n'y a
 * plus personne en lice. `remaining` est l'état des membres après l'opération.
 */
function withAutoReset(team, update, remaining) {
  const cycleReset = remaining.length > 0 && remaining.every((m) => m.withdrawn);
  if (cycleReset) {
    for (const m of remaining) update[`teams/${team.id}/members/${m.id}/withdrawn`] = false;
  }
  return { update, cycleReset };
}

export function removeMemberUpdate(team, memberId) {
  const member = team.members.find((m) => m.id === memberId);
  const update = { [`teams/${team.id}/members/${memberId}`]: null };
  if (member) update[`teams/${team.id}/memberNames/${nameKey(member.name)}`] = null;
  return withAutoReset(team, update, team.members.filter((m) => m.id !== memberId));
}

// ---------------------------------------------------------------- Roue

/** Tire au hasard, uniformément, un membre en lice. Null si personne n'est en lice. */
export function pickWinner(team, random = cryptoRandom) {
  const eligible = inPlay(team);
  if (eligible.length === 0) return null;
  return eligible[Math.min(eligible.length - 1, Math.floor(random() * eligible.length))];
}

/** « Retirer » : la personne passe dans « Déjà passés » ; fin de tour automatique si c'était la dernière. */
export function withdrawUpdate(team, memberId) {
  const update = { [`teams/${team.id}/members/${memberId}/withdrawn`]: true };
  const remaining = team.members.map((m) => (m.id === memberId ? { ...m, withdrawn: true } : m));
  return withAutoReset(team, update, remaining);
}

export const reinstateUpdate = (teamId, memberId) => ({ [`teams/${teamId}/members/${memberId}/withdrawn`]: false });

/** « Recommencer le tour » : tout le monde revient dans la roue. */
export function resetUpdate(team) {
  const update = {};
  for (const m of alreadyPassed(team)) update[`teams/${team.id}/members/${m.id}/withdrawn`] = false;
  return update;
}

// ---------------------------------------------------------------- Dessin de la roue

/** Nombre d'encres disponibles pour les segments (une couleur par personne jusqu'à 10). */
export const SEGMENT_COLOR_COUNT = 10;

/** Index de couleur de chaque segment, sans deux voisins identiques (le dernier touche le premier). */
export function colorIndexes(count) {
  const indexes = Array.from({ length: count }, (_, i) => i % SEGMENT_COLOR_COUNT);
  if (count > 1 && indexes[count - 1] === indexes[0]) {
    indexes[count - 1] = (count - 1 + 2) % SEGMENT_COLOR_COUNT;
  }
  return indexes;
}

/**
 * Rotation absolue (degrés, sens horaire) qui arrête le segment `index` sous le
 * pointeur placé en haut, après `turns` tours complets.
 */
export function targetRotation(current, index, count, { turns = 6, random = Math.random } = {}) {
  const slice = 360 / count;
  const jitter = (random() - 0.5) * slice * 0.7;
  const landing = index * slice + slice / 2 + jitter;
  const delta = (((-landing - current) % 360) + 360) % 360;
  return current + turns * 360 + delta;
}

/** Index du segment sous le pointeur pour une rotation donnée. */
export function segmentAt(rotation, count) {
  const angle = (((-rotation) % 360) + 360) % 360;
  return Math.floor(angle / (360 / count));
}

/**
 * Nombre de séparations entre segments passées sous le pointeur quand la roue
 * tourne de `from` à `to` degrés (rotations cumulées, sens horaire). Sert au cliquetis.
 */
export function boundariesCrossed(from, to, count) {
  if (count < 2 || to <= from) return 0;
  const slice = 360 / count;
  return Math.floor(to / slice) - Math.floor(from / slice);
}
