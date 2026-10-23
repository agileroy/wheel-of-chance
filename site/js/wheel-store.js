// Seul module qui parle à Firebase : connexion anonyme, lecture temps réel et écritures.
// Les règles de sécurité (database.rules.json, branche `wheelOfChance`) appliquent
// les mêmes contraintes côté base.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getDatabase, ref, onValue, update } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js';

const ROOT = 'wheelOfChance';

export function createWheelStore(firebaseConfig) {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);

  /** Connexion anonyme : l'identifiant est conservé par le navigateur. */
  function start() {
    return new Promise((resolve, reject) => {
      const stop = onAuthStateChanged(auth, (user) => {
        if (user) {
          stop();
          resolve(user.uid);
        }
      }, reject);
      signInAnonymously(auth).catch(reject);
    });
  }

  /** Abonnement à toutes les équipes ; `callback(raw)` à chaque changement, d'où qu'il vienne. */
  function onData(callback, onError) {
    return onValue(ref(db, ROOT), (snapshot) => callback(snapshot.val() ?? {}), onError);
  }

  /** Abonnement à l'état de la connexion temps réel. */
  function onConnection(callback) {
    return onValue(ref(db, '.info/connected'), (snapshot) => callback(snapshot.val() === true));
  }

  /**
   * Applique une mise à jour multi-chemins (décrite par wheel-core.js) en une
   * seule écriture atomique. Renvoie true si la base l'a acceptée.
   */
  function apply(changes) {
    return update(ref(db, ROOT), changes).then(() => true, () => false);
  }

  return { start, onData, onConnection, apply };
}
