## MODIFIED Requirements

### Requirement: Créer une équipe
Le site SHALL permettre de créer une équipe avec un nom de 1 à 50 caractères. Les espaces en début et fin SHALL être retirés et les espaces multiples réduits à un seul. Le nom MUST être unique sans tenir compte de la casse, des accents ni des espaces en trop, y compris parmi les équipes dans la corbeille. Cette unicité MUST être appliquée aussi par les règles de sécurité du service temps réel, pas seulement par l'interface. Après la création, la roue de la nouvelle équipe SHALL s'afficher, vide.

#### Scenario: Création réussie
- **WHEN** un utilisateur crée l'équipe « Produit »
- **THEN** la roue vide de l'équipe « Produit » s'affiche, et l'équipe apparaît dans la liste des équipes de tous les navigateurs

#### Scenario: Nom déjà utilisé
- **GIVEN** une équipe « Produit » existe
- **WHEN** un utilisateur crée l'équipe « produit  »
- **THEN** la création est refusée avec le message « Une équipe « Produit » existe déjà. »

#### Scenario: Nom identique aux accents près
- **GIVEN** une équipe « Été » existe
- **WHEN** un utilisateur crée l'équipe « ete »
- **THEN** la création est refusée avec le message « Une équipe « Été » existe déjà. »

#### Scenario: Nom réservé par une équipe de la corbeille
- **GIVEN** l'équipe « Produit » est dans la corbeille
- **WHEN** un utilisateur crée l'équipe « Produit »
- **THEN** la création est refusée avec le message « Une équipe « Produit » existe déjà dans la corbeille. »

#### Scenario: Création simultanée
- **GIVEN** Julie et Marc sur deux navigateurs différents
- **WHEN** ils créent tous les deux l'équipe « Tech » au même instant
- **THEN** une seule équipe « Tech » existe, et l'autre création est refusée par la base

#### Scenario: Nom vide
- **WHEN** un utilisateur crée une équipe dont le nom ne contient que des espaces
- **THEN** la création est refusée avec le message « Le nom de l'équipe est obligatoire. »

### Requirement: Lister les équipes
La page d'accueil SHALL lister les équipes actives par ordre alphabétique, sans tenir compte de la casse ni des accents, avec leur nombre de personnes, et permettre d'ouvrir la roue de chacune. La liste SHALL se mettre à jour sans recharger la page quand un autre navigateur crée, renomme ou supprime une équipe. Sans équipe, la page SHALL inviter à créer la première.

#### Scenario: Accès à une roue
- **WHEN** un utilisateur sélectionne l'équipe « Produit » dans la liste
- **THEN** la roue de l'équipe « Produit » s'affiche avec ses membres
