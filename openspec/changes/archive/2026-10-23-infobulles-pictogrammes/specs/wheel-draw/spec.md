## MODIFIED Requirements

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
