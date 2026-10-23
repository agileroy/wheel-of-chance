## ADDED Requirements

### Requirement: Ajouter un membre
Le site SHALL permettre d'ajouter un prénom de 1 à 50 caractères à une équipe, normalisé comme les noms d'équipe. Le couple équipe/prénom MUST être unique sans tenir compte de la casse ni des espaces en trop ; les accents restent distincts. Cette unicité MUST être appliquée aussi par les règles de sécurité du service temps réel. Un membre ajouté SHALL entrer directement dans la roue du tour en cours. Les membres SHALL être affichés dans l'ordre où ils ont été ajoutés.

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

#### Scenario: Accents distincts
- **GIVEN** « Élodie » est membre de l'équipe
- **WHEN** un utilisateur ajoute « Elodie »
- **THEN** l'ajout est accepté

### Requirement: Renommer un membre
Le site SHALL permettre de corriger un prénom, avec les mêmes règles de longueur et d'unicité. Le membre MUST garder son état dans le tour en cours.

#### Scenario: Correction d'une faute de frappe
- **GIVEN** « Jluie » est déjà passée dans le tour en cours
- **WHEN** un utilisateur la renomme en « Julie »
- **THEN** « Julie » reste dans « Déjà passés » jusqu'à la fin du tour

### Requirement: Supprimer un membre
Le site SHALL permettre de supprimer un membre d'une équipe, après confirmation. Le membre SHALL disparaître de la roue et de la liste « Déjà passés », et son prénom SHALL redevenir disponible dans l'équipe. Si la suppression laisse des membres mais plus personne en lice, un nouveau tour SHALL commencer comme décrit dans « Fin de tour ».

#### Scenario: Départ d'un membre
- **WHEN** un utilisateur supprime « Marc » de l'équipe « Produit » et confirme
- **THEN** « Marc » n'apparaît plus ni dans la roue ni dans « Déjà passés »

### Requirement: Mise à jour en direct
Les listes « En lice » et « Déjà passés » et la roue au repos SHALL se mettre à jour sans recharger la page quand un autre navigateur modifie l'équipe. Une saisie en cours dans le champ d'ajout MUST être conservée lors de ces mises à jour. Pendant l'animation de la roue, l'affichage SHALL attendre la fin du tirage pour se mettre à jour.

#### Scenario: Ajout depuis un autre navigateur
- **GIVEN** Julie et Marc ont la roue de l'équipe « Produit » ouverte, et Julie est en train de taper un prénom
- **WHEN** Marc ajoute « Nadia »
- **THEN** « Nadia » apparaît chez Julie, et le texte que Julie tapait est toujours là
