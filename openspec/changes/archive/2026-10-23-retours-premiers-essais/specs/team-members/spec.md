## MODIFIED Requirements

### Requirement: Ajouter un membre
Le site SHALL permettre d'ajouter un prénom de 1 à 50 caractères à une équipe, normalisé comme les noms d'équipe. Le couple équipe/prénom MUST être unique sans tenir compte de la casse, des accents ni des espaces en trop. Cette unicité MUST être appliquée aussi par les règles de sécurité du service temps réel. Un membre ajouté SHALL entrer directement dans la roue du tour en cours. Les listes « En lice » et « Déjà passés », et les segments de la roue, SHALL être triés par ordre alphabétique, sans tenir compte de la casse ni des accents.

#### Scenario: Ajout réussi
- **WHEN** un utilisateur ajoute « Julie » à l'équipe « Produit »
- **THEN** « Julie » apparaît dans la roue et dans la liste « En lice », et peut être tirée au prochain lancer

#### Scenario: Doublon dans l'équipe
- **GIVEN** « Julie » est membre de l'équipe « Produit »
- **WHEN** un utilisateur ajoute « julie » à l'équipe « Produit »
- **THEN** l'ajout est refusé avec le message « « Julie » fait déjà partie de cette équipe. »

#### Scenario: Même prénom dans une autre équipe
- **GIVEN** « Julie » est membre de l'équipe « Produit »
- **WHEN** un utilisateur ajoute « Julie » à l'équipe « Tech »
- **THEN** l'ajout est accepté, et retirer Julie de la roue de « Tech » ne change rien à la roue de « Produit »

#### Scenario: Doublon aux accents près
- **GIVEN** « Ayé » est membre de l'équipe
- **WHEN** un utilisateur ajoute « Aye »
- **THEN** l'ajout est refusé avec le message « « Ayé » fait déjà partie de cette équipe. »

#### Scenario: Ordre alphabétique
- **GIVEN** l'équipe compte Zoé et Marc
- **WHEN** un utilisateur ajoute « élodie » puis « Anna »
- **THEN** la liste « En lice » affiche Anna, élodie, Marc, Zoé

### Requirement: Renommer un membre
Un pictogramme crayon, à côté de chaque prénom, SHALL permettre de corriger ce prénom, avec les mêmes règles de longueur et d'unicité. Le pictogramme SHALL avoir un libellé accessible et une infobulle « Renommer <prénom> ». Le membre MUST garder son état dans le tour en cours.

#### Scenario: Correction d'une faute de frappe
- **GIVEN** « Jluie » est déjà passée dans le tour en cours
- **WHEN** un utilisateur la renomme en « Julie »
- **THEN** « Julie » reste dans « Déjà passés » jusqu'à la fin du tour

### Requirement: Supprimer un membre
Un pictogramme poubelle, à côté de chaque prénom, SHALL permettre de supprimer ce membre de l'équipe, après confirmation. Le pictogramme SHALL avoir un libellé accessible et une infobulle « Supprimer <prénom> de l'équipe ». Le membre SHALL disparaître de la roue et de la liste « Déjà passés », et son prénom SHALL redevenir disponible dans l'équipe. Si la suppression laisse des membres mais plus personne en lice, un nouveau tour SHALL commencer comme décrit dans « Fin de tour ».

#### Scenario: Départ d'un membre
- **WHEN** un utilisateur supprime « Marc » de l'équipe « Produit » et confirme
- **THEN** « Marc » n'apparaît plus ni dans la roue ni dans « Déjà passés »
