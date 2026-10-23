# Wheel Draw Specification

## Purpose
Affichage de la roue, tirage, choix « Garder » ou « Retirer », rétablissement et fin de tour.

## Requirements

### Requirement: Affichage de la roue
La roue d'une équipe SHALL afficher un segment par membre en lice, avec son prénom, et deux segments voisins MUST NOT avoir la même couleur. Un pointeur fixe en haut de la roue SHALL indiquer le segment désigné. Les membres retirés SHALL apparaître à côté de la roue, dans une liste « Déjà passés », avec leur nombre. Sans aucun membre, le bouton « Lancer » SHALL être désactivé et la page SHALL inviter à ajouter des prénoms.

#### Scenario: Roue avec des membres retirés
- **GIVEN** l'équipe compte Julie, Marc et Sami, et Marc est déjà passé
- **WHEN** un utilisateur ouvre la roue de l'équipe
- **THEN** la roue affiche Julie et Sami, et « Déjà passés » affiche Marc

### Requirement: Lancer la roue
Le bouton « Lancer » SHALL tirer au hasard, de manière uniforme, un membre parmi ceux en lice dans l'état le plus récent reçu du service temps réel. La roue SHALL tourner plusieurs tours, puis s'arrêter avec le segment du membre tiré sous le pointeur, avant d'afficher son prénom en grand, accompagné d'une pluie de confettis aux couleurs de la roue. Avec la réduction des animations activée sur l'appareil, la roue SHALL s'arrêter presque immédiatement et les confettis MUST NOT s'afficher. Les confettis MUST NOT bloquer les boutons de la fenêtre de résultat. Pendant l'animation, le bouton « Lancer » et la gestion des membres SHALL être désactivés.

#### Scenario: Tirage
- **WHEN** un utilisateur lance la roue de l'équipe « Produit »
- **THEN** la roue tourne, s'arrête sur un membre en lice, et la fenêtre « C'est au tour de » affiche son prénom sous une pluie de confettis

#### Scenario: Un seul membre en lice
- **GIVEN** seule Julie est encore en lice
- **WHEN** un utilisateur lance la roue
- **THEN** Julie est désignée

### Requirement: Garder ou retirer la personne désignée
Après un tirage, la fenêtre de résultat SHALL proposer « Retirer de la roue » et « Garder dans la roue ». « Garder » MUST laisser l'état de l'équipe inchangé. « Retirer » SHALL placer la personne dans « Déjà passés » pour le reste du tour. Fermer la fenêtre sans choisir (touche Échap ou clic à côté) MUST valoir « Garder ».

#### Scenario: Garder (personne absente)
- **GIVEN** la roue a désigné Julie, qui est absente
- **WHEN** l'utilisateur choisit « Garder dans la roue »
- **THEN** Julie reste dans la roue et l'utilisateur peut relancer

#### Scenario: Retirer
- **GIVEN** la roue a désigné Julie
- **WHEN** l'utilisateur choisit « Retirer de la roue »
- **THEN** Julie n'apparaît plus dans la roue et apparaît dans « Déjà passés », dans tous les navigateurs

#### Scenario: Fermeture sans choix
- **GIVEN** la roue a désigné Julie
- **WHEN** l'utilisateur appuie sur Échap
- **THEN** Julie reste dans la roue

### Requirement: Rétablir une personne retirée
Chaque personne de « Déjà passés » SHALL avoir un bouton « Rétablir » qui la remet dans la roue, par exemple après une erreur.

#### Scenario: Retrait par erreur
- **GIVEN** Julie a été retirée par erreur
- **WHEN** un utilisateur clique sur « Rétablir » à côté de Julie
- **THEN** Julie réapparaît dans la roue

### Requirement: Fin de tour
Quand une opération laisse une équipe avec des membres mais plus personne en lice, tous les membres SHALL revenir dans la roue dans la même écriture, et le message « Tout le monde est passé : la roue repart pour un tour complet. » SHALL s'afficher. Tant que « Déjà passés » n'est pas vide, un bouton « Recommencer le tour » SHALL remettre tout le monde dans la roue, après confirmation.

#### Scenario: Fin de tour automatique
- **GIVEN** seule Julie est encore en lice
- **WHEN** Julie est désignée et l'utilisateur choisit « Retirer de la roue »
- **THEN** tous les membres reviennent dans la roue, « Déjà passés » est vide, et le message de nouveau tour s'affiche

#### Scenario: Recommencer le tour
- **GIVEN** Marc et Sami sont déjà passés
- **WHEN** un utilisateur clique sur « Recommencer le tour » et confirme
- **THEN** tous les membres reviennent dans la roue

### Requirement: Son du tirage
Pendant la rotation, le site SHALL jouer un « tic » à chaque séparation entre deux segments qui passe sous le pointeur, en suivant le ralentissement de la roue. Quand la roue s'arrête, une courte fanfare SHALL accompagner l'affichage du résultat. Les sons SHALL être générés par le navigateur, sans fichier ni service externe. Un bouton, visible sur tous les écrans, SHALL couper ou réactiver le son ; son libellé accessible SHALL indiquer l'action (« Couper le son » ou « Activer le son »). Le son SHALL être activé par défaut, et le choix SHALL être mémorisé dans le navigateur, sans être partagé. Une fois le son coupé, le site MUST NOT jouer aucun son. Si le navigateur ne peut pas jouer de son, la roue SHALL fonctionner normalement, en silence.

#### Scenario: Cliquetis pendant la rotation
- **GIVEN** une équipe de sept personnes et le son activé
- **WHEN** un utilisateur lance la roue
- **THEN** des tics rapprochés se font entendre au départ, de plus en plus espacés jusqu'à l'arrêt, puis la fanfare accompagne le résultat

#### Scenario: Son coupé
- **GIVEN** l'utilisateur a cliqué sur « Couper le son »
- **WHEN** il recharge la page puis lance la roue
- **THEN** le bouton propose « Activer le son » et aucun son n'est joué

### Requirement: Marquer comme déjà passé
Une icône, à côté de chaque prénom en lice, SHALL placer cette personne dans « Déjà passés » sans tirage, par exemple pour une personne en congés. L'icône SHALL avoir le libellé accessible « Marquer <prénom> comme déjà passé » et une infobulle qui explique son effet : « Déjà passé : sort de la roue jusqu'au prochain tour (congés, absence…) ». L'infobulle SHALL s'afficher dès le survol de la souris ou le focus clavier, sans délai. L'action MUST NOT demander de confirmation, puisque « Rétablir » l'annule. Elle SHALL avoir le même effet qu'un retrait après tirage, y compris la fin de tour quand il ne reste plus personne en lice.

#### Scenario: Infobulle explicative
- **WHEN** un utilisateur passe la souris sur l'icône coche à côté d'Anna
- **THEN** l'infobulle « Déjà passé : sort de la roue jusqu'au prochain tour (congés, absence…) » s'affiche aussitôt

#### Scenario: Personne en congés
- **GIVEN** Anna, Bruno et Chloé sont en lice, et Bruno est en congés
- **WHEN** un utilisateur clique sur « Marquer Bruno comme déjà passé »
- **THEN** la roue ne contient plus qu'Anna et Chloé, et Bruno apparaît dans « Déjà passés » avec le bouton « Rétablir »

#### Scenario: Dernière personne en lice
- **GIVEN** seule Chloé est encore en lice
- **WHEN** un utilisateur la marque comme déjà passée
- **THEN** tous les membres reviennent dans la roue et le message de nouveau tour s'affiche
