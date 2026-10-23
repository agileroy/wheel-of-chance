## MODIFIED Requirements

### Requirement: Lancer la roue
Le bouton « Lancer » SHALL tirer au hasard, de manière uniforme, un membre parmi ceux en lice dans l'état le plus récent reçu du service temps réel. La roue SHALL tourner plusieurs tours, puis s'arrêter avec le segment du membre tiré sous le pointeur, avant d'afficher son prénom en grand, accompagné d'une pluie de confettis aux couleurs de la roue. Avec la réduction des animations activée sur l'appareil, la roue SHALL s'arrêter presque immédiatement et les confettis MUST NOT s'afficher. Les confettis MUST NOT bloquer les boutons de la fenêtre de résultat. Pendant l'animation, le bouton « Lancer » et la gestion des membres SHALL être désactivés.

#### Scenario: Tirage
- **WHEN** un utilisateur lance la roue de l'équipe « Produit »
- **THEN** la roue tourne, s'arrête sur un membre en lice, et la fenêtre « C'est au tour de » affiche son prénom sous une pluie de confettis

#### Scenario: Un seul membre en lice
- **GIVEN** seule Julie est encore en lice
- **WHEN** un utilisateur lance la roue
- **THEN** Julie est désignée
