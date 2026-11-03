## Context

Cinq outils partagent le projet `poker-planning-vleroy` et un `database.rules.json` commun, recopié à l'identique dans chaque dépôt et publié à la main. La roue lit et écrit uniquement sous `wheelOfChance/` ; son code ne connaît le projet que par `site/js/firebase-config.js`. Même recette que Fournée (`scrum-increment`), premier outil déplacé.

## Goals / Non-Goals

**Goals:**
- La roue ne dépend plus du quota de connexions des autres outils.
- Les règles de la roue vivent dans son seul dépôt et sont publiées automatiquement, testées avant.
- Une recette reproductible pour les outils suivants.

**Non-Goals:**
- Changer le modèle de données ou les règles de `wheelOfChance`.
- Déplacer les autres outils dans ce changement.

## Decisions

- **Garder la branche `wheelOfChance`** à la racine du nouveau projet plutôt que de remonter les données à la racine : aucune ligne de code ni règle de jeu ne change, seul l'emballage du fichier change. Alternative écartée : renommer les chemins, qui toucherait le store, les règles et les tests pour un gain nul.

- **Déploiement par Firebase CLI avec un compte de service** : `firebase.json` déclare `{"database": {"rules": "database.rules.json"}}`, `.firebaserc` le projet par défaut. Un job `rules` du workflow, après `test` et seulement sur `main`, écrit le secret `FIREBASE_SERVICE_ACCOUNT` dans un fichier temporaire, le désigne par `GOOGLE_APPLICATION_CREDENTIALS` et lance `npx firebase-tools@15 deploy --only database --non-interactive`. Alternative écartée : `firebase login:ci` (jeton personnel), déprécié par Firebase et lié au compte Google de l'auteur.

- **Site publié après les règles** : le job de publication du site attend le job `rules` ; si le déploiement des règles échoue, le site n'est pas publié, pour ne jamais servir un site qui vise une base aux règles périmées ou verrouillées.

- **Secret absent : on n'échoue pas la publication du site** : sans secret, le job affiche un avertissement et s'arrête sans erreur, pour que le site reste publiable (dépôt cloné, secret pas encore créé). Les règles doivent alors être publiées à la main.

- **Ordre de bascule** : 1) l'auteur crée le projet et le secret ; 2) push du changement : tests, règles déployées, site publié pointant vers le nouveau projet ; 3) essai d'une partie collective sur le site publié ; 4) seulement ensuite, retrait de `wheelOfChance` du fichier commun dans les autres dépôts qui partagent la base et publication dans la console du projet partagé. Tant que l'étape 4 n'est pas faite, l'ancienne branche reste inoffensive.

- **Test des règles** : le test « la branche wheelOfChance existe à côté des autres outils » devient « le fichier ne contient que la branche wheelOfChance », pour qu'une recopie accidentelle du fichier commun échoue.

- **Pas de migration** : les équipes de l'ancien projet sont des essais ; elles disparaissent avec le retrait de la branche du fichier commun (elles restent dans les données de l'ancien projet, illisibles, jusqu'à leur effacement par l'auteur s'il le souhaite).

## Risks / Trade-offs

- [Compte de service trop puissant (clé Admin SDK générée par la console)] → stocké uniquement en secret GitHub, jamais dans le dépôt ni le chat ; l'auteur peut le remplacer par un compte au rôle « Administrateur Firebase Realtime Database » seul.
- [Navigateur avec un vieux script en cache qui vise l'ancien projet] → les fichiers sont versionnés à chaque publication ; au pire une salle créée sur l'ancien projet n'est pas visible des autres, l'ancienne branche restant ouverte jusqu'à l'étape 4.
- [Quota de projets du compte Google] → un projet par outil reste peu nombreux ; vérifié à la création.

## Migration Plan

Voir « Ordre de bascule ». Retour arrière : remettre l'ancien `firebase-config.js` (la branche `wheelOfChance` du projet partagé n'est retirée qu'en dernier).

## Open Questions

_Aucune._
