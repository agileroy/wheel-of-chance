## MODIFIED Requirements

### Requirement: Interface et appareils
Le site SHALL s'appeler « Roue de la chance » (titre de l'onglet et en-tête). L'interface SHALL être en français. Elle SHALL être utilisable sur ordinateur et sur téléphone (largeur de 360 px et plus) sans défilement horizontal, en thème clair et en thème sombre. Le site MUST NOT afficher de publicité ni charger de traceur, et MUST NOT charger de police ou de ressource depuis un autre service que Firebase.

#### Scenario: Affichage sur téléphone
- **GIVEN** un téléphone de 390 px de large
- **WHEN** un utilisateur ouvre la roue d'une équipe de dix personnes
- **THEN** la roue, puis les listes « En lice » et « Déjà passés », s'affichent l'une sous l'autre sans défilement horizontal
