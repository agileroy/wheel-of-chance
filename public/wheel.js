// Dessin de la roue en SVG et calcul de la rotation finale.

const SVG_NS = 'http://www.w3.org/2000/svg';
const RADIUS = 96;

// Encres de risographie : alternance clair / foncé pour que deux voisins se distinguent.
export const SEGMENT_COLORS = [
  { fill: 'var(--seg-1)', text: 'var(--seg-text-light)' },
  { fill: 'var(--seg-2)', text: 'var(--seg-text-dark)' },
  { fill: 'var(--seg-3)', text: 'var(--seg-text-light)' },
  { fill: 'var(--seg-4)', text: 'var(--seg-text-dark)' },
  { fill: 'var(--seg-5)', text: 'var(--seg-text-light)' },
  { fill: 'var(--seg-6)', text: 'var(--seg-text-dark)' },
  { fill: 'var(--seg-7)', text: 'var(--seg-text-light)' },
  { fill: 'var(--seg-8)', text: 'var(--seg-text-dark)' },
  { fill: 'var(--seg-9)', text: 'var(--seg-text-light)' },
  { fill: 'var(--seg-10)', text: 'var(--seg-text-dark)' },
];

function el(name, attrs = {}) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

// Angle 0 = en haut (sous le pointeur), sens horaire.
function point(angleDeg, r) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [r * Math.cos(rad), r * Math.sin(rad)];
}

function truncate(name, max) {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

/** Couleur de chaque segment, en évitant que le dernier ait la couleur du premier. */
export function colorsFor(count) {
  const colors = Array.from({ length: count }, (_, i) => SEGMENT_COLORS[i % SEGMENT_COLORS.length]);
  if (count > 1 && colors[count - 1] === colors[0]) {
    colors[count - 1] = SEGMENT_COLORS[(count - 1 + 2) % SEGMENT_COLORS.length];
  }
  return colors;
}

/** Remplit le groupe `rotor` avec un segment par membre en lice. */
export function drawWheel(rotor, members) {
  rotor.replaceChildren();
  const count = members.length;

  if (count === 0) {
    rotor.append(el('circle', { r: RADIUS, class: 'wheel-empty' }));
    return;
  }

  const slice = 360 / count;
  const colors = colorsFor(count);
  const fontSize = count <= 4 ? 11 : count <= 7 ? 9.5 : 8;
  const maxChars = count <= 4 ? 13 : 11;

  members.forEach((member, i) => {
    const start = i * slice;
    const end = start + slice;
    const group = el('g', { class: 'segment' });

    if (count === 1) {
      group.append(el('circle', { r: RADIUS, fill: colors[i].fill }));
    } else {
      const [x1, y1] = point(start, RADIUS);
      const [x2, y2] = point(end, RADIUS);
      const largeArc = slice > 180 ? 1 : 0;
      group.append(el('path', {
        d: `M0 0 L${x1} ${y1} A${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`,
        fill: colors[i].fill,
      }));
    }

    // Le prénom suit le rayon. Sur la moitié gauche, on le retourne
    // pour qu'il ne soit pas à l'envers quand la roue est au repos.
    const mid = start + slice / 2;
    const flipped = mid > 180;
    const label = el('text', {
      x: flipped ? -(RADIUS - 10) : RADIUS - 10,
      y: 0,
      'text-anchor': flipped ? 'start' : 'end',
      'dominant-baseline': 'central',
      'font-size': fontSize,
      fill: colors[i].text,
      transform: `rotate(${flipped ? mid + 90 : mid - 90})`,
    });
    label.textContent = truncate(member.name, maxChars);
    group.append(label);
    rotor.append(group);
  });
}

/**
 * Rotation absolue (en degrés) à appliquer pour que le segment `index`
 * s'arrête sous le pointeur, après plusieurs tours complets.
 */
export function targetRotation(current, index, count, { turns = 6, random = Math.random } = {}) {
  const slice = 360 / count;
  const jitter = (random() - 0.5) * slice * 0.7;
  const landing = index * slice + slice / 2 + jitter;
  const delta = (((-landing - current) % 360) + 360) % 360;
  return current + turns * 360 + delta;
}
