# wheel-of-chance

**Roue de la chance** pour désigner, équipe par équipe, qui anime la réunion. Sans publicité.

**Site : https://vinchou59.github.io/wheel-of-chance/**

## Fonctionnement

- **Plusieurs équipes**, chacune avec sa roue et son état. Pas de compte : toute personne qui a le lien peut lancer la roue et gérer les équipes.
- Les prénoms sont **uniques dans une équipe**, les noms d'équipe sont uniques, sans tenir compte des majuscules, des accents ni des espaces en trop (« Ayé » et « aye » sont des doublons). Les listes sont triées par ordre alphabétique.
- **Lancer** fait tourner la roue parmi les personnes encore en lice, avec un cliquetis de roue de foire, puis une fanfare et des confettis saluent la personne désignée. Le bouton haut-parleur coupe le son (choix mémorisé dans le navigateur). Ensuite :
  - **Retirer de la roue** : la personne passe dans « Déjà passés » jusqu'à la fin du tour ;
  - **Garder dans la roue** : rien ne change (la personne est absente, on relance). Fermer la fenêtre revient à garder.
- Une icône sur chaque prénom en lice le passe directement dans « Déjà passés », par exemple pour une personne en congés. Elle revient dans la roue au tour suivant.
- **Rétablir** remet dans la roue une personne retirée par erreur.
- Quand tout le monde est passé, la roue **repart automatiquement** pour un tour complet. **Recommencer le tour** le fait à la main.
- Les équipes supprimées passent par une **corbeille** : restauration à l'identique, ou suppression définitive.
- Les listes se mettent à jour **en direct** dans tous les navigateurs ouverts.

## Réseau d'entreprise

Le VPN de l'entreprise (proxy Zscaler) bloque GitHub Pages et Firebase : utiliser la roue hors VPN, par exemple depuis un téléphone.

## Architecture

Site statique (HTML/CSS/JavaScript, sans build) publié sur GitHub Pages ; l'état partagé des équipes est dans Firebase Realtime Database (connexion anonyme), sous la branche `wheelOfChance`.

- `site/js/wheel-core.js` : logique métier pure (noms, tirage, écritures), testée avec Node.js ;
- `site/js/wheel-store.js` : seul module qui parle à Firebase ;
- `site/js/ui.js` : interface ; `site/js/app.js` : point d'entrée ; `site/js/theme.js` : thème clair ou sombre ; `site/js/confetti.js` : confettis (repris de poker-planning) ; `site/js/sound.js` : cliquetis et fanfare, générés par le navigateur ;
- `site/js/firebase-config.js` : configuration web Firebase (publique par nature) ;
- `database.rules.json` : règles de sécurité de la base, à publier dans la console Firebase après chaque modification. La base est partagée avec [poker-planning](https://github.com/vinchou59/poker-planning) (branche `room`) [matrice-competences](https://github.com/vinchou59/matrice-competences) (branche `skillMatrix`) et [moving-motivators](https://github.com/vinchou59/moving-motivators) (branche `movingMotivators`) : garder ce fichier identique dans les quatre dépôts.

## Développement

```sh
npm test                                          # tests de la logique métier et des règles
python3 -m http.server 8765 --directory site      # puis http://localhost:8765
```

Chaque push sur `main` lance les tests puis publie `site/` sur GitHub Pages ; un test en échec bloque la publication.

## Méthode

Le projet suit le développement piloté par les spécifications avec [OpenSpec](https://github.com/Fission-AI/OpenSpec) : `openspec/specs/` décrit le comportement attendu, `openspec/changes/` les changements en cours. Commandes Claude Code : `/opsx:explore`, `/opsx:propose`, `/opsx:apply`, `/opsx:archive`.
