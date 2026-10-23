# Proposition : roue de la chance pour désigner l'animateur de réunion

## Pourquoi

Désigner qui anime la réunion se fait aujourd'hui à la main, ce qui crée des oublis et des déséquilibres. Une roue de la chance partagée par équipe rend le tirage rapide, ludique et équitable, et fonctionne même quand le responsable habituel est absent.

## Ce qui change

- Gestion de plusieurs **équipes**, chacune avec sa propre roue et son propre état.
- Gestion des **membres** d'une équipe (prénoms), avec un couple équipe/prénom unique.
- **Tirage** : la roue tourne et désigne une personne parmi celles encore en lice.
- Après un tirage, deux choix :
  - **Garder** : la personne reste dans la roue (cas typique : absente, on relance). C'est le choix par défaut si on ferme sans choisir.
  - **Retirer** : la personne sort de la roue pour les prochains tours du cycle.
- **Rétablir** une personne retirée par erreur, à tout moment.
- **Réinitialisation** du cycle : automatique quand tout le monde est passé, ou manuelle.
- **Corbeille** pour les équipes supprimées, avec restauration possible.

## Décisions prises avec le métier

- Accès libre, sans authentification : toute personne ayant le lien peut lancer la roue et administrer les équipes.
- L'état est stocké côté serveur et partagé : n'importe qui peut lancer la roue.
- Pas de temps réel : les autres utilisateurs voient l'état à jour au rechargement de la page.
- Pas d'historique de qui a animé quand.
- Unicité insensible à la casse et aux espaces en trop, pour les noms d'équipe et pour les prénoms au sein d'une équipe.
- Une équipe compte une dizaine de personnes au maximum en usage normal.
- Une même personne peut appartenir à plusieurs équipes ; chaque équipe a son état indépendant.

## Hors périmètre

- Authentification et droits.
- Historique et statistiques des animations.
- Synchronisation en temps réel entre navigateurs.
- Pondération des tirages.

## Impact

- Nouvelles capacités : `team-management`, `team-members`, `wheel-draw`.
- Nouveau projet : backend avec persistance + frontend. Stack volontairement minimale, détaillée dans `design.md`.
