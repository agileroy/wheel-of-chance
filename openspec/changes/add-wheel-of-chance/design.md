# Conception

## Contexte

Même modèle que poker-planning et matrice-competences : site statique sur GitHub Pages, état partagé dans Firebase Realtime Database avec connexion anonyme, aucun serveur à maintenir.

## Architecture

- `site/js/wheel-core.js` : logique métier pure, sans DOM ni Firebase. Normalisation et unicité des noms, lecture de la base, tirage, et construction des écritures sous forme de mises à jour multi-chemins.
- `site/js/wheel-store.js` : seul module qui parle à Firebase. Connexion anonyme, abonnement temps réel à la branche `wheelOfChance`, état de connexion, et application atomique d'une mise à jour multi-chemins.
- `site/js/ui.js` : écrans, roue SVG, dialogues. `site/js/app.js` : point d'entrée. `site/js/theme.js` : thème clair ou sombre.
- `database.rules.json` : règles communes aux trois outils, branche `wheelOfChance` pour celui-ci.

## Données

```
wheelOfChance/
  teamNames/<clé du nom>: <teamId>          réservation des noms d'équipe (corbeille comprise)
  teams/<teamId>/                            teamId : 12 caractères [a-z0-9]
    name, createdAt (heure serveur), deletedAt (heure serveur, si dans la corbeille)
    members/<memberId>/ name, withdrawn, createdAt
    memberNames/<clé du prénom>: <memberId>  réservation des prénoms dans l'équipe
```

La clé d'un nom est le nom normalisé (espaces en trop retirés), en minuscules, avec les caractères interdits par Firebase encodés. Les accents sont conservés.

## Décisions

### Unicité garantie par la base

Chaque création ou renommage écrit, dans la même mise à jour atomique, le nom et sa réservation (`teamNames` ou `memberNames`). Les règles refusent d'écraser une réservation qui appartient à un autre identifiant. Deux personnes qui créent la même équipe au même instant ne peuvent donc pas obtenir de doublon : la seconde écriture est refusée en entier. L'interface vérifie aussi avant d'écrire, pour afficher un message clair.

### Tirage dans le navigateur

Le tirage se fait dans le navigateur qui lance la roue, avec `crypto.getRandomValues`, sur l'état reçu en temps réel. « Garder » n'écrit rien. « Retirer » repart de l'état le plus récent au moment du clic : si un autre navigateur a modifié l'équipe pendant l'animation, l'écriture en tient compte.

### Fin de tour

Quand un retrait ou une suppression laisse des membres mais plus personne en lice, la même mise à jour remet tout le monde en jeu. Le cas où deux navigateurs retirent les deux derniers en même temps est accepté : il est très rare, et « Recommencer le tour » le corrige.

### Corbeille

Mettre à la corbeille pose `deletedAt`. Une équipe dans la corbeille garde ses membres et son état, mais les règles refusent toute modification de son nom ou de ses membres. La suppression définitive n'est permise par les règles que pour une équipe déjà dans la corbeille. Elle efface l'équipe et la réservation de son nom. Tant qu'une équipe est dans la corbeille, son nom reste réservé, pour que la restauration ne crée jamais de doublon.

### Règles de sécurité

La branche est lisible et modifiable par tout navigateur connecté anonymement, conformément à l'accès libre. Les règles valident la forme des données (identifiants, longueurs, types, heure serveur) et protègent les réservations de noms et la corbeille. Elles n'empêchent pas un utilisateur malveillant de vider une équipe : c'est le prix de l'accès sans compte, le même que pour les autres outils.

## Risques

- Les règles n'ont pas pu être testées contre la base depuis l'environnement de développement. Un test vérifie que chaque écriture de l'application correspond à une règle. Les cas refusés sont à vérifier une fois les règles publiées.
- Le VPN de l'entreprise bloque GitHub Pages et Firebase, comme pour les autres outils.
