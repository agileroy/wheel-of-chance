## ADDED Requirements

### Requirement: Affichage de la roue
La roue d'une équipe SHALL afficher un segment par membre en lice, avec son prénom, et deux segments voisins MUST NOT avoir la même couleur. Un pointeur fixe en haut de la roue SHALL indiquer le segment désigné. Les membres retirés SHALL apparaître à côté de la roue, dans une liste « Déjà passés », avec leur nombre. Sans aucun membre, le bouton « Lancer » SHALL être désactivé et la page SHALL inviter à ajouter des prénoms.

#### Scenario: Roue avec des membres retirés
- **GIVEN** l'équipe compte Julie, Marc et Sami, et Marc est déjà passé
- **WHEN** un utilisateur ouvre la roue de l'équipe
- **THEN** la roue affiche Julie et Sami, et « Déjà passés » affiche Marc

### Requirement: Lancer la roue
Le bouton « Lancer » SHALL tirer au hasard, de manière uniforme, un membre parmi ceux en lice dans l'état le plus récent reçu du service temps réel. La roue SHALL tourner plusieurs tours, puis s'arrêter avec le segment du membre tiré sous le pointeur, avant d'afficher son prénom en grand. Avec la réduction des animations activée sur l'appareil, la roue SHALL s'arrêter presque immédiatement. Pendant l'animation, le bouton « Lancer » et la gestion des membres SHALL être désactivés.

#### Scenario: Tirage
- **WHEN** un utilisateur lance la roue de l'équipe « Produit »
- **THEN** la roue tourne, s'arrête sur un membre en lice, et la fenêtre « C'est au tour de » affiche son prénom

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
