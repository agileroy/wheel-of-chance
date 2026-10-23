## ADDED Requirements

### Requirement: Créer une équipe
Le système DOIT permettre de créer une équipe avec un nom. Le nom DOIT être unique, sans tenir compte de la casse ni des espaces en début et fin, y compris parmi les équipes présentes dans la corbeille.

#### Scenario: Création réussie
- **WHEN** un utilisateur crée l'équipe « Produit »
- **THEN** l'équipe « Produit » apparaît dans la liste des équipes, avec une roue vide

#### Scenario: Nom déjà utilisé
- **GIVEN** une équipe « Produit » existe
- **WHEN** un utilisateur crée l'équipe « produit  »
- **THEN** la création est refusée avec un message indiquant que le nom est déjà pris

#### Scenario: Nom vide
- **WHEN** un utilisateur crée une équipe dont le nom ne contient que des espaces
- **THEN** la création est refusée

### Requirement: Renommer une équipe
Le système DOIT permettre de renommer une équipe, avec la même règle d'unicité qu'à la création.

#### Scenario: Renommage réussi
- **WHEN** un utilisateur renomme « Produit » en « Produit & Design »
- **THEN** l'équipe porte le nouveau nom et conserve ses membres et l'état de sa roue

### Requirement: Lister les équipes
Le système DOIT afficher la liste des équipes actives et permettre d'ouvrir la roue de chacune.

#### Scenario: Accès à une roue
- **WHEN** un utilisateur sélectionne une équipe dans la liste
- **THEN** la roue de cette équipe s'affiche avec ses membres

### Requirement: Corbeille des équipes
La suppression d'une équipe DOIT la placer dans une corbeille, après confirmation. Une équipe de la corbeille DOIT pouvoir être restaurée à l'identique (membres et état de la roue) ou supprimée définitivement, après confirmation.

#### Scenario: Mise à la corbeille
- **WHEN** un utilisateur supprime l'équipe « Produit » et confirme
- **THEN** l'équipe disparaît de la liste des équipes actives et apparaît dans la corbeille

#### Scenario: Restauration
- **GIVEN** l'équipe « Produit » est dans la corbeille
- **WHEN** un utilisateur la restaure
- **THEN** elle réapparaît dans la liste avec ses membres et l'état de sa roue inchangés

#### Scenario: Suppression définitive
- **GIVEN** l'équipe « Produit » est dans la corbeille
- **WHEN** un utilisateur la supprime définitivement et confirme
- **THEN** l'équipe et toutes ses données sont effacées, et le nom « Produit » redevient disponible
