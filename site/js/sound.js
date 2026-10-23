// Sons de la roue, générés par le navigateur (Web Audio) : aucun fichier ni service externe.
// Cliquetis de roue de foire pendant la rotation, petite fanfare au résultat.
// Choix « son coupé » propre au navigateur, mémorisé comme le thème.

const STORAGE_KEY = 'wheel-of-chance.sound';
const MIN_TICK_GAP_S = 0.025; // au-delà, les tics se fondraient en un bourdonnement

let context = null;
let lastTickAt = 0;

export function isMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'off';
  } catch {
    return false;
  }
}

export function setMuted(muted) {
  try {
    if (muted) localStorage.setItem(STORAGE_KEY, 'off');
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* stockage indisponible : choix non mémorisé */ }
}

/**
 * À appeler pendant le clic sur « Lancer » : les navigateurs n'autorisent le son
 * qu'après une action de l'utilisateur. Renvoie false si le son est coupé ou indisponible.
 */
export function unlock() {
  if (isMuted()) return false;
  try {
    context ??= new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === 'suspended') context.resume();
    return true;
  } catch {
    context = null;
    return false;
  }
}

function ready() {
  return context && !isMuted() && context.state !== 'closed';
}

/** Un « tic » sec, comme une languette qui frappe un picot de la roue. */
export function tick() {
  if (!ready()) return;
  const now = context.currentTime;
  if (now - lastTickAt < MIN_TICK_GAP_S) return;
  lastTickAt = now;

  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(1900, now);
  osc.frequency.exponentialRampToValueAtTime(700, now + 0.03);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  osc.connect(gain).connect(context.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}

/** Petite fanfare montante (do, mi, sol, do) quand la roue s'arrête. */
export function fanfare() {
  if (!ready()) return;
  const start = context.currentTime + 0.02;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((frequency, i) => {
    const at = start + i * 0.11;
    const length = i === notes.length - 1 ? 0.45 : 0.14;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.22, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
    osc.connect(gain).connect(context.destination);
    osc.start(at);
    osc.stop(at + length + 0.02);
  });
}
