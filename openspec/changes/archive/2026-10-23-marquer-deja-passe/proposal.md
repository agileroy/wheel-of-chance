# Proposition : marquer une personne comme déjà passée

## Pourquoi

Une personne en congés ne doit pas être tirée. Aujourd'hui, il faut la supprimer de l'équipe ou relancer à chaque fois qu'elle sort.

## Ce qui change

- Une icône, à côté de chaque prénom en lice, la passe directement dans « Déjà passés », sans tirage.
- « Rétablir » annule, comme pour un retrait après tirage. Pas de confirmation, puisque l'action s'annule en un clic.
- Si c'était la dernière personne en lice, un nouveau tour commence, comme après un tirage.

## Décision prise avec le métier

Option simple retenue : la personne est traitée comme si elle était passée. Elle saute donc son tour, et elle revient automatiquement dans la roue au tour suivant, même si elle est encore en congés. Un statut « Absent » distinct, qui garderait son tour et durerait d'un tour à l'autre, a été écarté pour rester simple.

## Impact

- Capacité modifiée : `wheel-draw` (nouvelle exigence « Marquer comme déjà passé »).
- `site/js/ui.js` uniquement : l'écriture réutilise `withdrawUpdate` de `wheel-core.js`, déjà testée. Pas de changement des règles Firebase.
