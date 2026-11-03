## MODIFIED Requirements

### Requirement: Règles de sécurité versionnées
Les règles de sécurité de la base Firebase SHALL être versionnées dans le dépôt (`database.rules.json`). Elles SHALL ne contenir que la branche `wheelOfChance`, dans un projet Firebase propre à la roue (`wheel-of-chance-vleroy`), tout le reste de la base étant fermé. Les règles MUST exiger une connexion anonyme pour lire ou écrire, valider la forme des données, protéger les réservations de noms, et protéger les équipes de la corbeille.

#### Scenario: Écriture hors de la branche
- **GIVEN** un navigateur connecté à la roue
- **WHEN** il tente d'écrire sous `wheelOfChance/autre`
- **THEN** la base refuse l'écriture

## ADDED Requirements

### Requirement: Déploiement automatique des règles
À chaque push sur `main`, après la réussite des tests, GitHub Actions SHALL publier `database.rules.json` dans le projet Firebase de la roue, avec un compte de service gardé en secret (`FIREBASE_SERVICE_ACCOUNT`), puis seulement publier le site. Si un test échoue, les règles MUST NOT être publiées. Sans secret, le déploiement des règles SHALL être sauté avec un avertissement, sans empêcher la publication du site.

#### Scenario: Règles modifiées
- **GIVEN** un push sur `main` qui modifie `database.rules.json` et dont les tests réussissent
- **WHEN** le workflow s'exécute
- **THEN** les nouvelles règles sont actives dans le projet de la roue, sans action dans la console

#### Scenario: Fichier commun recopié par erreur
- **GIVEN** un `database.rules.json` qui contient aussi la branche d'un autre outil
- **WHEN** les tests s'exécutent
- **THEN** un test échoue et ni les règles ni le site ne sont publiés
