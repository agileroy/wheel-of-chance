# Conception

## Clé d'unicité sans accents

La clé d'un nom passe par une décomposition Unicode (NFD) puis le retrait des signes diacritiques, avant la mise en minuscules. « Ayé », « AYE » et « aye » ont donc la même clé `aye`. Les règles de sécurité n'ont pas besoin de changer : elles protègent déjà les réservations (`teamNames`, `memberNames`) quelle que soit la forme de la clé.

### Noms enregistrés avant ce changement

Les réservations écrites avant ce changement gardent leur ancienne clé, avec accents. Pour qu'elles comptent quand même :

- le contrôle des doublons dans l'interface compare les **noms eux-mêmes**, pour les équipes comme pour les membres, et non les clés déjà enregistrées ;
- pour ces anciens noms, la base ne bloquera pas un doublon créé au même instant depuis deux navigateurs. Le risque est négligeable vu le volume, et il disparaît dès qu'un nom est renommé ou recréé.

Les anciennes clés restent dans la base sans gêner : elles ne sont plus jamais lues.

## Tri

Tri par `Intl.Collator('fr', { sensitivity: 'base', numeric: true })`, puis par date d'ajout en cas d'égalité. Le même ordre sert aux listes et aux segments de la roue, pour qu'un prénom soit facile à retrouver de l'une à l'autre.

## Confettis

Le module `confetti.js` de poker-planning est repris tel quel, avec deux adaptations : les couleurs viennent des encres de la roue, et le canevas peut être placé dans la fenêtre de résultat. Une fenêtre modale passe au-dessus de tout le reste de la page ; dans la page, les confettis seraient assombris par son fond. Le canevas ne capte aucun clic et respecte la réduction des animations.
