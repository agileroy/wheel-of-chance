import { drawWheel, targetRotation } from './wheel.js';

const view = document.getElementById('view');
const toastEl = document.getElementById('toast');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// ---------- Utilitaires ----------

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error ?? 'Le serveur ne répond pas correctement. Rechargez la page.');
    err.status = res.status;
    throw err;
  }
  return data;
}

function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'class') node.className = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  node.append(...children.flat().filter((c) => c != null && c !== false));
  return node;
}

let toastTimer;
function toast(message, tone = 'info') {
  toastEl.textContent = message;
  toastEl.dataset.tone = tone;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 4000);
}

const showError = (err) => toast(err.message, 'error');

/** Confirmation ou saisie dans une boîte de dialogue. Renvoie null si annulé. */
function ask({ title, text = '', label, value = '', ok }) {
  const dialog = document.getElementById('ask');
  const input = document.getElementById('ask-input');
  document.getElementById('ask-title').textContent = title;
  document.getElementById('ask-text').textContent = text;
  document.getElementById('ask-text').hidden = !text;
  document.getElementById('ask-field').hidden = !label;
  document.getElementById('ask-label').textContent = label ?? '';
  document.getElementById('ask-ok').textContent = ok;
  input.value = value;
  input.required = Boolean(label);

  return new Promise((resolve) => {
    dialog.returnValue = 'cancel';
    dialog.addEventListener('close', () => {
      if (dialog.returnValue !== 'ok') return resolve(null);
      resolve(label ? input.value : true);
    }, { once: true });
    dialog.showModal();
    if (label) input.select();
  });
}

const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

function setActiveNav(name) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    if (a.dataset.nav === name) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function nameForm({ label, placeholder, button, onSubmit }) {
  const input = h('input', { name: 'name', maxlength: 50, required: true, placeholder, autocomplete: 'off' });
  const form = h('form', {
    class: 'add-form',
    onsubmit: async (e) => {
      e.preventDefault();
      try {
        await onSubmit(input.value);
      } catch (err) {
        showError(err);
        input.focus();
      }
    },
  },
  h('label', { class: 'visually-hidden', for: '' }, label),
  input,
  h('button', { class: 'btn btn-primary' }, button));
  const id = `f-${Math.random().toString(36).slice(2)}`;
  input.id = id;
  form.querySelector('label').setAttribute('for', id);
  return form;
}

// ---------- Vue : liste des équipes ----------

async function renderTeams() {
  setActiveNav('teams');
  const teams = await api('GET', '/api/teams');

  const list = teams.length
    ? h('ul', { class: 'team-list' }, teams.map((t) => h('li', {},
      h('a', { href: `#/team/${t.id}`, class: 'team-link' },
        h('span', { class: 'team-name' }, t.name),
        h('span', { class: 'team-meta' }, plural(t.members.length, 'personne', 'personnes'))))))
    : h('p', { class: 'empty' }, 'Aucune équipe pour l\'instant. Créez la première ci-dessous.');

  view.replaceChildren(
    h('section', { class: 'page page-narrow' },
      h('h1', { class: 'page-title' }, 'Équipes'),
      list,
      h('h2', { class: 'section-title' }, 'Nouvelle équipe'),
      nameForm({
        label: "Nom de l'équipe",
        placeholder: "Nom de l'équipe",
        button: 'Créer l\'équipe',
        onSubmit: async (name) => {
          const team = await api('POST', '/api/teams', { name });
          location.hash = `#/team/${team.id}`;
        },
      })),
  );
}

// ---------- Vue : corbeille ----------

async function renderTrash() {
  setActiveNav('trash');
  const teams = await api('GET', '/api/trash');
  const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

  const list = teams.length
    ? h('ul', { class: 'trash-list' }, teams.map((t) => h('li', {},
      h('div', {},
        h('span', { class: 'team-name' }, t.name),
        h('span', { class: 'team-meta' },
          `${plural(t.members.length, 'personne', 'personnes')}, supprimée le ${dateFmt.format(new Date(t.deletedAt))}`)),
      h('div', { class: 'row-actions' },
        h('button', {
          class: 'btn',
          onclick: async () => {
            try {
              await api('POST', `/api/teams/${t.id}/restore`);
              toast(`Équipe « ${t.name} » restaurée.`);
              renderTrash();
            } catch (err) { showError(err); }
          },
        }, 'Restaurer'),
        h('button', {
          class: 'btn btn-danger',
          onclick: async () => {
            const ok = await ask({
              title: `Supprimer « ${t.name} » définitivement ?`,
              text: 'L\'équipe et ses membres seront effacés. Cette action est irréversible.',
              ok: 'Supprimer définitivement',
            });
            if (!ok) return;
            try {
              await api('DELETE', `/api/teams/${t.id}`);
              toast(`Équipe « ${t.name} » supprimée définitivement.`);
              renderTrash();
            } catch (err) { showError(err); }
          },
        }, 'Supprimer définitivement')))))
    : h('p', { class: 'empty' }, 'La corbeille est vide.');

  view.replaceChildren(
    h('section', { class: 'page page-narrow' },
      h('h1', { class: 'page-title' }, 'Corbeille'),
      h('p', { class: 'page-intro' }, 'Les équipes supprimées restent ici, avec leurs membres, jusqu\'à leur suppression définitive.'),
      list),
  );
}

// ---------- Vue : roue d'une équipe ----------

const wheelState = { rotation: 0, spinning: false };

async function renderTeam(id) {
  setActiveNav(null);
  let team;
  try {
    team = await api('GET', `/api/teams/${id}`);
  } catch (err) {
    if (err.status !== 404) throw err;
    view.replaceChildren(h('section', { class: 'page page-narrow' },
      h('h1', { class: 'page-title' }, 'Équipe introuvable'),
      h('p', { class: 'empty' }, 'Cette équipe n\'existe pas ou a été mise à la corbeille.'),
      h('p', {}, h('a', { href: '#/' }, 'Revenir aux équipes'))));
    return;
  }

  wheelState.rotation = 0;
  wheelState.spinning = false;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '-100 -100 200 200');
  svg.setAttribute('class', 'wheel');
  svg.setAttribute('aria-hidden', 'true');
  const rotor = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  rotor.setAttribute('class', 'rotor');
  svg.append(rotor);

  const spinBtn = h('button', { class: 'spin-btn' }, 'Lancer');
  const wheelLive = h('p', { class: 'visually-hidden', 'aria-live': 'polite' });
  const panel = h('div', { class: 'panel' });
  const title = h('h1', { class: 'page-title team-title' });

  const update = (next) => {
    team = next;
    render();
  };

  function render() {
    const eligible = team.members.filter((m) => !m.withdrawn);
    const withdrawn = team.members.filter((m) => m.withdrawn);
    title.textContent = team.name;
    document.title = `${team.name} · Qui anime ?`;
    drawWheel(rotor, eligible);
    spinBtn.disabled = team.members.length === 0 || wheelState.spinning;
    spinBtn.title = team.members.length === 0 ? 'Ajoutez des personnes pour lancer la roue' : '';
    renderPanel(eligible, withdrawn);
  }

  async function act(fn) {
    try {
      const result = await fn();
      if (result?.cycleReset) toast('Tout le monde est passé : la roue repart pour un tour complet.');
      update(result?.team ?? result);
    } catch (err) {
      showError(err);
      if (err.status === 404) router();
    }
  }

  function memberRow(m) {
    const actions = m.withdrawn
      ? [h('button', {
        class: 'btn btn-small',
        onclick: () => act(() => api('POST', `/api/teams/${team.id}/members/${m.id}/reinstate`)),
      }, 'Rétablir')]
      : [];
    actions.push(
      h('button', {
        class: 'btn btn-small btn-quiet',
        'aria-label': `Renommer ${m.name}`,
        onclick: async () => {
          const name = await ask({ title: 'Renommer', label: 'Prénom', value: m.name, ok: 'Renommer' });
          if (name != null) act(() => api('PATCH', `/api/teams/${team.id}/members/${m.id}`, { name }));
        },
      }, 'Renommer'),
      h('button', {
        class: 'btn btn-small btn-quiet',
        'aria-label': `Supprimer ${m.name} de l'équipe`,
        onclick: async () => {
          const ok = await ask({
            title: `Supprimer ${m.name} de l'équipe ?`,
            text: 'La personne disparaît de la roue et de la liste « Déjà passés ».',
            ok: 'Supprimer',
          });
          if (ok) act(() => api('DELETE', `/api/teams/${team.id}/members/${m.id}`));
        },
      }, 'Supprimer'),
    );
    return h('li', { class: 'member' }, h('span', { class: 'member-name' }, m.name), h('span', { class: 'row-actions' }, actions));
  }

  function renderPanel(eligible, withdrawn) {
    panel.replaceChildren(
      h('section', { 'aria-labelledby': 'in-play' },
        h('h2', { id: 'in-play', class: 'section-title' }, `En lice `, h('span', { class: 'count' }, eligible.length)),
        eligible.length
          ? h('ul', { class: 'member-list' }, eligible.map(memberRow))
          : h('p', { class: 'empty' }, 'Ajoutez les prénoms des personnes de l\'équipe.'),
        nameForm({
          label: 'Prénom à ajouter',
          placeholder: 'Ajouter un prénom',
          button: 'Ajouter',
          onSubmit: async (name) => {
            const next = await api('POST', `/api/teams/${team.id}/members`, { name });
            update(next);
            panel.querySelector('.add-form input')?.focus();
          },
        })),
      h('section', { 'aria-labelledby': 'done' },
        h('h2', { id: 'done', class: 'section-title' }, 'Déjà passés ', h('span', { class: 'count' }, withdrawn.length)),
        withdrawn.length
          ? h('ul', { class: 'member-list member-list-done' }, withdrawn.map(memberRow))
          : h('p', { class: 'empty' }, 'Personne pour l\'instant dans ce tour.'),
        withdrawn.length > 0 && h('button', {
          class: 'btn',
          onclick: async () => {
            const ok = await ask({
              title: 'Recommencer le tour ?',
              text: 'Tout le monde revient dans la roue.',
              ok: 'Recommencer le tour',
            });
            if (ok) act(() => api('POST', `/api/teams/${team.id}/reset`));
          },
        }, 'Recommencer le tour')),
    );
  }

  async function spin() {
    if (wheelState.spinning) return;
    wheelState.spinning = true;
    spinBtn.disabled = true;
    panel.inert = true;
    try {
      const { winnerId, team: fresh } = await api('POST', `/api/teams/${team.id}/spin`);
      update(fresh);
      const eligible = team.members.filter((m) => !m.withdrawn);
      const index = eligible.findIndex((m) => m.id === winnerId);
      const winner = eligible[index];

      const duration = reducedMotion.matches ? 0.3 : 5;
      wheelState.rotation = targetRotation(wheelState.rotation, index, eligible.length, {
        turns: reducedMotion.matches ? 0 : 6,
      });
      rotor.style.transitionDuration = `${duration}s`;
      rotor.style.transform = `rotate(${wheelState.rotation}deg)`;
      await new Promise((resolve) => setTimeout(resolve, duration * 1000 + 150));

      wheelLive.textContent = `La roue désigne ${winner.name}.`;
      const choice = await showResult(winner.name);
      if (choice === 'withdraw') {
        await act(() => api('POST', `/api/teams/${team.id}/members/${winner.id}/withdraw`));
      }
    } catch (err) {
      showError(err);
    } finally {
      wheelState.spinning = false;
      panel.inert = false;
      render();
      spinBtn.focus();
    }
  }

  spinBtn.addEventListener('click', spin);

  view.replaceChildren(
    h('section', { class: 'page page-team' },
      h('div', { class: 'team-head' },
        h('a', { href: '#/', class: 'back' }, 'Toutes les équipes'),
        title,
        h('div', { class: 'row-actions' },
          h('button', {
            class: 'btn btn-small btn-quiet',
            onclick: async () => {
              const name = await ask({ title: 'Renommer l\'équipe', label: 'Nom de l\'équipe', value: team.name, ok: 'Renommer' });
              if (name != null) act(() => api('PATCH', `/api/teams/${team.id}`, { name }));
            },
          }, 'Renommer l\'équipe'),
          h('button', {
            class: 'btn btn-small btn-quiet',
            onclick: async () => {
              const ok = await ask({
                title: `Mettre « ${team.name} » à la corbeille ?`,
                text: 'Vous pourrez la restaurer depuis la corbeille.',
                ok: 'Mettre à la corbeille',
              });
              if (!ok) return;
              try {
                await api('POST', `/api/teams/${team.id}/trash`);
                toast(`Équipe « ${team.name} » mise à la corbeille.`);
                location.hash = '#/';
              } catch (err) { showError(err); }
            },
          }, 'Mettre à la corbeille'))),
      h('div', { class: 'stage' },
        h('div', { class: 'wheel-wrap' },
          h('div', { class: 'pointer', 'aria-hidden': 'true' }),
          svg,
          spinBtn,
          wheelLive),
        panel)),
  );
  render();
}

function showResult(name) {
  const dialog = document.getElementById('result');
  const nameEl = document.getElementById('result-name');
  nameEl.textContent = name;
  nameEl.classList.toggle('is-long', name.length > 12);
  return new Promise((resolve) => {
    dialog.returnValue = 'keep';
    dialog.addEventListener('close', () => resolve(dialog.returnValue || 'keep'), { once: true });
    dialog.showModal();
  });
}

// Clic sur le fond d'une boîte de dialogue : la fermer (vaut « Garder » pour le résultat).
document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
});

// ---------- Routage ----------

async function router() {
  if (wheelState.spinning) wheelState.spinning = false;
  const hash = location.hash || '#/';
  const teamMatch = hash.match(/^#\/team\/([\w-]+)$/);
  document.title = 'Qui anime ?';
  try {
    if (teamMatch) await renderTeam(teamMatch[1]);
    else if (hash === '#/trash') await renderTrash();
    else await renderTeams();
    view.focus({ preventScroll: true });
  } catch (err) {
    view.replaceChildren(h('section', { class: 'page page-narrow' },
      h('h1', { class: 'page-title' }, 'Impossible de charger la page'),
      h('p', { class: 'empty' }, `${err.message} Vérifiez que le serveur est démarré, puis rechargez.`)));
  }
}

window.addEventListener('hashchange', router);
router();
