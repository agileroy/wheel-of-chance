# Proposition : son de la roue

## Pourquoi

Ajouter du suspense au tirage, comme une vraie roue de foire.

## Ce qui change

- Un **cliquetis** pendant la rotation : un « tic » à chaque prénom qui passe sous le pointeur, rapide au départ, de plus en plus espacé à mesure que la roue ralentit.
- Une **petite fanfare** de quatre notes quand la roue s'arrête, avec les confettis.
- Un **bouton haut-parleur** dans la barre du haut pour couper ou réactiver le son, mémorisé dans le navigateur comme le thème. Le son est activé par défaut.

## Hors périmètre

- Musique en boucle pendant la rotation (écartée : agaçante à la longue, et peu flatteuse en son synthétisé).
- Son entendu par les autres navigateurs.

## Impact

- Capacité modifiée : `wheel-draw` (nouvelle exigence « Son du tirage »).
- Nouveau module `site/js/sound.js`. Fonction pure `boundariesCrossed` dans `site/js/wheel-core.js`.
- Aucun fichier audio ni service externe : les sons sont générés par le navigateur.
