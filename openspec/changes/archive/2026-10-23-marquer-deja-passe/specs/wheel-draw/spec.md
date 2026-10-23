## ADDED Requirements

### Requirement: Marquer comme déjà passé
Une icône, à côté de chaque prénom en lice, SHALL placer cette personne dans « Déjà passés » sans tirage, par exemple pour une personne en congés. L'icône SHALL avoir un libellé accessible et une infobulle « Marquer <prénom> comme déjà passé ». L'action MUST NOT demander de confirmation, puisque « Rétablir » l'annule. Elle SHALL avoir le même effet qu'un retrait après tirage, y compris la fin de tour quand il ne reste plus personne en lice.

#### Scenario: Personne en congés
- **GIVEN** Anna, Bruno et Chloé sont en lice, et Bruno est en congés
- **WHEN** un utilisateur clique sur « Marquer Bruno comme déjà passé »
- **THEN** la roue ne contient plus qu'Anna et Chloé, et Bruno apparaît dans « Déjà passés » avec le bouton « Rétablir »

#### Scenario: Dernière personne en lice
- **GIVEN** seule Chloé est encore en lice
- **WHEN** un utilisateur la marque comme déjà passée
- **THEN** tous les membres reviennent dans la roue et le message de nouveau tour s'affiche
