# Proposition : roue de la chance pour désigner l'animateur de réunion

## Pourquoi

Désigner qui anime la réunion se fait aujourd'hui à la main, avec des oublis et des déséquilibres. Une roue de la chance partagée par équipe rend le tirage rapide, ludique et équitable, et fonctionne même quand le responsable habituel est absent.

## Ce qui change

- Gestion de plusieurs **équipes**, chacune avec sa propre roue et son propre état.
- Gestion des **membres** d'une équipe (prénoms), avec un couple équipe/prénom unique.
- **Tirage** : la roue tourne et désigne une personne parmi celles encore en lice.
- Après un tirage, deux choix :
  - **Garder** : la personne reste dans la roue (cas typique : absente, on relance). C'est le choix par défaut si on ferme sans choisir.
  - **Retirer** : la personne sort de la roue pour le reste du tour.
- **Rétablir** une personne retirée par erreur, à tout moment.
- **Fin de tour** : réinitialisation automatique quand tout le monde est passé, ou manuelle.
- **Corbeille** pour les équipes supprimées, avec restauration ou suppression définitive.
- Publication sur **GitHub Pages**, état partagé dans la base **Firebase** déjà utilisée par le poker planning et la matrice de compétences.

## Décisions prises avec le métier

- Accès libre, sans compte : toute personne qui a le lien peut lancer la roue et gérer les équipes.
- L'état est partagé entre tous les navigateurs : n'importe qui peut lancer la roue en l'absence du responsable.
- Les listes se mettent à jour en direct (Firebase le permet sans coût). L'animation de la roue, elle, n'est visible que dans le navigateur qui la lance.
- Pas d'historique de qui a animé quand.
- Unicité insensible à la casse et aux espaces en trop, pour les noms d'équipe et pour les prénoms au sein d'une équipe. Les accents restent distincts.
- Une équipe compte une dizaine de personnes au maximum.
- Une même personne peut appartenir à plusieurs équipes ; chaque équipe a son état indépendant.

## Hors périmètre

- Comptes et droits.
- Historique et statistiques des animations.
- Animation de la roue synchronisée entre navigateurs.
- Pondération des tirages.

## Impact

- Nouvelles capacités : `team-management`, `team-members`, `wheel-draw`, `site-publication`.
- Nouveau site statique dans `site/`, publié par GitHub Actions.
- `database.rules.json` : ajout de la branche `wheelOfChance`. Les branches `room` et `skillMatrix` sont inchangées. Le fichier doit être recopié dans poker-planning et matrice-competences, puis publié dans la console Firebase.
