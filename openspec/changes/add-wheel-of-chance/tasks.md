# Tâches

## 1. Socle
- [x] 1.1 Créer le site statique `site/` (HTML, CSS, modules ES) sur le modèle de poker-planning
- [x] 1.2 Reprendre la configuration Firebase et le bouton de thème
- [x] 1.3 Ajouter le workflow GitHub Actions : tests, puis publication sur GitHub Pages
- [x] 1.4 Ajouter la branche `wheelOfChance` à `database.rules.json`, sans toucher aux autres branches

## 2. Équipes
- [x] 2.1 Créer, renommer et lister les équipes, avec réservation atomique des noms
- [x] 2.2 Corbeille : mise à la corbeille, restauration, suppression définitive

## 3. Membres
- [x] 3.1 Ajouter, renommer et supprimer un membre, avec réservation atomique des prénoms

## 4. Roue
- [x] 4.1 Tirage uniforme parmi les membres en lice
- [x] 4.2 Dessin et animation de la roue jusqu'au membre tiré
- [x] 4.3 Choix Garder / Retirer, « Garder » par défaut à la fermeture
- [x] 4.4 Liste « Déjà passés » avec rétablissement
- [x] 4.5 Fin de tour automatique et « Recommencer le tour »

## 5. Qualité
- [x] 5.1 Tests de la logique métier et de la couverture des règles (`npm test`)
- [x] 5.2 Vérification visuelle avec une base simulée : bureau, téléphone, thème sombre, 1 à 11 membres
- [ ] 5.3 Publier les règles dans la console Firebase et les recopier dans poker-planning et matrice-competences
- [ ] 5.4 Vérifier sur le site publié : création, tirage, corbeille, et refus d'un doublon par la base
