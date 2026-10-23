## ADDED Requirements

### Requirement: Ajouter un membre
Le système DOIT permettre d'ajouter un prénom à une équipe. Le couple équipe/prénom DOIT être unique, sans tenir compte de la casse ni des espaces en début et fin. Un membre ajouté DOIT entrer directement dans la roue du cycle en cours.

#### Scenario: Ajout réussi
- **WHEN** un utilisateur ajoute « Julie » à l'équipe « Produit »
- **THEN** « Julie » apparaît dans la roue de l'équipe « Produit » et peut être tirée au prochain tour

#### Scenario: Doublon dans l'équipe
- **GIVEN** « Julie » est membre de l'équipe « Produit »
- **WHEN** un utilisateur ajoute « julie » à l'équipe « Produit »
- **THEN** l'ajout est refusé avec un message indiquant que ce prénom existe déjà dans l'équipe

#### Scenario: Même prénom dans une autre équipe
- **GIVEN** « Julie » est membre de l'équipe « Produit »
- **WHEN** un utilisateur ajoute « Julie » à l'équipe « Tech »
- **THEN** l'ajout est accepté, et chaque équipe gère l'état de « Julie » indépendamment

### Requirement: Renommer un membre
Le système DOIT permettre de corriger un prénom, avec la même règle d'unicité, en conservant son état dans le cycle en cours.

#### Scenario: Correction d'une faute de frappe
- **GIVEN** « Jluie » a déjà été retirée de la roue dans le cycle en cours
- **WHEN** un utilisateur la renomme en « Julie »
- **THEN** « Julie » reste retirée jusqu'à la prochaine réinitialisation

### Requirement: Supprimer un membre
Le système DOIT permettre de supprimer un membre d'une équipe, après confirmation. Le membre disparaît de la roue et de l'état du cycle.

#### Scenario: Départ d'un membre
- **WHEN** un utilisateur supprime « Marc » de l'équipe « Produit » et confirme
- **THEN** « Marc » n'apparaît plus dans la roue ni dans la liste des personnes retirées
