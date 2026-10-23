// Interface : écrans, roue et dialogues. Ne parle à Firebase qu'à travers le store.
import {
  validateName, newId, buildTeamsView, findTeam, inPlay, alreadyPassed,
  teamNameConflict, createTeamUpdate, renameTeamUpdate, trashTeamUpdate, restoreTeamUpdate, purgeTeamUpdate,
  memberNameConflict, addMemberUpdate, renameMemberUpdate, removeMemberUpdate,
  pickWinner, withdrawUpdate, reinstateUpdate, resetUpdate,
  colorIndexes, targetRotation, boundariesCrossed, MESSAGES,
} from './wheel-core.js?v=__VERSION__';
import { launchConfetti } from './confetti.js?v=__VERSION__';
import * as sound from './sound.js?v=__VERSION__';

const $ = (id) => document.getElementById(id);
const SVG_NS = 'http://www.w3.org/2000/svg';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const SAVE_FAILED = 'La modification n\'a pas été enregistrée. Vérifiez la connexion, puis réessayez.';

const APP_NAME = 'Roue de la chance';

/** Pictogrammes des actions sur un prénom (le libellé est porté par le bouton). */
const ICONS = {
  passed: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg>',
  edit: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M13.5 7.5l3 3"/></svg>',
  delete: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/></svg>',
};

/**
 * Bouton pictogramme. `label` est lu par les lecteurs d'écran ; `tip` s'affiche
 * en infobulle au survol et au clavier (sans le délai de l'infobulle native).
 */
function iconButton(icon, label, tip, onclick, extraClass = '') {
  const button = h('button', { type: 'button', class: `icon-btn ${extraClass}`.trim(), 'aria-label': label, 'data-tip': tip, onclick });
  button.innerHTML = ICONS[icon];
  return button;
}

const SCREENS = ['screen-status', 'screen-teams', 'screen-trash', 'screen-missing', 'screen-team'];

let store = null;
let raw = null;
let wheel = { teamId: null, rotation: 0, spinning: false };

// ---------------------------------------------------------------- Utilitaires

function show(screenId) {
  for (const id of SCREENS) $(id).hidden = id !== screenId;
}

function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'class') node.className = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  node.append(...children.flat().filter((c) => c != null && c !== false));
  return node;
}

let toastTimer;
function toast(message, tone = 'info') {
  const el = $('toast');
  el.textContent = message;
  el.dataset.tone = tone;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 4500);
}

const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

/** Écrit dans la base ; affiche une erreur si la base refuse. Renvoie true si c'est enregistré. */
async function save(update) {
  const ok = await store.apply(update);
  if (!ok) toast(SAVE_FAILED, 'error');
  return ok;
}

/**
 * Confirmation (sans `label`) ou saisie (avec `label`). `check(value)` renvoie un
 * message d'erreur pour garder la boîte ouverte. Résout la valeur, true, ou null si annulé.
 */
function ask({ title, text = '', label, value = '', ok, check }) {
  const dialog = $('ask');
  const form = $('ask-form');
  const input = $('ask-input');
  const error = $('ask-error');
  $('ask-title').textContent = title;
  $('ask-text').textContent = text;
  $('ask-text').hidden = !text;
  $('ask-field').hidden = !label;
  $('ask-label').textContent = label ?? '';
  $('ask-ok').textContent = ok;
  input.value = value;
  error.textContent = '';

  return new Promise((resolve) => {
    const onSubmit = (event) => {
      if (event.submitter?.value !== 'ok' || !label || !check) return;
      const message = check(input.value);
      if (message) {
        event.preventDefault();
        error.textContent = message;
        input.focus();
      }
    };
    form.addEventListener('submit', onSubmit);
    dialog.returnValue = 'cancel';
    dialog.addEventListener('close', () => {
      form.removeEventListener('submit', onSubmit);
      if (dialog.returnValue !== 'ok') return resolve(null);
      resolve(label ? input.value : true);
    }, { once: true });
    dialog.showModal();
    if (label) input.select();
  });
}

function showResult(name) {
  const dialog = $('result');
  const nameEl = $('result-name');
  nameEl.textContent = name;
  nameEl.classList.toggle('is-long', name.length > 12);
  return new Promise((resolve) => {
    dialog.returnValue = 'keep';
    dialog.addEventListener('close', () => resolve(dialog.returnValue || 'keep'), { once: true });
    dialog.showModal();
    launchConfetti(dialog); // dans la fenêtre, pour passer au-dessus de son fond
    sound.fanfare();
  });
}

function setActiveNav(name) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === name) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

// ---------------------------------------------------------------- Écran : équipes

function renderTeams() {
  setActiveNav('teams');
  const { active } = buildTeamsView(raw);
  $('team-list').replaceChildren(...active.map((t) => h('li', {},
    h('a', { href: `#/team/${t.id}`, class: 'team-link' },
      h('span', { class: 'team-name' }, t.name),
      h('span', { class: 'team-meta' }, plural(t.members.length, 'personne', 'personnes'))))));
  $('teams-empty').hidden = active.length > 0;
  show('screen-teams');
}

async function createTeam(event) {
  event.preventDefault();
  const input = $('team-input');
  const error = $('team-error');
  const checked = validateName(input.value, 'team');
  const message = checked.ok ? teamNameConflict(raw, checked.name) : checked.error;
  if (message) {
    error.textContent = message;
    input.focus();
    return;
  }
  error.textContent = '';
  const id = newId();
  if (await save(createTeamUpdate(id, checked.name))) {
    input.value = '';
    location.hash = `#/team/${id}`;
  }
}

// ---------------------------------------------------------------- Écran : corbeille

function renderTrash() {
  setActiveNav('trash');
  const { trash } = buildTeamsView(raw);
  const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
  $('trash-list').replaceChildren(...trash.map((t) => h('li', {},
    h('div', {},
      h('span', { class: 'team-name' }, t.name),
      h('span', { class: 'team-meta' },
        `${plural(t.members.length, 'personne', 'personnes')}, supprimée le ${dateFmt.format(new Date(t.deletedAt))}`)),
    h('div', { class: 'row-actions' },
      h('button', {
        type: 'button',
        class: 'btn',
        onclick: async () => {
          if (await save(restoreTeamUpdate(t.id))) toast(`Équipe « ${t.name} » restaurée.`);
        },
      }, 'Restaurer'),
      h('button', {
        type: 'button',
        class: 'btn btn-danger',
        onclick: async () => {
          const confirmed = await ask({
            title: `Supprimer « ${t.name} » définitivement ?`,
            text: 'L\'équipe et ses membres seront effacés. Cette action est irréversible.',
            ok: 'Supprimer définitivement',
          });
          if (confirmed && await save(purgeTeamUpdate(t))) toast(`Équipe « ${t.name} » supprimée définitivement.`);
        },
      }, 'Supprimer définitivement')))));
  $('trash-empty').hidden = trash.length > 0;
  show('screen-trash');
}

// ---------------------------------------------------------------- Écran : roue

function currentTeam() {
  const team = wheel.teamId ? findTeam(raw, wheel.teamId) : null;
  return team && team.deletedAt === null ? team : null;
}

function drawWheel(members) {
  const rotor = $('rotor');
  rotor.replaceChildren();
  const count = members.length;
  const svg = (name, attrs) => {
    const node = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };

  if (count === 0) {
    rotor.append(svg('circle', { r: 96, class: 'wheel-empty' }));
    return;
  }

  const radius = 96;
  const slice = 360 / count;
  const colors = colorIndexes(count);
  const fontSize = count <= 4 ? 11 : count <= 7 ? 9.5 : 8;
  const maxChars = count <= 4 ? 13 : 11;
  const point = (angle) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return [radius * Math.cos(rad), radius * Math.sin(rad)];
  };

  members.forEach((member, i) => {
    const start = i * slice;
    const group = svg('g', { class: `segment seg-${colors[i] + 1}` });
    if (count === 1) {
      group.append(svg('circle', { r: radius }));
    } else {
      const [x1, y1] = point(start);
      const [x2, y2] = point(start + slice);
      group.append(svg('path', {
        d: `M0 0 L${x1} ${y1} A${radius} ${radius} 0 ${slice > 180 ? 1 : 0} 1 ${x2} ${y2} Z`,
      }));
    }
    // Le prénom suit le rayon ; retourné sur la moitié gauche pour rester lisible au repos.
    const mid = start + slice / 2;
    const flipped = mid > 180;
    const label = svg('text', {
      x: flipped ? -(radius - 10) : radius - 10,
      y: 0,
      'text-anchor': flipped ? 'start' : 'end',
      'dominant-baseline': 'central',
      'font-size': fontSize,
      transform: `rotate(${flipped ? mid + 90 : mid - 90})`,
    });
    label.textContent = member.name.length > maxChars ? `${member.name.slice(0, maxChars - 1)}…` : member.name;
    group.append(label);
    rotor.append(group);
  });
}

function memberRow(team, m) {
  const actions = [];
  if (m.withdrawn) {
    actions.push(h('button', {
      type: 'button',
      class: 'btn btn-small',
      onclick: () => save(reinstateUpdate(team.id, m.id)),
    }, 'Rétablir'));
  }
  if (!m.withdrawn) {
    // Pour une personne en congés, par exemple : elle sort de la roue jusqu'au prochain tour.
    actions.push(iconButton('passed', `Marquer ${m.name} comme déjà passé`,
      'Déjà passé : sort de la roue jusqu\'au prochain tour (congés, absence…)', async () => {
      const latest = currentTeam();
      const member = latest?.members.find((x) => x.id === m.id);
      if (!member || member.withdrawn) return;
      const { update, cycleReset } = withdrawUpdate(latest, member.id);
      if (await save(update) && cycleReset) toast(MESSAGES.cycleReset);
    }));
  }
  actions.push(
    iconButton('edit', `Renommer ${m.name}`, 'Renommer', async () => {
      let name;
      const value = await ask({
        title: 'Renommer',
        label: 'Prénom',
        value: m.name,
        ok: 'Renommer',
        check: (input) => {
          const checked = validateName(input, 'member');
          if (!checked.ok) return checked.error;
          const latest = currentTeam();
          const conflict = latest && memberNameConflict(latest, checked.name, m.id);
          if (conflict) return conflict;
          name = checked.name;
          return null;
        },
      });
      const latest = currentTeam();
      const member = latest?.members.find((x) => x.id === m.id);
      if (value != null && member && name !== member.name) save(renameMemberUpdate(latest, member, name));
    }),
    iconButton('delete', `Supprimer ${m.name} de l'équipe`, 'Supprimer de l\'équipe', async () => {
      const confirmed = await ask({
        title: `Supprimer ${m.name} de l'équipe ?`,
        text: 'La personne disparaît de la roue et de la liste « Déjà passés ».',
        ok: 'Supprimer',
      });
      const latest = currentTeam();
      if (!confirmed || !latest) return;
      const { update, cycleReset } = removeMemberUpdate(latest, m.id);
      if (await save(update) && cycleReset) toast(MESSAGES.cycleReset);
    }, 'icon-btn-danger'),
  );
  return h('li', { class: 'member' }, h('span', { class: 'member-name' }, m.name), h('span', { class: 'row-actions' }, actions));
}

function renderTeam() {
  setActiveNav(null);
  const team = currentTeam();
  if (!team) {
    document.title = APP_NAME;
    show('screen-missing');
    return;
  }

  const eligible = inPlay(team);
  const passed = alreadyPassed(team);
  $('team-title').textContent = team.name;
  document.title = `${team.name} · ${APP_NAME}`;
  drawWheel(eligible);

  $('spin').disabled = team.members.length === 0 || wheel.spinning;
  $('spin').title = team.members.length === 0 ? 'Ajoutez des personnes pour lancer la roue' : '';

  $('in-play-count').textContent = eligible.length;
  $('in-play-list').replaceChildren(...eligible.map((m) => memberRow(team, m)));
  $('in-play-empty').hidden = eligible.length > 0;

  $('done-count').textContent = passed.length;
  $('done-list').replaceChildren(...passed.map((m) => memberRow(team, m)));
  $('done-empty').hidden = passed.length > 0;
  $('reset').hidden = passed.length === 0;

  show('screen-team');
}

async function addMember(event) {
  event.preventDefault();
  const team = currentTeam();
  if (!team) return;
  const input = $('member-input');
  const error = $('member-error');
  const checked = validateName(input.value, 'member');
  const message = checked.ok ? memberNameConflict(team, checked.name) : checked.error;
  if (message) {
    error.textContent = message;
    input.focus();
    return;
  }
  error.textContent = '';
  if (await save(addMemberUpdate(team.id, newId(), checked.name))) {
    input.value = '';
    input.focus();
  }
}

/** Angle affiché (0 à 360) de la roue, lu sur la transformation en cours d'animation. */
function displayedAngle(rotor) {
  const matrix = new DOMMatrixReadOnly(getComputedStyle(rotor).transform);
  return ((Math.atan2(matrix.b, matrix.a) * 180) / Math.PI + 360) % 360;
}

/** Attend la fin de l'animation en jouant un tic à chaque prénom qui passe sous le pointeur. */
function followRotation(rotor, startRotation, count, durationMs) {
  return new Promise((resolve) => {
    const started = performance.now();
    let unwrapped = startRotation;
    let lastAngle = ((startRotation % 360) + 360) % 360;
    const frame = (now) => {
      const angle = displayedAngle(rotor);
      const next = unwrapped + ((angle - lastAngle + 360) % 360);
      if (boundariesCrossed(unwrapped, next, count) > 0) sound.tick();
      unwrapped = next;
      lastAngle = angle;
      if (now - started < durationMs) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

async function spin() {
  const team = currentTeam();
  if (!team || wheel.spinning) return;
  const winner = pickWinner(team);
  if (!winner) return;
  sound.unlock(); // pendant le clic : condition des navigateurs pour jouer du son

  wheel.spinning = true;
  $('spin').disabled = true;
  $('panel').inert = true;
  try {
    const eligible = inPlay(team);
    const index = eligible.findIndex((m) => m.id === winner.id);
    drawWheel(eligible);
    const quick = reducedMotion.matches;
    const duration = quick ? 0.3 : 5;
    const startRotation = wheel.rotation;
    wheel.rotation = targetRotation(wheel.rotation, index, eligible.length, { turns: quick ? 0 : 6 });
    const rotor = $('rotor');
    rotor.style.transitionDuration = `${duration}s`;
    rotor.style.transform = `rotate(${wheel.rotation}deg)`;
    await followRotation(rotor, startRotation, eligible.length, duration * 1000 + 150);

    $('wheel-live').textContent = `La roue désigne ${winner.name}.`;
    const choice = await showResult(winner.name);
    if (choice === 'withdraw') {
      // Repartir de l'état le plus récent : un autre navigateur a pu modifier l'équipe entre-temps.
      const latest = currentTeam();
      const member = latest?.members.find((m) => m.id === winner.id);
      if (member && !member.withdrawn) {
        const { update, cycleReset } = withdrawUpdate(latest, member.id);
        if (await save(update) && cycleReset) toast(MESSAGES.cycleReset);
      }
    }
  } finally {
    wheel.spinning = false;
    $('panel').inert = false;
    render();
    $('spin').focus();
  }
}

async function renameTeam() {
  const team = currentTeam();
  if (!team) return;
  let name;
  const value = await ask({
    title: 'Renommer l\'équipe',
    label: 'Nom de l\'équipe',
    value: team.name,
    ok: 'Renommer',
    check: (input) => {
      const checked = validateName(input, 'team');
      if (!checked.ok) return checked.error;
      const conflict = teamNameConflict(raw, checked.name, team.id);
      if (conflict) return conflict;
      name = checked.name;
      return null;
    },
  });
  const latest = currentTeam();
  if (value != null && latest && name !== latest.name) save(renameTeamUpdate(latest, name));
}

async function trashTeam() {
  const team = currentTeam();
  if (!team) return;
  const confirmed = await ask({
    title: `Mettre « ${team.name} » à la corbeille ?`,
    text: 'Vous pourrez la restaurer depuis la corbeille.',
    ok: 'Mettre à la corbeille',
  });
  if (confirmed && await save(trashTeamUpdate(team.id))) {
    toast(`Équipe « ${team.name} » mise à la corbeille.`);
    location.hash = '#/';
  }
}

async function resetCycle() {
  const team = currentTeam();
  if (!team) return;
  const confirmed = await ask({
    title: 'Recommencer le tour ?',
    text: 'Tout le monde revient dans la roue.',
    ok: 'Recommencer le tour',
  });
  const latest = currentTeam();
  if (confirmed && latest) save(resetUpdate(latest));
}

// ---------------------------------------------------------------- Routage

function route() {
  const hash = location.hash || '#/';
  const teamMatch = hash.match(/^#\/team\/([a-z0-9]{12})$/);
  if (teamMatch) return { name: 'team', teamId: teamMatch[1] };
  if (hash === '#/trash') return { name: 'trash' };
  return { name: 'teams' };
}

function render() {
  if (raw === null) return;
  if (wheel.spinning) return; // la roue garde son état pendant l'animation ; rendu à la fin
  const r = route();
  if (r.name === 'team') return renderTeam();
  document.title = APP_NAME;
  if (r.name === 'trash') return renderTrash();
  return renderTeams();
}

function onRouteChange() {
  const r = route();
  const nextTeam = r.name === 'team' ? r.teamId : null;
  if (nextTeam !== wheel.teamId) {
    // Nouvelle roue : repartir d'une rotation nulle, sans animation.
    wheel.teamId = nextTeam;
    wheel.rotation = 0;
    const rotor = $('rotor');
    rotor.style.transitionDuration = '0s';
    rotor.style.transform = 'rotate(0deg)';
    $('member-error').textContent = '';
    $('member-input').value = '';
  }
  render();
  $('main').focus({ preventScroll: true });
}

// ---------------------------------------------------------------- Démarrage

export function showFatal(message) {
  $('status-text').textContent = message;
  $('status-text').classList.add('is-error');
  show('screen-status');
}

export async function startApp(wheelStore) {
  store = wheelStore;
  try {
    await store.start();
  } catch {
    showFatal('Impossible de se connecter au service temps réel. Vérifiez votre connexion, puis rechargez la page.');
    return;
  }

  let everConnected = false;
  store.onConnection((connected) => {
    if (connected) everConnected = true;
    const banner = $('banner');
    banner.hidden = connected || !everConnected;
    banner.textContent = 'Connexion perdue, reconnexion…';
  });

  store.onData((next) => {
    raw = next;
    render();
  }, () => showFatal('Lecture des équipes refusée par la base. Vérifiez que les règles de sécurité sont publiées.'));

  const soundButton = $('sound-toggle');
  const showSoundState = () => {
    const muted = sound.isMuted();
    const label = muted ? 'Activer le son' : 'Couper le son';
    soundButton.classList.toggle('is-muted', muted);
    soundButton.setAttribute('aria-label', label);
    soundButton.title = label;
  };
  soundButton.addEventListener('click', () => {
    sound.setMuted(!sound.isMuted());
    showSoundState();
  });
  showSoundState();

  $('team-form').addEventListener('submit', createTeam);
  $('team-input').addEventListener('input', () => { $('team-error').textContent = ''; });
  $('member-input').addEventListener('input', () => { $('member-error').textContent = ''; });
  $('ask-input').addEventListener('input', () => { $('ask-error').textContent = ''; });
  $('member-form').addEventListener('submit', addMember);
  $('spin').addEventListener('click', spin);
  $('team-rename').addEventListener('click', renameTeam);
  $('team-trash').addEventListener('click', trashTeam);
  $('reset').addEventListener('click', resetCycle);

  // Clic sur le fond d'une boîte de dialogue : la fermer (vaut « Garder » pour le résultat).
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });

  window.addEventListener('hashchange', onRouteChange);
  onRouteChange();
}
