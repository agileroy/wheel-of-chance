## Why

La roue de la chance partage aujourd'hui le projet Firebase `poker-planning-vleroy` avec d'autres outils. Sur l'offre gratuite (Spark), une Realtime Database accepte au plus 100 connexions simultanées, réparties entre tous ces outils, et le fichier de règles commun doit être recopié dans chaque dépôt ; une erreur dans la branche d'un outil peut casser les autres. Cinquième outil déplacé, sur le modèle des précédents (changements `projet-firebase-dedie` de Fournée, des jeux de formation et de la matrice).

## What Changes

- **Projet Firebase dédié** (`wheel-of-chance-vleroy` : Realtime Database en europe-west1, connexion anonyme, domaine `agileroy.github.io` autorisé), créé par l'auteur ; `site/js/firebase-config.js` pointe vers ce projet.
- **Règles propres à la roue** : `database.rules.json` ne contient plus que la branche `wheelOfChance` (inchangée).
- **Déploiement automatique des règles** à chaque push sur `main`, après les tests (secret `FIREBASE_SERVICE_ACCOUNT`), puis publication du site.
- **Projet partagé** : la branche `wheelOfChance` est retirée du fichier commun, publié automatiquement par `poker-planning`.

**Pas de migration des données** : les équipes existantes ne sont que des essais (décision de l'auteur) ; la roue repart vide dans le nouveau projet.

Hors périmètre : autres outils, offre payante.

## Capabilities

### New Capabilities

_Aucune._

### Modified Capabilities

- `site-publication` : règles d'un projet dédié, déployées automatiquement.

## Impact

- Ce dépôt : `site/js/firebase-config.js`, `database.rules.json`, `firebase.json` et `.firebaserc` (nouveaux), `.github/workflows/pages.yml`, `tests/database-rules.test.mjs`, `README.md`, `openspec/config.yaml`.
- Dépôts qui partagent encore la base (`poker-planning`, `moving-motivators`, `roti`) : branche `wheelOfChance` retirée de `database.rules.json`.
- Actions manuelles de l'auteur : créer le projet (base, connexion anonyme activée, domaine autorisé, appli Web) et le secret.
