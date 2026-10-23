import { randomInt, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const MAX_NAME_LENGTH = 50;

export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const badRequest = (msg) => new AppError(400, msg);
const notFound = (msg) => new AppError(404, msg);
const conflict = (msg) => new AppError(409, msg);

export function normalizeName(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
}

export function nameKey(value) {
  return normalizeName(value).toLocaleLowerCase('fr');
}

function validName(value, label) {
  const name = normalizeName(value);
  if (!name) throw badRequest(`Le ${label} est obligatoire.`);
  if (name.length > MAX_NAME_LENGTH) {
    throw badRequest(`Le ${label} ne doit pas dépasser ${MAX_NAME_LENGTH} caractères.`);
  }
  return name;
}

/**
 * Remet tout le monde dans la roue quand une équipe a des membres
 * mais plus personne en lice. Renvoie true si le cycle a été réinitialisé.
 */
function autoReset(team) {
  if (team.members.length > 0 && team.members.every((m) => m.withdrawn)) {
    team.members.forEach((m) => { m.withdrawn = false; });
    return true;
  }
  return false;
}

const clone = (value) => structuredClone(value);

export class Store {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = { teams: [] };
    this.queue = Promise.resolve();
  }

  async load() {
    try {
      const raw = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      this.data = { teams: Array.isArray(parsed.teams) ? parsed.teams : [] };
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      this.data = { teams: [] };
    }
    return this;
  }

  async #save() {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(this.data, null, 2));
    await rename(tmp, this.filePath);
  }

  /** Exécute une mutation en série, puis enregistre si elle réussit. */
  #mutate(fn) {
    const run = this.queue.then(async () => {
      const snapshot = clone(this.data);
      try {
        const result = fn();
        await this.#save();
        return result;
      } catch (err) {
        this.data = snapshot;
        throw err;
      }
    });
    this.queue = run.catch(() => {});
    return run;
  }

  #team(id, { allowTrashed = false } = {}) {
    const team = this.data.teams.find((t) => t.id === id);
    if (!team || (team.deletedAt && !allowTrashed)) throw notFound('Équipe introuvable.');
    return team;
  }

  #member(team, memberId) {
    const member = team.members.find((m) => m.id === memberId);
    if (!member) throw notFound('Membre introuvable.');
    return member;
  }

  #assertTeamNameFree(name, exceptId) {
    const key = nameKey(name);
    const taken = this.data.teams.find((t) => t.id !== exceptId && nameKey(t.name) === key);
    if (taken) {
      throw conflict(taken.deletedAt
        ? `Une équipe « ${taken.name} » existe déjà dans la corbeille.`
        : `Une équipe « ${taken.name} » existe déjà.`);
    }
  }

  #assertMemberNameFree(team, name, exceptId) {
    const key = nameKey(name);
    const taken = team.members.find((m) => m.id !== exceptId && nameKey(m.name) === key);
    if (taken) throw conflict(`« ${taken.name} » fait déjà partie de cette équipe.`);
  }

  // --- Lecture ---

  listTeams() {
    return clone(this.data.teams.filter((t) => !t.deletedAt))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  listTrash() {
    return clone(this.data.teams.filter((t) => t.deletedAt))
      .sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
  }

  getTeam(id) {
    return clone(this.#team(id));
  }

  // --- Équipes ---

  createTeam(rawName) {
    return this.#mutate(() => {
      const name = validName(rawName, "nom d'équipe");
      this.#assertTeamNameFree(name);
      const team = { id: randomUUID(), name, deletedAt: null, members: [] };
      this.data.teams.push(team);
      return clone(team);
    });
  }

  renameTeam(id, rawName) {
    return this.#mutate(() => {
      const team = this.#team(id);
      const name = validName(rawName, "nom d'équipe");
      this.#assertTeamNameFree(name, id);
      team.name = name;
      return clone(team);
    });
  }

  trashTeam(id) {
    return this.#mutate(() => {
      const team = this.#team(id);
      team.deletedAt = new Date().toISOString();
      return clone(team);
    });
  }

  restoreTeam(id) {
    return this.#mutate(() => {
      const team = this.#team(id, { allowTrashed: true });
      if (!team.deletedAt) throw conflict("Cette équipe n'est pas dans la corbeille.");
      team.deletedAt = null;
      return clone(team);
    });
  }

  deleteTeam(id) {
    return this.#mutate(() => {
      const team = this.#team(id, { allowTrashed: true });
      if (!team.deletedAt) {
        throw conflict('Mettez d\'abord l\'équipe à la corbeille avant de la supprimer définitivement.');
      }
      this.data.teams = this.data.teams.filter((t) => t.id !== id);
      return { id };
    });
  }

  // --- Membres ---

  addMember(teamId, rawName) {
    return this.#mutate(() => {
      const team = this.#team(teamId);
      const name = validName(rawName, 'prénom');
      this.#assertMemberNameFree(team, name);
      team.members.push({ id: randomUUID(), name, withdrawn: false });
      return clone(team);
    });
  }

  renameMember(teamId, memberId, rawName) {
    return this.#mutate(() => {
      const team = this.#team(teamId);
      const member = this.#member(team, memberId);
      const name = validName(rawName, 'prénom');
      this.#assertMemberNameFree(team, name, memberId);
      member.name = name;
      return clone(team);
    });
  }

  removeMember(teamId, memberId) {
    return this.#mutate(() => {
      const team = this.#team(teamId);
      this.#member(team, memberId);
      team.members = team.members.filter((m) => m.id !== memberId);
      const cycleReset = autoReset(team);
      return { cycleReset, team: clone(team) };
    });
  }

  // --- Roue ---

  spin(teamId) {
    return this.#mutate(() => {
      const team = this.#team(teamId);
      if (team.members.length === 0) throw conflict("Ajoutez au moins une personne avant de lancer la roue.");
      autoReset(team);
      const eligible = team.members.filter((m) => !m.withdrawn);
      const winner = eligible[randomInt(eligible.length)];
      return { winnerId: winner.id, team: clone(team) };
    });
  }

  withdraw(teamId, memberId) {
    return this.#mutate(() => {
      const team = this.#team(teamId);
      this.#member(team, memberId).withdrawn = true;
      const cycleReset = autoReset(team);
      return { cycleReset, team: clone(team) };
    });
  }

  reinstate(teamId, memberId) {
    return this.#mutate(() => {
      const team = this.#team(teamId);
      this.#member(team, memberId).withdrawn = false;
      return clone(team);
    });
  }

  resetCycle(teamId) {
    return this.#mutate(() => {
      const team = this.#team(teamId);
      team.members.forEach((m) => { m.withdrawn = false; });
      return clone(team);
    });
  }
}
