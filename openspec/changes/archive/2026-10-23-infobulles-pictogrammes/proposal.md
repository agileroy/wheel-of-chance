# Proposition : infobulles des pictogrammes

## Pourquoi

Le crayon et la poubelle se comprennent seuls, mais pas la coche « déjà passé ». L'infobulle native du navigateur n'apparaît qu'après environ une seconde d'immobilité, et son texte décrivait le geste, pas son effet.

## Ce qui change

- Les pictogrammes des prénoms affichent une infobulle dès le survol ou le focus clavier.
- La coche explique son effet : « Déjà passé : sort de la roue jusqu'au prochain tour (congés, absence…) ».
- Le crayon et la poubelle gardent des infobulles courtes : « Renommer », « Supprimer de l'équipe ».
- Les libellés lus par les lecteurs d'écran restent complets, avec le prénom.

## Impact

- Capacités modifiées : `team-members`, `wheel-draw`.
- `site/js/ui.js` et `site/app.css` : infobulle en CSS (`data-tip`), à la place de l'attribut `title`.
