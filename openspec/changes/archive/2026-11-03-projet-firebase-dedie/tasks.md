## 1. Préparation (auteur)

- [x] 1.1 Créer le projet Firebase `wheel-of-chance-vleroy` : Realtime Database en europe-west1 (mode verrouillé), connexion anonyme activée, `agileroy.github.io` dans les domaines autorisés, appli Web enregistrée. Vérification : configuration Web transmise, fournisseur « Activé » dans la console.
- [x] 1.2 Créer le secret `FIREBASE_SERVICE_ACCOUNT` dans le dépôt `wheel-of-chance`. Vérification : job `rules` réussi. Fait le 3 novembre 2026.

## 2. Dépôt

- [x] 2.1 Réduire `database.rules.json` à la branche `wheelOfChance` (règles inchangées) et adapter `tests/database-rules.test.mjs`. Vérification : `npm test` au vert.
- [x] 2.2 Ajouter `firebase.json`, `.firebaserc` et le job `rules` du workflow. Vérification : règles « released successfully ».
- [x] 2.3 Pointer `site/js/firebase-config.js` vers le nouveau projet ; mettre à jour `README.md` et `openspec/config.yaml`. Vérification : site publié lu sans erreur. Fait le 3 novembre 2026 : « Aucune équipe pour l'instant » affiché depuis le nouveau projet, aucune erreur dans la console.

## 3. Projet partagé

- [x] 3.1 Retirer la branche `wheelOfChance` du fichier commun dans les dépôts qui partagent encore la base, lancer leurs tests, pousser. Vérification : fichiers identiques, tests au vert. Fait le 3 novembre 2026 (test de `moving-motivators` qui listait les branches simplifié).
- [x] 3.2 Publier le fichier commun allégé (automatique, par `poker-planning`). Vérification : job `rules` réussi. Fait le 3 novembre 2026 (commit 80ce636).
