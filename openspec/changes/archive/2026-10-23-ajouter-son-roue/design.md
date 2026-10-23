# Conception

## Sons générés par le navigateur

Les sons sont synthétisés avec la Web Audio API, sans fichier audio : rien à télécharger, et la règle « aucun service tiers » est respectée.

- **Tic** : onde carrée très brève (40 ms), fréquence qui chute de 1 900 à 700 Hz, attaque immédiate. Ça évoque une languette qui frappe un picot.
- **Fanfare** : quatre notes en onde triangulaire (do, mi, sol, do à l'octave), la dernière tenue.

## Synchronisation du cliquetis

La roue est animée par une transition CSS. À chaque image, la page lit l'angle réellement affiché, l'accumule tour après tour, et joue un tic quand une séparation entre deux segments passe sous le pointeur (`boundariesCrossed`, testée avec Node.js). Le cliquetis suit ainsi exactement la décélération affichée, quel que soit le nombre de prénoms. Au tout début, la roue peut passer plusieurs séparations entre deux images : un écart minimal de 25 ms entre deux tics évite qu'ils se fondent en bourdonnement.

## Autorisation du son

Les navigateurs, notamment sur iPhone, ne jouent du son qu'après une action de l'utilisateur. Le contexte audio est donc créé ou réactivé pendant le clic sur « Lancer », avant toute attente. Si le navigateur refuse ou ne connaît pas la Web Audio API, la roue fonctionne normalement, sans son.

## Bouton de son

Même modèle que le bouton de thème : choix propre au navigateur, mémorisé (`wheel-of-chance.sound`), libellé accessible qui annonce l'action (« Couper le son » ou « Activer le son »).
