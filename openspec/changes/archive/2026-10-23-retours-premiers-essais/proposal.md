# Proposition : retours des premiers essais

## Pourquoi

Premiers retours après la mise en ligne de la roue : le nom de l'outil, la lisibilité des listes, la détection des doublons et le moment du tirage.

## Ce qui change

- Le site s'appelle **Roue de la chance** au lieu de « Qui anime ? ».
- Renommer et supprimer un prénom se font par des **pictogrammes** (crayon, poubelle) au lieu de boutons texte. « Rétablir » reste un bouton texte : c'est l'action principale de la liste « Déjà passés ».
- Les prénoms sont **triés par ordre alphabétique**, dans les listes et sur la roue, sans tenir compte des majuscules ni des accents.
- Une **pluie de confettis** accompagne le résultat quand la roue s'arrête (module repris de poker-planning).
- Les **doublons ignorent les accents** en plus de la casse : « Anna » et « anna », « Aye » et « Ayé » sont des doublons. Même règle pour les noms d'équipe.

## Hors périmètre

- Animation synchronisée entre navigateurs.

## Impact

- Capacités modifiées : `team-management`, `team-members`, `wheel-draw`, `site-publication`.
- `site/js/wheel-core.js` : nouvelle clé d'unicité sans accents, tri alphabétique, contrôle des noms d'équipe sur les noms eux-mêmes.
- `site/js/confetti.js` : nouveau, repris de poker-planning.
- Pas de changement de `database.rules.json`.
